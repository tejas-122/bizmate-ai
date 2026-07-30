import { initializeApp as initializeFirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getFirebaseConfig } from './firebaseConfig.js';

let firebaseApp;
let auth;
let db;

export function initializeFirebase() {
  if (!firebaseApp) {
    firebaseApp = initializeFirebaseApp(getFirebaseConfig());
    auth = getAuth(firebaseApp);
    db = initializeFirestore(firebaseApp, {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    });
  }

  return { firebaseApp, auth, db };
}

export function getFirebaseAuth() {
  if (!auth) initializeFirebase();
  return auth;
}

export function getFirestoreDb() {
  if (!db) initializeFirebase();
  return db;
}
