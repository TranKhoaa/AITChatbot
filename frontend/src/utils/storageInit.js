/**
 * Storage initialization utility
 */

import { indexedDBManager } from './indexedDBManager';
import { localStorageManager } from './localStorageManager';
import { fileHandler } from './fileHandler';

export const initializeStorage = async () => {
  try {
    // Initialize IndexedDB
    await indexedDBManager.init();
    console.log('IndexedDB initialized successfully');

    // Check if there are any orphaned files in localStorage that don't exist in IndexedDB
    const untrainedFiles = localStorageManager.getuntrainedFiles();
    const orphanedFiles = [];

    for (const file of untrainedFiles) {
      const indexedFile = await indexedDBManager.getFile(file.id);
      if (!indexedFile) {
        orphanedFiles.push(file.id);
      }
    }

    // Clean up orphaned files
    if (orphanedFiles.length > 0) {
      console.log(`Cleaning up ${orphanedFiles.length} orphaned files from localStorage`);
      localStorageManager.removeuntrainedFiles(orphanedFiles);
    }

    console.log('Storage systems initialized and cleaned up');
    return true;
  } catch (error) {
    console.error('Error initializing storage systems:', error);
    return false;
  }
};

export const getStorageInfo = async () => {
  try {
    const stats = await fileHandler.getStorageStats();
    
    // Check browser storage quota
    let storageQuota = null;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      storageQuota = {
        quota: estimate.quota,
        usage: estimate.usage,
        available: estimate.quota - estimate.usage,
        usagePercentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      };
    }

    return {
      ...stats,
      storageQuota
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
};
