// src/components/generic/PageHeader.jsx
import { useState, useRef, useEffect } from 'react';
import { Menu, X, MessageSquare, Folder, Globe, Home, DollarSign } from 'lucide-react';

const PageHeader = ({ title, onNavigateToChat, onNavigateToGallery, onNavigateToTranslate, onNavigateToHome, onNavigateToPricing }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!navigatingTo) return;
    if (navigatingTo === 'chat') onNavigateToChat?.(null);
    else if (navigatingTo === 'gallery') onNavigateToGallery?.();
    else if (navigatingTo === 'translate') onNavigateToTranslate?.();
    else if (navigatingTo === 'pricing') onNavigateToPricing?.();
    else if (navigatingTo === 'home') onNavigateToHome?.();
  }, [navigatingTo]);

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
      key: 'chat',
      active: title === 'Chat with My Video'
    },
    {
      icon: Folder,
      label: 'My Gallery',
      key: 'gallery',
      active: title === 'My Gallery'
    },
    {
      icon: Globe,
      label: 'Translate',
      key: 'translate',
      active: title === 'Translate'
    },
    {
      icon: DollarSign,
      label: 'Pricing',
      key: 'pricing',
      active: title === 'Pricing'
    }
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      {navigatingTo && (
        <div className="fixed inset-0 z-50 bg-[#071224] flex items-center justify-center">
          <svg className="animate-spin" width="80" height="80" viewBox="0 0 80 80">
            <defs>
              <mask id="crescent-mask-pageheader">
                <circle cx="40" cy="40" r="36" fill="white" />
                <circle cx="43" cy="40" r="37" fill="black" />
              </mask>
            </defs>
            <circle cx="40" cy="40" r="36" fill="#43ead6" mask="url(#crescent-mask-pageheader)" />
          </svg>
        </div>
      )}
      <div className="flex items-center space-x-3">
        <img
          src="/images/vidya-ai-logo-1.png"
          alt="Vidya AI Logo"
          className="h-8 w-auto"
        />
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      
      {/* Navigation Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors duration-200"
          aria-label="Navigation menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 top-12 w-64 bg-[#0d1f38] border border-[#182842] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-2">
              {navigationItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setIsMenuOpen(false);
                      setNavigatingTo(item.key);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                      item.active
                        ? 'bg-[#43ead6] text-[#051224]'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <IconComponent size={18} className="mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}

              {/* Divider */}
              <div className="border-t border-[#182842] my-2"></div>

              {/* Home option */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setNavigatingTo('home');
                }}
                className="w-full flex items-center px-4 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors duration-200"
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
