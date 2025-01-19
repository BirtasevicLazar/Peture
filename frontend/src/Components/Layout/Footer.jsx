import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-green-900 to-green-950">
      <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
          {/* Branding */}
          <div className="text-center md:text-left space-y-3">
            <Link to="/" className="inline-block text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              Peture
            </Link>
            <p className="text-green-100 text-sm">
              Profesionalna briga o vašim ljubimcima
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="text-green-300 font-semibold mb-4">Brzi Linkovi</h3>
            <ul className="space-y-3">
              {[
                ['Početna', '/'],
                ['Usluge', '/usluge'],
                ['O nama', '/o-nama'],
                ['Kontakt', '/kontakt'],
              ].map(([text, path]) => (
                <li key={path}>
                  <Link 
                    to={path}
                    className="text-green-100 hover:text-white transition-colors duration-200 text-sm inline-block"
                  >
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-left">
            <h3 className="text-green-300 font-semibold mb-4">Kontakt</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-center md:justify-start text-green-100">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <a href="mailto:info@peture.com" className="hover:text-white transition-colors duration-200">
                  info@peture.com
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start text-green-100">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <a href="tel:+38164123456" className="hover:text-white transition-colors duration-200">
                  +381 64 123 456
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="text-center md:text-left">
            <h3 className="text-green-300 font-semibold mb-4">Pratite Nas</h3>
            <div className="flex justify-center md:justify-start space-x-6">
              {[
                { name: 'Facebook', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
                { name: 'Instagram', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z' },
                { name: 'Twitter', icon: 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' },
              ].map((social) => (
                <a
                  key={social.name}
                  href={`#${social.name.toLowerCase()}`}
                  className="text-green-200 hover:text-white transition-colors duration-200"
                  aria-label={social.name}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-green-800/50">
          <p className="text-center text-green-300 text-sm">
            © {currentYear} Peture. Sva prava zadržana.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
