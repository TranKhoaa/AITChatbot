import Header from "../components/Header";
import illustration from "../assets/illustration.svg";
import circleUp from "../assets/vector_up.svg";
import circleDown from "../assets/vector_down.svg";

function AuthLayout({ children }) {
    return (
        <div className="h-screen flex flex-col">
            <Header />
            <main className="py-20 pr-36 pl-64 flex flex-row gap-x-20 text-xl">
                <div className="flex flex-col justify-between gap-y-10">
                    <h1>Ask AITChatbot</h1>
                    <span className="text-slate-200">Access to thousands of design resources and templates</span>
                    <div className="circle-container">
                        <div className="orbit">
                            <img src={circleUp} className="circle-up" />
                            <img src={circleDown} className="circle-down" />
                        </div>
                        <img src={illustration} alt="Just an image" className="h-[70%] w-[70%] illustration" />
                    </div>
                </div>
                {children}
            </main>
        </div>
    );
}

export default AuthLayout;
