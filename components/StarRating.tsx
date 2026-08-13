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

  return (
    <div className="inline-flex items-center gap-1.5" id="star-rating">
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
              onClick={() => interactive && onRatingChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`transition-transform duration-150 ${
                interactive
                  ? 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded'
                  : 'cursor-default'
              }`}
              aria-label={`Set rating to ${starValue} stars`}
            >
              <div className="relative">
                <Star
                  className={`${starSizes[size]} ${
                    isFilled
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-zinc-300 dark:text-zinc-600'
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
        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm ml-1">
          {rating > 0 ? rating.toFixed(1) : 'New'}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-zinc-500 dark:text-zinc-400 text-xs font-normal">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
