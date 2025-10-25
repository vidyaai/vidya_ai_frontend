// PlayerComponent.jsx - Simple fix for uploaded video container issue
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, VolumeX, Volume2, Rewind, FastForward } from 'lucide-react';
import { formatTime } from '../generic/utils.jsx';

const PlayerComponent = ({ 
  currentVideo, 
  onPlayerReady, 
  onTimeUpdate,
  seekToTime 
}) => {
  const [player, setPlayer] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isHtml5, setIsHtml5] = useState(false);
  const [loadingState, setLoadingState] = useState('');
  const [showUploadNotification, setShowUploadNotification] = useState(false);
  const [uploadedVideoTitle, setUploadedVideoTitle] = useState('');
  const [isInNotificationMode, setIsInNotificationMode] = useState(false);
  
  const playerContainerRef = useRef(null);
  const html5Ref = useRef(null);
  const lastVideoIdRef = useRef(null);
  const lastVideoUrlRef = useRef(null);
  const notifiedVideoIdRef = useRef(null); // Track which video we've already notified about
  
  useEffect(() => {
    if (!window.YT) {
      console.log("Loading YouTube iframe API...");
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        console.log("YouTube iframe API loaded successfully");
        window.YT.loaded = true;
      };
    } else if (window.YT.Player && !window.YT.loaded) {
      window.YT.loaded = true;
    }
  }, []);

  const recreatePlayerDiv = () => {
    if (playerContainerRef.current) {
      playerContainerRef.current.innerHTML = '';
      
      const playerDiv = document.createElement('div');
      playerDiv.id = 'youtube-player';
      playerDiv.className = 'absolute top-0 left-0 w-full h-full';
      playerContainerRef.current.appendChild(playerDiv);
    }
  };
  
  const initializeYouTubePlayer = (videoId) => {
    if (!videoId || isInitializing) return;
    
    console.log("Initializing YouTube player with video ID:", videoId);
    setIsInitializing(true);
    
    // Clean up existing player
    if (player && typeof player.destroy === 'function') {
      try {
        player.destroy();
      } catch (e) {
        console.warn('Error destroying player:', e);
      }
    }
    setPlayer(null);
    setPlayerReady(false);
    
    recreatePlayerDiv();
    
    const initPlayer = () => {
      try {
        console.log("Creating new YouTube player...");
        const newPlayer = new window.YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: onPlayerReadyInternal,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
          }
        });
        
        setPlayer(newPlayer);
        console.log("YouTube player created successfully");
      } catch (error) {
        console.error('Error creating YouTube player:', error);
        setIsInitializing(false);
      }
    };
    
    if (window.YT && window.YT.Player && window.YT.loaded) {
      setTimeout(initPlayer, 100);
    } else if (window.YT && window.YT.Player) {
      setTimeout(initPlayer, 300);
    } else {
      console.log("YouTube API not ready, setting up callback");
      window.onYouTubeIframeAPIReady = () => {
        console.log("YouTube API ready callback triggered");
        setTimeout(initPlayer, 200);
      };
    }
  };
  
  const onPlayerReadyInternal = (event) => {
    console.log("YouTube player is ready");
    try {
      const playerInstance = event.target;
      setDuration(playerInstance.getDuration());
      setPlayerReady(true);
      setPlayer(playerInstance);
      setIsInitializing(false);
      
      if (onPlayerReady) {
        onPlayerReady(playerInstance);
      }
      
      console.log("Player setup completed");
    } catch (error) {
      console.error("Error in onPlayerReady:", error);
      setIsInitializing(false);
    }
  };
  
  const onPlayerStateChange = (event) => {
    updatePlayerState();
  };
  
  const onPlayerError = (event) => {
    console.error("YouTube player error:", event.data);
    setIsInitializing(false);
  };
  
  const updatePlayerState = () => {
    if (isHtml5) {
      const el = html5Ref.current;
      if (!el) return;
      setIsPlaying(!el.paused);
      setIsMuted(el.muted);
      const cur = el.currentTime || 0;
      setCurrentTime(cur);
      setSliderPosition(cur);
      if (onTimeUpdate) onTimeUpdate(cur);
      setDuration(el.duration || 0);
      return;
    }
    
    if (!player || typeof player.getPlayerState !== 'function') return;
    
    try {
      const state = player.getPlayerState();
      setIsPlaying(state === 1);
      
      if (typeof player.isMuted === 'function') {
        setIsMuted(player.isMuted());
      }
      
      if (!isDraggingSlider && typeof player.getCurrentTime === 'function') {
        const current = player.getCurrentTime() || 0;
        setCurrentTime(current);
        setSliderPosition(current);
        
        if (onTimeUpdate) {
          onTimeUpdate(current);
        }
      }
      
      if (typeof player.getDuration === 'function') {
        setDuration(player.getDuration() || 0);
      }
    } catch (e) {
      console.error("Error updating player state", e);
    }
  };
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      updatePlayerState();
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [player, isDraggingSlider, isHtml5]);
  
  const resetPlayerState = () => {
    setCurrentTime(0);
    setSliderPosition(0);
    setDuration(0);
    setIsPlaying(false);
    setPlayerReady(false);
    setLoadingState('');
  };

  useEffect(() => {
    const html5Source = currentVideo?.sourceType === 'uploaded' && currentVideo?.videoUrl;
    setIsHtml5(!!html5Source);
  }, [currentVideo?.sourceType, currentVideo?.videoUrl]);

  // Check if an uploaded video just became ready (URL became available)
  useEffect(() => {
    const isUploadedVideo = currentVideo?.sourceType === 'uploaded';
    const currentVideoId = currentVideo?.videoId;
    const currentVideoUrl = currentVideo?.videoUrl;
    
    // Check if this is a new uploaded video that just got its URL
    const wasWaitingForThisVideo = currentVideoId && 
                                   currentVideoId !== lastVideoIdRef.current && 
                                   currentVideoId !== notifiedVideoIdRef.current && // Haven't notified about this video yet
                                   isUploadedVideo && 
                                   currentVideoUrl;
    
    if (wasWaitingForThisVideo) {
      console.log("UPLOADED VIDEO JUST BECAME READY - SHOWING NOTIFICATION");
      console.log("Video ID:", currentVideoId);
      console.log("Video URL:", currentVideoUrl);
      console.log("Video title:", currentVideo?.title);
      
      // Clear the processing message
      setLoadingState('');
      
      // Set notification mode to prevent video switching
      setIsInNotificationMode(true);
      
      // Show notification popup with the NEW video's title
      setUploadedVideoTitle(currentVideo?.title || 'Your uploaded video');
      setShowUploadNotification(true);
      
      // Mark this video as notified to prevent repeated notifications
      notifiedVideoIdRef.current = currentVideoId;
      
      // DO NOT update lastVideoIdRef and lastVideoUrlRef here
      // Let the main useEffect handle the actual switching logic
      
      // Auto-hide notification after 10 seconds
      setTimeout(() => {
        setShowUploadNotification(false);
        setIsInNotificationMode(false); // Clear notification mode
      }, 10000);
    }
  }, [currentVideo?.videoUrl, currentVideo?.videoId, currentVideo?.sourceType, currentVideo?.title]);

  // Enhanced video change detection that properly handles uploads
  useEffect(() => {
    const isUploadedVideo = currentVideo?.sourceType === 'uploaded';
    const currentVideoId = currentVideo?.videoId;
    const currentVideoUrl = currentVideo?.videoUrl;
    const loadTimestamp = currentVideo?.loadTimestamp;

    console.log("=== VIDEO CHANGE DETECTION ===");
    console.log("Is uploaded video:", isUploadedVideo);
    console.log("Video ID:", currentVideoId);
    console.log("Video URL:", currentVideoUrl);
    console.log("Load timestamp:", loadTimestamp);
    console.log("Last video ID:", lastVideoIdRef.current);
    console.log("Last video URL:", lastVideoUrlRef.current);

    // Create a comprehensive key that includes all identifying properties
    const currentVideoKey = `${currentVideoId}-${currentVideoUrl}-${loadTimestamp}`;
    const lastVideoKey = `${lastVideoIdRef.current}-${lastVideoUrlRef.current}-${loadTimestamp}`;

    // Detect if this is a different video than what's currently loaded
    const videoChanged = currentVideoKey !== lastVideoKey || 
                         currentVideoId !== lastVideoIdRef.current || 
                         currentVideoUrl !== lastVideoUrlRef.current;

    // Check if this is a new uploaded video that just got its URL (for notification)
    const wasWaitingForThisVideo = currentVideoId && 
                                   currentVideoId !== lastVideoIdRef.current && 
                                   currentVideoId !== notifiedVideoIdRef.current && // Haven't notified about this video yet
                                   isUploadedVideo && 
                                   currentVideoUrl;

    console.log("Current video key:", currentVideoKey);
    console.log("Last video key:", lastVideoKey);
    console.log("Video changed:", videoChanged);
    console.log("Was waiting for this video:", wasWaitingForThisVideo);

    // For uploaded videos, only switch if we have a valid video URL (video is processed)
    // For YouTube videos, switch immediately as we don't need to wait for processing
    // Exclude videos that already showed notification (to prevent interference with current playback)
    // BUT allow them to load if user explicitly selects from gallery
    const isNotificationAlreadyShown = notifiedVideoIdRef.current === currentVideoId;
    const isGallerySelection = videoChanged && isUploadedVideo && currentVideoUrl && 
                               currentVideoId !== lastVideoIdRef.current; // This is a new selection
    
    // Check if this is a notification-only case (new upload that shouldn't auto-switch)
    const isNotificationOnly = wasWaitingForThisVideo && !isGallerySelection;
    
    const shouldSwitchVideo = videoChanged && !isNotificationOnly && !isInNotificationMode && (
      !isNotificationAlreadyShown || isGallerySelection
    ) && (
      (isUploadedVideo && currentVideoUrl) || // Only switch to uploaded video if URL is ready
      (!isUploadedVideo && currentVideoId)    // Switch to YouTube immediately if we have ID
    );

    console.log("Video changed:", videoChanged);
    console.log("Is notification already shown:", isNotificationAlreadyShown);
    console.log("Is gallery selection:", isGallerySelection);
    console.log("Is notification only:", isNotificationOnly);
    console.log("Is in notification mode:", isInNotificationMode);
    console.log("Should switch video:", shouldSwitchVideo);

    if (shouldSwitchVideo) {
      console.log("NEW VIDEO DETECTED - SWITCHING");
      resetPlayerState();
      
      // Update refs IMMEDIATELY to prevent re-detection
      lastVideoIdRef.current = currentVideoId;
      lastVideoUrlRef.current = currentVideoUrl;
      
      // Clean up YouTube player if exists
      if (player && typeof player.destroy === 'function') {
        try {
          console.log("Destroying YouTube player for new video");
          player.destroy();
        } catch (e) {
          console.warn('Error destroying YouTube player:', e);
        }
        setPlayer(null);
        setPlayerReady(false);
      }
    } else if (videoChanged && isUploadedVideo && !currentVideoUrl) {
      // Video changed but uploaded video is not ready yet - show processing message
      console.log("NEW UPLOADED VIDEO DETECTED BUT NOT READY - WAITING");
      // Don't update refs yet, keep current video playing
      // Show a subtle message that new video is being processed
      if (!loadingState) {
        setLoadingState('New video processing - current video will switch automatically when ready');
      }
      return; // Exit early, don't change player type
    }

    // Only update player type if we're actually switching or if it's the same video
    if (shouldSwitchVideo || !videoChanged) {
      setIsHtml5(isUploadedVideo);
    }

    if (isUploadedVideo && currentVideoUrl && shouldSwitchVideo) {
      console.log("LOADING NEW UPLOADED VIDEO - FORCED SWITCH");
      console.log("New S3 URL:", currentVideoUrl);
      
      setLoadingState('Switching to new uploaded video...');
      
      // Wait for next tick to ensure video element is available
      setTimeout(() => {
        const el = html5Ref.current;
        if (!el) {
          console.error("Video element still not available after timeout");
          setLoadingState('Error: Video element not ready');
          return;
        }

        // Reset the video element without replacing it
        try {
          console.log("Resetting video element for new video");
          
          // Remove all existing event listeners by cloning event listeners
          const oldEl = el;
          
          // Pause and reset current video
          if (!el.paused) {
            el.pause();
          }
          el.currentTime = 0;
          el.src = '';
          el.load(); // Reset the video element
          
          setLoadingState('Video element reset, preparing new video...');
        } catch (error) {
          console.error("Error resetting video element:", error);
          setLoadingState(`Reset error: ${error.message}`);
          return;
        }

        // Use the same element reference (no replacement)
        const videoEl = html5Ref.current;

        // Set up event handlers for this specific video load
        const handleLoadStart = () => {
          console.log("NEW UPLOADED VIDEO: Load started");
          setLoadingState('Starting to load from S3...');
        };

        const handleLoadedMetadata = () => {
          console.log("NEW UPLOADED VIDEO: Metadata loaded, duration:", videoEl.duration);
          setDuration(videoEl.duration || 0);
          setLoadingState('Video metadata loaded');
        };

        const handleCanPlay = () => {
          console.log("NEW UPLOADED VIDEO: Ready to play!");
          setPlayerReady(true);
          setLoadingState(''); // Clear loading state when ready to play
          if (onPlayerReady) onPlayerReady(null);
        };

        const handleCanPlayThrough = () => {
          console.log("NEW UPLOADED VIDEO: Can play through (enough buffered)");
          setLoadingState('Fully loaded');
        };

        const handleError = (e) => {
          console.error('NEW UPLOADED VIDEO ERROR:', e.target.error);
          console.error('Error details:', {
            code: e.target.error?.code,
            message: e.target.error?.message,
            src: videoEl.src,
            readyState: videoEl.readyState,
            networkState: videoEl.networkState
          });
          
          let errorMsg = 'Unknown error';
          if (e.target.error) {
            switch(e.target.error.code) {
              case 1:
                errorMsg = 'Video loading aborted';
                break;
              case 2:
                errorMsg = 'Network error loading video';
                break;
              case 3:
                errorMsg = 'Video decode error';
                break;
              case 4:
                errorMsg = 'Video format not supported';
                break;
              default:
                errorMsg = `Video error code: ${e.target.error.code}`;
            }
          }
          
          setLoadingState(`Error: ${errorMsg}`);
          setPlayerReady(false);
        };

        const handleProgress = () => {
          // Only show buffering progress if the video is not playing or is stalled
          if (videoEl.buffered.length > 0 && videoEl.duration && (!isPlaying || videoEl.readyState < 3)) {
            const buffered = (videoEl.buffered.end(0) / videoEl.duration) * 100;
            setLoadingState(`Buffering: ${Math.round(buffered)}%`);
          } else if (isPlaying && videoEl.readyState >= 3) {
            // Video is playing and has enough data, clear loading state
            setLoadingState('');
          }
        };

        const handlePlay = () => {
          console.log("Video started playing");
          setIsPlaying(true);
          setLoadingState(''); // Clear any loading messages when playing
        };

        const handlePause = () => {
          console.log("Video paused");
          setIsPlaying(false);
          setLoadingState(''); // Clear loading state, pause overlay will show instead
        };

        // Add event listeners to the video element
        videoEl.addEventListener('loadstart', handleLoadStart);
        videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoEl.addEventListener('canplay', handleCanPlay);
        videoEl.addEventListener('canplaythrough', handleCanPlayThrough);
        videoEl.addEventListener('error', handleError);
        videoEl.addEventListener('progress', handleProgress);
        videoEl.addEventListener('play', handlePlay);
        videoEl.addEventListener('pause', handlePause);

        // Load the NEW uploaded video - this is the critical part
        console.log("Setting NEW video source to S3 URL:", currentVideoUrl);
        try {
          videoEl.src = currentVideoUrl;
          videoEl.load();
          setLoadingState('Requesting NEW video from S3...');
          console.log("NEW video load initiated successfully");
        } catch (error) {
          console.error("Error setting NEW video source:", error);
          setLoadingState(`Source error: ${error.message}`);
        }
      }, 100);
    } else if (currentVideoId && currentVideo?.sourceType === 'youtube' && shouldSwitchVideo && !isInitializing) {
      console.log("Loading YouTube video:", currentVideoId);
      initializeYouTubePlayer(currentVideoId);
    }
  }, [currentVideo?.videoId, currentVideo?.videoUrl, currentVideo?.sourceType, currentVideo?.loadTimestamp]);

  // Expose seekToTime function to parent
  useEffect(() => {
    if (isHtml5) {
      const el = html5Ref.current;
      if (!el) return;
      window.playerSeekTo = (timeInSeconds) => {
        try {
          el.currentTime = timeInSeconds;
          setCurrentTime(timeInSeconds);
          setSliderPosition(timeInSeconds);
        } catch (error) {
          console.error('Error seeking HTML5:', error);
        }
      };
      return;
    }
    if (seekToTime && player && typeof player.seekTo === 'function') {
      window.playerSeekTo = (timeInSeconds) => {
        try {
          player.seekTo(timeInSeconds, true);
          setCurrentTime(timeInSeconds);
          setSliderPosition(timeInSeconds);
        } catch (error) {
          console.error('Error seeking to time:', error);
        }
      };
    }
  }, [player, seekToTime, isHtml5]);
  
  const handleSliderChange = (e) => {
    setSliderPosition(parseFloat(e.target.value));
    if (!isDraggingSlider) {
      setIsDraggingSlider(true);
    }
  };
  
  const handleSliderRelease = () => {
    if (isHtml5) {
      const el = html5Ref.current;
      if (!el) return;
      try {
        el.currentTime = sliderPosition;
        setCurrentTime(sliderPosition);
      } catch (error) {
        console.error("Error seeking HTML5 video:", error);
      } finally {
        setIsDraggingSlider(false);
      }
    } else if (player && isDraggingSlider && typeof player.seekTo === 'function') {
      try {
        player.seekTo(sliderPosition);
        setCurrentTime(sliderPosition);
      } catch (error) {
        console.error("Error seeking to position:", error);
      } finally {
        setIsDraggingSlider(false);
      }
    }
  };
  
  const togglePlay = () => {
    if (isHtml5) {
      const el = html5Ref.current;
      if (!el) {
        console.error("No HTML5 element for uploaded video");
        setLoadingState('Error: No video element');
        return;
      }
      
      console.log("Play button clicked for uploaded video");
      console.log("Video element state:", {
        paused: el.paused,
        readyState: el.readyState,
        src: el.src,
        currentSrc: el.currentSrc,
        duration: el.duration,
        error: el.error,
        networkState: el.networkState
      });
      
      if (!playerReady) {
        console.log("Video not ready yet");
        setLoadingState('Video not ready - please wait');
        return;
      }
      
      try { 
        if (el.paused) {
          console.log("Attempting to play uploaded video from S3");
          const playPromise = el.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("SUCCESS: Uploaded video started playing");
                setIsPlaying(true);
                setLoadingState(''); // Clear loading state when playing
              })
              .catch(error => {
                console.error("FAILED: Could not play uploaded video:", error);
                setLoadingState(`Play failed: ${error.message}`);
              });
          } else {
            // Older browsers that don't return a promise
            setIsPlaying(true);
            setLoadingState(''); // Clear loading state when playing
          }
        } else {
          console.log("Pausing uploaded video");
          el.pause();
          setIsPlaying(false);
          setLoadingState(''); // Clear loading state when paused - we'll show "Paused" overlay instead
        }
      } catch (e) {
        console.error("Error toggling uploaded video play:", e);
        setLoadingState(`Play error: ${e.message}`);
      }
      return;
    }
    
    // YouTube player logic
    if (!player) return;
    try {
      if (isPlaying && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      } else if (!isPlaying && typeof player.playVideo === 'function') {
        player.playVideo();
      }
    } catch (error) {
      console.error("Error toggling play:", error);
    }
  };
  
  const toggleMute = () => {
    if (isHtml5) {
      const el = html5Ref.current; 
      if (!el) return;
      el.muted = !el.muted;
      setIsMuted(el.muted);
      return;
    }
    if (!player) return;
    try {
      if (isMuted && typeof player.unMute === 'function') {
        player.unMute();
      } else if (!isMuted && typeof player.mute === 'function') {
        player.mute();
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };
  
  const skipBackward = () => {
    if (isHtml5) {
      const el = html5Ref.current; 
      if (!el) return;
      const newTime = Math.max(0, (el.currentTime || 0) - 10);
      el.currentTime = newTime;
      setCurrentTime(newTime);
      setSliderPosition(newTime);
      return;
    }
    if (!player || typeof player.seekTo !== 'function') return;
    try {
      const newTime = Math.max(0, currentTime - 10);
      player.seekTo(newTime);
      setCurrentTime(newTime);
      setSliderPosition(newTime);
    } catch (error) {
      console.error("Error skipping backward:", error);
    }
  };
  
  const skipForward = () => {
    if (isHtml5) {
      const el = html5Ref.current; 
      if (!el) return;
      const newTime = Math.min(el.duration || 0, (el.currentTime || 0) + 10);
      el.currentTime = newTime;
      setCurrentTime(newTime);
      setSliderPosition(newTime);
      return;
    }
    if (!player || typeof player.seekTo !== 'function') return;
    try {
      const newTime = Math.min(duration, currentTime + 10);
      player.seekTo(newTime);
      setCurrentTime(newTime);
      setSliderPosition(newTime);
    } catch (error) {
      console.error("Error skipping forward:", error);
    }
  };

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl aspect-video">
        {isHtml5 ? (
          <video 
            key={`uploaded-${currentVideo?.videoId || 'no-video'}`}
            ref={html5Ref} 
            className="absolute top-0 left-0 w-full h-full" 
            controls={false} 
            crossOrigin="anonymous"
            preload="metadata"
            playsInline
          />
        ) : currentVideo?.videoId ? (
          <div ref={playerContainerRef} className="absolute top-0 left-0 w-full h-full"></div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <p className="text-gray-500">Enter a YouTube URL to load a video</p>
            </div>
          </div>
        )}
        
        {/* Loading/Error state overlay for uploaded videos - only show when loading, not during playback */}
        {isHtml5 && loadingState && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <div className="text-center text-white p-4 max-w-lg">
              <p className="text-sm mb-2">{loadingState}</p>
              {!playerReady && (
                <div className="text-xs text-gray-400 break-all">
                  <strong>S3 URL:</strong><br />
                  {currentVideo?.videoUrl}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Pause overlay - show "Paused" when video is paused */}
        {isHtml5 && !isPlaying && playerReady && !loadingState && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-white p-4">
              <p className="text-lg font-semibold">Paused</p>
            </div>
          </div>
        )}
        
        {/* Upload notification popup */}
        {showUploadNotification && (
          <div className="absolute top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-xl border border-green-500 max-w-sm z-20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <p className="font-semibold text-sm">Video Ready!</p>
                </div>
                <p className="text-sm mb-2">{uploadedVideoTitle} has been processed and is ready to play.</p>
                <p className="text-xs text-green-200">You can find it in the gallery.</p>
              </div>
              <button 
                onClick={() => setShowUploadNotification(false)}
                className="ml-2 text-green-200 hover:text-white transition-colors flex-shrink-0"
                aria-label="Close notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex items-center space-x-4">
        <button 
          onClick={togglePlay} 
          className="p-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-lg disabled:opacity-50"
          disabled={!currentVideo?.videoId}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} />}
        </button>
        
        <button 
          onClick={toggleMute} 
          className="p-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-lg disabled:opacity-50"
          disabled={!currentVideo?.videoId}
        >
          {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
        
        <div className="flex-grow">
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            value={sliderPosition || 0}
            onChange={handleSliderChange}
            onMouseUp={handleSliderRelease}
            onTouchEnd={handleSliderRelease}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" 
            disabled={!currentVideo?.videoId}
            style={{
              background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${(sliderPosition / (duration || 1)) * 100}%, rgb(55, 65, 81) ${(sliderPosition / (duration || 1)) * 100}%, rgb(55, 65, 81) 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime || 0)}</span>
            <span>{formatTime(duration || 0)}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-2 flex justify-center space-x-4">
        <button 
          onClick={skipBackward}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors disabled:opacity-50"
          disabled={!currentVideo?.videoId}
        >
          <Rewind size={16} />
          <span className="sr-only">Skip backward</span>
        </button>
        
        <button 
          onClick={skipForward}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors disabled:opacity-50"
          disabled={!currentVideo?.videoId}
        >
          <FastForward size={16} />
          <span className="sr-only">Skip forward</span>
        </button>
      </div>
    </div>
  );
};

export default PlayerComponent;