import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function addReview({ productId, userId, userName, rating, comment }) {
  const docRef = await addDoc(collection(db, 'reviews'), {
    productId: String(productId),
    userId,
    userName,
    rating: Number(rating),
    comment,
    date: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getProductReviews(productId) {
  const q = query(
    collection(db, 'reviews'),
    where('productId', '==', String(productId))
  );
  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return reviews.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
}
