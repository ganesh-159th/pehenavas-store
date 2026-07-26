import React from 'react';
import { ArrowUpDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
  { value: 'helpful', label: 'Most Helpful' },
];

const ReviewSortBar = ({ sort, onSortChange, reviewCount }) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <p className="text-sm text-rose-900/60">
        {reviewCount} review{reviewCount !== 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-rose-900/40" />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="text-sm border border-rose-200 rounded-lg px-3 py-1.5 bg-white text-rose-950 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ReviewSortBar;
