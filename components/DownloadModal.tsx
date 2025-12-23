import React, { useState } from 'react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(name || "ศิลปิน");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full mx-4 border-4 border-pink-300 transform transition-all scale-100">
        <h3 className="text-2xl font-bold text-pink-600 mb-4 text-center">บันทึกผลงาน 💾</h3>
        <p className="text-gray-600 mb-4 text-center">พิมพ์ชื่อศิลปินเพื่อประทับตราบนผลงานแห่งความรักนี้</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อของคุณ..."
            className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none mb-6 text-lg text-center font-bold text-pink-700 placeholder-pink-300"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-gray-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg transform active:scale-95 transition-all"
            >
              บันทึกเลย!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DownloadModal;