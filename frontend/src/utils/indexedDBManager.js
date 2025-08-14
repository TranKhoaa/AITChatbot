/**
 * IndexedDB Manager for file system storage
 */

const DB_NAME = 'AITChatbotFileSystem';
const DB_VERSION = 1;
const STORE_NAME = 'files';

class IndexedDBManager {
  constructor() {
    this.db = null;
  }

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Delete existing store if it exists
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        
        // Create new store
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('hash', 'hash', { unique: true });
        store.createIndex('status', 'status', { unique: false });
      };
    });
  }

  // Store file data in IndexedDB
  async storeFile(fileData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put(fileData);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Store multiple files
  async storeFiles(filesData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      let completed = 0;
      const total = filesData.length;
      const results = [];

      if (total === 0) {
        resolve([]);
        return;
      }

      filesData.forEach((fileData, index) => {
        const request = store.put(fileData);
        
        request.onsuccess = () => {
          results[index] = request.result;
          completed++;
          if (completed === total) {
            resolve(results);
          }
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  }

  // Get file by ID
  async getFile(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get all files
  async getAllFiles() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get files by status
  async getFilesByStatus(status) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      
      const request = index.getAll(status);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Update file status
  async updateFileStatus(id, status, additionalData = {}) {
    if (!this.db) await this.init();

    const file = await this.getFile(id);
    if (!file) {
      throw new Error(`File with id ${id} not found`);
    }

    const updatedFile = {
      ...file,
      status,
      updatedAt: new Date().toISOString(),
      ...additionalData
    };

    return this.storeFile(updatedFile);
  }

  // Delete file
  async deleteFile(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Delete multiple files
  async deleteFiles(ids) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      let completed = 0;
      const total = ids.length;

      if (total === 0) {
        resolve(true);
        return;
      }

      ids.forEach(id => {
        const request = store.delete(id);
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve(true);
          }
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  }

  // Clear all files
  async clearAllFiles() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export const indexedDBManager = new IndexedDBManager();
