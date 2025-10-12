// src/App.jsx
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/Login/AuthForm';
import VidyaLandingPage from './components/Landing/VidyaLandingPage';
import HomePage from './components/HomePage/HomePage';
import ImprovedYoutubePlayer from './components/Chat/ImprovedYouTubePlayer';
import Gallery from './components/Gallery/Gallery';
import PricingPage from './components/Pricing/PricingPage';
import ProtectedRoute from './components/generic/ProtectedRoute';
import TopBar from './components/generic/TopBar';
import PageHeader from './components/generic/PageHeader';
import SharedResourceViewer from './components/Sharing/SharedResourceViewer';
import SharedChatPage from './components/Sharing/SharedChatPage';
import AssignmentManager from './components/Assignments/AssignmentManager';
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
  if (path === '/assignments') return 'assignments';
  if (path === '/pricing') return 'pricing';
  if (path === '/home') return 'home';
  
  // Default to landing page for root path when not logged in
  return 'landing';
};

// Main App Content Component
const AppContent = () => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // MOVE ALL HOOKS BEFORE ANY CONDITIONAL LOGIC

  // Handle navigation with browser history
  const handleNavigateToLanding = () => {
    setCurrentPage('landing');
    setSelectedVideo(null);
    window.history.pushState({ page: 'landing' }, '', '/');
  };

  const handleNavigateToHome = () => {
    setCurrentPage('home');
    setSelectedVideo(null);
    window.history.pushState({ page: 'home' }, '', '/home');
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

  const handleNavigateToAssignments = () => {
    setCurrentPage('assignments');
    setSelectedVideo(null);
    window.history.pushState({ page: 'assignments' }, '', '/assignments');
  };

  const handleNavigateToPricing = () => {
    setCurrentPage('pricing');
    setSelectedVideo(null);
    window.history.pushState({ page: 'pricing' }, '', '/pricing');
  };

  const handleNavigateToLogin = () => {
    setCurrentPage('login');
    setSelectedVideo(null);
    window.history.pushState({ page: 'login' }, '', '/login');
  };

  const handleNavigateToLoginWithTarget = (targetPage) => {
    // Store the target page for after login
    sessionStorage.setItem('postLoginTarget', targetPage);
    setCurrentPage('login');
    setSelectedVideo(null);
    window.history.pushState({ page: 'login' }, '', '/login');
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

  // Handle post-login navigation
  useEffect(() => {
    if (currentUser) {
      const postLoginTarget = sessionStorage.getItem('postLoginTarget');
      if (postLoginTarget) {
        sessionStorage.removeItem('postLoginTarget');
        if (postLoginTarget === 'chat') {
          handleNavigateToChat();
        } else if (postLoginTarget === 'assignments') {
          handleNavigateToAssignments();
        } else {
          handleNavigateToHome();
        }
      } else if (currentPage === 'login' || currentPage === 'landing') {
        // If user is logged in and on login/landing page, redirect to home
        handleNavigateToHome();
      }
    }
  }, [currentUser]);

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
      } else if (newUrl === '/assignments') {
        setCurrentPage('assignments');
      } else if (newUrl === '/pricing') {
        setCurrentPage('pricing');
      } else if (newUrl === '/home') {
        setCurrentPage('home');
      } else {
        setCurrentPage('home');
      }
    }
  }, [currentUser, returnUrl, shouldShowLogin]);
  
  // Show landing page when not authenticated unless on shared page
  if (!currentUser && currentPage !== 'shared' && currentPage !== 'login') {
    if (shouldShowLogin) {
      return <AuthForm returnUrl={returnUrl} />;
    }
    // Show landing page by default when not logged in
    if (currentPage !== 'landing') {
      setCurrentPage('landing');
    }
  }

  // Show login form when user is not authenticated and on login page
  if (!currentUser && currentPage === 'login') {
    return <AuthForm onNavigateToLanding={handleNavigateToLanding} />;
  }

  // Render current page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <VidyaLandingPage 
            onLogin={handleNavigateToLogin}
            onNavigateToLoginWithTarget={handleNavigateToLoginWithTarget}
          />
        );
      case 'login':
        return <AuthForm onNavigateToLanding={handleNavigateToLanding} />;
      case 'home':
        return (
          <HomePage 
            onNavigateToChat={handleNavigateToChat}
            onNavigateToTranslate={handleNavigateToTranslate}
            onNavigateToGallery={handleNavigateToGallery}
            onNavigateToAssignments={handleNavigateToAssignments}
            onNavigateToPricing={handleNavigateToPricing}
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
              <TopBar onNavigateToHome={handleNavigateToHome} />
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
              <TopBar onNavigateToHome={handleNavigateToHome} />
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
      case 'assignments':
        return (
          <ProtectedRoute>
            <AssignmentManager onNavigateToHome={handleNavigateToHome} />
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
          <VidyaLandingPage 
            onLogin={handleNavigateToLogin}
            onNavigateToLoginWithTarget={handleNavigateToLoginWithTarget}
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