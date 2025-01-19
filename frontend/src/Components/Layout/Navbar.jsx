import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.2,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled || isOpen ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link 
            to="/" 
            className="text-3xl font-extrabold relative group z-50"
          >
            <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              Peture
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {[
              ['Početna', '/'],
              ['Usluge', '/usluge'],
              ['O nama', '/o-nama'],
              ['Kontakt', '/kontakt']
            ].map(([naziv, putanja]) => (
              <NavLink 
                key={naziv}
                to={putanja}
                active={location.pathname === putanja}
              >
                {naziv}
              </NavLink>
            ))}
            <div className="flex items-center space-x-4 ml-8">
              <Link 
                to="/login" 
                className="px-6 py-2.5 text-white bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Prijava
              </Link>
              <Link 
                to="/register" 
                className="px-6 py-2.5 text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Registracija
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-green-50 transition-colors duration-300 z-50"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`w-full h-0.5 rounded-full bg-gray-600 transform transition-all duration-300 ${
                  isOpen ? 'rotate-45 translate-y-2.5 bg-green-600' : ''
                }`}
              />
              <span
                className={`w-full h-0.5 rounded-full bg-gray-600 transition-all duration-300 ${
                  isOpen ? 'opacity-0 translate-x-2' : ''
                }`}
              />
              <span
                className={`w-full h-0.5 rounded-full bg-gray-600 transform transition-all duration-300 ${
                  isOpen ? '-rotate-45 -translate-y-2 bg-green-600' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-md shadow-xl lg:hidden overflow-hidden"
            >
              <div className="px-4 py-8 space-y-6">
                {[
                  ['Početna', '/'],
                  ['Usluge', '/usluge'],
                  ['O nama', '/o-nama'],
                  ['Kontakt', '/kontakt']
                ].map(([naziv, putanja]) => (
                  <motion.div
                    key={naziv}
                    variants={itemVariants}
                    className="text-center"
                  >
                    <Link
                      to={putanja}
                      onClick={() => setIsOpen(false)}
                      className={`inline-block py-3 text-lg font-medium transition-colors duration-200 ${
                        location.pathname === putanja
                          ? 'text-green-600'
                          : 'text-gray-700 hover:text-green-600'
                      }`}
                    >
                      {naziv}
                    </Link>
                  </motion.div>
                ))}
                <motion.div 
                  variants={itemVariants}
                  className="pt-6 flex flex-col gap-4"
                >
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="py-3 text-center text-white bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full hover:shadow-lg transition-all duration-200"
                  >
                    Prijava
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="py-3 text-center text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-full hover:shadow-lg transition-all duration-200"
                  >
                    Registracija
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

const NavLink = ({ to, children, active }) => (
  <Link to={to} className={`relative text-gray-700 hover:text-green-600 transition-colors duration-300 ${active ? 'text-green-600' : ''}`}>{children}</Link>
);

const MobileNavLink = ({ to, children, active, onClick }) => (
  <Link to={to} onClick={onClick} className={`text-lg text-center py-3 transition-colors duration-300 ${active ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}`}>{children}</Link>
);

export default Navbar;
