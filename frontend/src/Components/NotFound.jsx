import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-indigo-600">404</h1>
        <p className="text-xl mt-4">Stranica nije pronađena</p>
        <Link to="/" className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          Nazad na početnu
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
