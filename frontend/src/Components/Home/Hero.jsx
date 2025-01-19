import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import desktopImage from '../assets/Images/Dog.png';
import mobileImage from '../assets/Images/Dog2.png';

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center overflow-hidden">
      {/* Pozadinske slike - responsive */}
      <div className="absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" srcSet={desktopImage} />
          <img 
            src={mobileImage}
            alt="Pas u pozadini" 
            className="w-full h-full object-cover md:object-right"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/50 via-black/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full md:w-3/4 lg:w-2/5 ml-0 lg:ml-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center md:text-left pt-20 md:pt-0"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              <span className="block">Dobrodošli u</span>
              <span className="block mt-2 bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">
                Peture
              </span>
            </h1>
            <p className="mt-4 md:mt-6 text-sm sm:text-base md:text-lg text-gray-300 max-w-xl mx-auto md:mx-0">
              Otkrijte savršenog saputnika za putovanje vašeg ljubimca. 
              Profesionalna nega, pouzdana usluga i bezgranična ljubav 
              za vaše krznene prijatelje.
            </p>
            
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                to="/registracija"
                className="inline-flex items-center justify-center px-6 py-3 text-sm sm:text-base font-medium text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Započnite Odmah
                <motion.svg
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="ml-2 h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </motion.svg>
              </Link>
              <Link
                to="/usluge"
                className="inline-flex items-center justify-center px-6 py-3 text-sm sm:text-base font-medium text-white border-2 border-white rounded-full hover:bg-white/10 transition-colors duration-200"
              >
                Naše Usluge
              </Link>
            </div>

            {/* Plutajući bedževi sa prirodnim zelenim nijansama */}
            <div className="mt-8 md:mt-12 grid grid-cols-3 sm:flex gap-2 sm:gap-4 md:gap-6 max-w-md mx-auto md:mx-0">
              {[
                { icon: "🌿", text: "Prirodna Nega", delay: 3 },
                { icon: "💚", text: "Uvek Dostupni", delay: 3.5 },
                { icon: "🍃", text: "Vrhunska Usluga", delay: 4 }
              ].map((badge, index) => (
                <motion.div
                  key={index}
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ repeat: Infinity, duration: badge.delay }}
                  className="bg-green-900/10 backdrop-blur-md p-2 sm:p-3 md:p-4 rounded-xl border border-green-500/20"
                >
                  <span className="text-xl sm:text-2xl block mb-1">{badge.icon}</span>
                  <p className="font-semibold text-white text-xs sm:text-sm">{badge.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
