/**
 * File Handler Utility for managing file operations
 */

import { localStorageManager } from './localStorageManager';
import { indexedDBManager } from './indexedDBManager';

// Generate unique ID for files
const generateFileId = () => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to get file extension from filename
const getFileExtension = (filename) => {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex !== -1 ? filename.substring(lastDotIndex).toLowerCase() : '';
};

// Calculate file hash (simple implementation using file properties)
const calculateFileHash = (file) => {
  // Create a string from file properties
  const fileString = `${file.name}_${file.size}_${file.lastModified}_${file.type}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fileString.length; i++) {
    const char = fileString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Return as hex string
  return Math.abs(hash).toString(16);
};

export const fileHandler = {
  // Process selected files and store them
  processSelectedFiles: async (selectedFiles, uploaderInfo) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword",
      "application/vnd.ms-excel",
      "text/plain",
    ];

    try {
      // Initialize IndexedDB if not already done
      await indexedDBManager.init();

      const processedFiles = [];
      const fileDataForStorage = [];

      for (const file of selectedFiles) {
        if (!allowedTypes.includes(file.type)) {
          console.warn(`Skipping unsupported file type: ${file.type}`);
          continue;
        }

        const fileId = generateFileId();
        const hash = calculateFileHash(file);
        
        // Create file metadata
        const fileMetadata = {
          id: fileId,
          name: file.name,
          type: file.type,
          fileExtension: getFileExtension(file.name), // Add file extension for proper icon display
          size: file.size,
          lastModified: file.lastModified,
          status: 'pending',
          hash: hash,
          uploadedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploader: uploaderInfo,
          webkitRelativePath: file.webkitRelativePath || file.name,
        };

        // Create file data for IndexedDB storage
        const fileDataForIndexedDB = {
          ...fileMetadata,
          fileData: file, // Store the actual File object
        };

        processedFiles.push(fileMetadata);
        fileDataForStorage.push(fileDataForIndexedDB);
      }

      // Store files in IndexedDB
      await indexedDBManager.storeFiles(fileDataForStorage);

      // Store metadata in localStorage
      localStorageManager.savePendingFiles(processedFiles);

      return {
        success: true,
        processedFiles,
        count: processedFiles.length
      };

    } catch (error) {
      console.error('Error processing selected files:', error);
      return {
        success: false,
        error: error.message,
        processedFiles: [],
        count: 0
      };
    }
  },

  // Get all pending files from storage
  getPendingFiles: async () => {
    try {
      const metadataFiles = localStorageManager.getPendingFiles();
      const indexedDBFiles = await indexedDBManager.getFilesByStatus('pending');
      
      // Merge metadata with file data
      const mergedFiles = metadataFiles.map(metadata => {
        const fileData = indexedDBFiles.find(f => f.id === metadata.id);
        return {
          ...metadata,
          hasFileData: !!fileData
        };
      });

      return mergedFiles;
    } catch (error) {
      console.error('Error getting pending files:', error);
      return [];
    }
  },

  // Get file data for upload
  getFileDataForUpload: async (fileIds) => {
    try {
      const filesToUpload = [];
      
      for (const fileId of fileIds) {
        const fileData = await indexedDBManager.getFile(fileId);
        if (fileData && fileData.fileData) {
          filesToUpload.push({
            id: fileId,
            file: fileData.fileData,
            metadata: {
              name: fileData.name,
              type: fileData.type,
              size: fileData.size,
              hash: fileData.hash,
              webkitRelativePath: fileData.webkitRelativePath
            }
          });
        }
      }

      return filesToUpload;
    } catch (error) {
      console.error('Error getting file data for upload:', error);
      return [];
    }
  },

  // Update file status after upload
  updateFileStatus: async (fileId, status, additionalData = {}) => {
    try {
      // Update in localStorage
      localStorageManager.updateFileStatus(fileId, status, additionalData);
      
      // Update in IndexedDB
      await indexedDBManager.updateFileStatus(fileId, status, additionalData);

      return true;
    } catch (error) {
      console.error('Error updating file status:', error);
      return false;
    }
  },

  // Remove files from storage
  removeFiles: async (fileIds) => {
    try {
      // Remove from localStorage
      localStorageManager.removePendingFiles(fileIds);
      
      // Remove from IndexedDB
      await indexedDBManager.deleteFiles(fileIds);

      return true;
    } catch (error) {
      console.error('Error removing files:', error);
      return false;
    }
  },

  // Clear all pending files
  clearAllPendingFiles: async () => {
    try {
      localStorageManager.clearPendingFiles();
      
      // Get all pending files and delete them from IndexedDB
      const pendingFiles = await indexedDBManager.getFilesByStatus('pending');
      const pendingIds = pendingFiles.map(f => f.id);
      
      if (pendingIds.length > 0) {
        await indexedDBManager.deleteFiles(pendingIds);
      }

      return true;
    } catch (error) {
      console.error('Error clearing all pending files:', error);
      return false;
    }
  },

  // Check if a file is already in storage (by hash)
  isFileAlreadyStored: async (hash) => {
    try {
      const allFiles = await indexedDBManager.getAllFiles();
      return allFiles.some(file => file.hash === hash);
    } catch (error) {
      console.error('Error checking if file is already stored:', error);
      return false;
    }
  },

  // Get storage statistics
  getStorageStats: async () => {
    try {
      const allFiles = await indexedDBManager.getAllFiles();
      const pendingFiles = allFiles.filter(f => f.status === 'pending');
      const uploadedFiles = allFiles.filter(f => f.status === 'uploaded');
      
      const totalSize = allFiles.reduce((total, file) => total + (file.size || 0), 0);
      const pendingSize = pendingFiles.reduce((total, file) => total + (file.size || 0), 0);

      return {
        totalFiles: allFiles.length,
        pendingFiles: pendingFiles.length,
        uploadedFiles: uploadedFiles.length,
        totalSize: totalSize,
        pendingSize: pendingSize,
        formattedTotalSize: formatFileSize(totalSize),
        formattedPendingSize: formatFileSize(pendingSize)
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalFiles: 0,
        pendingFiles: 0,
        uploadedFiles: 0,
        totalSize: 0,
        pendingSize: 0,
        formattedTotalSize: '0 B',
        formattedPendingSize: '0 B'
      };
    }
  }
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
