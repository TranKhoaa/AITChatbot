/**
 * Local Storage Manager for file metadata
 */

const LOCAL_STORAGE_KEYS = {
  PENDING_FILES: 'admin_pending_files',
  UPLOADED_FILES: 'admin_uploaded_files',
};

export const localStorageManager = {
  // Migration function to handle transition from old keys to new keys
  migrateOldData: () => {
    try {
      // Check for old data and migrate it
      const oldData = localStorage.getItem('admin_untrained_files');
      if (oldData) {
        const parsedData = JSON.parse(oldData);
        const migratedData = parsedData.map(file => ({
          ...file,
          status: file.status === 'untrained' ? 'pending' : file.status
        }));
        localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING_FILES, JSON.stringify(migratedData));
        localStorage.removeItem('admin_untrained_files');
        console.log('Migrated old file data to new format');
      }
    } catch (error) {
      console.error('Error migrating old data:', error);
    }
  },

  // Save pending files metadata to local storage
  savePendingFiles: (files) => {
    try {
      const metadata = files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        fileExtension: file.fileExtension || null,
        size: file.size,
        lastModified: file.lastModified,
        status: 'pending',
        hash:  null,
        uploadedAt: null,
        updatedAt: new Date().toISOString(),
        uploader: file.uploader || null,
        webkitRelativePath: file.webkitRelativePath || file.name,
      }));

      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.PENDING_FILES);
      const existingMetadata = data ? JSON.parse(data) : [];
      const combinedMetadata = [...existingMetadata, ...metadata];
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING_FILES, JSON.stringify(combinedMetadata));
      return true;
    } catch (error) {
      console.error('Error saving pending files to localStorage:', error);
      return false;
    }
  },

  // Get pending files metadata from local storage
  getPendingFiles: () => {
    try {
      // Run migration if needed
      localStorageManager.migrateOldData();
      
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.PENDING_FILES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending files from localStorage:', error);
      return [];
    }
  },

  // Update specific file status
  updateFileStatus: (fileId, status, additionalData = {}) => {
    try {
      const pendingFiles = localStorageManager.getPendingFiles();
      const updatedFiles = pendingFiles.map(file => 
        file.id === fileId 
          ? { 
              ...file, 
              status, 
              updatedAt: new Date().toISOString(),
              ...additionalData 
            }
          : file
      );
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING_FILES, JSON.stringify(updatedFiles));
      return true;
    } catch (error) {
      console.error('Error updating file status:', error);
      return false;
    }
  },

  // Remove files from pending list
  removePendingFiles: (fileIds) => {
    try {
      const pendingFiles = localStorageManager.getPendingFiles();
      const filteredFiles = pendingFiles.filter(file => !fileIds.includes(file.id));
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING_FILES, JSON.stringify(filteredFiles));
      return true;
    } catch (error) {
      console.error('Error removing pending files:', error);
      return false;
    }
  },

  // Clear all pending files
  clearPendingFiles: () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.PENDING_FILES);
      return true;
    } catch (error) {
      console.error('Error clearing pending files:', error);
      return false;
    }
  },

  // Save uploaded files list for download availability tracking
  saveUploadedFiles: (files) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.UPLOADED_FILES, JSON.stringify(files));
      return true;
    } catch (error) {
      console.error('Error saving uploaded files:', error);
      return false;
    }
  },

  // Get uploaded files list
  getUploadedFiles: () => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.UPLOADED_FILES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting uploaded files:', error);
      return [];
    }
  }
};
