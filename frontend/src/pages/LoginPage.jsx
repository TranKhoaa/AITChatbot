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
  const [isAdmin, setIsAdmin] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const togglePass = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let hasError = false;
    setUsernameError("");
    setPasswordError("");
    setLoginError("");
    if (!username.trim()) {
      setUsernameError("Please fill out this field");
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Please fill out this field");
      hasError = true;
    }

    if (hasError) return;

    const credentials = { name: username, password };

    try {
      const response = isAdmin
        ? await loginAdmin(credentials)
        : await loginUser(credentials);
        console.log("Login response: ", response);
      dispatch(
        setCredentials({
          id: response.id,
          name: response.name,
          role: "admin",
          access_token: response.access_token,
        })
      );
    navigate(response.role === "admin" ? "/admin" : "/chat");
    } catch (err) {
      if (err.status === 401) {
        setLoginError("Your username or password is incorrect.");
      } else {
        setLoginError("An unexpected error occurred. Please try again.");
      }
      dispatch(setError({ message: err.message, status: err.status }));
    }
  };
  return (
    <AuthLayout>
      <div className="bg-white text-black px-20 py-28 w-[35%] flex flex-col justify-around rounded-2xl space-y-10">
        <h2>Log In</h2>
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-5">
            <div className="input-block">
              <label className="text-slate-600 text-xl">
                User name/email address
              </label>
              <input
                type="text"
                className={`input-text focus:outline-none ${
                  usernameError
                    ? "border border-red-500 focus:border-red-500 "
                    : "border border-slate-300 focus:border-slate-500  "
                }`}
                onChange={(e) => setUsername(e.target.value)}
              />
              {usernameError && (
                <p className="my-1 text-red-500">{usernameError}</p>
              )}
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
                className={`input-text focus:outline-none ${
                  passwordError
                    ? "border border-red-500 focus:border-red-500 "
                    : "border border-slate-300 focus:border-slate-500  "
                }`}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && (
                <p className="my-1 text-red-500">{passwordError}</p>
              )}
              <label className="text-slate-600 text-lg cursor-pointer">
                Use 8 or more characters with a mix of letters, numbers &
                symbols
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-y-5">
            <label class="items-start ">
              <input
                type="checkbox"
                className=" text-slate-900 mt-2 w-4 h-4 cursor-pointer"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <span class="ml-2 text-gray-700 text-xl">Log in as admin</span>
            </label>
            <label class="items-start">
              <input
                type="checkbox"
                class="form-checkbox text-slate-900 mt-2 h-4 w-4 cursor-pointer"
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
            <label class="items-start">
              <input
                type="checkbox"
                class="form-checkbox text-slate-900 mt-2 h-4 w-4 cursor-pointer"
              />
              <span class="ml-2 text-gray-700 text-xl">
                By creating an account, I am also consenting to receive SMS
                messages and emails, including product new feature updates,
                events, and marketing promotions.
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-x-28 items-start">
            <button className="w-40 rounded-full h-14 bg-black hover:bg-slate-800 text-white text-xl">
              Log In
            </button>
            {loginError && (
              <p className="text-red-500 mt-4">{loginError}</p>
            )}
            {/* <span className="text-xl text-gray-700">
              Don’t have an account?{" "}
              <a href="/signup" className="underline text-xl cursor-pointer">
                Sign up
              </a>
            </span> */}
          </div>
        </form>
      
      </div>
    </AuthLayout>
  );
}
export default LoginPage;
