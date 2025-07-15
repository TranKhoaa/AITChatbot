import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import FileManagement from "../components/FileManagement";
import FileUploading from "../components/FileUploading";
import sideBar from "../components/Sidebar";

const AdminPage = () => {
    return (
    <div style={{ display: "flex", height: "100vh" }}>
      <sideBar/>
      <div className="w-full">
        <Routes>
          <Route path="/" element={<Navigate to="file-management" />} />
          <Route path="file-management" element={<FileManagement />} />
          <Route path="upload" element={<FileUploading />} />
        </Routes>
      </div>
    </div>
  );
}
export default AdminPage