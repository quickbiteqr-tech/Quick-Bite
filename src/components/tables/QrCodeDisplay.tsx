'use client';

import Image from 'next/image';

interface QrCodeDisplayProps {
  url: string;
  tableName: string;
}

export default function QrCodeDisplay({ url, tableName }: QrCodeDisplayProps) {
  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tableName.replace(/\s+/g, '-')}-qr-code.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
      <div className="relative h-28 w-28 sm:h-32 sm:w-32">
        <Image
          src={url}
          alt={`QR code for ${tableName}`}
          fill
          className="object-contain"
          sizes="128px"
        />
      </div>
      <button
        type="button"
        onClick={downloadQRCode}
        className="w-full rounded-lg bg-[#6DBE45] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#5aa337] sm:text-sm"
      >
        Download QR
      </button>
    </div>
  );
}
