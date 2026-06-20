import { signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { launchProfile } from '../browser/browser-engine';
import { getProfileById } from '../profile/profile-manager';
import path from 'path';
import { getDb, insert, getBrowserDataPath } from '../database/db';
import { generateFingerprint } from '../fingerprint/generator';
import fs from 'fs';
import { getFirebaseListenerAuth, getFirebaseListenerDb } from './firebase-client';

let listenerUnsubscribe: (() => void) | null = null;

// Helper to ensure profile exists in local SQLite DB
async function ensureLocalProfile(profileId: string) {
    if (getProfileById(profileId)) return;
    
    console.log(`[Sync] Profile ${profileId} not found locally. Fetching from Firebase...`);
    const db = getFirebaseListenerDb();
    const docRef = doc(db, 'profiles', profileId);
    const docSnap = await getDoc(docRef);
    const profileData = docSnap.exists() ? docSnap.data() : {};
    const name = profileData.name || `Profile ${profileId}`;
    const os = profileData.customFields?.os || 'windows';
    const country = profileData.customFields?.country || 'BR';
    
    // Create profile locally to satisfy browser-engine
    const browserDataPath = getBrowserDataPath();
    const dataDirPath = path.join(browserDataPath, profileId);
    if (!fs.existsSync(dataDirPath)) fs.mkdirSync(dataDirPath, { recursive: true });

    insert('profiles', {
        id: profileId,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_used: null,
        data_dir_path: dataDirPath,
        notes: null,
        status: 'active',
        is_active: 0
    });

    const fp = generateFingerprint(profileId, os as any, country as any);
    insert('fingerprints', fp as any);
}

export async function startFirebaseListener() {
    console.log('🔥 Starting Firebase Listener for Profile Commands...');
    
    const auth = getFirebaseListenerAuth();
    const db = getFirebaseListenerDb();
    
    try {
        await signInAnonymously(auth);
        console.log('✅ Authenticated anonymously in Electron.');
    } catch (error) {
        console.error('❌ Failed to authenticate anonymously:', error);
        return;
    }

    const commandsRef = collection(db, 'launch_commands');
    const q = query(commandsRef, where('status', '==', 'pending'));

    let isInitialSnapshot = true;

    listenerUnsubscribe = onSnapshot(q, (snapshot) => {
        if (isInitialSnapshot) {
            isInitialSnapshot = false;
            // Mark old commands as cancelled so they don't stay pending forever
            snapshot.docs.forEach(async (docSnap) => {
                try {
                    await updateDoc(doc(db, 'launch_commands', docSnap.id), { status: 'cancelled_by_restart' });
                } catch(e) {}
            });
            console.log(`[Firebase] Ignored and cancelled ${snapshot.docs.length} stale pending commands on startup.`);
            return; // Skip processing to avoid unwanted 'telas de aberturas'
        }

        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                const commandId = change.doc.id;
                console.log(`[Command ${commandId}] Received launch request for profile ${data.profileId}`);
                
                if (data.action === 'close') {
                    console.log(`[Command ${commandId}] Received close request for profile ${data.profileId}`);
                    try {
                        const { closeProfile } = await import('../browser/browser-engine');
                        await closeProfile(data.profileId);
                        await updateDoc(doc(db, 'launch_commands', commandId), { status: 'active' });
                        await updateDoc(doc(db, 'profiles', data.profileId), { sessionStatus: 'closed' });
                        console.log(`[Command ${commandId}] Profile ${data.profileId} closed successfully via command.`);
                    } catch (error: any) {
                        console.error(`[Command ${commandId}] Error closing profile:`, error);
                        await updateDoc(doc(db, 'launch_commands', commandId), { status: 'error', error: error.message });
                    }
                    return;
                }

                try {
                    await updateDoc(doc(db, 'launch_commands', commandId), { status: 'launching' });
                    await updateDoc(doc(db, 'profiles', data.profileId), { sessionStatus: 'launching' });
                    
                    await ensureLocalProfile(data.profileId);
                    const context = await launchProfile(data.profileId);
                    
                    await updateDoc(doc(db, 'launch_commands', commandId), { status: 'active' });
                    await updateDoc(doc(db, 'profiles', data.profileId), { sessionStatus: 'running' });
                    console.log(`[Command ${commandId}] Profile ${data.profileId} launched successfully.`);

                    // Listen for close to update Firestore back to closed
                    context.on('close', async () => {
                        console.log(`[Command ${commandId}] Profile ${data.profileId} closed.`);
                        try {
                            await updateDoc(doc(db, 'profiles', data.profileId), { sessionStatus: 'closed' });
                        } catch (e) {
                            console.error('Failed to update sessionStatus to closed', e);
                        }
                    });
                } catch (error: any) {
                    console.error(`[Command ${commandId}] Error launching profile:`, error);
                    await updateDoc(doc(db, 'launch_commands', commandId), { status: 'error', error: error.message });
                    await updateDoc(doc(db, 'profiles', data.profileId), { sessionStatus: 'error' });
                }
            }
        });
    });
}

export function stopFirebaseListener() {
    if (listenerUnsubscribe) {
        listenerUnsubscribe();
        listenerUnsubscribe = null;
        console.log('🔥 Firebase Listener stopped.');
    }
}
