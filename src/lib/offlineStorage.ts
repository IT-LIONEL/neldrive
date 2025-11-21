import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineFile {
  id: string;
  name: string;
  data: Blob;
  file_type: string;
  file_size: number;
  cached_at: number;
}

interface QueuedUpload {
  id: string;
  name: string;
  data: Blob;
  file_type: string;
  file_size: number;
  folder_id: string | null;
  queued_at: number;
}

interface OfflineDB extends DBSchema {
  files: {
    key: string;
    value: OfflineFile;
  };
  uploadQueue: {
    key: string;
    value: QueuedUpload;
  };
}

let db: IDBPDatabase<OfflineDB> | null = null;

export const initOfflineDB = async () => {
  if (db) return db;
  
  db = await openDB<OfflineDB>('neltech-offline', 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
      if (oldVersion < 2 && !db.objectStoreNames.contains('uploadQueue')) {
        db.createObjectStore('uploadQueue', { keyPath: 'id' });
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

// Queued upload functions
export const queueUpload = async (
  name: string,
  data: Blob,
  fileType: string,
  fileSize: number,
  folderId: string | null
) => {
  const database = await initOfflineDB();
  const id = crypto.randomUUID();
  await database.put('uploadQueue', {
    id,
    name,
    data,
    file_type: fileType,
    file_size: fileSize,
    folder_id: folderId,
    queued_at: Date.now(),
  });
  return id;
};

export const getUploadQueue = async (): Promise<QueuedUpload[]> => {
  const database = await initOfflineDB();
  return await database.getAll('uploadQueue');
};

export const removeFromUploadQueue = async (id: string) => {
  const database = await initOfflineDB();
  await database.delete('uploadQueue', id);
};

export const clearUploadQueue = async () => {
  const database = await initOfflineDB();
  await database.clear('uploadQueue');
};

export const getStorageStats = async () => {
  const database = await initOfflineDB();
  const offlineFiles = await database.getAll('files');
  const queuedUploads = await database.getAll('uploadQueue');
  
  const offlineSize = offlineFiles.reduce((sum, file) => sum + file.file_size, 0);
  const queuedSize = queuedUploads.reduce((sum, file) => sum + file.file_size, 0);
  
  return {
    offlineFiles: {
      count: offlineFiles.length,
      size: offlineSize,
    },
    queuedUploads: {
      count: queuedUploads.length,
      size: queuedSize,
    },
    totalSize: offlineSize + queuedSize,
  };
};
