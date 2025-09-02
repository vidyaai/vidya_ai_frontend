// src/components/generic/PageHeader.jsx
import { useState, useRef, useEffect } from 'react';
import { Menu, X, MessageSquare, Folder, Globe, Home } from 'lucide-react';

const PageHeader = ({ title, onNavigateToChat, onNavigateToGallery, onNavigateToTranslate, onNavigateToHome }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigationItems = [
    {
      icon: MessageSquare,
      label: 'Chat with My Video',
      onClick: () => onNavigateToChat(null),
      active: title === 'Chat with My Video'
    },
    {
      icon: Folder,
      label: 'My Gallery',
      onClick: onNavigateToGallery,
      active: title === 'My Gallery'
    },
    {
      icon: Globe,
      label: 'Translate',
      onClick: onNavigateToTranslate,
      active: title === 'Translate'
    }
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      
      {/* Navigation Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
          aria-label="Navigation menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 top-12 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-2">
              {navigationItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                      item.active
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <IconComponent size={18} className="mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              
              {/* Divider */}
              <div className="border-t border-gray-700 my-2"></div>
              
              {/* Home option */}
              <button
                onClick={() => {
                  onNavigateToHome();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors duration-200"
              >
                <Home size={18} className="mr-3" />
                <span className="font-medium">Home</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
