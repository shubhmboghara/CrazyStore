'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // e.g. 4.8 or 5
  maxStars?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  reviewCount?: number;
}

export function StarRating({
  rating,
  maxStars = 5,
  interactive = false,
  onRatingChange,
  size = 'md',
  showNumber = false,
  reviewCount,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const currentRating = hoverRating !== null ? hoverRating : rating;

  const handleKeyDown = (e: React.KeyboardEvent, starValue: number) => {
    if (!interactive || !onRatingChange) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onRatingChange(Math.min(maxStars, starValue + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onRatingChange(Math.max(1, starValue - 1));
    }
  };

  return (
    <div
      className="inline-flex items-center gap-1.5"
      id="star-rating"
      role={interactive ? 'radiogroup' : undefined}
      aria-label={interactive ? 'Star rating selection' : undefined}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = currentRating >= starValue;
          const isHalf = !isFilled && currentRating > index && currentRating < starValue;

          return (
            <button
              key={index}
              type={interactive ? 'button' : undefined}
              disabled={!interactive}
              role={interactive ? 'radio' : undefined}
              aria-checked={interactive ? rating === starValue : undefined}
              onClick={() => interactive && onRatingChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              onKeyDown={(e) => handleKeyDown(e, starValue)}
              className={`transition-transform duration-150 p-0.5 ${
                interactive
                  ? 'cursor-pointer hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-md'
                  : 'cursor-default'
              }`}
              aria-label={interactive ? `${starValue} of ${maxStars} stars` : undefined}
            >
              <div className="relative">
                <Star
                  className={`${starSizes[size]} ${
                    isFilled
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-zinc-700'
                  }`}
                />
                {isHalf && (
                  <div className="absolute top-0 left-0 overflow-hidden w-[50%]">
                    <Star className={`${starSizes[size]} fill-amber-400 text-amber-400`} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {showNumber && (
        <span className="font-semibold text-zinc-100 text-sm ml-1">
          {rating > 0 ? rating.toFixed(1) : 'New'}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-zinc-400 text-xs font-normal">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
