import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import FileManagement from "../components/FileManagement";
import EnhancedFileManagement from "../components/LocalFileManagement";
import FileUploading from "../components/FileUploading";
import AdminSidebar from "../components/AdminSidebar";
import sidebar from "../components/sidebar";
import FileManagementHeader from "../components/FileManagementHeader";
import FileManagementSidebar from "../components/FileManagementSidebar";
import SettingsModal from "../components/Settings";
import { useState, useRef } from "react";
import UploadFiles from "../components/UploadFiles";
import { fileHandler } from "../utils/fileHandler";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";


const AdminPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refs for hidden file inputs
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const user = useSelector((state) => state.auth.user);

  // Handle file selection from sidebar
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      try {
        const result = await fileHandler.processSelectedFiles(files, {
          name: user?.username || user?.fullName || 'Unknown',
          email: user?.email || '',
          userId: user?.id || null
        });

        if (result.success) {
          toast.success(`${result.count} file(s) added successfully!`);
          setRefreshTrigger(prev => prev + 1);
        } else {
          toast.error(result.error || 'Failed to process files');
        }
      } catch (error) {
        console.error('Error selecting files:', error);
        toast.error('Error processing selected files');
      }
    }
    // Reset the input
    event.target.value = '';
  };

  // Handle folder selection from sidebar
  const handleFolderSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      try {
        const result = await fileHandler.processSelectedFiles(files, {
          name: user?.username || user?.fullName || 'Unknown',
          email: user?.email || '',
          userId: user?.id || null
        });

        if (result.success) {
          toast.success(`${result.count} file(s) added from folder successfully!`);
          setRefreshTrigger(prev => prev + 1);
        } else {
          toast.error(result.error || 'Failed to process folder files');
        }
      } catch (error) {
        console.error('Error selecting folder:', error);
        toast.error('Error processing selected folder');
      }
    }
    // Reset the input
    event.target.value = '';
  };



  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

    return (
      <div>
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory=""
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFolderSelect}
          style={{ display: 'none' }}
        />

        <FileManagementHeader toggleSidebar={toggleSidebar} />
        <main className="flex top-16 h-fit bg-black w-full">
          {isSidebarOpen && (
            <FileManagementSidebar
              isSidebarOpen={isSidebarOpen}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenUpload={() => setIsUploadOpen(true)}
              onUploadFiles={() => fileInputRef.current?.click()}
              onUploadFolders={() => folderInputRef.current?.click()}
            />
          )}
          {isUploadOpen && (
            <UploadFiles
              onClose={() => setIsUploadOpen(false)}
            />
          )} 
          {isSettingsOpen && (
            <SettingsModal onClose={() => setIsSettingsOpen(false)} />
          )}
          <EnhancedFileManagement refreshKey={refreshTrigger} />
        </main>
      </div>
  );
}
export default AdminPage