import React, { useState, useEffect } from "react";
import filterIcon from "../assets/filter_icon.svg";
import wordIcon from "../assets/word_icon.svg";
import excelIcon from "../assets/excel_icon.svg";
import pdfIcon from "../assets/pdf_icon.svg";
import ReactPaginate from "react-paginate";
import axiosInstance from "../api/axiosInstance";
import { AiOutlineDownload, AiOutlineDelete } from "react-icons/ai";

function FileManagement() {
  const getIconByType = (type) => {
    if (!type || typeof type !== "string") return "";
    switch (type.toLowerCase()) {
      case ".docx":
      case ".doc":
        return wordIcon;
      case ".xls":
      case ".xlsx":
        return excelIcon;
      case ".pdf":
        return pdfIcon;
      default:
        return "";
    }
  };
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
      console.error("Lỗi khi tải file:", error);
    }
  };

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await axiosInstance.get("admin/file/");
        const data = res?.data;
        setFiles(data);
      } catch (error) {
        console.error("Lỗi khi load file từ DB:", error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 15;
  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = files.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.max(1, Math.ceil(files.length / filesPerPage));

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="flex flex-row bg-black text-white h-full w-screen">
      {/* Sidebar Filter */}
      <div className="lg:w-80 w-50 border-r border-slate-300 p-4 space-y-6">
        <div className="flex items-center gap-x-4">
          <img src={filterIcon} alt="Filter Icon" />
          <h2>Filter</h2>
        </div>
        <div>
          <label className="block mb-1">Name</label>
          <input type="text" placeholder="Name" className="w-full rounded bg-white text-black p-2" />
        </div>
        <div>
          <label className="block mb-1">Type</label>
          <div className="flex flex-wrap gap-4">
            {["docx", "xls", "pdf"].map((type) => (
              <div className="flex items-center gap-x-2" key={type}>
                <input type="checkbox" className="accent-green-500 h-4 w-4" />
                <label>{type}</label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block mb-1">Date Created</label>
          <input type="date" className="w-full rounded bg-white text-black p-2" />
          <label className="mt-1 block">To</label>
          <input type="date" className="w-full rounded bg-white text-black p-2" />
        </div>
        <div>
          <label className="block mb-1">Date Modified</label>
          <input type="date" className="w-full rounded bg-white text-black p-2" />
          <label className="mt-1 block">To</label>
          <input type="date" className="w-full rounded bg-white text-black p-2" />
        </div>
        <div>
          <label className="block mb-1">Uploaded by</label>
          <input type="text" placeholder="Uploader" className="w-full rounded bg-white text-black p-2" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto lg:px-20 px-4">
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-500 text-base md:text-lg">
              <th className="pb-4 pr-4">Name</th>
              <th className="pb-4 pr-4">Type</th>
              <th className="pb-4 pr-4">Date Created</th>
              <th className="pb-4 pr-4">Date Modified</th>
              <th className="pb-4 pr-4">Uploader</th>
              <th className="pb-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && currentFiles.length > 0 ? (
              currentFiles.map((file, i) => (
                <tr key={i} className="border-b border-slate-700 hover:bg-slate-800 text-sm md:text-base">
                  <td className="py-2 flex items-center gap-2">
                    <img src={getIconByType(file.type)} alt="icon" className="w-5 h-5" />
                    {file.name}
                  </td>
                  <td className="pr-2">{file.type}</td>
                  <td className="pr-2">{file.created_at}</td>
                  <td className="pr-2">{file.updated_at}</td>
                  <td className="pr-2">{file.admin.name}</td>
                  <td className="text-center space-x-2">
                    <button className="hover:text-gray-400 text-white"
                    onClick={() => handleDownloadFile(file.id, file.name)}>
                      <AiOutlineDownload className="h-5 w-5" /></button>
                    <button className="hover:text-gray-400 text-white">
                      <AiOutlineDelete className="h-5 w-5" /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-400">
                  {loading ? "Loading files..." : "No files found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex flex-col items-center gap-3 mt-6">
          {files.length > 0 && (
            <>
              <ReactPaginate
                breakLabel="..."
                nextLabel=">"
                onPageChange={(selectedItem) => setCurrentPage(selectedItem.selected + 1)}
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
              />

              {/* Go to page input */}
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

export default FileManagement;
