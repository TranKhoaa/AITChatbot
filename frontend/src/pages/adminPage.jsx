import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import FileManagement from "../components/FileManagement";
import FileUploading from "../components/FileUploading";
import AdminSidebar from "../components/AdminSidebar";
import sidebar from "../components/sidebar";
import FileManagementHeader from "../components/FileManagementHeader";
import FileManagementSidebar from "../components/FileManagementSidebar";
import SettingsModal from "../components/Settings";
import { useState } from "react";
import UploadFiles from "../components/UploadFiles";


const AdminPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);



  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
    return (
      <div>
        <FileManagementHeader toggleSidebar={toggleSidebar} />
        <main className="flex top-16 h-fit bg-black w-full">
          {isSidebarOpen && (
            <FileManagementSidebar
              isSidebarOpen={isSidebarOpen}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenUpload={() => setIsUploadOpen(true)}
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
          <FileManagement />
        </main>
      </div>
  );
}
export default AdminPage