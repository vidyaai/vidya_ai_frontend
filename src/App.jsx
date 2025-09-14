// src/App.jsx
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/Login/AuthForm';
import HomePage from './components/HomePage/HomePage';
import ImprovedYoutubePlayer from './components/Chat/ImprovedYouTubePlayer';
import Gallery from './components/Gallery/Gallery';
import PricingPage from './components/PricingPage';
import ProtectedRoute from './components/generic/ProtectedRoute';
import TopBar from './components/generic/TopBar';
import PageHeader from './components/generic/PageHeader';
import './App.css';

// Placeholder for TranslatePage if it doesn't exist
const TranslatePagePlaceholder = ({ onNavigateToHome }) => (
  <div className="w-full flex items-center justify-center py-20">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Translation Service</h2>
      <p className="text-gray-400 mb-6">This component will be available soon!</p>
      <button 
        onClick={onNavigateToHome}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Back to Home
      </button>
    </div>
  </div>
);

// Try to import TranslatePage, use placeholder if it fails
let TranslatePage;
try {
  TranslatePage = require('./components/TranslatePage').default;
} catch (e) {
  console.warn('TranslatePage component not found, using placeholder');
  TranslatePage = TranslatePagePlaceholder;
}

// Utility function to get initial page from URL
const getInitialPage = () => {
  const path = window.location.pathname;
  if (path === '/chat') return 'chat';
  if (path === '/gallery') return 'gallery';
  if (path === '/translate') return 'translate';
  if (path === '/pricing') return 'pricing';
  return 'home';
};

// Main App Content Component
const AppContent = () => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // MOVE ALL HOOKS BEFORE ANY CONDITIONAL LOGIC

  // Handle navigation with browser history
  const handleNavigateToHome = () => {
    setCurrentPage('home');
    setSelectedVideo(null);
    window.history.pushState({ page: 'home' }, '', '/');
  };
  
  const handleNavigateToChat = (videoData = null) => {
    setCurrentPage('chat');
    setSelectedVideo(videoData);
    if (videoData) {
      // Add video ID to URL for bookmarking
      const url = videoData.videoId ? `/chat?v=${videoData.videoId}` : '/chat';
      window.history.pushState({ page: 'chat', videoData }, '', url);
    } else {
      window.history.pushState({ page: 'chat' }, '', '/chat');
    }
  };
  
  const handleNavigateToTranslate = () => {
    setCurrentPage('translate');
    setSelectedVideo(null);
    window.history.pushState({ page: 'translate' }, '', '/translate');
  };

  const handleNavigateToGallery = () => {
    setCurrentPage('gallery');
    setSelectedVideo(null);
    window.history.pushState({ page: 'gallery' }, '', '/gallery');
  };

  const handleNavigateToPricing = () => {
    setCurrentPage('pricing');
    setSelectedVideo(null);
    window.history.pushState({ page: 'pricing' }, '', '/pricing');
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      const page = event.state?.page || getInitialPage();
      const videoData = event.state?.videoData || null;
      setCurrentPage(page);
      setSelectedVideo(videoData);
    };

    // Set initial history state
    if (!window.history.state) {
      window.history.replaceState({ page: getInitialPage() }, '', window.location.pathname);
    }

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // NOW AFTER ALL HOOKS, CHECK AUTHENTICATION
  if (!currentUser) {
    return <AuthForm />;
  }

  // Render current page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            onNavigateToChat={handleNavigateToChat}
            onNavigateToTranslate={handleNavigateToTranslate}
            onNavigateToGallery={handleNavigateToGallery}
            onNavigateToPricing={handleNavigateToPricing}
          />
        );
      case 'chat':
        return (
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-950">
            <TopBar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <PageHeader 
                title="Chat with My Video"
                onNavigateToChat={handleNavigateToChat}
                onNavigateToGallery={handleNavigateToGallery}
                onNavigateToTranslate={handleNavigateToTranslate}
                onNavigateToHome={handleNavigateToHome}
                onNavigateToPricing={handleNavigateToPricing}
              />
              <ImprovedYoutubePlayer 
                onNavigateToHome={handleNavigateToHome}
                onNavigateToTranslate={handleNavigateToTranslate}
                selectedVideo={selectedVideo}
              />
            </div>
          </div>
        </ProtectedRoute>
        );
      case 'gallery':
        return (
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-950">
              <TopBar />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader 
                  title="My Gallery"
                  onNavigateToChat={handleNavigateToChat}
                  onNavigateToGallery={handleNavigateToGallery}
                  onNavigateToTranslate={handleNavigateToTranslate}
                  onNavigateToHome={handleNavigateToHome}
                  onNavigateToPricing={handleNavigateToPricing}
                />
                <Gallery onNavigateToChat={handleNavigateToChat} />
              </div>
            </div>
          </ProtectedRoute>
        );
      case 'translate':
        return (
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-950">
              <TopBar />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader 
                  title="Translate"
                  onNavigateToChat={handleNavigateToChat}
                  onNavigateToGallery={handleNavigateToGallery}
                  onNavigateToTranslate={handleNavigateToTranslate}
                  onNavigateToHome={handleNavigateToHome}
                  onNavigateToPricing={handleNavigateToPricing}
                />
                <TranslatePage 
                  onNavigateToHome={handleNavigateToHome}
                  onNavigateToChat={handleNavigateToChat}
                />
              </div>
            </div>
          </ProtectedRoute>
        );
      case 'pricing':
        return (
          <PricingPage 
            onNavigateToHome={handleNavigateToHome}
            onNavigateToChat={handleNavigateToChat}
            onNavigateToGallery={handleNavigateToGallery}
            onNavigateToTranslate={handleNavigateToTranslate}
            onNavigateToPricing={handleNavigateToPricing}
          />
        );
      default:
        return (
          <HomePage 
            onNavigateToChat={handleNavigateToChat}
            onNavigateToTranslate={handleNavigateToTranslate}
          />
        );
    }
  };

  return renderCurrentPage();
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;