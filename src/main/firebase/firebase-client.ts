import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Tenta .env local do projeto primeiro, depois o axe-vault-browser
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', 'Axefull - CRM', '.env.local') });

const firebaseConfig = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp;
let _auth: Auth;
let _db: Firestore;

let _listenerApp: FirebaseApp;
let _listenerAuth: Auth;
let _listenerDb: Firestore;

export function getFirebaseApp(): FirebaseApp {
    if (!_app) {
        _app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    }
    return _app;
}

export function getFirebaseAuth(): Auth {
    if (!_auth) _auth = getAuth(getFirebaseApp());
    return _auth;
}

export function getFirebaseDb(): Firestore {
    if (!_db) _db = getFirestore(getFirebaseApp());
    return _db;
}

export function getFirebaseListenerApp(): FirebaseApp {
    if (!_listenerApp) {
        const apps = getApps();
        const existing = apps.find(a => a.name === 'listener');
        _listenerApp = existing || initializeApp(firebaseConfig, 'listener');
    }
    return _listenerApp;
}

export function getFirebaseListenerAuth(): Auth {
    if (!_listenerAuth) _listenerAuth = getAuth(getFirebaseListenerApp());
    return _listenerAuth;
}

export function getFirebaseListenerDb(): Firestore {
    if (!_listenerDb) _listenerDb = getFirestore(getFirebaseListenerApp());
    return _listenerDb;
}

export const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
