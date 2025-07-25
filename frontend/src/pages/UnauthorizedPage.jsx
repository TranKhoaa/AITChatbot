// pages/UnauthorizedPage.jsx
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  return (
    <div className="text-center mt-20 text-2xl text-red-600">
      ⛔ Bạn không có quyền truy cập trang này!
      <div className="mt-8 flex justify-center items-center">
        <button
          className="flex items-center w-56 px-4 py-2.5 text-sm font-medium rounded-lg bg-white text-black group transition-all duration-200 hover:bg-gray-400 "
          onClick={() => navigate('/')}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};
export default UnauthorizedPage;
