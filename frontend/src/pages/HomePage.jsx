import React, {useState} from "react";
import { useNavigate} from "react-router-dom";
import companyLogo from "../assets/company_logo.svg"
import "../App.css"

function HomePage() {
    const navigate = useNavigate()
    return (
        <main className="h-screen flex flex-row overflow-hidden">
            <div className="flex flex-col justify-center gap-y-36 p-48 ml-24 w-[40%] items-center">
                <div className="inline-flex flex-col w-64 items-center gap-y-10" >
                    <img src={companyLogo} alt="Company Logo"/>
                    <h1>
                        AITChatbot   
                    </h1>
                </div>
                <div className="flex flex-col gap-y-10">
                    <button 
                        className="w-96 h-16 text-xl font-semibold cursor-pointer rounded-full border-none bg-white text-black hover:bg-slate-200"
                        onClick={() => navigate("/signup")}
                    >
                        Sign Up 
                    </button>
                    <button 
                        className="w-96 h-16  text-xl font-semibold cursor-pointer rounded-full border-none bg-white text-black hover:bg-slate-200"
                        onClick={() => navigate("/login")}
                    >
                        Log In
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-5 grid-rows-[1fr_auto_auto] w-full container">
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