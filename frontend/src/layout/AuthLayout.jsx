import Header from "../components/Header";
import illustration from "../assets/illustration.svg";
import circleUp from "../assets/vector_up.svg";
import circleDown from "../assets/vector_down.svg";

function AuthLayout({ children }) {
    return (
        <div className="h-screen flex flex-col">
            <Header />
            <main className="p-5 xl:overflow-hidden lg:py-10 lg:px-24 flex flex-col lg:flex-row lg:gap-x-36 text-xl">
                <div className="flex flex-col justify-between gap-y-10">
                    <h1 className="text-2xl lg:text-3xl xl:text-4xl font-medium">Ask AITChatbot</h1>
                    <span className="text-slate-200">Access to thousands of design resources and templates</span>
                    <div className="circle-container h-72 lg:h-full pl-10">
                        <div className="orbit">
                            <img src={circleUp} className="circle-up w-5 xl:w-7" />
                            <img src={circleDown} className="circle-down w-5  xl:w-7" />
                        </div>
                        <img src={illustration} alt="Just an image" className="h-[50%] w-[50%] lg:h-auto lg:w-auto illustration" />
                    </div>
                </div>
                {children}
            </main>
        </div>
    );
}

export default AuthLayout;
