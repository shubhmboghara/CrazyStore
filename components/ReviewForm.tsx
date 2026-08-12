'use client';

import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { useToast } from './Toast';
import { Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReviewFormProps {
  appSlug: string;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({ appSlug, onReviewSubmitted }: ReviewFormProps) {
  const { showToast } = useToast();
  const [rating, setRating] = useState<number>(5);
  const [name, setName] = useState<string>('');
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation
    if (!rating || rating < 1 || rating > 5) {
      setErrorMessage('Please select a star rating between 1 and 5 stars.');
      return;
    }

    if (!reviewText.trim() || reviewText.trim().length < 10) {
      setErrorMessage('Review text must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appSlug,
          rating,
          name: name.trim() || 'Anonymous',
          reviewText: reviewText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to submit review. Please try again.';
        setErrorMessage(errorMsg);
        showToast(errorMsg, response.status === 429 ? 'info' : 'error');
        setIsSubmitting(false);
        return;
      }

      // Success
      setSubmittedSuccess(true);
      showToast('Thank you! Your review has been published.', 'success');
      setReviewText('');
      setName('');
      setRating(5);

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      // Reset success banner after 5 seconds
      setTimeout(() => {
        setSubmittedSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Submission error:', err);
      const msg = 'Network error. Please check your connection and try again.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="review-form-container"
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Leave a Review
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Share your experience with other Android users.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
          Verified APK
        </span>
      </div>

      {submittedSuccess && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Your review was submitted successfully! It is now live below.</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Field */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Your Rating <span className="text-purple-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <StarRating
              rating={rating}
              interactive={true}
              onRatingChange={setRating}
              size="lg"
            />
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              {rating} / 5 Star{rating > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label
            htmlFor="review-name-input"
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Your Name <span className="text-zinc-400 font-normal">(Optional)</span>
          </label>
          <input
            id="review-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex M. (blank shows 'Anonymous')"
            maxLength={50}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Review Text Field */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="review-text-input"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              Your Review <span className="text-purple-500">*</span>
            </label>
            <span
              className={`text-[11px] ${
                reviewText.trim().length >= 10
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-400'
              }`}
            >
              {reviewText.trim().length}/500 (min 10 chars)
            </span>
          </div>
          <textarea
            id="review-text-input"
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did you like about this app? Performance, Compose UI, speed, features..."
            minLength={10}
            maxLength={500}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          id="submit-review-button"
          type="submit"
          disabled={isSubmitting || reviewText.trim().length < 10}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 dark:disabled:text-zinc-600 text-white font-medium text-sm shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Review
            </>
          )}
        </button>
      </form>
    </div>
  );
}
