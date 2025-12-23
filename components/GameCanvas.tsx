import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { GamePhase, HiddenObject } from '../types';

interface GameCanvasProps {
  svgContent?: string;
  rasterImage?: string;
  imageMode: 'SVG' | 'RASTER';
  phase: GamePhase;
  brushColor: string;
  brushSize: number;
  toolMode: 'brush' | 'eraser' | 'text';
  fontSize: number;
  onUndoStateChange: (canUndo: boolean) => void;
  undoTrigger: number;
  hiddenObjects: HiddenObject[];
  onObjectFound: (id: string) => void;
  foundItemIds: Set<string>;
  zoom: number;
  isDevMode?: boolean; 
}

export interface GameCanvasHandle {
  downloadImage: (userName: string) => void;
  addText: (initialText: string) => void;
}

interface TextElement {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({
  rasterImage,
  imageMode,
  phase,
  brushColor,
  brushSize,
  toolMode,
  fontSize,
  onUndoStateChange,
  undoTrigger,
  hiddenObjects,
  onObjectFound,
  foundItemIds,
  zoom,
  isDevMode
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  
  const [dimensions, setDimensions] = useState<{width: number, height: number} | null>(null);
  const [lineArtData, setLineArtData] = useState<{data: Uint8ClampedArray, width: number, height: number} | null>(null);

  const isDrawing = useRef(false);
  const hasMoved = useRef(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);

  const devDragStart = useRef<{x: number, y: number} | null>(null);
  const [devCursorPos, setDevCursorPos] = useState<{x: number, y: number} | null>(null);

  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<number | null>(null);
  const draggingTextId = useRef<number | null>(null);
  const dragOffset = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    addText: (initialText: string) => {
      if (!dimensions) return;
      
      const newId = Date.now();
      const newText: TextElement = {
        id: newId,
        x: dimensions.width / 2 - 50,
        y: dimensions.height / 2,
        text: "", 
        color: brushColor,
        fontSize: fontSize
      };
      
      setTextElements(prev => [...prev, newText]);
      setSelectedTextId(newId);
    },

    downloadImage: (userName: string) => {
      if (!dimensions || !rasterImage || !canvasRef.current) {
        console.error("Missing dimensions or image data for download");
        return;
      }
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = dimensions.width;
      tempCanvas.height = dimensions.height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(canvasRef.current!, 0, 0);
        ctx.restore();
        
        textElements.forEach(el => {
           if (!el.text.trim()) return;
           ctx.font = `bold ${el.fontSize}px 'Kanit', sans-serif`;
           ctx.fillStyle = el.color;
           ctx.textBaseline = 'top';
           ctx.fillText(el.text, el.x, el.y);
        });

        if (userName) {
           ctx.save();
           ctx.font = "bold 24px 'Kanit', sans-serif";
           ctx.fillStyle = "rgba(233, 30, 99, 0.8)"; 
           const textStr = `ศิลปิน: ${userName} | Valentine's Art & Seek`;
           const textWidth = ctx.measureText(textStr).width;
           ctx.fillRect(dimensions.width - textWidth - 20, dimensions.height - 40, textWidth + 20, 40);
           ctx.fillStyle = "white";
           ctx.fillText(textStr, dimensions.width - textWidth - 10, dimensions.height - 32);
           ctx.restore();
        }

        const link = document.createElement('a');
        link.download = `valentine-art-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
      };
      img.src = `data:image/png;base64,${rasterImage}`;
    }
  }));

  useEffect(() => {
    if (selectedTextId !== null && toolMode === 'text') {
      setTextElements(prev => prev.map(t => {
        if (t.id === selectedTextId) {
          return { ...t, color: brushColor, fontSize: fontSize };
        }
        return t;
      }));
    }
  }, [brushColor, fontSize, selectedTextId, toolMode]);

  useEffect(() => {
    setHistory([]);
    setTextElements([]);
    setSelectedTextId(null);
    setDimensions(null);
    const canvas = canvasRef.current;
    if (canvas) {
       const ctx = canvas.getContext('2d');
       if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (!rasterImage || !containerRef.current) return;

    const img = new Image();
    
    img.onload = () => {
      const container = containerRef.current;
      if (!container) return;

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const containerAspect = container.clientWidth / container.clientHeight;

      let renderWidth, renderHeight;
      if (containerAspect > imgAspect) {
        renderHeight = container.clientHeight * 0.9;
        renderWidth = renderHeight * imgAspect;
      } else {
        renderWidth = container.clientWidth * 0.9;
        renderHeight = renderWidth / imgAspect;
      }

      setDimensions({ width: Math.floor(renderWidth), height: Math.floor(renderHeight) });

      const offCanvas = document.createElement('canvas');
      offCanvas.width = renderWidth;
      offCanvas.height = renderHeight;
      const ctx = offCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, renderWidth, renderHeight);
        setLineArtData(ctx.getImageData(0, 0, renderWidth, renderHeight));
      }
    };

    img.onerror = () => {
      console.error("Failed to load raster image in GameCanvas");
    };

    img.src = `data:image/png;base64,${rasterImage}`;

  }, [rasterImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensions) return;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
  }, [dimensions]);

  useEffect(() => {
    if (history.length > 0) {
      const newHistory = [...history];
      newHistory.pop(); 
      const previousState = newHistory.pop();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && previousState) {
        ctx.putImageData(previousState, 0, 0);
        setHistory([...newHistory, previousState]);
      } else if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHistory([]);
      }
    }
  }, [undoTrigger]);

  useEffect(() => {
    onUndoStateChange(history.length > 0);
  }, [history, onUndoStateChange]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      setHistory(prev => [...prev.slice(-9), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }
  }, []);

  const getPointerPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setSelectedTextId(null);
    if (toolMode === 'text') return;
    if (phase !== GamePhase.COLORING && phase !== GamePhase.HIDDEN_OBJECT) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const { x, y } = getPointerPos(e);
    if (isDevMode) {
      devDragStart.current = { x, y };
      return;
    }
    isDrawing.current = true;
    hasMoved.current = false;
    lastPos.current = { x, y };
    if (phase === GamePhase.COLORING) saveState(); 
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDevMode) {
      const { x, y } = getPointerPos(e);
      if (canvasRef.current) {
        setDevCursorPos({ 
          x: Math.floor((x / canvasRef.current.width) * 1000), 
          y: Math.floor((y / canvasRef.current.height) * 1000) 
        });
      }
      return;
    }
    if (toolMode === 'text' || !isDrawing.current) return;
    const { x, y } = getPointerPos(e);
    if (lastPos.current) {
      if (Math.hypot(x - lastPos.current.x, y - lastPos.current.y) > 3) hasMoved.current = true; 
    }
    if (phase === GamePhase.COLORING && hasMoved.current) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = toolMode === 'eraser' ? 'rgba(0,0,0,1)' : brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.globalCompositeOperation = toolMode === 'eraser' ? 'destination-out' : 'source-over';
        ctx.stroke();
        lastPos.current = { x, y };
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    const { x, y } = getPointerPos(e);
    if (isDevMode && devDragStart.current && canvasRef.current) {
      const start = devDragStart.current;
      const w = canvasRef.current.width, h = canvasRef.current.height;
      window.prompt("Copy พิกัดนี้:", `box: { ymin: ${Math.floor((Math.min(start.y, y) / h) * 1000)}, xmin: ${Math.floor((Math.min(start.x, x) / w) * 1000)}, ymax: ${Math.floor((Math.max(start.y, y) / h) * 1000)}, xmax: ${Math.floor((Math.max(start.x, x) / w) * 1000)} }`);
      devDragStart.current = null;
      return;
    }
    if (toolMode === 'text' || !isDrawing.current) return;
    isDrawing.current = false;
    if (!hasMoved.current) {
      if (phase === GamePhase.COLORING) performFloodFill(Math.floor(x), Math.floor(y));
      else if (phase === GamePhase.HIDDEN_OBJECT) handleHiddenObjectClick(x, y);
    }
  };

  const handleHiddenObjectClick = (x: number, y: number) => {
     if (!canvasRef.current) return;
     const sx = (x / canvasRef.current.width) * 1000, sy = (y / canvasRef.current.height) * 1000;
     hiddenObjects.forEach(obj => {
       if (foundItemIds.has(obj.id) || !obj.box) return;
       const { ymin, xmin, ymax, xmax } = obj.box;
       if (sy >= ymin - 70 && sy <= ymax + 70 && sx >= xmin - 70 && sx <= xmax + 70) onObjectFound(obj.id);
     });
  };

  const performFloodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lineArtData) return;
    saveState();
    const width = canvas.width, height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(brushColor);
    const r = res ? parseInt(res[1], 16) : 0, g = res ? parseInt(res[2], 16) : 0, b = res ? parseInt(res[3], 16) : 0;
    const a = toolMode === 'eraser' ? 0 : 255;
    const stack = [[startX, startY]];
    const startIdx = (startY * width + startX) * 4;
    const sR = data[startIdx], sG = data[startIdx+1], sB = data[startIdx+2], sA = data[startIdx+3];
    if (sR === r && sG === g && sB === b && sA === a) return;
    const canFill = (idx: number) => (lineArtData.data[idx] + lineArtData.data[idx+1] + lineArtData.data[idx+2]) > 450 && data[idx] === sR && data[idx+1] === sG && data[idx+2] === sB && data[idx+3] === sA;
    while (stack.length) {
      let [x, y] = stack.pop()!;
      let idx = (y * width + x) * 4;
      while (y >= 0 && canFill(idx)) { y--; idx -= width * 4; }
      y++; idx += width * 4;
      let rL = false, rR = false;
      while (y < height && canFill(idx)) {
        data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = a;
        if (x > 0) { if (canFill(idx - 4)) { if (!rL) { stack.push([x - 1, y]); rL = true; } } else rL = false; }
        if (x < width - 1) { if (canFill(idx + 4)) { if (!rR) { stack.push([x + 1, y]); rR = true; } } else rR = false; }
        y++; idx += width * 4;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const handleTextPointerDown = (e: React.PointerEvent, id: number) => {
     if (phase !== GamePhase.COLORING) return;
     e.stopPropagation(); 
     setSelectedTextId(id);
     draggingTextId.current = id;
     dragOffset.current = { x: e.clientX, y: e.clientY };
     (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleTextPointerMove = (e: React.PointerEvent) => {
     if (draggingTextId.current !== null) {
        e.stopPropagation();
        const dx = (e.clientX - dragOffset.current.x) / zoom, dy = (e.clientY - dragOffset.current.y) / zoom;
        setTextElements(prev => prev.map(t => t.id === draggingTextId.current ? { ...t, x: t.x + dx, y: t.y + dy } : t));
        dragOffset.current = { x: e.clientX, y: e.clientY };
     }
  };

  const brushCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M4 28 Q8 28 14 22 L26 8 L24 6 L12 18 Q6 24 4 28 Z" fill="${encodeURIComponent(brushColor)}" stroke="white" stroke-width="2"/></svg>') 0 32, crosshair`;

  return (
    <div className="relative w-full h-full bg-pink-50/50 shadow-inner rounded-xl overflow-hidden flex flex-col">
      <div 
        ref={containerRef} 
        tabIndex={0}
        onMouseEnter={() => containerRef.current?.focus()}
        className="flex-1 w-full h-full overflow-auto relative bg-gray-100/50 outline-none"
      >
        <div className="min-w-full min-h-full flex items-center justify-center p-4">
          {dimensions && rasterImage ? (
            <div style={{ width: dimensions.width * zoom, height: dimensions.height * zoom, position: 'relative', margin: 'auto' }}>
              <img src={`data:image/png;base64,${rasterImage}`} alt="Level" style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
              <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, mixBlendMode: 'multiply', cursor: toolMode === 'brush' ? brushCursor : 'crosshair', touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
              {textElements.map(el => (
                 <div key={el.id} onPointerDown={(e) => handleTextPointerDown(e, el.id)} onPointerMove={handleTextPointerMove} onPointerUp={() => draggingTextId.current = null}
                    style={{ position: 'absolute', left: el.x * zoom, top: el.y * zoom, color: el.color, fontSize: `${el.fontSize * zoom}px`, fontWeight: 'bold', zIndex: 20, fontFamily: 'Kanit', touchAction: 'none', border: selectedTextId === el.id ? '2px dashed #f0f' : 'none' }}>
                    {toolMode === 'text' ? <input value={el.text} onChange={(e) => setTextElements(prev => prev.map(t => t.id === el.id ? { ...t, text: e.target.value } : t))} style={{ background: 'rgba(255,255,255,0.5)', border: 'none', outline: 'none' }} /> : <span>{el.text || "พิมพ์ข้อความ"}</span>}
                 </div>
              ))}
              {hiddenObjects.map(obj => foundItemIds.has(obj.id) && obj.box && (
                <div key={obj.id} style={{ position: 'absolute', left: `${(obj.box.xmin/10)}%`, top: `${(obj.box.ymin/10)}%`, width: `${((obj.box.xmax-obj.box.xmin)/10)}%`, height: `${((obj.box.ymax-obj.box.ymin)/10)}%`, border: '4px solid #0f0', pointerEvents: 'none', zIndex: 30 }} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-pink-300">
               <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
               <p className="font-bold">กำลังโหลดรูปภาพ...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default GameCanvas;
