'use client';

import Image from 'next/image';

interface QrCodeDisplayProps {
  url: string;
  tableName: string;
}

export default function QrCodeDisplay({ url, tableName }: QrCodeDisplayProps) {

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
    </div>
  );
}
