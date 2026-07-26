import React from 'react';
import { Star } from 'lucide-react';

const RatingBreakdown = ({ stats }) => {
  if (!stats || !stats.totalReviews) return null;
  const { averageRating, totalReviews, distribution } = stats;

  return (
    <div className="bg-rose-50/50 rounded-xl p-6 border border-rose-100">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="text-center min-w-[100px]">
          <p className="text-5xl font-serif font-bold text-rose-950">{averageRating}</p>
          <div className="flex items-center justify-center gap-0.5 text-amber-500 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < Math.floor(averageRating) ? 'fill-current' : 'stroke-current text-gray-300'}`} />
            ))}
          </div>
          <p className="text-xs text-rose-900/50 mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 min-w-[200px] space-y-1.5">
          {[5, 4, 3, 2, 1].map(star => {
            const count = distribution?.[star] || 0;
            const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-6 text-right text-rose-900/60 font-medium">{star}</span>
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <div className="flex-1 h-2.5 bg-rose-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-rose-900/40">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingBreakdown;
