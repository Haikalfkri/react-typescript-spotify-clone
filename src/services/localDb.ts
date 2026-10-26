const DB_NAME = "spotify-clone-local";
const STORE = "audio";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Helper: jalankan satu operasi dalam satu transaksi
async function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function saveAudio(id: number, file: Blob): Promise<void> {
  await run("readwrite", (s) => s.put(file, id));
}

export async function deleteAudio(id: number): Promise<void> {
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
  await run("readwrite", (s) => s.delete(id));
}

// Cache blob URL supaya tidak dibuat ulang setiap lagu diputar
const urlCache = new Map<number, string>();

export async function getLocalAudioUrl(id: number): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return cached;

  const blob = (await run("readonly", (s) => s.get(id))) as Blob | undefined;
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}