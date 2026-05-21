import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { deleteTradeImage } from "./cloudinary";
import { firestore } from "./firebase";
import type { Trade, NewTrade } from "@/types/trade";

const COLLECTION = "trades";

/** Firestore rejects `undefined` field values on write. */
function stripUndefined<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export async function listTrades(userId: string): Promise<Trade[]> {
  const q = query(
    collection(firestore(), COLLECTION),
    where("userId", "==", userId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Trade, "id">) }))
    .sort((a, b) => b.tradedAt - a.tradedAt);
}

export async function getTrade(id: string): Promise<Trade | null> {
  const ref = doc(firestore(), COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Trade, "id">) };
}

export async function createTrade(userId: string, data: NewTrade): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(collection(firestore(), COLLECTION), {
    ...stripUndefined({ ...data, userId, createdAt: now, updatedAt: now }),
    _serverCreatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTrade(id: string, data: Partial<NewTrade>): Promise<void> {
  await updateDoc(
    doc(firestore(), COLLECTION, id),
    stripUndefined({ ...data, updatedAt: Date.now() }),
  );
}

const BATCH_SIZE = 500;

export async function importTrades(userId: string, trades: NewTrade[]): Promise<number> {
  if (trades.length === 0) return 0;

  const db = firestore();
  const col = collection(db, COLLECTION);
  const now = Date.now();
  let imported = 0;

  for (let i = 0; i < trades.length; i += BATCH_SIZE) {
    const chunk = trades.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const data of chunk) {
      const ref = doc(col);
      batch.set(ref, {
        ...data,
        userId,
        createdAt: now,
        updatedAt: now,
      });
    }
    await batch.commit();
    imported += chunk.length;
  }

  return imported;
}

export async function deleteTrade(id: string): Promise<void> {
  const trade = await getTrade(id);
  if (trade?.screenshotUrl) {
    await deleteTradeImage(trade.screenshotUrl);
  }
  await deleteDoc(doc(firestore(), COLLECTION, id));
}
