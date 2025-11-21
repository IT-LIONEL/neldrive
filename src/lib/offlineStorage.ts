import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineFile {
  id: string;
  name: string;
  data: Blob;
  file_type: string;
  file_size: number;
  cached_at: number;
}

interface OfflineDB extends DBSchema {
  files: {
    key: string;
    value: OfflineFile;
  };
}

let db: IDBPDatabase<OfflineDB> | null = null;

export const initOfflineDB = async () => {
  if (db) return db;
  
  db = await openDB<OfflineDB>('neltech-offline', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    },
  });
  
  return db;
};

export const saveFileOffline = async (fileId: string, name: string, data: Blob, fileType: string, fileSize: number) => {
  const database = await initOfflineDB();
  await database.put('files', {
    id: fileId,
    name,
    data,
    file_type: fileType,
    file_size: fileSize,
    cached_at: Date.now(),
  });
};

export const getOfflineFile = async (fileId: string): Promise<OfflineFile | undefined> => {
  const database = await initOfflineDB();
  return await database.get('files', fileId);
};

export const removeOfflineFile = async (fileId: string) => {
  const database = await initOfflineDB();
  await database.delete('files', fileId);
};

export const getAllOfflineFiles = async (): Promise<OfflineFile[]> => {
  const database = await initOfflineDB();
  return await database.getAll('files');
};

export const clearOfflineFiles = async () => {
  const database = await initOfflineDB();
  await database.clear('files');
};
