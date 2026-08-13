'use client';

import React from 'react';
import { StarRating } from './StarRating';
import { ReviewSkeleton } from './ReviewSkeleton';
import { User, MessageSquare, ThumbsUp, CornerDownRight } from 'lucide-react';

export interface ReviewItem {
  id: string;
  appSlug: string;
  rating: number;
  name: string;
  reviewText: string;
  createdAt: string;
  adminReply?: string;
}

interface ReviewsListProps {
  reviews: ReviewItem[];
  isLoading: boolean;
  averageRating: number;
  totalCount: number;
}

export function ReviewsList({
  reviews,
  isLoading,
  averageRating,
  totalCount,
}: ReviewsListProps) {
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
    return { star, count, percentage };
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Recently';
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return 'Recently';
    }
  };

  return (
    <div id="reviews-section" className="space-y-6">
      {/* Average Rating Summary Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Ratings & Reviews
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Big Score Number */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-center">
            <span className="text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {totalCount > 0 ? averageRating.toFixed(1) : '5.0'}
            </span>
            <div className="my-2">
              <StarRating
                rating={totalCount > 0 ? averageRating : 5}
                size="md"
                interactive={false}
              />
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Based on {totalCount} user review{totalCount === 1 ? '' : 's'}
            </span>
          </div>
          {/* Star Distribution Bars */}
          <div className="md:col-span-8 space-y-1.5">
            {distribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-medium text-zinc-600 dark:text-zinc-400 text-right">
                  {star} ★
                </span>
                <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-zinc-400 dark:text-zinc-500 font-mono">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            User Reviews ({reviews.length})
          </h4>
          <span className="text-xs text-zinc-400">Newest first</span>
        </div>

        {isLoading ? (
          <ReviewSkeleton />
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-2">
            <p className="text-zinc-600 dark:text-zinc-400 font-medium text-sm">
              No reviews yet for this app.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Be the first user to download the APK and leave feedback above!
            </p>
          </div>
        ) : (
          <div className="space-y-3" id="reviews-list">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:border-purple-200 dark:hover:border-purple-900/60 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs uppercase border border-purple-200 dark:border-purple-800/50">
                      {review.name ? review.name.charAt(0) : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 block">
                        {review.name || 'Anonymous'}
                      </span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                </div>

                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed pl-10">
                  {review.reviewText}
                </p>

                {/* Developer / Admin Reply */}
                {review.adminReply && (
                  <div className="ml-10 mt-3 p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-start gap-2.5">
                    <CornerDownRight className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                          Developer Response
                        </span>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                        {review.adminReply}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2 pl-10 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/60">
                  <span className="inline-flex items-center gap-1 text-[11px] hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer">
                    <ThumbsUp className="w-3 h-3" /> Helpful
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
