import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  return errInfo;
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (err) {
    if (err instanceof Error && err.message.includes('the client is offline')) {
      return false;
    }
    return true;
  }
}

export type TierKey = 'free' | 'beginner' | 'pro' | 'ultra' | 'business' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';
export type StaffRole = 'admin' | 'manager' | 'engineer' | 'instructor' | 'support';

export interface CloudUserDoc {
  userId: string;
  email: string;
  displayName?: string;
  tier: TierKey;
  billingCycle: BillingCycle;
  defaultDuration?: string;
  createdAt?: unknown;
}

export interface StaffMemberDoc {
  userId: string;
  email: string;
  role: StaffRole;
  active: boolean;
  grantedBy?: string;
  createdAt?: unknown;
}

export interface StudioProjectDoc {
  id: string;
  userId: string;
  studioHub: string;
  label: string;
  duration: string;
  prompt: string;
  videoUrl?: string;
  createdAt?: unknown;
}

export interface StudioArtifactDoc {
  id: string;
  userId: string;
  studioHub: string;
  title: string;
  kind: 'render' | 'blender_scene' | 'printify_mockup' | 'shader' | 'school_lab' | 'audio_stem';
  summary?: string;
  createdAt?: unknown;
}

export interface StudioConnectorDoc {
  id: string;
  userId: string;
  name: string;
  connectorType: 'mcp' | 'postgres' | 'mysql' | 'sqlite' | 'firebase' | 'quantum_storage' | 'self_hosted_llm';
  endpointUrl?: string;
  status: 'verified' | 'pending' | 'disconnected';
  createdAt?: unknown;
}

export interface PrintifyItemDoc {
  id: string;
  userId: string;
  title: string;
  productType: string;
  retailPrice: number;
  baseCost: number;
  colorHex?: string;
  createdAt?: unknown;
}

export interface BillingRecordDoc {
  userId: string;
  tier: TierKey;
  billingCycle: BillingCycle;
  provider: 'stripe' | 'infinity_billing';
  status: 'active' | 'canceled' | 'trialing';
  updatedAt?: unknown;
}

export function subscribeAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithChromeGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by the browser. Allow popups for this site or sign in with Username & Password.');
    }
    if (code === 'auth/unauthorized-domain') {
      throw new Error('Google popup domain is not authorized yet in console. Sign in with Username & Password below.');
    }
    if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in window was closed.');
    }
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function syncUserProfile(user: FirebaseUser, defaults?: Partial<CloudUserDoc>): Promise<CloudUserDoc> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const existing = snap.data() as CloudUserDoc;
    if (defaults && (defaults.tier || defaults.billingCycle || defaults.displayName)) {
      const updated = {
        displayName: defaults.displayName || existing.displayName || user.displayName || 'Studio Member',
        email: user.email || existing.email,
        tier: defaults.tier || existing.tier || 'free',
        billingCycle: defaults.billingCycle || existing.billingCycle || 'monthly',
      };
      await setDoc(ref, updated, { merge: true });
      return { ...existing, ...updated };
    }
    return existing;
  }

  const created: CloudUserDoc = {
    userId: user.uid,
    email: user.email || '',
    displayName: defaults?.displayName || user.displayName || 'Studio Member',
    tier: defaults?.tier || 'free',
    billingCycle: defaults?.billingCycle || 'monthly',
    defaultDuration: defaults?.defaultDuration || '10s',
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, created);
  return created;
}

export async function fetchUserProfile(userId: string): Promise<CloudUserDoc | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data() as CloudUserDoc) : null;
}

export async function verifyStaffAccess(user: FirebaseUser): Promise<StaffMemberDoc | null> {
  if (!user.emailVerified) return null;
  if (user.email?.toLowerCase() === 'gtamayo36@gmail.com') {
    return {
      userId: user.uid,
      email: user.email,
      role: 'admin',
      active: true,
      grantedBy: 'owner-root',
    };
  }
  const snap = await getDoc(doc(db, 'admins', user.uid));
  if (!snap.exists()) return null;
  const data = snap.data() as StaffMemberDoc;
  return data.active ? data : null;
}

export async function fetchStaffRoster(): Promise<StaffMemberDoc[]> {
  const snap = await getDocs(collection(db, 'admins'));
  return snap.docs.map((d) => d.data() as StaffMemberDoc);
}

export async function upsertStaffMember(member: Omit<StaffMemberDoc, 'createdAt'>): Promise<void> {
  await setDoc(
    doc(db, 'admins', member.userId),
    {
      ...member,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function revokeStaffMember(userId: string): Promise<void> {
  await deleteDoc(doc(db, 'admins', userId));
}

export async function saveStudioProject(project: Omit<StudioProjectDoc, 'id' | 'createdAt'>): Promise<string> {
  const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await setDoc(doc(db, 'video_projects', id), {
    ...project,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function fetchStudioProjects(userId: string): Promise<StudioProjectDoc[]> {
  const q = query(collection(db, 'video_projects'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StudioProjectDoc, 'id'>) }));
}

export async function saveStudioArtifact(artifact: Omit<StudioArtifactDoc, 'id' | 'createdAt'>): Promise<string> {
  const id = `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await setDoc(doc(db, 'artifacts', id), {
    ...artifact,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function fetchStudioArtifacts(userId: string): Promise<StudioArtifactDoc[]> {
  const q = query(collection(db, 'artifacts'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StudioArtifactDoc, 'id'>) }));
}

export async function saveConnector(conn: Omit<StudioConnectorDoc, 'id' | 'createdAt'>): Promise<string> {
  const id = `conn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await setDoc(doc(db, 'connectors', id), {
    ...conn,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function fetchConnectors(userId: string): Promise<StudioConnectorDoc[]> {
  const q = query(collection(db, 'connectors'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StudioConnectorDoc, 'id'>) }));
}

export async function savePrintifyItem(item: Omit<PrintifyItemDoc, 'id' | 'createdAt'>): Promise<string> {
  const id = `pod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await setDoc(doc(db, 'printify_items', id), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function fetchPrintifyItems(userId: string): Promise<PrintifyItemDoc[]> {
  const q = query(collection(db, 'printify_items'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PrintifyItemDoc, 'id'>) }));
}

export async function deletePrintifyItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'printify_items', itemId));
}

export async function saveBillingRecord(record: Omit<BillingRecordDoc, 'updatedAt'>): Promise<void> {
  await setDoc(
    doc(db, 'billing_records', record.userId),
    {
      ...record,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  await setDoc(
    doc(db, 'users', record.userId),
    {
      tier: record.tier,
      billingCycle: record.billingCycle,
    },
    { merge: true }
  );
}

export async function fetchBillingRecord(userId: string): Promise<BillingRecordDoc | null> {
  const snap = await getDoc(doc(db, 'billing_records', userId));
  return snap.exists() ? (snap.data() as BillingRecordDoc) : null;
}
