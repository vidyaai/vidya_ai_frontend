/**
 * useIntegrityTracker Hook
 * 
 * Tracks behavioral telemetry during assignment submission to detect
 * potential AI-generated content:
 * - Paste events and paste count
 * - Tab switches (focus/blur)
 * - Time to complete
 * - Typing speed (calculated from key events)
 * 
 * Usage:
 * const { integrityFlags, handlePaste, handleVisibilityChange, startTracking, getTrackingData } = useIntegrityTracker();
 * 
 * Then attach:
 * - onPaste={handlePaste} to textarea/input
 * - useEffect(() => { ... }) for visibility tracking
 * - Call startTracking() when user starts the assignment
 * - Call getTrackingData() when submitting to get telemetry object
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export const useIntegrityTracker = () => {
  const [integrityFlags, setIntegrityFlags] = useState({
    pasted: false,
    pasteCount: 0,
    tabSwitches: 0,
    timeToComplete: 0, // milliseconds
    typingSpeed: 0, // words per minute
  });

  const startTimeRef = useRef(null);
  const keystrokeCountRef = useRef(0);
  const lastKeystrokeTimeRef = useRef(null);

  // Start tracking when user begins the assignment
  const startTracking = useCallback(() => {
    startTimeRef.current = Date.now();
    keystrokeCountRef.current = 0;
    lastKeystrokeTimeRef.current = Date.now();
  }, []);

  // Handle paste events
  const handlePaste = useCallback((e) => {
    const pastedData = e.clipboardData?.getData('text') || '';
    
    // Only flag significant paste events (more than 50 characters)
    if (pastedData.length > 50) {
      setIntegrityFlags(prev => ({
        ...prev,
        pasted: true,
        pasteCount: prev.pasteCount + 1
      }));
    }
  }, []);

  // Handle visibility/tab switching
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setIntegrityFlags(prev => ({
        ...prev,
        tabSwitches: prev.tabSwitches + 1
      }));
    }
  }, []);

  // Handle keystrokes for typing speed calculation
  const handleKeyDown = useCallback(() => {
    keystrokeCountRef.current += 1;
    lastKeystrokeTimeRef.current = Date.now();
  }, []);

  // Get final telemetry data for submission
  const getTrackingData = useCallback(() => {
    const endTime = Date.now();
    const timeElapsed = startTimeRef.current ? endTime - startTimeRef.current : 0;
    
    // Calculate typing speed (rough estimate: 5 chars per word)
    const totalWords = Math.floor(keystrokeCountRef.current / 5);
    const timeInMinutes = timeElapsed / 60000;
    const typingSpeed = timeInMinutes > 0 ? Math.round(totalWords / timeInMinutes) : 0;

    return {
      pasted: integrityFlags.pasted,
      pasteCount: integrityFlags.pasteCount,
      tabSwitches: integrityFlags.tabSwitches,
      timeToComplete: timeElapsed,
      time_taken_seconds: Math.round(timeElapsed / 1000),
      typingSpeed: typingSpeed
    };
  }, [integrityFlags]);

  // Reset tracking
  const resetTracking = useCallback(() => {
    setIntegrityFlags({
      pasted: false,
      pasteCount: 0,
      tabSwitches: 0,
      timeToComplete: 0,
      typingSpeed: 0,
    });
    startTimeRef.current = null;
    keystrokeCountRef.current = 0;
    lastKeystrokeTimeRef.current = null;
  }, []);

  // Set up visibility change listener
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    integrityFlags,
    handlePaste,
    handleKeyDown,
    handleVisibilityChange,
    startTracking,
    getTrackingData,
    resetTracking
  };
};

export default useIntegrityTracker;
