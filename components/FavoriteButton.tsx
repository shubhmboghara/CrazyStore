'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/components/Toast';

interface FavoriteButtonProps {
  slug: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'floating' | 'inline';
  className?: string;
}

export function FavoriteButton({
  slug,
  name,
  size = 'md',
  variant = 'inline',
  className = '',
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();
  const active = isFavorite(slug);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(slug);

    if (!active) {
      showToast(`Added ${name} to your Favorites!`, 'success');
    } else {
      showToast(`Removed ${name} from Favorites`, 'info');
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 rounded-xl text-xs',
    md: 'p-2 rounded-2xl text-sm',
    lg: 'px-4 py-3 rounded-2xl text-sm',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
        title={active ? 'Remove from favorites' : 'Add to favorites'}
        className={`relative z-10 transition-all duration-200 cursor-pointer ${
          active
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
            : 'bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-zinc-700 shadow-xs'
        } ${sizeClasses} ${className}`}
      >
        <Heart className={`${iconSizes} ${active ? 'fill-white' : ''} transition-transform active:scale-125`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
      className={`inline-flex items-center gap-2 font-bold transition-all duration-200 cursor-pointer ${
        active
          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 shadow-xs'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/60'
      } ${sizeClasses} ${className}`}
    >
      <Heart className={`${iconSizes} ${active ? 'fill-rose-500 text-rose-500' : ''} transition-transform active:scale-125`} />
      <span>{active ? 'Favorited' : 'Favorite'}</span>
    </button>
  );
}
