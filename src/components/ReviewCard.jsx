import React, { useState } from 'react';
import { Star, ThumbsUp, Flag, Pencil, Trash2, Shield } from 'lucide-react';
import { toggleHelpful, deleteReview, reportReview } from '../services/reviews';
import { useUser } from '../hooks/useUser';

const ReviewCard = ({ review, onEdit, onDeleted, isAdmin, helpfulStatus }) => {
  const { user } = useUser();
  const [localHelpful, setLocalHelpful] = useState(null);
  const [localHelpfulCount, setLocalHelpfulCount] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reported, setReported] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?.uid === review.userId;
  const helpful = localHelpful !== null ? localHelpful : (helpfulStatus || false);
  const helpfulCount = localHelpfulCount !== null ? localHelpfulCount : (review.helpfulCount || 0);

  const handleHelpful = async () => {
    if (!user) return;
    try {
      const res = await toggleHelpful(review.id);
      setLocalHelpful(res.helpful);
      setLocalHelpfulCount(res.helpfulCount);
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this review?')) return;
    setDeleting(true);
    try {
      await deleteReview(review.id);
      onDeleted?.(review.id);
    } catch { /* ignore */ } finally {
      setDeleting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await reportReview(review.id, reportReason.trim());
      setReported(true);
      setShowReport(false);
      setReportReason('');
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-rose-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-950 text-amber-400 flex items-center justify-center font-bold text-sm">
            {review.userName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-rose-950 text-sm">{review.userName}</span>
            {review.edited && (
              <span className="text-xs text-rose-900/40 ml-1">(edited)</span>
            )}
          </div>
          {isAdmin && review.userId !== user?.uid && (
            <Shield className="w-3.5 h-3.5 text-blue-500" title="Admin view" />
          )}
        </div>
        <div className="flex items-center gap-0.5 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'stroke-current text-gray-300'}`} />
          ))}
        </div>
      </div>
      <p className="text-rose-900/80 text-sm leading-relaxed">{review.comment}</p>
      {review.date && (
        <p className="text-xs text-rose-900/40 mt-2">
          {new Date(review.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      )}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-rose-50">
        <button
          onClick={handleHelpful}
          disabled={!user}
          className={`flex items-center gap-1 text-xs font-medium transition-colors ${
            helpful ? 'text-amber-600' : 'text-rose-900/40 hover:text-rose-900/70'
          } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${helpful ? 'fill-current' : ''}`} />
          Helpful ({helpfulCount})
        </button>
        {isOwner && (
          <>
            <button onClick={() => onEdit?.(review)} className="flex items-center gap-1 text-xs text-rose-900/40 hover:text-amber-600 transition-colors font-medium">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1 text-xs text-rose-900/40 hover:text-red-500 transition-colors font-medium">
              <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        )}
        {user && !isOwner && !reported && (
          <button onClick={() => setShowReport(!showReport)} className="flex items-center gap-1 text-xs text-rose-900/40 hover:text-red-500 transition-colors font-medium ml-auto">
            <Flag className="w-3.5 h-3.5" /> Report
          </button>
        )}
        {reported && <span className="text-xs text-green-600 ml-auto">Reported</span>}
      </div>
      {showReport && (
        <div className="mt-3 p-3 bg-rose-50 rounded-lg border border-rose-100">
          <p className="text-xs font-bold text-rose-950 mb-2">Reason for reporting:</p>
          <input
            type="text"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Spam, inappropriate, offensive..."
            className="w-full text-sm border border-rose-200 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleReport} className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600">Submit</button>
            <button onClick={() => { setShowReport(false); setReportReason(''); }} className="text-xs text-rose-900/60 hover:text-rose-900">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
