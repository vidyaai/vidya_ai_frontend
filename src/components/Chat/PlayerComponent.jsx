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
  
  const playerContainerRef = useRef(null);
  const html5Ref = useRef(null);
  const lastVideoIdRef = useRef(null);
  const lastVideoUrlRef = useRef(null);
  
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

    console.log("Current video key:", currentVideoKey);
    console.log("Last video key:", lastVideoKey);
    console.log("Video changed:", videoChanged);

    if (videoChanged) {
      console.log("NEW VIDEO DETECTED - FORCING SWITCH");
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
    }

    setIsHtml5(isUploadedVideo);

    if (isUploadedVideo && currentVideoUrl && videoChanged) {
      console.log("LOADING NEW UPLOADED VIDEO - FORCED SWITCH");
      console.log("New S3 URL:", currentVideoUrl);
      
      setLoadingState('Switching to new uploaded video...');
      
      // Use the existing video element (don't recreate it)
      const el = html5Ref.current;
      if (!el) {
        console.error("No video element found - this should not happen");
        setLoadingState('Error: Video element missing');
        return;
      }

      // FORCE a complete reset of the video element
      try {
        console.log("FORCING video element reset for new video");
        el.pause();
        el.currentTime = 0;
        
        // Remove all event listeners to prevent interference
        const newEl = el.cloneNode(true);
        if (el.parentNode) {
          el.parentNode.replaceChild(newEl, el);
          html5Ref.current = newEl;
        }
        
        setLoadingState('Video element replaced, loading new video...');
      } catch (error) {
        console.error("Error replacing video element:", error);
        setLoadingState(`Reset error: ${error.message}`);
      }

      // Use the new element reference
      const newEl = html5Ref.current;

      // Set up event handlers for this specific video load
      const handleLoadStart = () => {
        console.log("NEW UPLOADED VIDEO: Load started");
        setLoadingState('Starting to load from S3...');
      };

      const handleLoadedMetadata = () => {
        console.log("NEW UPLOADED VIDEO: Metadata loaded, duration:", newEl.duration);
        setDuration(newEl.duration || 0);
        setLoadingState('Video metadata loaded');
      };

      const handleCanPlay = () => {
        console.log("NEW UPLOADED VIDEO: Ready to play!");
        setPlayerReady(true);
        setLoadingState('Ready to play');
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
          src: newEl.src,
          readyState: newEl.readyState,
          networkState: newEl.networkState
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
        if (newEl.buffered.length > 0 && newEl.duration) {
          const buffered = (newEl.buffered.end(0) / newEl.duration) * 100;
          setLoadingState(`Buffering: ${Math.round(buffered)}%`);
        }
      };

      // Add event listeners to the new element
      newEl.addEventListener('loadstart', handleLoadStart);
      newEl.addEventListener('loadedmetadata', handleLoadedMetadata);
      newEl.addEventListener('canplay', handleCanPlay);
      newEl.addEventListener('canplaythrough', handleCanPlayThrough);
      newEl.addEventListener('error', handleError);
      newEl.addEventListener('progress', handleProgress);

      // Load the NEW uploaded video - this is the critical part
      console.log("Setting NEW video source to S3 URL:", currentVideoUrl);
      try {
        newEl.src = currentVideoUrl;
        newEl.load();
        setLoadingState('Requesting NEW video from S3...');
        console.log("NEW video load initiated successfully");
      } catch (error) {
        console.error("Error setting NEW video source:", error);
        setLoadingState(`Source error: ${error.message}`);
      }

      // Cleanup function for event listeners
      return () => {
        newEl.removeEventListener('loadstart', handleLoadStart);
        newEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
        newEl.removeEventListener('canplay', handleCanPlay);
        newEl.removeEventListener('canplaythrough', handleCanPlayThrough);
        newEl.removeEventListener('error', handleError);
        newEl.removeEventListener('progress', handleProgress);
      };
      
    } else if (currentVideoId && currentVideo?.sourceType === 'youtube' && videoChanged && !isInitializing) {
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
                setLoadingState('Playing');
              })
              .catch(error => {
                console.error("FAILED: Could not play uploaded video:", error);
                setLoadingState(`Play failed: ${error.message}`);
              });
          } else {
            // Older browsers that don't return a promise
            setIsPlaying(true);
            setLoadingState('Playing');
          }
        } else {
          console.log("Pausing uploaded video");
          el.pause();
          setIsPlaying(false);
          setLoadingState('Paused');
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
            key={`uploaded-${currentVideo?.videoId}-${currentVideo?.loadTimestamp || 0}`}
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
        
        {/* Loading/Error state overlay for uploaded videos */}
        {isHtml5 && loadingState && (
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