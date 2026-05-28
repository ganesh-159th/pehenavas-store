import {
  collection, doc, getDocs, addDoc, deleteDoc, updateDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

export const productsService = {
  async getAll() {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async add(product) {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...product,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...product };
  },

  async remove(id) {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  },

  async update(id, data) {
    await updateDoc(doc(db, PRODUCTS_COLLECTION, id), data);
  },
};

export const ordersService = {
  async getAll() {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async add(order) {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...order,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...order };
  },
};

export async function uploadImage(file, path) {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
