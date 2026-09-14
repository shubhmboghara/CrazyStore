import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      <h1 className="text-4xl font-black mb-4">404</h1>
      <p className="text-zinc-400 mb-8">Page not found</p>
      <Link href="/" className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/25">
        Return Home
      </Link>
    </div>
  );
}
