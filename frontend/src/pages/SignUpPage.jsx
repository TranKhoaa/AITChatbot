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

  const [usernameError, setUsernameError] = useState("");
  const [missingPasswordError, setMissingPasswordError] = useState("");
  const [missingConfirmError, setMissingConfirmError] = useState("");
  // For redux
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);
  const [signupSuccess, setSignupSuccess] = useState(false);

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

    let hasError = false;
    setUsernameError("");
    setMissingPasswordError("");
    setMissingConfirmError("");

    if (!username.trim()) {
      setUsernameError("Please fill out this field");
      hasError = true;
    }
    if (!password.trim()) {
      setMissingPasswordError("Please fill out this field");
      hasError = true;
    }
    if (!confirmPassword.trim()) {
      setMissingConfirmError("Please fill out this field");
      hasError = true;
    }

    if (hasError) return;

    if (password != confirmPassword) {
      setPasswordError("Password do not match, please enter again");
      return;
    }
    setPasswordError("");
    const credentials = { name: username, password };
    try {
      const response = isAdmin
        ? await signupAdmin(credentials)
        : await signupUser(credentials);
      // dispatch(
      //   setCredentials({
      //     id: response.user_id || response.admin_id,
      //     name: response.name,
      //     access_token: response.access_token,
      //     refresh_token: response.refresh_token,
      //   })
      // ); //Sign up information should not be include in local storage
      if (response && (response.user_id || response.admin_id)) {
        setSignupSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return;
      }
    } catch (err) {
      dispatch(setError(err));
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white text-black p-5  xl:px-15 xl:py-15 w-full 2xl:w-[45%] xl:w-[70%] flex flex-col justify-around rounded-2xl space-y-3 xl:space-y-5">
        <h2 className="text-xl lg:text-2xl xl:text-3xl font-medium">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="input-block">
            <label className="text-slate-600 text-sm lg:text-base">
              User name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`input-text focus:outline-none ${
                usernameError
                  ? "border border-red-500 focus:border-red-500 "
                  : "border border-slate-300 focus:border-slate-500  "
              }`}
            />
            {usernameError && (
              <p className="my-1 text-sm xl:text-base text-red-500">
                {usernameError}
              </p>
            )}
          </div>
          <div className="input-block">
            <label className="text-slate-600 text-sm lg:text-base">
              Email address
            </label>
            <input
              type="text"
              className="input-text focus:outline-none  border border-slate-300 focus:border-slate-500  "
            />
          </div>
          <div className="input-block">
            <div className="flex flex-row justify-between">
              <label className="text-slate-600 text-sm lg:text-base">
                Password
              </label>
              <div className="flex flex-row gap-x-3 cursor-pointer">
                {showPassword && <img src={hideIcon} alt="HideIcon" />}
                <span
                  className="text-sm lg:text-base text-gray-700"
                  onClick={togglePass}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className={`input-text focus:outline-none ${
                missingPasswordError
                  ? "border border-red-500 focus:border-red-500 "
                  : "border border-slate-300 focus:border-slate-500  "
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {missingPasswordError && (
              <p className="my-1 text-sm xl:text-base text-red-500">
                {missingPasswordError}
              </p>
            )}
            <label className="text-slate-600 text-sm xl:text-base">
              Use 8 or more characters with a mix of letters, numbers & symbols
            </label>
          </div>
          <div className="input-block">
            <div className="flex flex-row justify-between">
              <label className="text-slate-600 text-sm lg:text-base">
                Confirm Password
              </label>
              <div className="flex flex-row gap-x-3 cursor-pointer">
                {showConfirmPassword && <img src={hideIcon} alt="HideIcon" />}
                <span
                  className="text-sm lg:text-base text-gray-700"
                  onClick={toggleConfirmPass}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </span>
              </div>
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              className={`input-text focus:outline-none ${
                missingConfirmError
                  ? "border border-red-500 focus:border-red-500 "
                  : "border border-slate-300 focus:border-slate-500  "
              }`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {missingConfirmError && (
              <p className="my-1 text-sm xl:text-base text-red-500">
                {missingConfirmError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-y-2">
            <label class="flex items-start ">
              <input
                type="checkbox"
                className=" text-slate-900 mt-1 xl:mt-1.5 cursor-pointer"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <span class="ml-2 text-gray-700 text-sm xl:text-base">
                Sign up as admin
              </span>
            </label>
            <label class="flex items-start">
              <input
                type="checkbox"
                className=" text-slate-900 mt-1 xl:mt-1.5 cursor-pointer"
              />
              <span class="ml-2 text-gray-700 text-sm  xl:text-base">
                By creating an account, I agree to our{" "}
                <span className="font-bold underline text-sm xl:text-base cursor-pointer">
                  Terms of use
                </span>{" "}
                and{" "}
                <span className="font-bold underline text-sm xl:text-base cursor-pointer">
                  Privacy Policy
                </span>
              </span>
            </label>
            <label class="flex items-start">
              <input
                type="checkbox"
                className=" text-slate-900 mt-1 xl:mt-1.5 cursor-pointer"
              />
              <span class="ml-2 text-gray-700 text-sm xl:text-base">
                By creating an account, I am also consenting to receive SMS
                messages and emails, including product new feature updates,
                events, and marketing promotions.
              </span>
            </label>
          </div>
          <div className="flex flex-col gap-y-5 items-center md:flex-row md:gap-x-14 md:items-center">
            <button
              type="submit"
              className="w-40 h-10 rounded-full xl:h-14 bg-black hover:bg-slate-800 text-white text-sm xl:text-base"
            >
              Sign up
            </button>
            <span className="text-sm xl:text-sm text-gray-700">
              Already have an account?{" "}
              <a
                href="/login"
                className="underline text-sm xl:text-base cursor-pointer"
              >
                Log in
              </a>
            </span>
          </div>
          {signupSuccess && (
            <div className="text-green-600 text-center mt-2 text-sm xl:text-base">
              Sign up successful! Directing to login
            </div>
          )}
        </form>
      </div>
    </AuthLayout>
  );
}
export default SignUpPage;
