import React from "react";
import filterIcon from "../assets/filter_icon.svg"
import wordIcon from "../assets/word_icon.svg"
import excelIcon from "../assets/excel_icon.svg"
import pdfIcon from "../assets/pdf_icon.svg"
import removeIcon from "../assets/remove_icon.svg"
import downloadIcon from "../assets/download_icon.svg"
function FileManagement() {
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
            <h1 className="h-[15%] w-full border-b border-slate-300 flex items-center pl-24">Files Management</h1>
            <div className="h-screen flex flex-row">
                {/* Sidebar Filter */}
                <div className=" w-[15%] h-screen border-r border-slate-300 p-6 flex flex-col gap-y-14 space-y-5">

                    <span className="flex items-center gap-x-7">
                        <img src={filterIcon} alt="Filter Icon" />
                        <h2>Filter</h2>
                    </span>

                    <div>
                        <label className="block mb-2">Name</label>
                        <input type="text" placeholder="Name" className="w-[90%] rounded-lg bg-white text-black p-3 focus:outline-none" />
                    </div>

                    <div>
                        <label className="block mb-2">Type</label>
                        <div className="flex flex-col gap-y-6">
                            <div className="flex flex-row gap-x-14">
                                <div className="flex items-center gap-x-2">
                                    <input type="checkbox" className="accent-green-500 h-5 w-5"/> 
                                    <label>docx</label>
                                </div>
                                <div className="flex items-center gap-x-2">
                                    <input type="checkbox" defaultChecked  className="accent-green-500 h-5 w-5"/> 
                                    <label>xsl</label>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-x-2">
                                <input type="checkbox"  className="accent-green-500 h-5 w-5"/> 
                                <label>pdf</label>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="block mb-2">Date Created</label>
                        <input type="date" className="w-[90%] rounded-lg bg-white text-black p-3 focus:outline-none" />
                        <label >To</label>
                        <input type="date" className="w-[90%] rounded-lg bg-white text-black p-3 focus:outline-none" />
                    </div>

                    <div className="flex flex-col">
                        <label className="block mb-2">Date Modified</label>
                        <input type="date" className="w-[90%] rounded-lg bg-white text-black p-3 focus:outline-none" />
                        <label>To</label>
                        <input type="date" className="w-[90%] rounded-lg bg-white text-black p-3 focus:outline-none" />
                    </div>

                    <div>
                        <label className="block mb-2">Uploaded by</label>
                        <input type="text" placeholder="Uploaded by" className="w-[90%] rounded-lg bg-white text-black p-3 focus:outline-none" />
                    </div>
                </div>

                {/* Files Table */}
                <div className="w-full p-6 space-y-10">
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
        </div>
    );
}

export default FileManagement;
