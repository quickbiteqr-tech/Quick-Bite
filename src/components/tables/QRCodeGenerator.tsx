'use client';

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeGeneratorProps {
  tableId: string;
  tableName: string;
  size?: number;
  className?: string;
  onDownload?: () => void;
}

export default function QRCodeGenerator({ 
  tableId, 
  tableName, 
  size = 128, 
  className,
  onDownload
}: QRCodeGeneratorProps) {
  // Construct the secure URL using the table's UUID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://quickbiteqr.co.in';
  const qrUrl = `${baseUrl}/t/${tableId}`;

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    
    // Default download logic
    const canvas = document.getElementById(`qr-${tableId}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `table-${tableName}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 ${className || ''}`}>
      <div 
        className="relative cursor-pointer" 
        onClick={handleDownload}
        title="Click to download QR Code"
        data-testid={`qr-container-${tableId}`}
      >
        <QRCodeCanvas 
          id={`qr-${tableId}`}
          value={qrUrl} 
          size={size} 
          level="H" // High error correction for restaurant environments
          includeMargin={true}
        />
      </div>
    </div>
  );
}
