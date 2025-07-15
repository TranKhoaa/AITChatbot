export default function Navbar() {
  return (
  <nav className="relative px-4 py-2 flex justify-between items-center bg-white border-b-2">
    <a className="text-2xl font-bold text-black" href="#">
      AITChatbot
    </a>
    <ul className="hidden absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 lg:mx-auto lg:flex lg:items-center lg:w-auto lg:space-x-6">
      <li>
        <div className=" relative mx-auto text-gray-600">
          <input
            className="border border-gray-300 placeholder-current h-10 px-5 pr-16  rounded-lg text-sm focus:outline-none"
            type="search"
            name="search"
            placeholder="Search"
          />
        </div>
      </li>
    </ul>
    <div className="hidden lg:flex">
      <a href="https://tailwindflex.com/playground">
        <button className=" py-1.5 px-3 m-1 text-center bg-black border rounded-md text-white  hover:bg-black/80 hover:text-gray-100 hidden lg:block">
          Log in
        </button>
      </a>
    </div>
  </nav>
  );
}