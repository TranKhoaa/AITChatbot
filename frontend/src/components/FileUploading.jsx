import React from "react";
import filterIcon from "../assets/filter_icon.svg"
import wordIcon from "../assets/word_icon.svg"
import excelIcon from "../assets/excel_icon.svg"
import pdfIcon from "../assets/pdf_icon.svg"
import removeIcon from "../assets/remove_icon.svg"
import downloadIcon from "../assets/download_icon.svg"
function FileUploading() {
    const getIconByType = (type) => {
        switch(type.toLowerCase()) {
            case "docx":
            case "doc":
                return wordIcon
            case "xls":
            case "xlsx":
                return excelIcon
            case "pdf":
                return pdfIcon
            default:
                return ""
        }
    }
    const files = [
        {
            name: "Nghe",
            type: "docx",
            created: "10/07/2025 9:02 AM",
            modified: "10/07/2025 9:02 AM",
            uploader: "liemdt",
            icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/word/word-original.svg"
        },
        {
            name: "Nghe",
            type: "xls",
            created: "10/07/2025 9:02 AM",
            modified: "10/07/2025 9:02 AM",
            uploader: "liemdt",
            icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/excel/excel-original.svg"
        },
        {
            name: "Nghe",
            type: "pdf",
            created: "10/07/2025 9:02 AM",
            modified: "10/07/2025 9:02 AM",
            uploader: "liemdt",
            icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/adobeillustrator/adobeillustrator-plain.svg"
        }
    ];

    return (
        <div className="h-screen">
            <h1 className="h-[15%] w-full border-b border-slate-300 flex items-center pl-24">Files Uploading</h1>
                <div className="w-full px-24 py-16 space-y-10">
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="text-left border-b border-slate-500 text-2xl">
                                <th className="pb-6 font-thin">Name</th>
                                <th className="pb-6 font-thin">Type</th>
                                <th className="pb-6 font-thin">Date Created</th>
                                <th className="pb-6 font-thin">Date Modified</th>
                                <th className="pb-6 font-thin">Uploaded By</th>
                                <th className="pb-6 text-center font-thin">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file, index) => (
                                <tr key={index} className="border-b border-slate-700 hover:bg-slate-800 text-xl">
                                    <td className="py-3 flex items-center gap-2">
                                        <img src={getIconByType(file.type)} alt={`${file.type} icon`} className="w-5 h-5" />
                                        {file.name}
                                    </td>
                                    <td>{file.type}</td>
                                    <td>{file.created}</td>
                                    <td>{file.modified}</td>
                                    <td>{file.uploader}</td>
                                    <td className="flex gap-4 justify-center items-center py-2">
                                        <button title="Download">
                                            <img src={downloadIcon} alt="Download Icon" />
                                        </button>
                                        <button title="Delete">
                                            <img src={removeIcon} alt="Remove Icon" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
    );
}
export default FileUploading