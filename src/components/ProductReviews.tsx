import React, { useEffect, useState } from "react";
import { Star, MessageSquarePlus } from "lucide-react";
import { reviewService, ReviewItem, getUserId } from "../api/reviewService";
import { showToast, showApiResponseToast } from "../utils/toastService";

interface ProductReviewsProps {
  productId: number;
  onReviewSubmitted?: () => void;
}

export function ProductReviews({ productId, onReviewSubmitted }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [start, setStart] = useState(0);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");

  const loadReviews = async (reset = false) => {
    setLoading(true);
    const nextStart = reset ? 0 : start;
    try {
      const response = await reviewService.getAll({
        productId,
        search: "",
        start: nextStart,
        length: 10,
        sortColumnIndex: 7,
        sortDirection: "desc",
      });

      if (response && response.isSuccess) {
        const table1 = response.data?.table1 || [];
        const table2 = response.data?.table2 || [];

        const totalRaw = table1[0]?.FilteredRecords ?? table1[0]?.TotalRecords;
        const total = typeof totalRaw === 'number' ? totalRaw : typeof totalRaw === 'string' ? Number(totalRaw) : 0;
        setTotalRecords(total);

        if (reset) {
          setReviews(table2);
          setStart(table2.length);
        } else {
          setReviews((prev) => {
            // Filter duplicates just in case
            const existingIds = new Set(prev.map(r => r.Id));
            const newItems = table2.filter(r => !existingIds.has(r.Id));
            return [...prev, ...newItems];
          });
          setStart((prev) => prev + table2.length);
        }
      } else {
        console.error("Failed to load reviews:", response?.message);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(true);
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      showToast("error", "Please write a review comment.");
      return;
    }

    setSubmitting(true);
    try {
      const userId = getUserId();
      const payload = {
        id: 0,
        productId,
        userId,
        rating,
        reviewText: reviewText.trim()
      };

      const result = await reviewService.save(payload);
      
      // Utilize existing showApiResponseToast
      showApiResponseToast(result);

      if (result.isSuccess || result.statusCode === 1) {
        setReviewText("");
        setRating(5);
        // Refresh from start to display the new review
        await loadReviews(true);
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
      }
    } catch (error) {
      console.error("Error saving review:", error);
      showToast("error", "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr || typeof dateStr !== "string") return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return "";
    }
  };

  // Get initials for profile placeholder
  const getInitials = (name: any) => {
    if (!name || typeof name !== "string") return "A";
    const cleanName = name.trim();
    if (!cleanName) return "A";
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  };

  // Compute summary stats dynamically or read from first review
  const firstReview = reviews[0];
  const avgRatingRaw = firstReview?.AverageRating;
  const avgRating = typeof avgRatingRaw === 'number' ? avgRatingRaw : typeof avgRatingRaw === 'string' ? Number(avgRatingRaw) : 0;
  const reviewsCount = typeof totalRecords === 'number' ? totalRecords : 0;

  const hasMore = reviews.length < reviewsCount;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Summary and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white/40 border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-sm">
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-black/5 pb-6 md:pb-0 md:pr-8">
          <span className="text-5xl font-serif font-semibold text-gray-900 mb-2">
            {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
          </span>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(avgRating)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 font-medium font-satoshi uppercase tracking-wider">
            Based on {reviewsCount} {reviewsCount === 1 ? "review" : "reviews"}
          </span>
        </div>

        {/* Dynamic Reviews Progress Bar Display */}
        <div className="md:col-span-8 space-y-3 font-satoshi">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter((r) => {
              const rRating = typeof r.Rating === 'number' ? r.Rating : typeof r.Rating === 'string' ? Number(r.Rating) : 0;
              return rRating === stars;
            }).length;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-4 text-xs font-medium">
                <span className="w-12 text-gray-600 flex items-center justify-end gap-1">
                  {stars} <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 shrink-0" />
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-gray-400 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Reviews List */}
        <div className="lg:col-span-7 space-y-6">
          <h4 className="text-xl font-serif font-semibold text-gray-900 border-b border-black/5 pb-4">
            Customer Reviews ({reviewsCount})
          </h4>

          {reviews.length === 0 && !loading ? (
            <div className="py-12 text-center bg-white/30 rounded-3xl border border-white/50">
              <span className="text-sm text-gray-500 font-satoshi block mb-2">No reviews yet.</span>
              <span className="text-xs text-gray-400 font-satoshi">Be the first to share your thoughts!</span>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              {reviews.map((rev) => (
                <div
                  key={rev.Id}
                  className="bg-white/70 border border-white/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex gap-4 font-satoshi"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EDE5F5] to-[#f8f4ff] border border-white text-[var(--color-primary)] flex items-center justify-center font-bold font-general text-sm shrink-0 shadow-sm">
                    {getInitials(rev.UserName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <h5 className="font-semibold text-sm text-gray-900 truncate">
                        {typeof rev.UserName === 'string' && rev.UserName.trim() ? rev.UserName : "Anonymous Guest"}
                      </h5>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {formatDate(rev.CreatedDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const starRating = typeof rev.Rating === 'number' ? rev.Rating : typeof rev.Rating === 'string' ? Number(rev.Rating) : 0;
                        return (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= starRating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-200"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-light whitespace-pre-line">
                      {typeof rev.ReviewText === 'string' ? rev.ReviewText : typeof rev.ReviewText === 'number' ? String(rev.ReviewText) : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loader or Load More Button */}
          {loading && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {hasMore && !loading && (
            <button
              onClick={() => loadReviews(false)}
              className="w-full bg-white/80 hover:bg-white text-[var(--color-primary)] border border-[var(--color-primary)]/20 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              More Reviews
            </button>
          )}
        </div>

        {/* Add Review Form */}
        <div className="lg:col-span-5 bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-[2rem] shadow-sm sticky top-28">
          <div className="flex items-center gap-2.5 mb-6">
            <MessageSquarePlus className="w-5 h-5 text-[var(--color-primary)]" />
            <h4 className="text-lg font-serif font-semibold text-gray-900">
              Write a Review
            </h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 font-satoshi">
            {/* Rating Selector */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold block mb-2.5">
                Your Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = hoverRating !== null ? star <= hoverRating : star <= rating;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 -m-1 focus:outline-none cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isActive
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-200"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label htmlFor="reviewText" className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold block mb-2">
                Your Review
              </label>
              <textarea
                id="reviewText"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this product (e.g. packaging, fragrance, effectiveness)..."
                className="w-full bg-white/80 border border-black/10 rounded-2xl p-4 text-xs font-light text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)]/40 focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-all resize-none"
              />
            </div>

            {/* Note on logged-in vs anonymous */}
            {getUserId() === 0 && (
              <p className="text-[10px] text-gray-400 bg-orange-50/50 border border-orange-100/50 rounded-xl p-3 leading-relaxed">
                You are currently posting as an anonymous guest. Log in to show your username on the review.
              </p>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#5B2A86] via-[#7A49A5] to-[#A678D6] disabled:from-gray-400 disabled:to-gray-500 text-white py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all shadow-md hover:shadow-lg shadow-[rgba(91,42,134,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Submit Review"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
