import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import companyLogo from "../assets/company_logo.svg";
import searchIcon from "../assets/search_icon.svg";

function Header() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClick = () => {
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="flex justify-between items-center bg-white p-3">
      <a href="/">
        <img src={companyLogo} alt="Company Logo" className="h-12" />
      </a>
      <div className="flex flex-row items-center gap-x-2 lg:gap-x-5">
        <div className="relative">
          <img
            src={searchIcon}
            alt="Search Icon"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-100 hover:bg-slate-100"
          />
          <input
            type="text"
            placeholder="Search"
            className=" pl-10 w-44 lg:w-32 pr-3 py-2 border border-slate-400 rounded-full bg-slate-100 text-black focus:border-slate-700 focus:outline-none"
          />
        </div>

        <div className="lg:hidden">
          <button onClick={toggleMenu} className="text-black focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
        <div className={` lg:flex lg:flex-row gap-x-5 
            ${isMenuOpen ? 'flex flex-col top-18 right-0 gap-y-5 p-5 items-end absolute w-full bg-black text-white border border-slate-700 ' : 'hidden'}`}>
          <select className="text-white bg-black lg:bg-white lg:text-black focus:outline-none cursor-pointer">
            <option>English (United States)</option>
            <option>Vietnam (Vietnamese)</option>
            <option>Japan (Japanese)</option>
          </select>

          <button
            className="cursor-pointer w-32 rounded-lg h-10 bg-white text-black border border-slate-500  lg:bg-black hover:bg-slate-800 lg:text-white"
            onClick={handleClick}
          >
            Log in
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;