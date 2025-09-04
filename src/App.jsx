// src/App.jsx
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/Login/AuthForm';
import HomePage from './components/HomePage/HomePage';
import ImprovedYoutubePlayer from './components/Chat/ImprovedYouTubePlayer';
import Gallery from './components/Gallery/Gallery';
import ProtectedRoute from './components/generic/ProtectedRoute';
import TopBar from './components/generic/TopBar';
import PageHeader from './components/generic/PageHeader';
import SharedResourceViewer from './components/Sharing/SharedResourceViewer';
import SharedChatPage from './components/Sharing/SharedChatPage';
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
  const urlParams = new URLSearchParams(window.location.search);
  const returnUrl = urlParams.get('returnUrl');
  
  // Only set to shared if we're actually on a shared URL, not just have it in returnUrl
  // The returnUrl will be handled by the redirect logic after login
  if (path.startsWith('/shared/')) return 'shared';
  
  if (path === '/chat') return 'chat';
  if (path === '/gallery') return 'gallery';
  if (path === '/translate') return 'translate';
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
      const currentUrl = window.location.pathname + window.location.search;
      window.history.replaceState({ page: getInitialPage() }, '', currentUrl);
    }

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle shared videos from sessionStorage
  useEffect(() => {
    if (currentUser && currentPage === 'home') {
      const sharedVideoData = sessionStorage.getItem('sharedVideoForChat');
      if (sharedVideoData) {
        try {
          const videoData = JSON.parse(sharedVideoData);
          sessionStorage.removeItem('sharedVideoForChat'); // Clear after use
          
          // Convert shared video format to chat format
          const chatVideoData = {
            videoId: videoData.id,
            title: videoData.title || 'Shared Video',
            source_type: videoData.source_type,
            youtube_id: videoData.youtube_id,
            youtube_url: videoData.youtube_url,
            s3_key: videoData.s3_key,
            shareToken: videoData.shareToken,
            shareId: videoData.shareId, // Add the shareId field
            isShared: true
          };
          
          // Navigate to chat with the shared video
          handleNavigateToChat(chatVideoData);
        } catch (error) {
          console.error('Error parsing shared video data:', error);
          sessionStorage.removeItem('sharedVideoForChat');
        }
      }
    }
  }, [currentUser, currentPage]);

  // NOW AFTER ALL HOOKS, CHECK AUTHENTICATION
  // Check if user wants to login (from shared link redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const shouldShowLogin = urlParams.get('login') === 'true';
  const returnUrl = urlParams.get('returnUrl');
  
  
  // Handle redirect after successful login
  useEffect(() => {
    if (currentUser && returnUrl && shouldShowLogin) {
      // Clear the URL parameters and navigate to the return URL
      const newUrl = returnUrl;
      window.history.replaceState({}, '', newUrl);
      
      // Update the current page state based on the return URL
      if (newUrl.startsWith('/shared/')) {
        setCurrentPage('shared');
      } else if (newUrl === '/chat') {
        setCurrentPage('chat');
      } else if (newUrl === '/gallery') {
        setCurrentPage('gallery');
      } else if (newUrl === '/translate') {
        setCurrentPage('translate');
      } else {
        setCurrentPage('home');
      }
    }
  }, [currentUser, returnUrl, shouldShowLogin]);
  
  // Allow shared page access without authentication
  if (!currentUser && currentPage !== 'shared') {
    if (shouldShowLogin) {
      return <AuthForm returnUrl={returnUrl} />;
    }
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
          />
        );
      case 'chat':
        return (
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-950">
            <TopBar onNavigateToHome={handleNavigateToHome} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <PageHeader 
                title={selectedVideo?.isShared ? "Chat with Shared Video" : "Chat with My Video"}
                onNavigateToChat={handleNavigateToChat}
                onNavigateToGallery={handleNavigateToGallery}
                onNavigateToTranslate={handleNavigateToTranslate}
                onNavigateToHome={handleNavigateToHome}
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
              <TopBar onNavigateToHome={handleNavigateToHome} />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader 
                  title="My Gallery"
                  onNavigateToChat={handleNavigateToChat}
                  onNavigateToGallery={handleNavigateToGallery}
                  onNavigateToTranslate={handleNavigateToTranslate}
                  onNavigateToHome={handleNavigateToHome}
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
              <TopBar onNavigateToHome={handleNavigateToHome} />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader 
                  title="Translate"
                  onNavigateToChat={handleNavigateToChat}
                  onNavigateToGallery={handleNavigateToGallery}
                  onNavigateToTranslate={handleNavigateToTranslate}
                  onNavigateToHome={handleNavigateToHome}
                />
                <TranslatePage 
                  onNavigateToHome={handleNavigateToHome}
                  onNavigateToChat={handleNavigateToChat}
                />
              </div>
            </div>
          </ProtectedRoute>
        );
      case 'shared':
        return (
          <div className="min-h-screen bg-gray-950">
            <TopBar onNavigateToHome={handleNavigateToHome} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <PageHeader 
                title="Shared Resource"
                onNavigateToChat={handleNavigateToChat}
                onNavigateToGallery={handleNavigateToGallery}
                onNavigateToTranslate={handleNavigateToTranslate}
                onNavigateToHome={handleNavigateToHome}
              />
              <SharedResourceViewer />
            </div>
          </div>
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