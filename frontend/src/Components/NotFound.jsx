import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-green-600">404</h1>
        <p className="text-xl mt-4 text-gray-700">Stranica nije pronađena</p>
        <Link to="/" className="mt-4 inline-block bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300">
          Nazad na početnu
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
