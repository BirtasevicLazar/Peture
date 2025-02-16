import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { checkAuth, checkWorkers } from '../../api/dashboard';
import Workers from './Workers';
import Salon from './Salon';
import WorkerDetails from './WorkerDetails';
import WorkerAppointments from './WorkerAppointments';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [activeComponent, setActiveComponent] = useState('workers');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [hasWorkers, setHasWorkers] = useState(true);
  const mainContentRef = useRef(null);
  const navigate = useNavigate();

  // Auth provera
  const { isLoading: isAuthLoading, isError: isAuthError } = useQuery({
    queryKey: ['auth'],
    queryFn: checkAuth,
    retry: false,
    onError: () => {
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
    }
  });

  // Provera radnika
  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: checkWorkers,
    enabled: !isAuthLoading && !isAuthError,
    onSuccess: (data) => {
      const hasExistingWorkers = data.length > 0;
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (!hasExistingWorkers && !hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    },
    onError: (error) => {
      console.error('Error checking workers:', error);
      toast.error('Greška pri učitavanju radnika');
    }
  });

  // Prevent going back
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = function(event) {
      window.history.pushState(null, '', window.location.href);
    };

    return () => {
      window.onpopstate = null;
    };
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    window.onpopstate = null; // Remove the navigation prevention
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'salon', label: 'Salon', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'workers', label: 'Radnici', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  ];

  const workerSubmenuItems = [
    { id: 'details', label: 'Detalji', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', component: null },
    { id: 'appointments', label: 'Termini', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', component: null },
  ];

  // Функција за скроловање на врх
  const scrollToTop = () => {
    const contentElement = mainContentRef.current?.querySelector('.overflow-y-auto');
    if (contentElement) {
      contentElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Модификована функција за промену компоненте
  const handleComponentChange = (component) => {
    setActiveComponent(component);
    setSelectedWorker(null);
    setActiveSubmenu(null);
    scrollToTop();
  };

  // Модификована функција за селекцију радника
  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker);
    setActiveSubmenu('appointments');
    setActiveComponent('worker-details');
    scrollToTop();
  };

  // Модификована функција за промену подменија
  const handleSubmenuClick = (itemId) => {
    setActiveSubmenu(itemId);
    setActiveComponent('worker-details');
    scrollToTop();
  };

  const renderMainContent = () => {
    if (activeComponent === 'salon') {
      return <Salon />;
    }

    if (activeComponent === 'workers') {
      return <Workers onWorkerSelect={handleWorkerSelect} />;
    }

    if (activeComponent === 'worker-details') {
      if (activeSubmenu === 'details') {
        return <WorkerDetails workerId={selectedWorker?.id} />;
      } else if (activeSubmenu === 'appointments') {
        return <WorkerAppointments workerId={selectedWorker?.id} />;
      }
      return null;
    }

    return null;
  };

  const OnboardingModal = () => {
    const steps = [
      {
        title: "Dobrodošli! 🎉",
        description: "Vodićemo Vas kroz sve mogućnosti Peture platforme.",
        icon: (
          <div className="relative w-16 h-16 mx-auto lg:w-24 lg:h-24">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200 rounded-xl animate-pulse"></div>
            <div className="absolute -inset-1 bg-gradient-to-br from-green-400 to-green-600 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <svg className="absolute inset-0 w-16 h-16 lg:w-24 lg:h-24 text-green-600 transform transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        ),
        features: [
          {
            title: "Sve na jednom mestu",
            description: "Upravljanje salonom",
            icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
          },
          {
            title: "Online Zakazivanje",
            description: "24/7 dostupnost",
            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          },
          {
            title: "Obaveštenja",
            description: "SMS i email",
            icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          }
        ]
      },
      {
        title: "Radnici 👥",
        description: "Dodajte radnike i organizujte njihov rad.",
        icon: (
          <div className="relative w-16 h-16 mx-auto lg:w-24 lg:h-24">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
            <svg className="absolute inset-0 w-16 h-16 lg:w-24 lg:h-24 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        ),
        features: [
          {
            title: "Profil",
            description: "Osnovni podaci",
            icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0z"
          },
          {
            title: "Radno Vreme",
            description: "Raspored rada",
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          },
          {
            title: "Usluge",
            description: "Cene i trajanje",
            icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4"
          }
        ]
      },
      {
        title: "Usluge 💇‍♀️",
        description: "Definišite usluge i cene za svakog radnika.",
        icon: (
          <div className="relative w-16 h-16 mx-auto lg:w-24 lg:h-24">
            <div className="absolute inset-0 bg-purple-100 rounded-full animate-pulse"></div>
            <svg className="absolute inset-0 w-16 h-16 lg:w-24 lg:h-24 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
        ),
        features: [
          {
            title: "Cene",
            description: "Postavite cene",
            icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2"
          },
          {
            title: "Trajanje",
            description: "Vreme usluge",
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          },
          {
            title: "Opis",
            description: "Detalji usluge",
            icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586"
          }
        ]
      },
      {
        title: "Termini 📅",
        description: "Upravljajte zakazanim terminima.",
        icon: (
          <div className="relative w-16 h-16 mx-auto lg:w-24 lg:h-24">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse"></div>
            <svg className="absolute inset-0 w-16 h-16 lg:w-24 lg:h-24 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ),
        features: [
          {
            title: "Kalendar",
            description: "Pregled termina",
            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5"
          },
          {
            title: "Notifikacije",
            description: "Obaveštenja",
            icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11"
          },
          {
            title: "Istorija",
            description: "Prošli termini",
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          }
        ]
      }
    ];

    return (
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 ${showOnboarding ? '' : 'hidden'}`}>
        <div className="bg-white/95 backdrop-blur-md w-full h-full lg:h-auto lg:w-auto lg:max-w-4xl lg:rounded-3xl lg:mx-4 overflow-y-auto shadow-2xl border border-white/20">
          {/* Content Container */}
          <div className="p-4 lg:p-8">
            {/* Icon i Naslov */}
            <div className="text-center mb-8">
              <div className="group">
                {steps[onboardingStep - 1].icon}
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mt-6 mb-3 lg:text-4xl animate-fade-in">
                {steps[onboardingStep - 1].title}
              </h2>
              <p className="text-sm text-gray-600 lg:text-lg animate-fade-in max-w-xl mx-auto">
                {steps[onboardingStep - 1].description}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 gap-4 mt-8 lg:grid-cols-3 lg:gap-6">
              {steps[onboardingStep - 1].features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 lg:p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-slide-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl blur opacity-0 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex items-center lg:block">
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-3 w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center shadow-md group-hover:shadow-xl transition-shadow">
                      <svg className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600 transform transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                      </svg>
                    </div>
                    <div className="ml-4 lg:ml-0 lg:mt-4">
                      <h3 className="text-base font-semibold text-gray-900 lg:text-lg mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 lg:text-base">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200/50 p-4 lg:static lg:p-6">
            {/* Progress Bar */}
            <div className="relative h-1.5 bg-gray-200 rounded-full mb-6 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-green-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(onboardingStep / steps.length) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer"></div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setOnboardingStep(prev => prev - 1)}
                className={`group flex items-center text-sm font-medium text-gray-600 px-4 py-2.5 lg:px-5 lg:py-2.5 rounded-xl hover:bg-gray-100 transition-all ${
                  onboardingStep === 1 ? 'opacity-0 pointer-events-none' : ''
                }`}
              >
                <svg className="w-4 h-4 mr-2 transform transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Nazad
              </button>

              {onboardingStep < steps.length ? (
                <button
                  onClick={() => setOnboardingStep(prev => prev + 1)}
                  className="group relative inline-flex items-center text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 lg:px-6 lg:py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all hover:shadow-lg hover:scale-[1.02]"
                >
                  <span className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl blur opacity-0 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></span>
                  <span className="relative flex items-center">
                    Dalje
                    <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem('hasSeenOnboarding', 'true');
                  }}
                  className="group relative inline-flex items-center text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 px-5 py-2.5 lg:px-6 lg:py-2.5 rounded-xl hover:from-green-700 hover:to-green-800 transition-all hover:shadow-lg hover:scale-[1.02]"
                >
                  <span className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></span>
                  <span className="relative flex items-center">
                    Započni
                    <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-green-100 border-t-green-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] fixed inset-0 bg-gray-50/50">
      {/* Top Navigation Bar */}
      <nav className="flex-none bg-white border-b border-gray-200 h-16 z-30">
        <div className="h-full px-4">
          <div className="flex justify-between h-full">
            <div className="flex items-center">
              {selectedWorker ? (
                <button
                  onClick={() => {
                    setActiveComponent('workers');
                    setSelectedWorker(null);
                    setActiveSubmenu(null);
                  }}
                  className="lg:hidden inline-flex items-center p-2 text-gray-400 hover:text-gray-900 
                           hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : null}
              <div className="flex-shrink-0 flex items-center ml-2">
                <span className="text-xl font-normal text-gray-900">Peture</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedWorker && (
                <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                  {selectedWorker.ime} {selectedWorker.prezime}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="lg:hidden inline-flex items-center p-2 text-red-500 hover:text-white 
                         hover:bg-red-500 rounded-lg transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block w-72 bg-white border-r border-gray-200">
          <div className="flex flex-col h-full">
            <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleComponentChange(item.id)}
                  className={`${
                    activeComponent === item.id && !selectedWorker
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } group w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200`}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              ))}

              {/* Worker Submenu */}
              {selectedWorker && (
                <div className="mt-4 space-y-2">
                  <div className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Radnik</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {selectedWorker.ime} {selectedWorker.prezime}
                    </p>
                  </div>
                  {workerSubmenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSubmenuClick(item.id)}
                      className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                        ${activeSubmenu === item.id
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                      <svg
                        className="w-5 h-5 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                      </svg>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium 
                         text-white bg-red-500 hover:bg-red-600 rounded-lg 
                         transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Odjavi se
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 relative" ref={mainContentRef}>
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden will-change-scroll overscroll-none">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - hidden on desktop */}
      <div className="lg:hidden flex-none bg-white border-t border-gray-200 h-16 z-30">
        <div className="flex justify-evenly items-center h-full px-2">
          {!selectedWorker ? (
            menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleComponentChange(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full
                  ${activeComponent === item.id
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))
          ) : (
            workerSubmenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSubmenuClick(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full
                  ${activeSubmenu === item.id
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
                 onClick={() => setShowLogoutModal(false)} />
            
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Odjava
                        </h3>
                        <p className="text-sm text-gray-500">Da li ste sigurni da želite da se odjavite?</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowLogoutModal(false)}
                      className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(false)}
                      className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                               rounded-xl hover:bg-gray-50"
                    >
                      Otkaži
                    </button>
                    <button
                      type="button"
                      onClick={confirmLogout}
                      className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl 
                               hover:bg-red-700"
                    >
                      Odjavi se
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <OnboardingModal />
    </div>
  );
};

export default Dashboard;
