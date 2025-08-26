// src/components/generic/TopBar.jsx
import { useState } from 'react';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TopBar = () => {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <img 
            src="logo-new-2.png" 
            alt="VidyaAI Logo" 
            className="h-16 w-auto rounded-lg border-2 border-white"
          />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 h-16">
            <div className="flex items-center space-x-3 bg-gray-800 rounded-lg px-4 py-2 h-16">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {currentUser?.displayName || 'User'}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 font-medium"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-4 space-y-4">
            <div className="flex items-center space-x-3 bg-gray-800 rounded-lg p-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User size={24} className="text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium text-base truncate">
                  {currentUser?.displayName || 'User'}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 font-medium"
            >
              <LogOut size={20} className="mr-3" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
