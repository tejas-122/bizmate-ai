import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '../../core/firebase/firebaseClient.js';
import { userFromFirestore } from '../../core/models/user.js';

export function watchAuthState(callback, onError) {
  return onAuthStateChanged(getFirebaseAuth(), callback, onError);
}

export async function signIn({ email, password }) {
  await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export async function register({ email, password, fullName, phoneNumber }) {
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );

  await updateProfile(credential.user, { displayName: fullName.trim() });

  await setDoc(doc(getFirestoreDb(), 'users', credential.user.uid), {
    email: email.trim(),
    fullName: fullName.trim(),
    phoneNumber: phoneNumber?.trim() || null,
    createdAt: serverTimestamp(),
  });
}

export async function loadCurrentUserProfile(userId) {
  const snapshot = await getDoc(doc(getFirestoreDb(), 'users', userId));
  return snapshot.exists() ? userFromFirestore(snapshot) : null;
}

export async function logout() {
  await signOut(getFirebaseAuth());
}
