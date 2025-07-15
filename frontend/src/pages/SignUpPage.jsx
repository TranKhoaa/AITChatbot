import { useState , React}  from "react";
import Header from "../components/Header";
import illustration from "../assets/illustration.svg"
import circleUp from "../assets/vector_up.svg"
import circleDown from "../assets/vector_down.svg"
import hideIcon from "../assets/hide_icon.svg"
import AuthLayout from "../layout/AuthLayout";
import { useNavigate } from "react-router-dom";
function SignUpPage() {
    const [showPassword, setShowPassword] = useState(false)
    const togglePass = (e) => {
        e.preventDefault()
        setShowPassword(!showPassword)
    }
    const navigate = useNavigate
    const handleClick = () => {
        navigate("/login")
    }
    return (
        <AuthLayout>
                <div className="bg-white text-black px-20 py-14 w-[35%] flex flex-col justify-around rounded-2xl">
                    <h2>Sign Up</h2>
                    <form>
                        <div className="input-block">
                            <label className="text-slate-600 text-xl">User name</label>
                            <input type="text" className="input-text focus:border-slate-700 focus:outline-none"/>
                        </div>
                        <div className="input-block">
                            <label className="text-slate-600 text-xl">Email address</label>
                            <input type="text" className="input-text focus:border-slate-700 focus:outline-none"/>
                        </div>
                        <div className="input-block">
                            <div className="flex flex-row justify-between">
                                <label className="text-slate-600 text-xl">Password</label>
                                <div className = "flex flex-row gap-x-3 cursor-pointer">
                                    {showPassword && (<img src={hideIcon} alt="HideIcon"/>)}
                                    <span className="text-xl text-gray-700" onClick={togglePass}>{showPassword? 'Hide' : 'Show'} </span>
                                </div>  
                            </div>
                            <input type={showPassword? 'text' : 'password'} className="input-text focus:border-slate-700 focus:outline-none"/>
                            <label className="text-slate-600 text-lg cursor-pointer" >Use 8 or more characters with a mix of letters, numbers & symbols</label>
                        </div>
                    </form>      
                    <div className="flex flex-col gap-y-5">
                        <label class="inline-flex items-start">
                            <input type="checkbox" class="form-checkbox text-slate-900 w-5 h-4 mt-1 cursor-pointer" />
                            <span class="ml-2 text-gray-700 text-xl">By creating an account, I agree to 
                            our <span className="font-bold underline text-xl cursor-pointer">Terms of use</span> and <span className="font-bold underline text-xl cursor-pointer">
                            Privacy Policy</span>
                            </span>
                        </label>
                        <label class="inline-flex items-start">
                            <input type="checkbox" class="form-checkbox text-slate-900 w-5 h-4 mt-1 cursor-pointer" />
                            <span class="ml-2 text-gray-700 text-xl">By creating an account, I am also consenting to receive SMS messages and emails, 
                                    including product new feature updates, events, and marketing promotions.</span>
                        </label>
                    </div>

                    <div className="flex flex-row gap-x-28 items-center">
                        <button className="w-40 rounded-full h-14 bg-black hover:bg-slate-800 text-white text-xl">Sign up</button>
                        <span className="text-xl text-gray-700">Already have an 
                            account? <a href = "/login" className="underline text-xl cursor-pointer">Log in</a></span>
                    </div>
                </div>
        </AuthLayout>
        );
}   
export default SignUpPage