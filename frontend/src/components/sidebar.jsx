import React from "react";
import fileIcon from '../assets/file_icon.svg'
import uploadIcon from '../assets/upload_icon.svg'
import signoutIcon from '../assets/sign_out_icon.svg'
import settingIcon from '../assets/upload_icon.svg'
import { NavLink } from "react-router-dom";
import FileManagement from "./FileManagement";
import FileUploading from "./FileUploading";
const SideBar = () => {
    return (
        <div className="flex flex-col h-screen w-[15%] border-r border-r-slate-300 ">    
            <h2 className="h-[10%] flex flex-row items-center px-8 border-b border-b-slate-300">Chatbot</h2>
            <div className="flex flex-col justify-between h-full px-8 pt-10">
                <div className="flex flex-col gap-y-5">
                    <NavLink to="/admin/file-management" className="flex flex-row items-center gap-x-4 hover:bg-slate-700 hover:rounded-lg hover:p-2">
                        <img src={fileIcon} alt="File Icon" />
                        <span>File Management</span>
                    </NavLink>
                    <NavLink to="/admin/upload" className="flex flex-row items-center gap-x-4 hover:bg-slate-700 hover:rounded-lg hover:p-2">
                        <img src={uploadIcon} alt="File Icon" />
                        <span>Upload</span>
                    </NavLink>
                </div>
                <div className="flex flex-col gap-y-5 pb-10">
                    <button className="flex flex-row items-center gap-x-4 hover:bg-slate-700 hover:rounded-lg hover:p-2">
                        <img src={signoutIcon} alt="Sign out Icon" />
                        <span>Sign out</span>
                    </button>
                    <button className="flex flex-row items-center gap-x-4 hover:bg-slate-700 hover:rounded-lg hover:p-2">
                        <img src={settingIcon} alt="Setting Icon" />
                        <span>Settings</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SideBar