'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Smartphone, ExternalLink, ShieldCheck } from 'lucide-react';

interface DownloadQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  version: string;
  downloadUrl: string;
}

export function DownloadQrModal({
  isOpen,
  onClose,
  appName,
  version,
  downloadUrl,
}: DownloadQrModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && downloadUrl) {
      QRCode.toDataURL(downloadUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#0a0a10',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [isOpen, downloadUrl]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-auto z-50 p-0 rounded-3xl bg-zinc-950 border border-purple-500/30 text-white max-w-md w-[92vw] shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
      aria-labelledby="qr-modal-title"
    >
      <div className="p-6 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close QR download modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 id="qr-modal-title" className="text-base font-black text-zinc-100 tracking-tight">
              Scan to Download APK
            </h2>
            <p className="text-xs text-zinc-400">
              {appName} · <span className="text-purple-400 font-mono">{version}</span>
            </p>
          </div>
        </div>

        {/* QR Code Canvas / Image Container */}
        <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/80 rounded-2xl border border-zinc-800/80 mb-5 relative group">
          {qrDataUrl ? (
            <div className="relative p-2 bg-[#0a0a10] rounded-xl border border-purple-500/20 shadow-inner">
              <img
                src={qrDataUrl}
                alt={`QR code to download ${appName} ${version}`}
                className="w-56 h-56 rounded-lg object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-purple-600/90 flex items-center justify-center shadow-lg border border-purple-400/50">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-56 h-56 rounded-xl bg-zinc-800/50 animate-pulse flex items-center justify-center text-zinc-500 text-xs">
              Generating secure QR...
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Point phone camera at screen to install directly</span>
          </div>
        </div>

        {/* Direct Download Action Button */}
        <div>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Direct Download on this Device</span>
          </a>
        </div>
      </div>
    </dialog>
  );
}
