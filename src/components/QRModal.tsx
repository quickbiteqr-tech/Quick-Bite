'use client';
import { X, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrUrl: string;
  tableNumber?: number;
}

export default function QRModal({ isOpen, onClose, qrUrl, tableNumber }: QRModalProps) {
  if (!isOpen) return null;
  const [loading, setLoading ] = useState<boolean>(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `table-${tableNumber || 'qr'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download image", error);
    }
    finally{
        setLoading(false);
    }
  };

  if(loading){
    return (
        <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#6DBE45]" aria-hidden />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="font-semibold text-slate-800">
            {tableNumber ? `Table ${tableNumber} QR` : 'QR Code'}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrUrl} 
              alt={`QR Code for Table ${tableNumber}`} 
              className="h-48 w-48 object-contain mix-blend-multiply"
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