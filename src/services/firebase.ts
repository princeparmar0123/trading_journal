/**
 * Firebase singleton.
 *
 * 👉 Paste your Firebase web config below (Project Settings → General → Your apps → SDK setup).
 *    All these values are PUBLIC (publishable) — safe to commit.
 *    Then enable: Authentication (Email/Password) + Firestore + Storage in the Firebase console.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyC4wxrcaxxKqPhfpNV97C5-ZAjPkdJchTQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "journal-2ccc8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "journal-2ccc8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "journal-2ccc8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "85354441155",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:85354441155:web:94d7fa2a0a0b39b747b576",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-S3BB21RHP0",
};

export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith("REPLACE_ME");

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function ensureApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

export function firebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(ensureApp());
  return _auth;
}

export function firestore(): Firestore {
  if (!_db) _db = getFirestore(ensureApp());
  return _db;
}

export function firebaseStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(ensureApp());
  return _storage;
}
