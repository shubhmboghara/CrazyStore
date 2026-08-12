import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4">
      <h1 className="text-4xl font-black mb-4">404</h1>
      <p className="text-zinc-500 mb-8">Page not found</p>
      <Link href="/" className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500">
        Return Home
      </Link>
    </div>
  );
}
