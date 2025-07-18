import React, {useState} from "react";
import { useNavigate} from "react-router-dom";
import companyLogo from "../assets/company_logo.svg"
import "../App.css"

function HomePage() {
    const navigate = useNavigate()
    return (
        <main className="h-screen flex flex-col py-40 lg:p-0 lg:flex-row overflow-hidden">
            <div className="flex flex-col justify-center gap-y-36 lg:p-48 xl:ml-24 lg:w-[40%] items-center">
                <div className="inline-flex flex-col w-64 items-center gap-y-10" >
                    <img src={companyLogo} alt="Company Logo" className="floating-logo "/>
                    <h1 className="text-2xl lg:text-3xl xl:text-4xl font-medium">
                        AITChatbot   
                    </h1>
                </div>
                <div className="flex flex-col items-center gap-y-10">
                    <button 
                        className="w-52 xl:w-96 h-16 text-xl font-semibold cursor-pointer rounded-full border-none bg-white text-black hover:bg-slate-200"
                        onClick={() => navigate("/signup")}
                    >
                        Sign Up 
                    </button>
                    <button 
                        className="w-52 xl:w-96 h-16 text-xl font-semibold cursor-pointer rounded-full border-none bg-white text-black hover:bg-slate-200"
                        onClick={() => navigate("/login")}
                    >
                        Log In
                    </button>
                </div>
            </div>
            <div className="hidden lg:grid grid-cols-5 grid-rows-[1fr_auto_auto] w-full rect-container">
                <div className="row-span-3 rectangle rect1"></div>
                <div className="col-span-4 grid grid-cols-4">
                    <div className="rectangle rect2"></div>
                    <div className="rectangle rect2"></div>
                    <div className="rectangle rect2"></div>
                    <div className="rectangle rect2"></div>
                </div>
                <div className="col-span-4 flex flex-col gap-y-5">
                    <div className="rectangle rect3"></div>
                    <div className="rectangle rect3"></div>
                </div>
            </div>
        </main>
    );
}

export default HomePage