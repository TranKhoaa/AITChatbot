import React, { useState, useRef} from "react";
import store from "../app/store";
import axiosInstance from "../api/axiosInstance";
import {
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaTrash,
  FaChevronRight,
  FaChevronDown,
} from "react-icons/fa";
import { MdClose } from "react-icons/md";

export default function UploadFile({ onClose }) {
  const [files, setFiles] = useState([]);
  const [expanded, setExpanded] = useState({});
  const fileInputRef = useRef();
  const folderInputRef = useRef();

  const handleFiles = (selectedFiles) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const newFiles = Array.from(selectedFiles)
      .filter((file) => allowedTypes.includes(file.type))
      .map((file) => ({
        id: URL.createObjectURL(file),
        file,
        relativePath: file.webkitRelativePath || file.name,
      }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDeleteFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDeleteFolder = (folderPath) => {
    setFiles((prev) =>
      prev.filter(
        (f) =>
          !f.relativePath.startsWith(folderPath + "/") &&
          f.relativePath !== folderPath
      )
    );
  };

  const [visible, setVisible] = useState(true);

  const toggleFolder = (path) => {
    setExpanded((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const buildTree = (items) => {
    const tree = {};
    items.forEach(({ relativePath, id }) => {
      const parts = relativePath.split("/");
      let current = tree;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          // Is a file
          current[part] = id;
        } else {
          // Is a folder
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      }
    });
    return tree;
  };

  const renderTree = (node, parentPath = "") => (
    <ul className="pl-4 border-l border-gray-300">
      {Object.entries(node).map(([key, value]) => {
        const currentPath = parentPath ? `${parentPath}/${key}` : key;
        if (typeof value === "object") {
          const isOpen = expanded[currentPath] ?? true;
          return (
            <li key={currentPath} className="relative">
              <div className="flex items-center">
                <button
                  onClick={() => toggleFolder(currentPath)}
                  className="mr-1 text-gray-500 hover:text-gray-700"
                >
                  {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                </button>
                <div className="flex items-center group">
                  {isOpen ? (
                    <FaFolderOpen className="text-yellow-500 mr-1" />
                  ) : (
                    <FaFolder className="text-yellow-500 mr-1" />
                  )}
                  <a className="font-semibold">{key}</a>
                  <button
                    onClick={() => handleDeleteFolder(currentPath)}
                    className="ml-2 invisible group-hover:visible text-red-600 hover:text-red-800"
                    title="Remove Folder"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              {isOpen && renderTree(value, currentPath)}
            </li>
          );
        } else {
          return (
            <li key={currentPath} className="flex items-center group ml-6">
              <FaFile className="text-gray-500 mr-1" />
              <a>{key}</a>
              <button
                onClick={() => handleDeleteFile(value)}
                className="ml-2 invisible group-hover:visible text-red-600 hover:text-red-800"
                title="Remove File"
              >
                <FaTrash />
              </button>
            </li>
          );
        }
      })}
    </ul>
  );
  const token = store.getState().auth.token;
  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(({ file }) => {
      formData.append("files", file);
    });

    try {
      const res = await axiosInstance.post("admin/file/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(res);
      if (
        res.status === 200 ||
        res.status === 201 ||
        res.status === 202
      ) {
        // const data = await res.json();
        alert("Processing...");
        onClose();
      } else {
        alert("Error uploading!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("An error occurred while uploading.");
    }
  };

  const handleCancel = () => {
    setFiles([]);
  };

  const tree = buildTree(files);

  return visible ? (
    <main className="fixed z-[1000] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md container w-[800px] h-200">
      <article className="flex flex-col h-200 bg-gray-900 text-white p-4">
        <div className="flex justify-between">
          <h1 className="font-semibold text-lg mb-2 p-2 ml-4">Files/Folders Upload</h1>
          <button
            onClick={onClose}
            className="cursor-pointer top-1 p-4 right-1 absolute text-gray-500 hover:text-gray-600"
            title="Close"
          >
            <MdClose className="text-2xl h-7 w-7" />
          </button>
        </div>
        <section className="m-4 p-6 border-2 border-white/40 rounded-2xl h-120 overflow-auto w-180 self-center">
          {files.length === 0 ? (
            <p className="text-gray-200">No files selected</p>
          ) : (
            renderTree(tree)
          )}
        </section>
        <div className="flex flex-row justify-center m-6 gap-x-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              onClick={() => {
                fileInputRef.current.value = null;
                fileInputRef.current.click();
              }}
              className="cursor-pointer rounded-2xl h-15 w-40 px-3 py-1 bg-gray-800 hover:bg-gray-600"
            >
              Select Files
            </button>
          </div>
          <div>
            <input
              ref={folderInputRef}
              type="file"
              multiple
              webkitdirectory="true"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              onClick={() => {
                folderInputRef.current.value = null;
                folderInputRef.current.click();
              }}
              className="cursor-pointer rounded-2xl h-15 w-40 px-3 py-1 bg-gray-800 hover:bg-gray-600"
            >
              Select Folders
            </button>
          </div>
        </div>



        <footer className="flex justify-end mt-8 h-12 gap-x-3">
          <button
            onClick={handleCancel}
            className="cursor-pointer rounded p-6 py-1 bg-gray-800 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className="cursor-pointer rounded p-6 py-1 bg-gray-800 hover:bg-gray-600 text-white"
          >
            Upload Now
          </button>
        </footer>
      </article>
    </main>
  ) : null;
}
