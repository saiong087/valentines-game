import React from 'react';
import { PALETTE } from '../constants';
import { GamePhase } from '../types';

interface ToolsPanelProps {
  phase: GamePhase;
  currentColor: string;
  toolMode: 'brush' | 'eraser' | 'text';
  onColorChange: (color: string) => void;
  onSetToolMode: (mode: 'brush' | 'eraser' | 'text') => void;
  onUndo: () => void;
  onFinish: () => void;
  canUndo: boolean;
  
  // Zoom Props
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;

  // New Actions
  onDownload: () => void;
  onSkip: () => void;

  // Text Tool Props
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onAddText: () => void;

  // Brush Size
  brushSize: number;
  onBrushSizeChange: (size: number) => void;

  // Dev Mode
  isDevMode?: boolean;
  onToggleDevMode?: () => void;
}

const BRUSH_PRESETS = [5, 15, 30, 50];

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  phase,
  currentColor,
  toolMode,
  onColorChange,
  onSetToolMode,
  onUndo,
  onFinish,
  canUndo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onDownload,
  onSkip,
  fontSize,
  onFontSizeChange,
  onAddText,
  brushSize,
  onBrushSizeChange,
  isDevMode,
  onToggleDevMode
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-pink-200 w-full md:w-72 h-full overflow-y-auto custom-scrollbar">
      
      {/* Zoom Controls */}
      <div className="space-y-2 pb-4 border-b-2 border-dashed border-pink-200">
        <h3 className="font-bold text-pink-500 text-lg flex items-center gap-2">🔍 ย่อ/ขยาย (Zoom)</h3>
        <div className="flex gap-2">
          <button onClick={onZoomOut} className="flex-1 bg-white border-2 border-pink-200 text-pink-500 rounded-xl py-2 hover:bg-pink-50 font-bold text-xl shadow-sm transition-transform active:scale-95">➖</button>
          <button onClick={onZoomReset} className="flex-1 bg-pink-50 border-2 border-pink-200 text-pink-600 rounded-xl py-2 font-bold text-sm shadow-inner">{Math.round(zoom * 100)}%</button>
          <button onClick={onZoomIn} className="flex-1 bg-white border-2 border-pink-200 text-pink-500 rounded-xl py-2 hover:bg-pink-50 font-bold text-xl shadow-sm transition-transform active:scale-95">➕</button>
        </div>
      </div>

      {/* Coloring & Text Tools (Only in COLORING phase) */}
      {phase === GamePhase.COLORING && (
        <>
           {/* Tool Selection */}
          <div className="space-y-2">
            <h3 className="font-bold text-pink-500 text-lg flex items-center gap-2">🛠️ เครื่องมือ</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onSetToolMode('brush')}
                className={`flex-1 py-4 rounded-2xl text-3xl shadow-[0_4px_0_rgb(0,0,0,0.1)] transition-all active:translate-y-1 active:shadow-none ${toolMode === 'brush' ? 'bg-pink-500 text-white ring-4 ring-pink-200' : 'bg-white text-gray-400 border-2 border-gray-200 hover:bg-gray-50'}`}
                title="ระบายสี"
              >
                🖌️
              </button>
              <button
                onClick={() => onSetToolMode('text')}
                className={`flex-1 py-4 rounded-2xl text-3xl shadow-[0_4px_0_rgb(0,0,0,0.1)] transition-all active:translate-y-1 active:shadow-none ${toolMode === 'text' ? 'bg-purple-500 text-white ring-4 ring-purple-200' : 'bg-white text-gray-400 border-2 border-gray-200 hover:bg-gray-50'}`}
                title="ใส่ข้อความ"
              >
                🔤
              </button>
              <button
                onClick={() => onSetToolMode('eraser')}
                className={`flex-1 py-4 rounded-2xl text-3xl shadow-[0_4px_0_rgb(0,0,0,0.1)] transition-all active:translate-y-1 active:shadow-none ${toolMode === 'eraser' ? 'bg-blue-400 text-white ring-4 ring-blue-200' : 'bg-white text-gray-400 border-2 border-gray-200 hover:bg-gray-50'}`}
                title="ยางลบ"
              >
                🧼
              </button>
            </div>
          </div>

          {/* Brush/Eraser Size Controls */}
          {(toolMode === 'brush' || toolMode === 'eraser') && (
            <div className="space-y-2 animate-fadeIn bg-pink-50 p-3 rounded-2xl border-2 border-pink-100">
              <h3 className="font-bold text-pink-600 text-sm mb-2">
                 📏 ขนาด{toolMode === 'brush' ? 'หัวแปรง' : 'ยางลบ'}
              </h3>
              <div className="flex justify-between items-center bg-white p-2 rounded-xl shadow-sm">
                {BRUSH_PRESETS.map((size) => (
                  <button
                    key={size}
                    onClick={() => onBrushSizeChange(size)}
                    className={`rounded-full flex items-center justify-center transition-all hover:scale-110 ${brushSize === size ? 'bg-pink-500 shadow-md ring-2 ring-pink-200' : 'bg-gray-200 hover:bg-pink-300'}`}
                    style={{ width: Math.max(24, size + 10), height: Math.max(24, size + 10) }}
                    title={`ขนาด ${size}`}
                  >
                     <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: toolMode === 'eraser' ? 'white' : currentColor }} className="shadow-sm border border-black/10"></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Settings */}
          {toolMode === 'text' && (
            <div className="space-y-3 p-3 bg-purple-50 rounded-2xl border-2 border-purple-100 animate-fadeIn">
              <h4 className="font-bold text-purple-800 text-sm">🔤 ปรับแต่งข้อความ</h4>
              
              <button
                onClick={onAddText}
                className="w-full py-3 bg-white border-2 border-purple-300 text-purple-700 rounded-xl font-bold hover:bg-purple-100 transition-colors shadow-sm"
              >
                + เพิ่มกล่องข้อความ
              </button>

              <div className="space-y-1">
                 <label className="text-xs text-gray-600 flex justify-between font-bold">
                    ขนาดตัวอักษร: {fontSize}px
                 </label>
                 <input 
                   type="range" 
                   min="12" 
                   max="100" 
                   value={fontSize}
                   onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
                   className="w-full accent-purple-600 h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                 />
              </div>
            </div>
          )}

          {/* Colors (Visible for both Brush and Text) */}
          <div className="space-y-2 animate-fadeIn">
            <h3 className="font-bold text-pink-500 text-lg flex items-center gap-2">
               🎨 {toolMode === 'text' ? 'สีข้อความ' : 'จานสี'}
            </h3>
            <div className="grid grid-cols-4 gap-3 p-1">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`aspect-square rounded-full border-4 transition-transform hover:scale-110 shadow-sm ${
                    currentColor === color ? 'border-pink-500 ring-2 ring-pink-200 scale-110' : 'border-white ring-1 ring-gray-100'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`เลือกสี ${color}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-full py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_4px_0_rgb(0,0,0,0.1)] active:translate-y-1 active:shadow-none ${
              !canUndo
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 hover:bg-yellow-200'
            }`}
          >
            <span className="text-xl">↩️</span> ย้อนกลับ
          </button>

          <div className="mt-auto pt-4 border-t-2 border-dashed border-pink-200 animate-fadeIn">
            <button
              onClick={onFinish}
              className="w-full py-4 px-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-[0_6px_0_rgb(180,20,50)] hover:shadow-[0_8px_0_rgb(180,20,50)] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all"
            >
              เสร็จแล้ว! ไปด่านต่อไป ✨
            </button>
          </div>
        </>
      )}
      
      {phase === GamePhase.HIDDEN_OBJECT && (
         <div className="mt-auto flex flex-col gap-3 animate-fadeIn pt-4 border-t-2 border-dashed border-pink-200">
            <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-xl border-2 border-yellow-200 text-center shadow-sm">
               <p className="font-bold text-lg">💡 คำใบ้</p>
               <p>ลองซูมเข้าดูใกล้ๆ สิ!</p>
            </div>
            
            <button
              onClick={onDownload}
              className="w-full py-4 px-4 bg-blue-500 text-white rounded-2xl font-bold shadow-[0_6px_0_rgb(30,60,180)] hover:bg-blue-600 active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 text-lg"
            >
              <span>💾</span> บันทึกรูปภาพ
            </button>

             <button
              onClick={onSkip}
              className="w-full py-3 px-4 border-2 border-gray-300 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              จบเกม 🏁
            </button>
         </div>
      )}

      {/* DEV TOOL BUTTON */}
      {onToggleDevMode && (
         <button 
           onClick={onToggleDevMode}
           className={`mt-2 py-2 px-3 text-xs font-mono rounded border-2 ${isDevMode ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-gray-100 text-gray-500 border-gray-300'}`}
         >
           {isDevMode ? "📍 ปิดโหมดหาพิกัด (Dev)" : "📍 เปิดโหมดหาพิกัด (Dev)"}
         </button>
      )}
    </div>
  );
};

export default ToolsPanel;