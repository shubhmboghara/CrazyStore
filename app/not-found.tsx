import Link from 'next/link';
import { Sparkles, ArrowLeft, Search, Layers, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-lg mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/70 border border-purple-800/50 text-purple-300 text-xs font-bold shadow-inner">
          <Compass className="w-3.5 h-3.5 text-purple-400" />
          <span>404 &bull; Resource Not Located</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-zinc-100">
          Page or App <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300">
            Not Found
          </span>
        </h1>

        <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
          The open-source Android APK or route you requested could not be located in our repository. It may have been moved, renamed, or updated.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/#catalog"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Browse App Catalog</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm border border-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Storefront Home</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-zinc-900 text-xs text-zinc-500">
          Looking for a specific app? Check out our flagship{' '}
          <Link href="/apps/videohub" className="text-purple-400 hover:underline font-bold">
            VideoHub Android Studio
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
