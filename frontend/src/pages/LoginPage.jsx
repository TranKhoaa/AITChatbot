import { useState, React } from "react";

import Header from "../components/Header";
import illustration from "../assets/illustration.svg";
import circleUp from "../assets/vector_up.svg";
import circleDown from "../assets/vector_down.svg";
import AuthLayout from "../layout/AuthLayout";
import hideIcon from "../assets/hide_icon.svg";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, setError } from "../features/auth/authSlice";
import { loginUser, loginAdmin } from "../features/auth/authAPI";
function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const togglePass = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const credentials = { name: username, password };
    const isAdmin = username.toLowerCase().includes("admin");
    try {
      const response = isAdmin
        ? await loginAdmin(credentials)
        : await loginUser(credentials);
      dispatch(
        setCredentials({
          id: response.id,
          name: response.name,
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        })
      );
      navigate("/chat");
    } catch (err) {
      dispatch(setError(err));
    }
  };
  return (
    <AuthLayout>
      <div className="bg-white text-black px-20 py-28 w-[35%] flex flex-col justify-around rounded-2xl">
        <h2>Log In</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="input-block">
            <label className="text-slate-600 text-xl">
              User name/email address
            </label>
            <input
              type="text"
              className="input-text focus:border-slate-700 focus:outline-none"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="input-block">
            <div className="flex flex-row justify-between">
              <label className="text-slate-600 text-xl">Password</label>
              <div className="flex flex-row gap-x-3 cursor-pointer">
                {showPassword && <img src={hideIcon} alt="HideIcon" />}
                <span className="text-xl text-gray-700" onClick={togglePass}>
                  {showPassword ? "Hide" : "Show"}{" "}
                </span>
              </div>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className="input-text focus:border-slate-700 focus:outline-none"
              onChange={(e) => setPassword(e.target.value)}
            />
            <label className="text-slate-600 text-lg cursor-pointer">
              Use 8 or more characters with a mix of letters, numbers & symbols
            </label>
          </div>

          <div className="flex flex-col">
            <label class="inline-flex items-start">
              <input
                type="checkbox"
                class="form-checkbox text-slate-900 mt-2 h-3 w-3 cursor-pointer"
              />
              <span class="ml-2 text-gray-700 text-xl">
                By creating an account, I agree to our{" "}
                <span className="font-bold underline text-xl cursor-pointer">
                  Terms of use
                </span>{" "}
                and{" "}
                <span className="font-bold underline text-xl cursor-pointer">
                  Privacy Policy
                </span>
              </span>
            </label>
            <label class="inline-flex items-start">
              <input
                type="checkbox"
                class="form-checkbox text-slate-900 mt-2 h-5 w-5 cursor-pointer"
              />
              <span class="ml-2 text-gray-700 text-xl">
                By creating an account, I am also consenting to receive SMS
                messages and emails, including product new feature updates,
                events, and marketing promotions.
              </span>
            </label>
          </div>

          <div className="flex flex-row gap-x-28 items-center">
            <button className="w-40 rounded-full h-14 bg-black hover:bg-slate-800 text-white text-xl">
              Log In
            </button>
            <span className="text-xl text-gray-700">
              Don’t have an account?{" "}
              <a href="/signup" className="underline text-xl cursor-pointer">
                Sign up
              </a>
            </span>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
export default LoginPage;
