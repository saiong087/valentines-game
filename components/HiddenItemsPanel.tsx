import React, { useEffect, useRef } from 'react';
import { HiddenObject } from '../types';

interface HiddenItemsPanelProps {
  items: HiddenObject[];
  foundItemIds: Set<string>;
  story: string;
  phase: string;
  rasterImage?: string;
}

const HiddenItemsPanel: React.FC<HiddenItemsPanelProps> = ({ items, foundItemIds, story, phase, rasterImage }) => {
  return (
    <div className="flex flex-col gap-6 p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border-2 border-pink-200 w-full md:w-72 h-full overflow-y-auto">
      <div className="space-y-2">
        <h2 className="text-2xl text-red-600 font-bold">ตำนานรักวาเลนไทน์</h2>
        <p className="text-gray-700 italic leading-relaxed text-sm">{story}</p>
      </div>
      <div className="border-t border-pink-200 pt-4">
        <h3 className="text-xl text-pink-700 font-bold mb-4 flex items-center gap-2">
          {phase === 'COLORING' ? 'สิ่งของที่ต้องหา:' : 'ตามหาสิ่งเหล่านี้!'}
          <span className="text-sm bg-pink-100 px-2 py-0.5 rounded-full text-pink-600">
            {foundItemIds.size}/{items.length}
          </span>
        </h3>
        <ul className="space-y-3">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} isFound={foundItemIds.has(item.id)} phase={phase} rasterImage={rasterImage} />
          ))}
        </ul>
      </div>
    </div>
  );
};

const ItemRow: React.FC<{ item: HiddenObject; isFound: boolean; phase: string; rasterImage?: string; }> = ({ item, isFound, phase, rasterImage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!rasterImage || !item.box || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { ymin, xmin, ymax, xmax } = item.box!;
      const pad = Math.max(xmax - xmin, ymax - ymin) * 0.3;
      const sx = Math.max(0, xmin - pad) / 1000 * img.width, sy = Math.max(0, ymin - pad) / 1000 * img.height;
      const sw = Math.min(1000, xmax + pad) / 1000 * img.width - sx, sh = Math.min(1000, ymax + pad) / 1000 * img.height - sy;
      canvas.width = 70; canvas.height = 70;
      ctx.fillStyle = '#fff0f5'; ctx.fillRect(0, 0, 70, 70);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 70, 70);
    };
    // Use a more generic mime type or detect if key starts with /9j/ (JPEG) or iVBOR (PNG)
    // But since we stripped the header in service, we just guess or try universal approach.
    // For now, let's try assuming standard base64 without prefix if not present, and handle the prefix manually if needed.
    // Actually, let's log what we have to debug.
    console.log(`[ItemRow] Loading image for ${item.name}. Box:`, item.box, `Raster length: ${rasterImage.length}`);

    // Simple heuristic: JPEGs often start with /9j/, PNGs with iVBOR.
    const mime = rasterImage.trim().startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
    img.src = `data:${mime};base64,${rasterImage}`;
  }, [rasterImage, item.box]);

  return (
    <li className={`p-2 rounded-lg border-2 transition-all ${isFound ? 'bg-green-50 border-green-200 opacity-50' : 'bg-white border-pink-100'}`}>
      <div className="flex items-center gap-3">
        <div className="w-[70px] h-[70px] rounded overflow-hidden bg-gray-100 relative">
          <canvas ref={canvasRef} className="w-full h-full" />
          {isFound && <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center text-white text-xl font-bold">✓</div>}
        </div>
        <div className="flex-1">
          <span className={`font-medium ${isFound ? 'line-through' : 'text-gray-800'}`}>{item.name}</span>
          {!isFound && phase === 'HIDDEN_OBJECT' && <p className="text-[10px] text-pink-500 italic">{item.hint}</p>}
        </div>
      </div>
    </li>
  );
};

export default HiddenItemsPanel;
