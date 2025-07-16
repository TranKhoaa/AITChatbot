import React from "react";
import { useNavigate } from "react-router-dom";
import companyLogo from "../assets/company_logo.svg"
import searchIcon from "../assets/search_icon.svg"
function Header() {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate('/login');
      };
    return (
        <header className="flex flex-row justify-between items-center bg-white p-3">
            <a href="/"><img src={companyLogo} alt="Company Logo" className="h-12 "/></a>
            <div className="flex flex-row justify-between gap-x-5">
                <div className="relative">
                    <img
                        src={searchIcon}
                        alt="Search Icon"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-100 hover:bg-slate-100"
                    />
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-32 pl-10 pr-4 py-2 border border-slate-400 rounded-full bg-slate-100 text-black focus:border-slate-700 focus:outline-none"
                    />
                </div>  

                <select className="text-black focus:outline-none cursor-pointer">    
                    <option>EngLish (United Stated)</option>
                    <option>Vietnam (Vietnamese)</option>
                    <option>Japan (Japanese)</option>
                </select>

                <button 
                    className="w-32 rounded-lg h-10 bg-black hover:bg-slate-800"
                    onClick={handleClick}
                >
                    Log in
                </button>
            </div>
        </header>
    );
}

export default Header;