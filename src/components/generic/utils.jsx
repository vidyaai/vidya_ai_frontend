// utils.js - Shared utilities and helpers
import { auth } from '../../firebase/config';
import axios from 'axios';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Next.js environment variables
const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

console.log("NODE_ENV", NODE_ENV);
console.log("API_BASE_URL from env", API_BASE_URL);

let API_URL = API_BASE_URL || 'https://api.vidyaai.co';

// IMPORTANT: DON'T change the following.
// instead, use NEXT_PUBLIC_NODE_ENV=local
// in .env.local for local development
if (NODE_ENV === 'development') {
  API_URL = 'https://api.vidyaai.co';
} else if (NODE_ENV === 'production') {
  API_URL = 'https://api.vidyaai.co';
} else if (NODE_ENV === 'local') {
  // API_URL = 'http://localhost:8000';
  API_URL = 'http://54.153.26.252:8000';
}

console.log("Final API_URL", API_URL);
export { API_URL };

// Shared axios instance with Firebase ID token attached when available
export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  try {
    const user = auth?.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // continue without token
  }
  return config;
});

// Response interceptor to handle 429 errors with better messaging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      const detail = error.response.data?.detail;
      
      if (detail && typeof detail === 'object') {
        // Use the formatted message from the backend
        const message = detail.message || 'Daily limit reached. Please upgrade or try again later.';
        const timeUntilReset = detail.time_until_reset;
        const resetTime = detail.reset_time_utc;
        
        // Create a user-friendly error message
        let friendlyMessage = message;
        if (timeUntilReset && resetTime) {
          friendlyMessage = `${message}`;
        }
        
        // Replace the error message
        error.message = friendlyMessage;
        
        // Also add to response data for components that check it
        error.response.data.friendlyMessage = friendlyMessage;
      } else if (typeof detail === 'string') {
        error.message = detail;
      } else {
        error.message = 'Daily limit reached. Please upgrade to Plus or Pro to continue.';
      }
    }
    return Promise.reject(error);
  }
);

export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const parseMarkdownWithMath = (text, onSeekToTime = null) => {
  if (!text) return text;

  // Remove standalone heading markers without text (e.g., lines with just "#" or "##")
  text = text.replace(/^\s*#{1,6}\s*$/gm, '');

  // Remove newlines after heading markers (e.g., "## \nText" -> "## Text")
  text = text.replace(/(#{1,6})\s*\n+\s*/g, '$1 ');

  // Remove newlines immediately after numbered list markers (e.g., "1. \n" -> "1. ")
  // This joins "1. \nText" into "1. Text"
  text = text.replace(/(\d+\.)\s*\n+\s*/g, '$1 ');

  // Normalize: ensure headings and numbered list items start on new lines
  // Must happen AFTER joining markers with their content
  // Don't match inside a sequence of # characters (e.g., don't break ### into # and ##)
  text = text.replace(/([^\n#])(#{1,6}\s)/g, '$1\n$2');

  // Add newline before numbered lists, but not if preceded by a digit (to preserve 10., 20., etc.)
  // Also don't add newline if part of a heading (e.g., "### 1. Title")
  text = text.replace(/(?<!#{1,6})([^\n])(\d+)\.\s/g, (match, before, digits) => {
    if (/\d/.test(before)) {
      // Previous character is a digit, don't add newline (e.g., "10.", "20.")
      return match;
    }
    // Previous character is not a digit, add newline
    return before + '\n' + digits + '. ';
  });
  // Add newline before bold text that looks like a sub-heading (bold text followed by colon)
  // But only if it's preceded by a period and space (end of sentence)
  text = text.replace(/(\.\s+)(\*\*[^*]+\*\*:)/g, '$1\n$2');
  text = text.replace(/(\.\s+)(__[^_]+__:)/g, '$1\n$2');

  // First convert LaTeX to HTML
  let processed = convertLatexToMathHTML(text);

  console.log('📝 Original text sample:', text.substring(0, 300));
  console.log('📝 Processed text sample:', processed.substring(0, 300));
  console.log('📝 Number of newlines in processed:', (processed.match(/\n/g) || []).length);

  // Function to convert time string to seconds
  const timeToSeconds = (timeStr) => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const [minutes, seconds] = parts.map(Number);
      return minutes * 60 + seconds;
    } else if (parts.length === 3) {
      const [hours, minutes, seconds] = parts.map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };

  // Helper function to extract a readable title from URL
  const getTitleFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastSegment = pathname.split('/').filter(Boolean).pop() || urlObj.hostname;

      // If the last segment looks like a readable title, use it
      const decodedSegment = decodeURIComponent(lastSegment);
      if (decodedSegment && decodedSegment.length > 0 && decodedSegment.length < 80) {
        return decodedSegment.replace(/[-_]/g, ' ').replace(/\.(html?|php|aspx?)$/i, '');
      }

      // Otherwise, use the hostname
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url.length > 50 ? url.substring(0, 50) + '...' : url;
    }
  };

  // Split lines at sentence boundaries followed by emojis (e.g., "text! 😊" -> "text!\n😊")
  const preprocessed = processed.replace(/([.!?])\s+([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/gu, '$1\n$2');

  const lines = preprocessed.split('\n');
  const elements = [];

  lines.forEach((line, index) => {
    if (!line.trim()) {
      elements.push(<br key={`br-${index}`} />);
      return;
    }

    // Check if this line is a heading (###, ##, #)
    // Only treat as heading if it's reasonably short (< 80 chars) - headings shouldn't be paragraphs
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const [, hashes, headingText] = headingMatch;

      // If heading text is too long, strip the # markers and process as regular paragraph
      if (headingText.length >= 80) {
        line = headingText; // Remove the # prefix, continue processing as paragraph
      } else {
        // Process as heading
        const level = hashes.length;
        const HeadingTag = `h${level}`;
        const headingClasses = {
          1: 'text-2xl font-bold text-white mb-3 mt-4',
          2: 'text-xl font-bold text-white mb-2 mt-3',
          3: 'text-lg font-semibold text-white mb-2 mt-2',
          4: 'text-base font-semibold text-white mb-1 mt-2',
          5: 'text-sm font-semibold text-white mb-1 mt-1',
          6: 'text-xs font-semibold text-white mb-1 mt-1'
        };

        // Process markdown in heading text (bold, links, timestamps)
        let processedHeading = headingText
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
          .replace(/__(.*?)__/g, '<strong class="font-bold">$1</strong>')
          .replace(/\[([\s\S]*?)\]\s*\(([\s\S]*?)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
          .replace(/\$?(\d{1,2}:\d{2})\$?/g, '<span class="text-cyan-400">$1</span>'); // Timestamps (styled but not clickable in headings)

        // Use dangerouslySetInnerHTML if contains HTML (KaTeX or processed markdown)
        if (processedHeading.includes('<')) {
          elements.push(
            <HeadingTag key={`heading-${index}`} className={headingClasses[level]} dangerouslySetInnerHTML={{ __html: processedHeading }} />
          );
        } else {
          elements.push(
            <HeadingTag key={`heading-${index}`} className={headingClasses[level]}>
              {processedHeading}
            </HeadingTag>
          );
        }
        return;
      }
    }

    // Check if this line is a numbered list item (e.g., "1. Item text")
    const listMatch = line.match(/^(\d+)\.\s+(.+)$/s);
    if (listMatch) {
      const [, number, itemText] = listMatch;
      // Process inline formatting in list item text (bold, math, links)
      let processedItem = itemText
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
        .replace(/__(.*?)__/g, '<strong class="font-bold text-white">$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>');
      elements.push(
        <div key={`list-${index}`} className="mb-1 leading-relaxed flex">
          <span className="font-semibold text-white mr-2 flex-shrink-0">{number}.</span>
          <span dangerouslySetInnerHTML={{ __html: processedItem }} />
        </div>
      );
      return;
    }

    // If line contains KaTeX HTML, process markdown and render entire line with dangerouslySetInnerHTML
    if (line.includes('<span class="katex">')) {
      // Convert markdown syntax to HTML
      let processedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
        .replace(/__(.*?)__/g, '<strong class="font-bold text-white">$1</strong>')
        .replace(/\[(.*?)\]\s*\((.*?)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>');

      elements.push(
        <div key={`math-line-${index}`} className="mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />
      );
      return;
    }

    const parts = [];
    let currentIndex = 0;

    // Combine all regexes to process in order (markdown links first, then plain URLs, timestamps, bold)
    const combinedRegex = /(\[([^\]]+)\]\s*\(([^)]+)\)|https?:\/\/[^\s<>]+(?<!\))|\$?\d{1,2}:\d{2}\$?|\*\*.*?\*\*|__.*?__)/g;
    let match;

    while ((match = combinedRegex.exec(line)) !== null) {
      if (match.index > currentIndex) {
        const beforeMatch = line.slice(currentIndex, match.index);
        // Check if this text contains HTML (math expressions)
        if (beforeMatch.includes('<') && beforeMatch.includes('>')) {
          parts.push(<span key={`html-${index}-${currentIndex}`} dangerouslySetInnerHTML={{ __html: beforeMatch }} />);
        } else {
          parts.push(beforeMatch);
        }
      }

      // Check if this is a markdown link [text](url)
      if (match[0].startsWith('[') && match[0].includes('](')) {
        const linkMatch = match[0].match(/\[([^\]]+)\]\s*\(([^)]+)\)/);
        if (linkMatch) {
          const [, linkText, linkUrl] = linkMatch;
          parts.push(
            <a
              key={`link-${index}-${match.index}`}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline break-all"
            >
              {linkText}
            </a>
          );
        }
      } else if (match[0].startsWith('http://') || match[0].startsWith('https://')) {
        // This is a plain URL - convert it to a clickable link with a nice title
        const url = match[0];
        const title = getTitleFromUrl(url);
        parts.push(
          <a
            key={`url-${index}-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all inline-block"
            title={url}
          >
            {title}
          </a>
        );
      } else if (/\d{1,2}:\d{2}/.test(match[0])) {
        // Check if this is a timestamp (contains digits and colon)
        // Extract just the time part (remove $ signs)
        const timeStr = match[0].replace(/\$/g, '');
        const totalSeconds = timeToSeconds(timeStr);

        if (onSeekToTime && totalSeconds > 0) {
          parts.push(
            <button
              key={`time-${index}-${match.index}`}
              onClick={() => onSeekToTime(totalSeconds)}
              className="text-cyan-400 hover:text-cyan-300 underline bg-transparent border-none cursor-pointer p-0 m-0 font-inherit"
              title={`Jump to ${timeStr}`}
            >
              {timeStr}
            </button>
          );
        } else {
          parts.push(
            <span key={`time-${index}-${match.index}`} className="text-cyan-400">
              {timeStr}
            </span>
          );
        }
      } else if (match[0].startsWith('**') || match[0].startsWith('__')) {
        // Handle bold text
        const boldText = match[0].replace(/(\*\*|__)/g, '');
        parts.push(
          <strong key={`bold-${index}-${match.index}`} className="font-bold text-white">
            {boldText}
          </strong>
        );
      }

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < line.length) {
      const remainingText = line.slice(currentIndex);
      // Check if this text contains HTML (math expressions)
      if (remainingText.includes('<') && remainingText.includes('>')) {
        parts.push(<span key={`html-end-${index}`} dangerouslySetInnerHTML={{ __html: remainingText }} />);
      } else {
        parts.push(remainingText);
      }
    }

    if (parts.length > 0) {
      elements.push(
        <div key={`para-${index}`} className="mb-2 leading-relaxed">
          {parts}
        </div>
      );
    }
  });

  return <div className="space-y-1">{elements}</div>;
};

// Keep the original parseMarkdown for non-AI messages
export const parseMarkdown = (text, onSeekToTime = null) => {
  if (!text) return text;

  // Remove standalone heading markers without text (e.g., lines with just "#" or "##")
  text = text.replace(/^\s*#{1,6}\s*$/gm, '');

  // Remove newlines after heading markers (e.g., "## \nText" -> "## Text")
  text = text.replace(/(#{1,6})\s*\n+\s*/g, '$1 ');

  // Remove newlines immediately after numbered list markers (e.g., "1. \n" -> "1. ")
  // This joins "1. \nText" into "1. Text"
  text = text.replace(/(\d+\.)\s*\n+\s*/g, '$1 ');

  // Normalize: ensure headings and numbered list items start on new lines
  // Must happen AFTER joining markers with their content
  // Don't match inside a sequence of # characters (e.g., don't break ### into # and ##)
  text = text.replace(/([^\n#])(#{1,6}\s)/g, '$1\n$2');

  // Add newline before numbered lists, but not if preceded by a digit (to preserve 10., 20., etc.)
  // Also don't add newline if part of a heading (e.g., "### 1. Title")
  text = text.replace(/(?<!#{1,6})([^\n])(\d+)\.\s/g, (match, before, digits) => {
    if (/\d/.test(before)) {
      // Previous character is a digit, don't add newline (e.g., "10.", "20.")
      return match;
    }
    // Previous character is not a digit, add newline
    return before + '\n' + digits + '. ';
  });

  // Function to convert time string to seconds
  const timeToSeconds = (timeStr) => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const [minutes, seconds] = parts.map(Number);
      return minutes * 60 + seconds;
    } else if (parts.length === 3) {
      const [hours, minutes, seconds] = parts.map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };

  // Helper function to extract a readable title from URL
  const getTitleFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastSegment = pathname.split('/').filter(Boolean).pop() || urlObj.hostname;

      // If the last segment looks like a readable title, use it
      const decodedSegment = decodeURIComponent(lastSegment);
      if (decodedSegment && decodedSegment.length > 0 && decodedSegment.length < 80) {
        return decodedSegment.replace(/[-_]/g, ' ').replace(/\.(html?|php|aspx?)$/i, '');
      }

      // Otherwise, use the hostname
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url.length > 50 ? url.substring(0, 50) + '...' : url;
    }
  };

  // Split lines at sentence boundaries followed by emojis (e.g., "text! 😊" -> "text!\n😊")
  const preprocessed = text.replace(/([.!?])\s+([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/gu, '$1\n$2');

  const lines = preprocessed.split('\n');
  const elements = [];

  lines.forEach((line, index) => {
    if (!line.trim()) {
      elements.push(<br key={`br-${index}`} />);
      return;
    }

    // Check if this line is a heading (###, ##, #)
    // Only treat as heading if it's reasonably short (< 80 chars) - headings shouldn't be paragraphs
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const [, hashes, headingText] = headingMatch;

      // If heading text is too long, strip the # markers and process as regular paragraph
      if (headingText.length >= 80) {
        line = headingText; // Remove the # prefix, continue processing as paragraph
      } else {
        // Process as heading
        const level = hashes.length;
        const HeadingTag = `h${level}`;
        const headingClasses = {
          1: 'text-2xl font-bold text-white mb-3 mt-4',
          2: 'text-xl font-bold text-white mb-2 mt-3',
          3: 'text-lg font-semibold text-white mb-2 mt-2',
          4: 'text-base font-semibold text-white mb-1 mt-2',
          5: 'text-sm font-semibold text-white mb-1 mt-1',
          6: 'text-xs font-semibold text-white mb-1 mt-1'
        };

        // Process markdown in heading text (bold, links, timestamps)
        let processedHeading = headingText
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
          .replace(/__(.*?)__/g, '<strong class="font-bold">$1</strong>')
          .replace(/\[([\s\S]*?)\]\s*\(([\s\S]*?)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
          .replace(/\$?(\d{1,2}:\d{2})\$?/g, '<span class="text-cyan-400">$1</span>'); // Timestamps (styled but not clickable in headings)

        // Use dangerouslySetInnerHTML if contains HTML (KaTeX or processed markdown)
        if (processedHeading.includes('<')) {
          elements.push(
            <HeadingTag key={`heading-${index}`} className={headingClasses[level]} dangerouslySetInnerHTML={{ __html: processedHeading }} />
          );
        } else {
          elements.push(
            <HeadingTag key={`heading-${index}`} className={headingClasses[level]}>
              {processedHeading}
            </HeadingTag>
          );
        }
        return;
      }
    }

    // Check if this line is a numbered list item (e.g., "1. Item text")
    const listMatch2 = line.match(/^(\d+)\.\s+(.+)$/);
    if (listMatch2) {
      const [, number, itemText] = listMatch2;
      elements.push(
        <div key={`list-${index}`} className="mb-1 leading-relaxed flex">
          <span className="font-semibold text-white mr-2 flex-shrink-0">{number}.</span>
          <span>{itemText}</span>
        </div>
      );
      return;
    }

    const parts = [];
    let currentIndex = 0;

    // Combine all regexes to process in order (markdown links first, then plain URLs, timestamps, bold)
    const combinedRegex = /(\[([^\]]+)\]\s*\(([^)]+)\)|https?:\/\/[^\s<>]+(?<!\))|\$?\d{1,2}:\d{2}\$?|\*\*.*?\*\*|__.*?__)/g;
    let match;

    while ((match = combinedRegex.exec(line)) !== null) {
      if (match.index > currentIndex) {
        parts.push(line.slice(currentIndex, match.index));
      }

      // Check if this is a markdown link [text](url)
      if (match[0].startsWith('[') && match[0].includes('](')) {
        const linkMatch = match[0].match(/\[([^\]]+)\]\s*\(([^)]+)\)/);
        if (linkMatch) {
          const [, linkText, linkUrl] = linkMatch;
          parts.push(
            <a
              key={`link-${index}-${match.index}`}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline break-all"
            >
              {linkText}
            </a>
          );
        }
      } else if (match[0].startsWith('http://') || match[0].startsWith('https://')) {
        // This is a plain URL - convert it to a clickable link with a nice title
        const url = match[0];
        const title = getTitleFromUrl(url);
        parts.push(
          <a
            key={`url-${index}-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all inline-block"
            title={url}
          >
            {title}
          </a>
        );
      } else if (/\d{1,2}:\d{2}/.test(match[0])) {
        // Check if this is a timestamp (contains digits and colon)
        // Extract just the time part (remove $ signs)
        const timeStr = match[0].replace(/\$/g, '');
        const totalSeconds = timeToSeconds(timeStr);

        if (onSeekToTime && totalSeconds > 0) {
          parts.push(
            <button
              key={`time-${index}-${match.index}`}
              onClick={() => onSeekToTime(totalSeconds)}
              className="text-cyan-400 hover:text-cyan-300 underline bg-transparent border-none cursor-pointer p-0 m-0 font-inherit"
              title={`Jump to ${timeStr}`}
            >
              {timeStr}
            </button>
          );
        } else {
          parts.push(
            <span key={`time-${index}-${match.index}`} className="text-cyan-400">
              {timeStr}
            </span>
          );
        }
      } else if (match[0].startsWith('**') || match[0].startsWith('__')) {
        // Handle bold text
        const boldText = match[0].replace(/(\*\*|__)/g, '');
        parts.push(
          <strong key={`bold-${index}-${match.index}`} className="font-bold text-white">
            {boldText}
          </strong>
        );
      }

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < line.length) {
      parts.push(line.slice(currentIndex));
    }

    if (parts.length > 0) {
      elements.push(
        <div key={`para-${index}`} className="mb-2 leading-relaxed">
          {parts}
        </div>
      );
    }
  });

  return <div className="space-y-1">{elements}</div>;
};

export const SimpleSpinner = ({ size = 24, className = "" }) => {
  return (
    <div 
      className={`inline-block border-2 border-t-transparent border-white rounded-full animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

// Clean up broken MathML/HTML tags from AI responses
const cleanMathMarkup = (text) => {
  if (!text || typeof text !== 'string') return text;

  let cleaned = text;

  console.log('🧹 Cleaning math markup, original length:', text.length);

  // Remove markdown links with "MathML" text: [MathML](url) -> empty
  cleaned = cleaned.replace(/\[MathML\]\([^)]*\)/g, '');

  // Remove ALL instances of 'MathML"' followed by anything until '>' (greedy to catch everything)
  // This handles: MathML" display="block"> or MathML" > or MathML">
  cleaned = cleaned.replace(/MathML"[^>]*>/g, '');

  // Also remove patterns like: ">MathML" or >MathML
  cleaned = cleaned.replace(/>\s*MathML\s*"/g, '');
  cleaned = cleaned.replace(/>\s*MathML\s*</g, '><');

  // Also remove standalone "MathML" text that might appear
  cleaned = cleaned.replace(/\bMathML\b/g, '');

  // Remove display attribute patterns (anywhere in text, not just at end of tags)
  cleaned = cleaned.replace(/display\s*=\s*"[^"]*"/g, '');
  cleaned = cleaned.replace(/display\s*=\s*'[^']*'/g, '');

  // Remove common HTML/MathML tags (both opening and closing)
  const tagsToRemove = ['span', 'math', 'mrow', 'mfrac', 'mn', 'mi', 'mo', 'msub', 'msup', 'mfenced', 'mtable', 'mtr', 'mtd'];
  tagsToRemove.forEach(tag => {
    // Remove opening tags with any attributes
    cleaned = cleaned.replace(new RegExp(`<\\s*${tag}[^>]*>`, 'gi'), '');
    // Remove closing tags
    cleaned = cleaned.replace(new RegExp(`<\\s*\\/\\s*${tag}\\s*>`, 'gi'), '');
  });

  // Remove any remaining HTML-like tags with attributes
  cleaned = cleaned.replace(/<\s*\w+[^>]*>/g, '');
  cleaned = cleaned.replace(/<\s*\/\s*\w+\s*>/g, '');

  // Clean up multiple spaces created by tag removal (but preserve newlines)
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();

  console.log('✅ Cleaned math markup, new length:', cleaned.length);

  return cleaned;
};

// Convert LaTeX math expressions to proper HTML mathematical formatting using KaTeX
export const convertLatexToMathHTML = (text) => {
  if (!text || typeof text !== 'string') return text;

  console.log('🔄 Converting LaTeX to HTML with KaTeX:', text.substring(0, 100) + '...');

  // Clean up any broken MathML/HTML markup first
  let converted = cleanMathMarkup(text);

  // Convert inline math \( ... \) to HTML using KaTeX
  converted = converted.replace(/\\\(([\s\S]+?)\\\)/g, (match, content) => {
    console.log('📐 Found inline math:', content.substring(0, 50));
    try {
      const html = katex.renderToString(content.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
        trust: true,
        output: 'html'  // Force HTML-only output, prevent MathML
      });
      // Strip newlines so KaTeX HTML stays on one line when text is split by \n
      return html.replace(/\n/g, '');
    } catch (e) {
      console.error('KaTeX inline error:', e);
      return `<span class="math-error">${content}</span>`;
    }
  });

  // Convert display math \[ ... \] to HTML block using KaTeX
  converted = converted.replace(/\\\[([\s\S]+?)\\\]/g, (match, content) => {
    console.log('📊 Found display math:', content.substring(0, 50));
    try {
      const html = katex.renderToString(content.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
        trust: true,
        output: 'html'  // Force HTML-only output, prevent MathML
      });
      // Strip newlines so KaTeX HTML stays on one line when text is split by \n
      return html.replace(/\n/g, '');
    } catch (e) {
      console.error('KaTeX display error:', e);
      return `<div class="math-error">${content}</div>`;
    }
  });
  
  // Convert $ ... $ to HTML - allow any content except single $ (to avoid timestamp conflicts like 5:30)
  // More permissive: match non-digit start or ensure it contains LaTeX commands
  converted = converted.replace(/\$([^$]+?)\$/g, (match, content) => {
    // Skip if it looks like a timestamp (e.g., $5:30$, $00:07$)
    if (/^0?\d{1,2}:\d{2}$/.test(content.trim())) {
      return match;
    }
    console.log('💲 Found dollar math:', match.substring(0, 50), '→ content:', content.substring(0, 50));
    return `<span class="math-expression">${convertLatexToHTML(content)}</span>`;
  });
  
  console.log('✅ Conversion result:', converted.substring(0, 100) + '...');
  return converted;
};

// Helper function to convert specific LaTeX expressions to HTML
const convertLatexToHTML = (latex) => {
  let converted = latex.trim();
  
  // Remove LaTeX spacing commands first
  converted = converted.replace(/\\,/g, ' ');        // thin space
  converted = converted.replace(/\\:/g, ' ');        // medium space
  converted = converted.replace(/\\;/g, ' ');        // thick space
  converted = converted.replace(/\\!/g, '');         // negative thin space
  converted = converted.replace(/\\ /g, ' ');        // normal space
  converted = converted.replace(/~~/g, ' ');         // non-breaking space
  converted = converted.replace(/\\quad/g, '  ');    // quad space
  converted = converted.replace(/\\qquad/g, '    '); // double quad space
  
  // Remove \left and \right delimiters (they're just for sizing)
  converted = converted.replace(/\\left\(/g, '(');
  converted = converted.replace(/\\right\)/g, ')');
  converted = converted.replace(/\\left\[/g, '[');
  converted = converted.replace(/\\right\]/g, ']');
  converted = converted.replace(/\\left\{/g, '{');
  converted = converted.replace(/\\right\}/g, '}');
  converted = converted.replace(/\\left\|/g, '|');
  converted = converted.replace(/\\right\|/g, '|');
  
  // Fractions - convert to proper stacked format
  converted = converted.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, numerator, denominator) => {
    return `<span class="fraction"><span class="numerator">${convertLatexToHTML(numerator)}</span><span class="denominator">${convertLatexToHTML(denominator)}</span></span>`;
  });
  
  converted = converted.replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, (match, numerator, denominator) => {
    return `<span class="fraction"><span class="numerator">${convertLatexToHTML(numerator)}</span><span class="denominator">${convertLatexToHTML(denominator)}</span></span>`;
  });
  
  // Handle integral limits: \int_{lower}^{upper}
  converted = converted.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, (match, lower, upper) => {
    return `<span class="integral-with-limits"><span class="integral">∫</span><sup>${convertLatexToHTML(upper)}</sup><sub>${convertLatexToHTML(lower)}</sub></span>`;
  });
  
  // Handle integral with only subscript
  converted = converted.replace(/\\int_\{([^}]+)\}/g, (match, lower) => {
    return `<span class="integral-with-limits"><span class="integral">∫</span><sub>${convertLatexToHTML(lower)}</sub></span>`;
  });
  
  // Handle summation limits: \sum_{lower}^{upper}
  converted = converted.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, (match, lower, upper) => {
    return `<span class="sum-with-limits"><span class="summation">∑</span><sup>${convertLatexToHTML(upper)}</sup><sub>${convertLatexToHTML(lower)}</sub></span>`;
  });
  
  // Greek letters (do this before subscript/superscript to avoid issues)
  const greekLetters = {
    'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ', 'Delta': 'Δ',
    'epsilon': 'ε', 'varepsilon': 'ε', 'theta': 'θ', 'Theta': 'Θ',
    'lambda': 'λ', 'Lambda': 'Λ', 'mu': 'μ', 'pi': 'π', 'Pi': 'Π',
    'sigma': 'σ', 'Sigma': 'Σ', 'tau': 'τ', 'phi': 'φ', 'Phi': 'Φ',
    'omega': 'ω', 'Omega': 'Ω', 'xi': 'ξ', 'Xi': 'Ξ', 'psi': 'ψ', 'Psi': 'Ψ',
    'rho': 'ρ', 'nu': 'ν', 'kappa': 'κ', 'eta': 'η', 'zeta': 'ζ', 'chi': 'χ'
  };
  
  Object.entries(greekLetters).forEach(([latex, unicode]) => {
    converted = converted.replace(new RegExp(`\\\\${latex}\\b`, 'g'), unicode);
  });
  
  // Mathematical operators and symbols
  const symbols = {
    'times': '×', 'cdot': '·', 'div': '÷', 'pm': '±', 'mp': '∓',
    'leq': '≤', 'geq': '≥', 'neq': '≠', 'approx': '≈', 'equiv': '≡',
    'infty': '∞', 'partial': '∂', 'nabla': '∇', 'forall': '∀', 'exists': '∃',
    'in': '∈', 'notin': '∉', 'subset': '⊂', 'supset': '⊃', 'cup': '∪', 'cap': '∩',
    'emptyset': '∅', 'propto': '∝', 'angle': '∠', 'perp': '⊥', 'parallel': '∥'
  };
  
  Object.entries(symbols).forEach(([latex, unicode]) => {
    converted = converted.replace(new RegExp(`\\\\${latex}\\b`, 'g'), unicode);
  });
  
  // Common math functions
  const mathFunctions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot',
                         'log', 'ln', 'exp', 'lim', 'max', 'min', 
                         'det', 'dim', 'ker', 'arg'];
  
  mathFunctions.forEach(func => {
    converted = converted.replace(new RegExp(`\\\\${func}\\b`, 'g'), func);
  });
  
  // Subscripts and superscripts with braces - handle complex expressions
  // Process these after Greek letters and symbols to avoid issues
  converted = converted.replace(/([a-zA-Z0-9]+)_\{([^}]+)\}/g, (match, base, sub) => {
    return `${base}<sub>${convertLatexToHTML(sub)}</sub>`;
  });
  converted = converted.replace(/([a-zA-Z0-9]+)\^\{([^}]+)\}/g, (match, base, sup) => {
    return `${base}<sup>${convertLatexToHTML(sup)}</sup>`;
  });
  
  // Handle superscripts/subscripts without braces (single character or with minus sign)
  // e^-jωt or e^{-jωt} should both work
  converted = converted.replace(/([a-zA-Z0-9]+)\^(-?[a-zA-Z0-9]+)/g, '$1<sup>$2</sup>');
  converted = converted.replace(/([a-zA-Z0-9]+)_(-?[a-zA-Z0-9]+)/g, '$1<sub>$2</sub>');
  
  // Handle arrows
  converted = converted.replace(/\\leftrightarrow/g, '↔');
  converted = converted.replace(/\\rightarrow/g, '→');
  converted = converted.replace(/\\leftarrow/g, '←');
  converted = converted.replace(/\\Rightarrow/g, '⇒');
  converted = converted.replace(/\\Leftarrow/g, '⇐');
  
  // Square roots
  converted = converted.replace(/\\sqrt\{([^}]+)\}/g, (match, content) => {
    return `<span class="sqrt">√<span class="sqrt-content">${convertLatexToHTML(content)}</span></span>`;
  });
  
  // Integrals and summations (without limits, already handled above)
  converted = converted.replace(/\\int\b/g, '<span class="integral">∫</span>');
  converted = converted.replace(/\\sum\b/g, '<span class="summation">∑</span>');
  converted = converted.replace(/\\prod\b/g, '<span class="product">∏</span>');
  
  // Text formatting
  converted = converted.replace(/\\text\{([^}]+)\}/g, '<span class="math-text">$1</span>');
  converted = converted.replace(/\\mathrm\{([^}]+)\}/g, '$1');
  converted = converted.replace(/\\mathbf\{([^}]+)\}/g, '<strong>$1</strong>');
  converted = converted.replace(/\\mathit\{([^}]+)\}/g, '<em>$1</em>');
  
  // Clean up remaining backslash commands (both \command and single chars like \,)
  converted = converted.replace(/\\([a-zA-Z]+)/g, '$1');  // \omega -> omega (if not already converted)
  converted = converted.replace(/\\(.)/g, '$1');           // \, -> , (any remaining single char commands)
  
  // Clean up remaining braces
  converted = converted.replace(/\{([^}]+)\}/g, '$1');
  
  // Clean up any remaining carets and underscores that weren't converted
  // This is a fallback - wrap in minimal formatting
  converted = converted.replace(/\^([^\s<>]+)/g, '<sup>$1</sup>');
  converted = converted.replace(/_([^\s<>]+)/g, '<sub>$1</sub>');
  
  return converted;
};