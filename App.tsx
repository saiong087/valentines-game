import React, { useState, useEffect, useRef } from 'react';
import { generateValentineLevel, generateFallbackLevel, BACKUP_LEVELS } from './services/geminiService';
import { GamePhase, LevelData } from './types';
import { DEFAULT_BRUSH_COLOR, DEFAULT_BRUSH_SIZE } from './constants';
import ToolsPanel from './components/ToolsPanel';
import HiddenItemsPanel from './components/HiddenItemsPanel';
import GameCanvas, { GameCanvasHandle } from './components/GameCanvas';
import DownloadModal from './components/DownloadModal';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.INIT);
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tools State
  const [toolMode, setToolMode] = useState<'brush' | 'eraser' | 'text'>('brush');
  const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH_COLOR);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);

  // Text Tool State
  const [fontSize, setFontSize] = useState(30);

  // Undo/Redo
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [canUndo, setCanUndo] = useState(false);

  // Zoom State
  const [zoom, setZoom] = useState(1);

  // Hidden Object State
  const [foundItemIds, setFoundItemIds] = useState<Set<string>>(new Set());

  // Download Modal State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Developer Mode
  const [isDevMode, setIsDevMode] = useState(false);

  const gameCanvasRef = useRef<GameCanvasHandle>(null);

  const startGame = async () => {
    setPhase(GamePhase.LOADING);
    setLevelData(null);
    setError(null);
    setFoundItemIds(new Set());
    setZoom(1);

    try {
      // สุ่มด่านจาก BACKUP_LEVELS เสมอ (ไม่ต้องใช้ AI)
      const randomIndex = Math.floor(Math.random() * BACKUP_LEVELS.length);
      const data = await generateFallbackLevel(randomIndex);

      setLevelData(data);
      setPhase(GamePhase.COLORING);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage || "ไม่พบรูปภาพสำรองที่คุณอัปโหลด กรุณาตรวจสอบไฟล์ backup1.jpg ถึง backup4.jpg");
      setPhase(GamePhase.INIT);
    }
  };

  const handleFinishColoring = () => {
    setPhase(GamePhase.HIDDEN_OBJECT);
    setZoom(1);
    setToolMode('brush');
  };

  const handleObjectFound = (id: string) => {
    if (isDevMode) return;
    if (!levelData) return;

    const newFound = new Set(foundItemIds);
    newFound.add(id);
    setFoundItemIds(newFound);

    if (newFound.size === levelData.hiddenObjects.length) {
      setTimeout(() => setPhase(GamePhase.WIN), 1000);
    }
  };

  const handleDownloadConfirm = (name: string) => {
    setIsDownloadModalOpen(false);
    if (gameCanvasRef.current) {
      gameCanvasRef.current.downloadImage(name);
    }
  };

  const handleAddText = () => {
    if (gameCanvasRef.current) {
      gameCanvasRef.current.addText("");
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col font-sans text-gray-800 overflow-hidden relative">
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onConfirm={handleDownloadConfirm}
      />

      {/* Header */}
      <header className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-3 md:p-4 shadow-lg flex justify-between items-center z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl md:text-4xl animate-bounce">💘</span>
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-wide drop-shadow-md">Valentine's Art & Seek</h1>
            {levelData?.isLocal && (
              <p className="text-[10px] md:text-xs font-mono opacity-80">📁 กำลังเล่น: ภาพที่อัปโหลดเอง (สุ่ม)</p>
            )}
          </div>
        </div>
        <div className="text-xs md:text-lg font-bold bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-md border-2 border-white/40 shadow-sm">
          {phase === GamePhase.INIT && "ยินดีต้อนรับ! 🎮"}
          {phase === GamePhase.LOADING && "กำลังเตรียมด่าน... 🪄"}
          {phase === GamePhase.COLORING && "ระบายสีให้สวยงาม 🎨"}
          {phase === GamePhase.HIDDEN_OBJECT && "ตามหาของที่หายไป 🔍"}
          {phase === GamePhase.WIN && "สุดยอดมาก! 🏆"}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row relative p-2 md:p-4 gap-4 overflow-hidden h-full">

        {/* Overlay Screens */}
        {(phase === GamePhase.INIT || phase === GamePhase.LOADING || phase === GamePhase.WIN) && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border-4 border-pink-200">

              {phase === GamePhase.WIN && (
                <div className="mb-6 animate-bounce text-6xl">🎉💖🏅</div>
              )}

              <h2 className="text-4xl font-bold text-red-600 mb-4">
                {phase === GamePhase.WIN ? "ภารกิจสำเร็จ!" : "ปริศนาแห่งรัก"}
              </h2>

              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {phase === GamePhase.WIN
                  ? "คุณมีสายตาที่เฉียบคมและฝีมือระบายสีที่ยอดเยี่ยมมาก! มาลองเล่นด่านต่อไปกันเลย"
                  : "มาสนุกกับการระบายสีและค้นหาของที่ซ่อนอยู่ในภาพกันเถอะ!"}
              </p>

              {phase === GamePhase.WIN && (
                <div className="mb-6">
                  <button
                    onClick={() => setIsDownloadModalOpen(true)}
                    className="w-full px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-xl"
                  >
                    <span>💾</span> เก็บผลงานนี้ไว้ดู
                  </button>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium">
                  🚨 {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={startGame}
                  disabled={phase === GamePhase.LOADING}
                  className={`w-full py-4 text-xl font-bold text-white rounded-2xl shadow-[0_6px_0_rgb(0,0,0,0.2)] transition-all transform active:translate-y-1 active:shadow-none ${phase === GamePhase.LOADING
                    ? 'bg-gray-400 cursor-wait'
                    : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
                    }`}
                >
                  {phase === GamePhase.LOADING ? "กำลังดาวน์โหลดด่าน..." : phase === GamePhase.WIN ? "เล่นอีกครั้ง 🔄" : "เริ่มเกม 🎮 (v1.4)"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Layout */}
        {levelData && (
          <>
            <div className={`transition-all duration-500 ${phase === GamePhase.WIN ? 'blur-sm' : ''} z-20 flex-shrink-0 hidden md:block`}>
              <HiddenItemsPanel
                items={levelData.hiddenObjects}
                foundItemIds={foundItemIds}
                story={levelData.story}
                phase={phase}
                rasterImage={levelData.rasterImage}
              />
            </div>

            <div className={`flex-1 relative min-h-[300px] min-w-0 transition-all duration-500 ${phase === GamePhase.WIN ? 'blur-sm' : ''} z-10 rounded-2xl overflow-hidden border-4 border-pink-200 bg-white shadow-inner`}>
              <GameCanvas
                ref={gameCanvasRef}
                rasterImage={levelData.rasterImage}
                imageMode={levelData.imageMode}
                phase={phase}
                brushColor={brushColor}
                brushSize={brushSize}
                toolMode={toolMode}
                fontSize={fontSize}
                onUndoStateChange={setCanUndo}
                undoTrigger={undoTrigger}
                hiddenObjects={levelData.hiddenObjects}
                onObjectFound={handleObjectFound}
                foundItemIds={foundItemIds}
                zoom={zoom}
                isDevMode={isDevMode}
              />

              {phase === GamePhase.HIDDEN_OBJECT && foundItemIds.size === 0 && !isDevMode && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 px-8 py-3 rounded-full shadow-2xl border-4 border-pink-400 animate-bounce pointer-events-none z-50 whitespace-nowrap">
                  <p className="text-pink-600 font-bold text-xl">👆 คลิกที่จุดที่ซ่อนอยู่ในภาพ!</p>
                </div>
              )}

              {isDevMode && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-2 rounded-lg shadow-xl border-2 border-yellow-400 pointer-events-none z-50">
                  <p className="text-yellow-400 font-bold font-mono">🔧 Dev Mode: ลากครอบเพื่อเอาพิกัดไปใส่โค้ด</p>
                </div>
              )}
            </div>

            {(phase === GamePhase.COLORING || phase === GamePhase.HIDDEN_OBJECT) && (
              <div className="z-20 flex-shrink-0">
                <ToolsPanel
                  phase={phase}
                  currentColor={brushColor}
                  toolMode={toolMode}
                  onColorChange={setBrushColor}
                  onSetToolMode={setToolMode}
                  onUndo={() => setUndoTrigger(prev => prev + 1)}
                  onFinish={handleFinishColoring}
                  canUndo={canUndo}
                  zoom={zoom}
                  onZoomIn={() => setZoom(p => Math.min(p + 0.5, 3))}
                  onZoomOut={() => setZoom(p => Math.max(p - 0.5, 1))}
                  onZoomReset={() => setZoom(1)}
                  onDownload={() => setIsDownloadModalOpen(true)}
                  onSkip={() => setPhase(GamePhase.WIN)}
                  fontSize={fontSize}
                  onFontSizeChange={setFontSize}
                  onAddText={handleAddText}
                  brushSize={brushSize}
                  onBrushSizeChange={setBrushSize}
                  isDevMode={isDevMode}
                  onToggleDevMode={() => setIsDevMode(!isDevMode)}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;