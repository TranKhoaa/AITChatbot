import React, { useEffect, useState } from "react";
import filterIcon from "../assets/filter_icon.svg";
import wordIcon from "../assets/word_icon.svg";
import excelIcon from "../assets/excel_icon.svg";
import pdfIcon from "../assets/pdf_icon.svg";
import fileIcon from "../assets/file_icon.svg";
import ReactPaginate from "react-paginate";
import axiosInstance from "../api/axiosInstance";
import { AiOutlineDownload, AiOutlineDelete, AiOutlineUpload, AiOutlineEye, AiOutlineLoading3Quarters } from "react-icons/ai";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { fetchFiles } from "../features/filesSlice";
import { fileHandler } from "../utils/fileHandler";
import { localStorageManager } from "../utils/localStorageManager";

function EnhancedFileManagement({ refreshKey }) {
  const getIconByType = (type, fileExtension = '') => {
    if (!type && !fileExtension) return "";

    // Use fileExtension if available, otherwise try to extract from type
    let ext = fileExtension;
    if (!ext && typeof type === "string") {
      // Handle MIME types
      if (type.includes('wordprocessingml') || type.includes('msword')) {
        ext = '.docx';
      } else if (type.includes('spreadsheetml') || type.includes('ms-excel')) {
        ext = '.xlsx';
      } else if (type.includes('pdf')) {
        ext = '.pdf';
      } else if (type.includes('text/plain')) {
        ext = '.txt';
      } else if (type.startsWith('.')) {
        ext = type;
      }
    }

    switch (ext?.toLowerCase()) {
      case ".docx":
      case ".doc": return wordIcon;
      case ".xls":
      case ".xlsx": return excelIcon;
      case ".pdf": return pdfIcon;
      case ".txt": return fileIcon;
      default: return "";
    }
  };

  const dispatch = useDispatch();
  const serverFiles = useSelector((state) => state.files.files);
  const loading = useSelector((state) => state.files.loading);
  const user = useSelector((state) => state.auth.user);

  // State for pending files from local storage
  const [pendingFiles, setPendingFiles] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 15;

  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [uploaderFilter, setUploaderFilter] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [modifiedFrom, setModifiedFrom] = useState("");
  const [modifiedTo, setModifiedTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // const [statusFilter, setStatusFilter] = useState("all"); 

  // File selection for bulk operations
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    // Fetch server files
    dispatch(fetchFiles());

    // Load pending files from storage
    loadPendingFiles();

    // Listen for refresh events from WebSocket handler
    const handleRefresh = () => {
      // Force immediate refresh of both server and local files
      dispatch(fetchFiles());
      loadPendingFiles();
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('fileManagementRefresh', handleRefresh);

    return () => {
      window.removeEventListener('fileManagementRefresh', handleRefresh);
    };
  }, [dispatch, refreshTrigger, refreshKey]);

  const loadPendingFiles = async () => {
    try {
      const pending = await fileHandler.getPendingFiles();
      setPendingFiles(pending);
    } catch (error) {
      console.error('Error loading pending files:', error);
    }
  };

  // Handle file upload
  const handleUploadFiles = async (fileIds) => {
    try {
      const filesToUpload = await fileHandler.getFileDataForUpload(fileIds);

      if (filesToUpload.length === 0) {
        toast.error('No files to upload');
        return;
      }

      const formData = new FormData();
      filesToUpload.forEach(({ file }) => {
        formData.append("files", file);
      });

      // Update status to uploading
      for (const fileId of fileIds) {
        await fileHandler.updateFileStatus(fileId, 'uploading');
      }
      setRefreshTrigger(prev => prev + 1);

      const res = await axiosInstance.post("admin/file/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if ([200, 201, 202].includes(res.status)) {
        const id = toast.loading("Processing files...");
        const uploadID = res.data.uploadID;

        let toastMap = JSON.parse(localStorage.getItem("uploadToastMap") || "{}");
        toastMap[uploadID] = id;
        localStorage.setItem("uploadToastMap", JSON.stringify(toastMap));

        // Update status to 'uploaded' but keep files visible until training completes
        for (const fileId of fileIds) {
          await fileHandler.updateFileStatus(fileId, 'uploaded', {
            uploadID,
            uploadedAt: new Date().toISOString() // Set server upload time
          });
        }

        // Refresh to show updated status
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading files');

      // Revert status back to pending
      for (const fileId of fileIds) {
        await fileHandler.updateFileStatus(fileId, 'pending');
      }
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // Handle file deletion from dashboard
  const handleDeleteFromDashboard = async (fileIds) => {
    const fileCount = fileIds.length;
    const confirmMessage = fileCount === 1
      ? "Are you sure you want to remove this file from the dashboard?"
      : `Are you sure you want to remove ${fileCount} files from the dashboard?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await fileHandler.removeFiles(fileIds);
      const successMessage = fileCount === 1
        ? 'File removed from dashboard'
        : `${fileCount} files removed from dashboard`;
      toast.success(successMessage);
      setRefreshTrigger(prev => prev + 1);
      setSelectedFiles(prev => prev.filter(id => !fileIds.includes(id)));
    } catch (error) {
      console.error('Error removing files:', error);
      toast.error('Error removing files');
    }
  };

  // Handle server file download
  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const res = await axiosInstance.get(`admin/file/${fileId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error while downloading file:", error);
      toast.error("Error downloading file");
    }
  };

  // Handle server file deletion
  const handleDeleteServerFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file from server?")) return;

    try {
      const res = await axiosInstance.delete(`admin/file/${fileId}`);
      if (res.status === 200 || res.status === 204) {
        toast.success("File deleted successfully!");
        dispatch(fetchFiles());
      } else {
        toast.error("Cannot delete file!");
      }
    } catch (error) {
      console.error("Error when deleting file:", error);
      toast.error("Error when deleting file");
    }
  };

  const handleTypeChange = (type) => {
    setTypeFilter((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  // Combine server files and pending files, avoiding duplicates
  const allFiles = [];

  // Create a map to track files by hash for duplicate detection
  const filesByHash = new Map();

  // First pass: collect all local files and mark their hashes
  pendingFiles.forEach(file => {
    if (['pending', 'uploading', 'uploaded'].includes(file.status)) {
      const processedFile = {
        ...file,
        source: 'local',
        id: file.id,
        status: file.status === 'uploaded' ? 'processing' : file.status,
        isDownloadable: false
      };

      // Always add local files and mark their hashes
      allFiles.push(processedFile);
      if (file.hash) {
        filesByHash.set(file.hash, processedFile);
      }
    }
  });

  // Second pass: add server files only if they don't conflict with local files
  serverFiles.forEach(serverFile => {
    const existingFile = filesByHash.get(serverFile.hash);

    if (!existingFile) {
      // No local version exists, add server file
      allFiles.push({
        ...serverFile,
        source: 'server',
        status: serverFile.status || 'trained',
        type: serverFile.type && serverFile.type.startsWith('.') ? serverFile.type : '.' + (serverFile.type || '').toLowerCase(),
        fileExtension: serverFile.type && serverFile.type.startsWith('.') ? serverFile.type : '.' + (serverFile.type || '').toLowerCase(),
        isDownloadable: true
      });
    } else if (existingFile.status === 'processing' && (serverFile.status === 'trained' || !serverFile.status)) {
      // Local file is processing and server file is trained - update local status but keep the file
      const index = allFiles.findIndex(f => f === existingFile);
      if (index !== -1) {
        // Update the existing local file status to trained instead of replacing with server file
        allFiles[index] = {
          ...existingFile,
          status: 'trained',
          trainedAt: new Date().toISOString()
        };
      }
    }
  });

  // Apply filters
  const filteredFiles = allFiles.filter((file) => {
    // File name filter
    if (nameFilter.length > 0 && !file.name.toLowerCase().includes(nameFilter.toLowerCase())) {
      return false;
    }

    // Admin name filter
    if (uploaderFilter.length > 0) {
      const adminName = file.admin?.name || file.admin || '';
      if (!adminName.toLowerCase().includes(uploaderFilter.toLowerCase())) {
        return false;
      }
    }

    // Type filter
    if (typeFilter.length > 0) {
      const fileExtension = file.type?.toLowerCase().replace(".", "");
      if (!typeFilter.includes(fileExtension)) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && statusFilter && file.status?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    // Date filters
    if (createdFrom) {
      // For local files, use uploadedAt (server upload time) or createdAt (local creation time)
      // For server files, use created_at
      let createdDateValue;
      if (file.source === 'local') {
        createdDateValue = file.uploadedAt || file.createdAt;
      } else {
        createdDateValue = file.created_at;
      }
      const createdDate = new Date(createdDateValue);
      const fromDate = new Date(createdFrom + "T00:00:00");
      const toDate = createdTo ? new Date(createdTo + "T23:59:59") : new Date();
      if (createdDate < fromDate || createdDate > toDate) return false;
    }

    if (modifiedFrom) {
      // Always use lastModified if available (original file modification date from computer)
      // Only fallback to server updated_at if no original modification date exists
      let modifiedDateValue;
      if (file.lastModified) {
        modifiedDateValue = typeof file.lastModified === 'number' ?
          new Date(file.lastModified).toISOString() :
          file.lastModified;
      } else {
        modifiedDateValue = file.updated_at;
      }
      const modifiedDate = new Date(modifiedDateValue);
      const fromDate = new Date(modifiedFrom + "T00:00:00");
      const toDate = modifiedTo ? new Date(modifiedTo + "T23:59:59") : new Date();
      if (modifiedDate < fromDate || modifiedDate > toDate) return false;
    }

    return true;
  });

  // Pagination
  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / filesPerPage));

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  // Handle file selection for bulk operations
  const handleFileSelect = (fileId, isChecked) => {
    setSelectedFiles(prev =>
      isChecked
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
    );
  };

  const handleSelectAll = (isChecked) => {
    setSelectedFiles(isChecked ? currentFiles.map(file => file.id) : []);
  };

  // Get pending files for bulk upload (only pending, not uploading)
  const selectedPendingFiles = selectedFiles.filter(fileId =>
    pendingFiles.some(file => file.id === fileId && file.status === 'pending')
  );

  return (
    <div className="flex flex-row bg-black text-white h-full w-screen">
      {/* Sidebar Filter */}
      <div className="lg:w-80 w-50 border-r border-slate-500 p-4 space-y-5">
        <div className="flex items-center gap-x-4">
          <img src={filterIcon} alt="Filter Icon" />
          <h2>Filter</h2>
        </div>
        {/* Existing Filters */}
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            placeholder="Name"
            className="w-full rounded bg-white text-black p-2"
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Status</label>
          <select
            className="w-full rounded bg-white text-black p-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="uploading">Uploading</option>
            <option value="processing">Processing</option>
            <option value="training">Training</option>
            <option value="trained">Trained</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Type</label>
          <div className="flex flex-wrap gap-4">
            {["docx", "xls", "pdf", "txt"].map((type) => (
              <div className="flex items-center gap-x-2" key={type}>
                <input
                  type="checkbox"
                  className="cursor-pointer accent-green-500 h-4 w-4"
                  onChange={(e) => handleTypeChange(type)}
                />
                <label>{type}</label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1">Date Created</label>
          <input
            type="date"
            className="w-full rounded bg-white text-black p-2"
            onChange={(e) => setCreatedFrom(e.target.value)}
          />
          <label className="mt-1 block">To</label>
          <input
            type="date"
            className="w-full rounded bg-white text-black p-2"
            onChange={(e) => setCreatedTo(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Date Modified</label>
          <input
            type="date"
            className="w-full rounded bg-white text-black p-2"
            onChange={(e) => setModifiedFrom(e.target.value)}
          />
          <label className="mt-1 block">To</label>
          <input
            type="date"
            className="w-full rounded bg-white text-black p-2"
            onChange={(e) => setModifiedTo(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Uploaded by</label>
          <input
            type="text"
            placeholder="Uploader"
            className="w-full rounded bg-white text-black p-2"
            onChange={(e) => setUploaderFilter(e.target.value)}
          />
        </div>

        {/* Upload and Delete Buttons at bottom of filters */}
        {selectedPendingFiles.length > 0 && (
          <div className="pt-4 border-t border-slate-600 space-y-2">
            <button
              onClick={() => handleUploadFiles(selectedPendingFiles)}
              className="w-full flex items-center justify-center gap-2 p-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
            >
              <AiOutlineUpload className="w-4 h-4" />
              Upload Selected Files ({selectedPendingFiles.length})
            </button>
            <button
              onClick={() => handleDeleteFromDashboard(selectedPendingFiles)}
              className="w-full flex items-center justify-center gap-2 p-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
            >
              <AiOutlineDelete className="w-4 h-4" />
              Delete Selected Files ({selectedPendingFiles.length})
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto lg:px-20 px-4">

        {/* File Table */}
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-500 text-base md:text-lg">
              <th className="pb-4 pr-4">
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={selectedFiles.length === currentFiles.length && currentFiles.length > 0}
                  className="cursor-pointer"
                />
              </th>
              <th className="pb-4 pr-4">Name</th>
              <th className="pb-4 pr-4">Type</th>
              <th className="pb-4 pr-4">Status</th>
              <th className="pb-4 pr-4">Date Created</th>
              <th className="pb-4 pr-4">Date Modified</th>
              <th className="pb-4 pr-4">Uploader</th>
              <th className="pb-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && currentFiles.length > 0 ? (
              currentFiles.map((file, i) => (
                <tr
                  key={`${file.source}-${file.id}-${i}`}
                  className="border-b border-slate-700 hover:bg-slate-800 text-sm md:text-base"
                >
                  <td className="py-2">
                    {file.status !== 'trained' ? (
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={(e) => handleFileSelect(file.id, e.target.checked)}
                        className="cursor-pointer"
                      />
                    ) : (
                      // Empty space for trained files to maintain table alignment
                      <div className="w-4 h-4"></div>
                    )}
                  </td>
                  <td className="py-2 flex items-center gap-2">
                    <img
                      src={getIconByType(file.type, file.fileExtension)}
                      alt="icon"
                      className="w-5 h-5"
                    />
                    {file.name}
                  </td>
                  <td className="pr-2">{file.fileExtension || file.type}</td>
                  <td className="pr-2">
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${file.status === 'pending' ? 'bg-yellow-600' :
                          file.status === 'uploading' ? 'bg-blue-600' :
                            file.status === 'uploaded' || file.status === 'processing' ? 'bg-green-600' :
                              file.status === 'training' ? 'bg-orange-600' :
                                file.status === 'trained' ? 'bg-purple-600' :
                                  'bg-gray-600'
                        }`}>
                        {file.status === 'uploaded' ? 'processing' : file.status || 'unknown'}
                      </span>
                      {(file.status === 'training' || file.status === 'uploading' || file.status === 'uploaded') && (
                        <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin text-orange-400" />
                      )}
                    </div>
                  </td>
                  {/* Date Created: Shows when file was uploaded to server (uploadedAt) or added to dashboard (createdAt) */}
                  <td className="pr-2">{
                    formatDate(
                      file.source === 'local' ?
                        (file.uploadedAt || file.createdAt) : // Show server upload time if available, otherwise local creation time
                        file.created_at // Server files use their created_at
                    )
                  }</td>
                  {/* Date Modified: Always shows the original file modification date from local computer */}
                  <td className="pr-2">{
                    formatDate(
                      // Priority: use original lastModified from local computer if available
                      file.lastModified ?
                        (typeof file.lastModified === 'number' ? new Date(file.lastModified).toISOString() : file.lastModified) :
                        file.updated_at // Only fallback to server updated_at if no original modification date
                    )
                  }</td>
                  <td className="pr-2">{file.admin?.name || file.admin || 'Unknown'}</td>
                  <td className="text-center space-x-2">
                    {file.source === 'local' && file.status === 'pending' && (
                      <>
                        <button
                          className="cursor-pointer hover:text-blue-400 text-white"
                          onClick={() => handleUploadFiles([file.id])}
                          title="Upload file"
                        >
                          <AiOutlineUpload className="h-5 w-5" />
                        </button>
                        <button
                          className="cursor-pointer hover:text-red-400 text-white"
                          onClick={() => handleDeleteFromDashboard([file.id])}
                          title="Delete from dashboard"
                        >
                          <AiOutlineDelete className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {file.source === 'local' && (file.status === 'uploading' || file.status === 'uploaded' || file.status === 'processing') && (
                      <span className="text-blue-400" title="Processing...">
                        <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin" />
                      </span>
                    )}

                    {file.isDownloadable && file.source === 'server' && (
                      <button
                        className="cursor-pointer hover:text-green-400 text-white"
                        onClick={() => handleDownloadFile(file.id, file.name)}
                        title="Download file"
                      >
                        <AiOutlineDownload className="h-5 w-5" />
                      </button>
                    )}
                    {file.source === 'server' && (
                      <button
                        className="cursor-pointer hover:text-red-400 text-white"
                        onClick={() => handleDeleteServerFile(file.id)}
                        title="Delete from server"
                      >
                        <AiOutlineDelete className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-400">
                  {loading ? "Loading files..." : "No files found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex flex-col items-center gap-3 mt-6">
          {allFiles.length > 0 && (
            <>
              <ReactPaginate
                breakLabel="..."
                nextLabel=">"
                onPageChange={(selectedItem) =>
                  setCurrentPage(selectedItem.selected + 1)
                }
                pageRangeDisplayed={1}
                marginPagesDisplayed={1}
                pageCount={totalPages}
                previousLabel="<"
                forcePage={currentPage - 1}
                containerClassName="flex gap-1 items-center text-sm"
                pageClassName="border px-3 py-1 rounded hover:bg-gray-700"
                activeClassName="bg-gray-600"
                previousClassName="border px-3 py-1 rounded hover:bg-gray-700"
                nextClassName="border px-3 py-1 rounded hover:bg-gray-700"
                breakClassName="px-2"
                disabledClassName="opacity-30"
                className="cursor-pointer flex flex-row"
              />

              <div className="flex items-center gap-2 text-sm mt-2">
                <label>Go to page:</label>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) paginate(val);
                  }}
                  className="w-16 text-white px-2 py-1 rounded bg-slate-800 border border-slate-500"
                />
                <span>/ {totalPages}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedFileManagement;
