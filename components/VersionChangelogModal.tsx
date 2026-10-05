'use client';

import React, { useEffect, useRef } from 'react';
import { X, History, Sparkles, CheckCircle2 } from 'lucide-react';
import { AndroidApp } from '@/lib/appsData';

interface VersionChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: AndroidApp;
}

export function VersionChangelogModal({ isOpen, onClose, app }: VersionChangelogModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const changelog = app.changelog || [
    {
      version: app.version,
      date: app.updatedAt,
      notes: [
        'Optimized runtime execution for latest Android API release.',
        'Zero-telemetry privacy policy strictly maintained.',
        'Continuous performance improvements and battery consumption reductions.',
      ],
    },
  ];

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
      className="fixed inset-0 m-auto z-50 p-0 rounded-3xl bg-zinc-950 border border-zinc-800 text-white max-w-lg w-[92vw] shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      aria-labelledby="changelog-modal-title"
    >
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 id="changelog-modal-title" className="text-base font-black text-zinc-100 tracking-tight">
                Version History &amp; Changelog
              </h2>
              <p className="text-xs text-zinc-400">{app.name} Release Archive</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close changelog modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Changelog Timeline List */}
        <div className="p-6 overflow-y-auto space-y-6">
          {changelog.map((entry, idx) => (
            <div key={idx} className="relative pl-6 border-l-2 border-purple-800/50 space-y-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-600 border-2 border-zinc-950" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-purple-300">{entry.version}</span>
                <span className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
                  {entry.date}
                </span>
                {idx === 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    Latest
                  </span>
                )}
              </div>
              <ul className="space-y-1.5 pt-1">
                {entry.notes.map((note, noteIdx) => (
                  <li key={noteIdx} className="text-xs text-zinc-300 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </dialog>
  );
}
