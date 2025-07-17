import React, { useState, useRef } from "react";
import {
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaTrash,
  FaChevronRight,
  FaChevronDown,
} from "react-icons/fa";
import { MdClose } from 'react-icons/md';

export default function UploadFile() {
  const [files, setFiles] = useState([]);
  const [expanded, setExpanded] = useState({});
  const hiddenInputRef = useRef();

  const handleFiles = (selectedFiles) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
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

  const handleUpload = () => {
    alert(`Uploading ${files.length} files`);
    console.log(files.map((f) => f.file));
  };

  const handleCancel = () => {
    setFiles([]);
  };

  const tree = buildTree(files);

  return visible ? (
    <main className="container w-[800px] h-[700px] mx-auto max-w-screen-lg">
      <article className="flex flex-col h-200 bg-black text-white shadow rounded-md p-4">
        <div class="flex justify-between">
          <h1 className="font-semibold text-lg mb-2 p-2 ml-4">Files/Folders Upload</h1>
          <button
            onClick={() => setVisible(false)}
            className="top-1 right-1 absolute text-gray-500 hover:text-black"
            title="Close"
          >
          <MdClose className="text-2xl" />
          </button>
        </div>
        <section className="m-4 p-6 border-2 border-white/40 rounded-2xl h-120 overflow-auto w-180 self-center">
          {files.length === 0 ? (
            <p className="text-gray-200">No files selected</p>
          ) : (
            renderTree(tree)
          )}
        </section>
        <header className="mt-6 w-180 self-center h-50 bottom-0 border-dashed rounded-2xl border-2 border-white/50 py-6 flex flex-col items-center justify-center">
          <p className="mb-2 font-semibold text-gray-400">
            Drag & drop files/folders or
          </p>
          <input
            ref={hiddenInputRef}
            type="file"
            multiple
            webkitdirectory="true"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => {
              hiddenInputRef.current.value = null;
              hiddenInputRef.current.click();
            }}
            className="rounded px-3 py-1 bg-gray-800 hover:bg-gray-600"
          >
            Select Files/Folders
          </button>
        </header>

        

        <footer className="flex justify-end mt-4">
          <button
            onClick={handleUpload}
            className="rounded px-3 py-1 bg-gray-800 hover:bg-gray-600 text-white"
          >
            Upload Now
          </button>
          <button
            onClick={handleCancel}
            className="ml-3 rounded px-3 py-1 bg-gray-800 hover:bg-gray-600"
          >
            Cancel
          </button>
        </footer>
      </article>
    </main>
  ) : null;
}
