import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { AiOutlineClose } from 'react-icons/ai';

export default function SettingsModal({ onClose }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Auto-Detect");
  const [searchTerm, setSearchTerm] = useState("");

  const languages = ["Auto-Detect", "English", "Japanese", "Vietnamese"];
  const filteredLanguages = languages.filter((lang) =>
    lang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-150 w-200 z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white rounded-xl shadow-lg max-w-2xl p-6">
      {/* Header */}
      <div className="px-4 flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
        <h2 className="text-xl font-semibold">Settings</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white cursor-pointer"
          title="Close"
        >
          <AiOutlineClose className="h-6 w-6" />
        </button>
      </div>

      <div className="flex space-x-8">
        {/* Sidebar */}
        <div className="flex p-4 flex-col space-y-4 w-1/3">
          <button className="cursor-pointer text-left hover:text-gray-300">General</button>
          <button className="cursor-pointer text-left hover:text-gray-300">
            Data controls
          </button>
          <button className="cursor-pointer text-left hover:text-gray-300">Main Language</button>
        </div>

        {/* Main Content */}
        <div className="justify-end flex-1 flex flex-row pt-4">
          <div>
            <a className="font-semibold block mb-2">Main Language</a>
            <div className="relative inline-block w-48">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="cursor-pointer w-full bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded flex justify-between items-center"
              >
                {selectedLanguage}
                {dropdownOpen ? (
                  <FaChevronUp className="ml-2" />
                ) : (
                  <FaChevronDown className="ml-2" />
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-full bg-gray-700 border border-gray-600 rounded shadow-lg z-10">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full px-2 py-1 bg-gray-600 text-sm outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <ul className="max-h-48 overflow-y-auto">
                    {filteredLanguages.map((lang) => (
                      <li
                        key={lang}
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setDropdownOpen(false);
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-600 flex justify-between items-center ${selectedLanguage === lang ? "bg-gray-600" : ""
                          }`}
                      >
                        {lang}
                        {selectedLanguage === lang && (
                          <span className="text-xs">✓</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
