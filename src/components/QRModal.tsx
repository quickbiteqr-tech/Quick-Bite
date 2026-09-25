'use client';
import { X, Download } from 'lucide-react';
import QRCodeGenerator from './tables/QRCodeGenerator';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId?: string;
  tableName?: string;
}

export default function QRModal({ isOpen, onClose, tableId, tableName }: QRModalProps) {
  if (!isOpen || !tableId) return null;

  const handleDownload = () => {
    const canvas = document.getElementById(`qr-${tableId}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `table-${tableName || 'qr'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="font-semibold text-slate-800">
            {tableName ? `Table ${tableName} QR` : 'QR Code'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center p-6">
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2 shadow-inner">
            <QRCodeGenerator 
              tableId={tableId} 
              tableName={tableName || ''} 
              size={192} // slightly larger for the modal
              className="border-none !bg-transparent p-0" 
            />
          </div>
          
          <button
            onClick={handleDownload}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6DBE45] py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#5aa337]"
          >
            <Download className="h-4 w-4" />
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
}