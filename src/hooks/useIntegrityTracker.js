/**
 * useIntegrityTracker Hook
 * 
 * Tracks behavioral telemetry per question during assignment submission to detect
 * potential AI-generated content:
 * - Paste events and paste count per question
 * - Tab switches (focus/blur) per question
 * - Time spent on each question
 * - Typing speed per question (calculated from key events)
 * 
 * Usage:
 * const { startQuestionTracking, stopQuestionTracking, handlePaste, handleKeyDown, getAllQuestionTelemetry } = useIntegrityTracker();
 * 
 * Then attach to question inputs:
 * - onFocus={() => startQuestionTracking(questionId)}
 * - onBlur={() => stopQuestionTracking(questionId)}
 * - onPaste={handlePaste}
 * - onKeyDown={handleKeyDown}
 * - Call getAllQuestionTelemetry() when submitting to get complete telemetry structure
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export const useIntegrityTracker = () => {
  // Track telemetry per question ID
  const [questionTelemetry, setQuestionTelemetry] = useState({});
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [globalTabSwitches, setGlobalTabSwitches] = useState(0);
  
  // Refs for tracking current question state
  const questionStartTimes = useRef({});
  const questionKeystrokes = useRef({});
  const questionLastKeystroke = useRef({});
  const globalStartTime = useRef(null);

  // Initialize global tracking
  useEffect(() => {
    globalStartTime.current = Date.now();
  }, []);

  // Start tracking when user focuses on a question
  const startQuestionTracking = useCallback((questionId) => {
    if (!questionId) return;
    
    setCurrentQuestionId(questionId);
    
    // Initialize tracking for this question if not already done
    if (!questionStartTimes.current[questionId]) {
      questionStartTimes.current[questionId] = Date.now();
      questionKeystrokes.current[questionId] = 0;
      questionLastKeystroke.current[questionId] = Date.now();
      
      // Initialize telemetry entry for this question
      setQuestionTelemetry(prev => ({
        ...prev,
        [questionId]: {
          pasted: false,
          pasteCount: 0,
          tabSwitches: 0,
          timeOnQuestion: 0,
          typingSpeed: 0,
        }
      }));
    }
  }, []);

  // Stop tracking when user leaves a question
  const stopQuestionTracking = useCallback((questionId) => {
    if (!questionId || !questionStartTimes.current[questionId]) return;
    
    const endTime = Date.now();
    const timeElapsed = endTime - questionStartTimes.current[questionId];
    const keystrokeCount = questionKeystrokes.current[questionId] || 0;
    
    // Calculate typing speed for this question
    const totalWords = Math.floor(keystrokeCount / 5);
    const timeInMinutes = timeElapsed / 60000;
    const typingSpeed = timeInMinutes > 0 ? Math.round(totalWords / timeInMinutes) : 0;
    
    // Update telemetry with final values
    setQuestionTelemetry(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        timeOnQuestion: timeElapsed,
        time_taken_seconds: Math.round(timeElapsed / 1000),
        typingSpeed: typingSpeed,
      }
    }));
    
    setCurrentQuestionId(null);
  }, []);

  // Handle paste events
  const handlePaste = useCallback((e, questionId = null) => {
    const pastedData = e.clipboardData?.getData('text') || '';
    const targetQuestionId = questionId || currentQuestionId;
    
    // Only flag significant paste events (more than 50 characters)
    if (targetQuestionId && pastedData.length > 50) {
      setQuestionTelemetry(prev => ({
        ...prev,
        [targetQuestionId]: {
          ...(prev[targetQuestionId] || {}),
          pasted: true,
          pasteCount: (prev[targetQuestionId]?.pasteCount || 0) + 1,
        }
      }));
    }
  }, [currentQuestionId]);

  // Handle keystrokes for typing speed calculation
  const handleKeyDown = useCallback((e, questionId = null) => {
    const targetQuestionId = questionId || currentQuestionId;
    
    if (targetQuestionId) {
      questionKeystrokes.current[targetQuestionId] = 
        (questionKeystrokes.current[targetQuestionId] || 0) + 1;
      questionLastKeystroke.current[targetQuestionId] = Date.now();
    }
  }, [currentQuestionId]);

  // Handle visibility/tab switching
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && currentQuestionId) {
      // Track tab switch for current question
      setGlobalTabSwitches(prev => prev + 1);
      setQuestionTelemetry(prev => ({
        ...prev,
        [currentQuestionId]: {
          ...(prev[currentQuestionId] || {}),
          tabSwitches: (prev[currentQuestionId]?.tabSwitches || 0) + 1,
        }
      }));
    }
  }, [currentQuestionId]);

  // Get all telemetry data in the format expected by backend
  const getAllQuestionTelemetry = useCallback(() => {
    // Finalize any currently tracked question
    if (currentQuestionId && questionStartTimes.current[currentQuestionId]) {
      const endTime = Date.now();
      const timeElapsed = endTime - questionStartTimes.current[currentQuestionId];
      const keystrokeCount = questionKeystrokes.current[currentQuestionId] || 0;
      const totalWords = Math.floor(keystrokeCount / 5);
      const timeInMinutes = timeElapsed / 60000;
      const typingSpeed = timeInMinutes > 0 ? Math.round(totalWords / timeInMinutes) : 0;
      
      setQuestionTelemetry(prev => ({
        ...prev,
        [currentQuestionId]: {
          ...prev[currentQuestionId],
          timeOnQuestion: timeElapsed,
          time_taken_seconds: Math.round(timeElapsed / 1000),
          typingSpeed: typingSpeed,
        }
      }));
    }

    // Calculate submission-level metrics
    const totalTime = globalStartTime.current ? Date.now() - globalStartTime.current : 0;
    
    return {
      per_question: questionTelemetry,
      submission_level: {
        total_time_ms: totalTime,
        total_time_seconds: Math.round(totalTime / 1000),
        total_tab_switches: globalTabSwitches,
        questions_attempted: Object.keys(questionTelemetry).length,
      }
    };
  }, [questionTelemetry, currentQuestionId, globalTabSwitches]);

  // Reset tracking
  const resetTracking = useCallback(() => {
    setQuestionTelemetry({});
    setCurrentQuestionId(null);
    setGlobalTabSwitches(0);
    questionStartTimes.current = {};
    questionKeystrokes.current = {};
    questionLastKeystroke.current = {};
    globalStartTime.current = Date.now();
  }, []);

  // Legacy method for backward compatibility
  const startTracking = useCallback(() => {
    globalStartTime.current = Date.now();
  }, []);

  // Legacy method for backward compatibility
  const getTrackingData = useCallback(() => {
    console.warn('getTrackingData() is deprecated. Use getAllQuestionTelemetry() instead.');
    return getAllQuestionTelemetry();
  }, [getAllQuestionTelemetry]);

  // Set up visibility change listener
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    // Per-question tracking methods
    startQuestionTracking,
    stopQuestionTracking,
    handlePaste,
    handleKeyDown,
    getAllQuestionTelemetry,
    resetTracking,
    currentQuestionId,
    
    // Legacy methods for backward compatibility
    startTracking,
    getTrackingData,
    integrityFlags: {}, // Empty for compatibility
    handleVisibilityChange,
  };
};

export default useIntegrityTracker;
