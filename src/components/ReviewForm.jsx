import React, { useState } from 'react';
import { Star } from 'lucide-react';

const ReviewForm = ({ initialRating, initialComment, onSubmit, onCancel, isEditing, submitting }) => {
  const [rating, setRating] = useState(initialRating || 5);
  const [comment, setComment] = useState(initialComment || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed || trimmed.length < 10) return;
    onSubmit({ rating, comment: trimmed });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-rose-50/50 rounded-xl p-6 border border-rose-100">
      <h3 className="font-bold text-rose-950 mb-3">{isEditing ? 'Edit Review' : 'Write a Review'}</h3>
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => setRating(star)} className="text-amber-500 hover:scale-110 transition-transform">
            <Star className={`w-8 h-8 ${star <= rating ? 'fill-current' : 'stroke-current'}`} />
          </button>
        ))}
        <span className="ml-2 text-sm text-rose-900/60 font-medium">{rating}/5</span>
      </div>
      <textarea
        rows="3"
        placeholder="Share your experience with this product..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border-2 border-rose-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white resize-none"
        required
      />
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          disabled={submitting || !comment.trim()}
          className="bg-amber-500 text-rose-950 font-bold py-3 px-8 rounded-xl hover:bg-amber-400 transition-colors uppercase tracking-wider shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-rose-900/60 hover:text-rose-900 font-medium py-3 px-4 transition-colors">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
