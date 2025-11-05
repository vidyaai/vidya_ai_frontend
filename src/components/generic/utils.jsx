// utils.js - Shared utilities and helpers
import { auth } from '../../firebase/config';
import axios from 'axios';

// Next.js environment variables
const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

console.log("NODE_ENV", NODE_ENV);
console.log("API_BASE_URL from env", API_BASE_URL);

// Use environment variable or fallback to hardcoded for backward compatibility
let API_URL = API_BASE_URL || 'https://api.vidyaai.co';

if (NODE_ENV === 'development') {
  API_URL = 'https://devapi.vidyaai.co';
} else if (NODE_ENV === 'production') {
  API_URL = 'https://api.vidyaai.co';
} else if (NODE_ENV === 'local') {
  API_URL = 'http://127.0.0.1:8000';
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
  
  // First convert LaTeX to HTML
  let processed = convertLatexToMathHTML(text);
  
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

  const lines = processed.split('\n');
  const elements = [];
  
  lines.forEach((line, index) => {
    if (!line.trim()) {
      elements.push(<br key={`br-${index}`} />);
      return;
    }
    
    const parts = [];
    let currentIndex = 0;
    
    // Updated regex to match timestamps with or without $ signs
    const timestampRegex = /(\$?\d{1,2}:\d{2}\$?)/g;
    const boldRegex = /(\*\*.*?\*\*|__.*?__)/g;
    
    // Combine both regexes to process in order
    const combinedRegex = /(\$?\d{1,2}:\d{2}\$?|\*\*.*?\*\*|__.*?__)/g;
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
      
      // Check if this is a timestamp (contains digits and colon)
      if (/\d{1,2}:\d{2}/.test(match[0])) {
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

  const lines = text.split('\n');
  const elements = [];
  
  lines.forEach((line, index) => {
    if (!line.trim()) {
      elements.push(<br key={`br-${index}`} />);
      return;
    }
    
    const parts = [];
    let currentIndex = 0;
    
    // Updated regex to match timestamps with or without $ signs
    const timestampRegex = /(\$?\d{1,2}:\d{2}\$?)/g;
    const boldRegex = /(\*\*.*?\*\*|__.*?__)/g;
    
    // Combine both regexes to process in order
    const combinedRegex = /(\$?\d{1,2}:\d{2}\$?|\*\*.*?\*\*|__.*?__)/g;
    let match;
    
    while ((match = combinedRegex.exec(line)) !== null) {
      if (match.index > currentIndex) {
        parts.push(line.slice(currentIndex, match.index));
      }
      
      // Check if this is a timestamp (contains digits and colon)
      if (/\d{1,2}:\d{2}/.test(match[0])) {
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

// Convert LaTeX math expressions to proper HTML mathematical formatting
export const convertLatexToMathHTML = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  console.log('🔄 Converting LaTeX to HTML:', text.substring(0, 100) + '...');
  
  let converted = text;
  
  // Convert inline math \( ... \) to HTML - use [\s\S] to match newlines
  converted = converted.replace(/\\\(([\s\S]+?)\\\)/g, (match, content) => {
    console.log('📐 Found inline math:', match.substring(0, 50), '→ content:', content.substring(0, 50));
    return `<span class="math-expression">${convertLatexToHTML(content)}</span>`;
  });
  
  // Convert display math \[ ... \] to HTML block - use [\s\S] to match newlines
  converted = converted.replace(/\\\[([\s\S]+?)\\\]/g, (match, content) => {
    console.log('📊 Found display math:', match.substring(0, 50), '→ content:', content.substring(0, 50));
    return `<div class="math-block">${convertLatexToHTML(content)}</div>`;
  });
  
  // Convert $ ... $ to HTML - allow any content except single $ (to avoid timestamp conflicts like 5:30)
  // More permissive: match non-digit start or ensure it contains LaTeX commands
  converted = converted.replace(/\$([^$]+?)\$/g, (match, content) => {
    // Skip if it looks like a timestamp (e.g., $5:30$)
    if (/^\d{1,2}:\d{2}$/.test(content.trim())) {
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