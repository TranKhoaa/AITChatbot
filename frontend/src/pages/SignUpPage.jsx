import { useState, React } from "react";
import Header from "../components/Header";
import illustration from "../assets/illustration.svg";
import circleUp from "../assets/vector_up.svg";
import circleDown from "../assets/vector_down.svg";
import hideIcon from "../assets/hide_icon.svg";
import AuthLayout from "../layout/AuthLayout";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, setError } from "../features/auth/authSlice";
import { signupUser, signupAdmin } from "../features/auth/authAPI";

function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  // For redux
  const [username, setUsername] = useState("");
  // const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  const togglePass = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  const toggleConfirmPass = (e) => {
    e.preventDefault();
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleClick = () => {
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password != confirmPassword) {
      setPasswordError("Password do not match, please enter again");
      return;
    }
    setPasswordError("");
    const credentials = { name: username, password };
    const isAdminSignup = username.toLowerCase().includes("admin");
    try {
      const response = isAdminSignup
        ? await signupAdmin(credentials)
        : await signupUser(credentials);
      dispatch(
        setCredentials({
          id: response.user_id || response.admin_id,
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
      <div className="bg-white text-black px-24 py-28 w-[35%] flex flex-col gap-y-10 justify-around rounded-2xl">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="input-block">
            <label className="text-slate-600 text-xl">User name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-text focus:border-slate-700 focus:outline-none"
            />
          </div>
          <div className="input-block">
            <label className="text-slate-600 text-xl">Email address</label>
            <input
              type="text"
              className="input-text focus:border-slate-700 focus:outline-none"
            />
          </div>
          <div className="input-block">
            <div className="flex flex-row justify-between">
              <label className="text-slate-600 text-xl">Password</label>
              <div className="flex flex-row gap-x-3 cursor-pointer">
                {showPassword && <img src={hideIcon} alt="HideIcon" />}
                <span className="text-xl text-gray-700" onClick={togglePass}>
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className="input-text focus:border-slate-700 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label className="text-slate-600 text-lg cursor-pointer">
              Use 8 or more characters with a mix of letters, numbers & symbols
            </label>
          </div>
          <div className="input-block">
            <div className="flex flex-row justify-between">
              <label className="text-slate-600 text-xl">Confirm Password</label>
              <div className="flex flex-row gap-x-3 cursor-pointer">
                {showConfirmPassword && <img src={hideIcon} alt="HideIcon" />}
                <span
                  className="text-xl text-gray-700"
                  onClick={toggleConfirmPass}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </span>
              </div>
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="input-text focus:border-slate-700 focus:outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {passwordError && (
              <label className="text-red-500 text-xl">{passwordError}</label>
            )}
          </div>

          <div className="flex flex-col gap-y-5">
            <label class="inline-flex items-start">
              <input
                type="checkbox"
                className=" text-slate-900 mt-2 cursor-pointer"
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
                className=" text-slate-900 mt-2 cursor-pointer"
              />
              <span class="ml-2 text-gray-700 text-xl">
                By creating an account, I am also consenting to receive SMS
                messages and emails, including product new feature updates,
                events, and marketing promotions.
              </span>
            </label>
          </div>
          <div className="flex flex-row gap-x-28 items-center">
            <button
              type="submit"
              className="w-40 rounded-full h-14 bg-black hover:bg-slate-800 text-white text-xl"
            >
              Sign up
            </button>
            <span className="text-xl text-gray-700">
              Already have an account?{" "}
              <a href="/login" className="underline text-xl cursor-pointer">
                Log in
              </a>
            </span>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
export default SignUpPage;
