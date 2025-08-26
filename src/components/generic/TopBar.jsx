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
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <img 
              src="/logo-new.png" 
              alt="VidyaAI Logo" 
              className="h-12 w-auto mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">VidyaAI</h1>
              <p className="text-sm text-gray-400">Your AI Learning Companion</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User size={18} className="text-white" />
                )}
              </div>
              <div>
                <p className="text-white font-medium">
                  {currentUser?.displayName || 'User'}
                </p>
                <p className="text-gray-400 text-xs">
                  {currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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
          <div className="md:hidden border-t border-gray-800 py-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
              <div>
                <p className="text-white font-medium">
                  {currentUser?.displayName || 'User'}
                </p>
                <p className="text-gray-400 text-sm">
                  {currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
