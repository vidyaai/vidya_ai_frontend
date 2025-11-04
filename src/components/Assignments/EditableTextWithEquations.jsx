// src/components/Assignments/EditableTextWithEquations.jsx
import React, { useState, useEffect, useRef } from 'react';
import InlineEquationEditor from './InlineEquationEditor';
import { parseTextWithEquations } from './utils/equationParser';

/**
 * Editable text component that supports inline equation editing
 * Users can type text and insert equations using <eq {latex}> or <eq {}> placeholders
 * 
 * @param {string} text - The text content with equation placeholders
 * @param {Array} equations - Array of equation objects
 * @param {Function} onTextChange - Callback when text changes (DEPRECATED - use onChange)
 * @param {Function} onEquationsChange - Callback when equations change (DEPRECATED - use onChange)
 * @param {Function} onChange - Callback when text or equations change: ({text, equations}) => void
 * @param {string} placeholder - Placeholder text for the input
 * @param {string} className - Additional CSS classes
 * @param {boolean} multiline - Whether to use textarea (true) or input (false)
 * @param {number} rows - Number of rows for textarea
 */
const EditableTextWithEquations = ({
  text = '',
  equations = [],
  onTextChange = () => {},
  onEquationsChange = () => {},
  onChange = null,
  placeholder = 'Enter text...',
  className = '',
  multiline = true,
  rows = 3
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const textareaRef = useRef(null);

  useEffect(() => {
    setEditText(text);
  }, [text]);

  // Detect equation placeholders in text and create/update equation objects
  const detectAndCreateEquations = (inputText) => {
    console.log('[detectAndCreateEquations] Input text:', inputText);
    
    if (!inputText) {
      return { updatedText: '', newEquations: equations };
    }

    // Regex to match <eq {anything}> format (with braces)
    const bracedPattern = /<eq\s*\{([^}]*)\}>/gi;
    
    const newEquations = [...equations];
    const existingIds = new Set(equations.map(eq => eq.id));
    let equationCounter = equations.length;
    
    let updatedText = inputText;
    let hasChanges = false;

    // Process <eq {latex}> format
    let match;
    const processedPositions = new Set();
    
    // Reset regex lastIndex
    bracedPattern.lastIndex = 0;
    
    console.log('[detectAndCreateEquations] Starting pattern matching...');
    
    while ((match = bracedPattern.exec(inputText)) !== null) {
      console.log('[detectAndCreateEquations] Found match:', match[0]);
      const fullMatch = match[0];
      const latex = match[1].trim();
      const position = match.index;
      
      // Skip if we already processed this position
      if (processedPositions.has(position)) {
        console.log('[detectAndCreateEquations] Skipping duplicate position:', position);
        continue;
      }
      processedPositions.add(position);
      
      // Generate a unique ID
      let equationId;
      do {
        equationId = `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      } while (existingIds.has(equationId));
      
      existingIds.add(equationId);
      
      console.log('[detectAndCreateEquations] Creating equation with ID:', equationId, 'latex:', latex);
      
      // Create new equation object
      const newEquation = {
        id: equationId,
        latex: latex || '',
        type: 'inline',
        position: {
          char_index: position,
          context: 'question'
        }
      };
      
      newEquations.push(newEquation);
      
      // Replace in text with standardized placeholder
      updatedText = updatedText.replace(fullMatch, `<eq ${equationId}>`);
      hasChanges = true;
    }

    console.log('[detectAndCreateEquations] hasChanges:', hasChanges);
    console.log('[detectAndCreateEquations] Final updatedText:', updatedText);
    console.log('[detectAndCreateEquations] Final newEquations count:', newEquations.length);
    
    // Return updated text and equations (always return newEquations if we had changes, otherwise return original)
    return { updatedText, newEquations };
  };

  const handleTextInputChange = (e) => {
    const newText = e.target.value;
    setEditText(newText);
  };

  const handleBlur = () => {
    console.log('[EditableTextWithEquations] handleBlur called');
    console.log('[EditableTextWithEquations] editText:', editText);
    console.log('[EditableTextWithEquations] current text prop:', text);
    console.log('[EditableTextWithEquations] current equations prop:', equations);
    
    // Process the text to detect equation placeholders
    const { updatedText, newEquations } = detectAndCreateEquations(editText);
    
    console.log('[EditableTextWithEquations] updatedText:', updatedText);
    console.log('[EditableTextWithEquations] newEquations:', newEquations);
    
    // Always update both text and equations together
    console.log('[EditableTextWithEquations] Updating parent with new text and equations');
    
    // Use new onChange callback if provided (updates both at once), otherwise use legacy callbacks
    if (onChange) {
      onChange({ text: updatedText, equations: newEquations });
    } else {
      onTextChange(updatedText);
      onEquationsChange(newEquations);
    }
    
    setIsEditing(false);
  };

  const handleContainerClick = (e) => {
    // Only enter edit mode if clicking on the container itself or text, not equations
    setIsEditing(true);
  };

  const handleEquationClick = (e) => {
    // Stop propagation to prevent the container's onClick from firing
    e.stopPropagation();
  };

  const handleEquationSave = (equationId, newLatex) => {
    console.log('[EditableTextWithEquations] handleEquationSave called');
    console.log('[EditableTextWithEquations] equationId:', equationId, 'newLatex:', newLatex);
    
    const updatedEquations = equations.map(eq => 
      eq.id === equationId ? { ...eq, latex: newLatex } : eq
    );
    
    console.log('[EditableTextWithEquations] updatedEquations:', updatedEquations);
    
    // Use new onChange callback if provided, otherwise use legacy callback
    if (onChange) {
      onChange({ text: text, equations: updatedEquations });
    } else {
      onEquationsChange(updatedEquations);
    }
  };

  // If editing, show textarea/input
  if (isEditing) {
    const inputClassName = `w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`;
    
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={handleTextInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          className={inputClassName}
          autoFocus
        />
      );
    } else {
      return (
        <input
          ref={textareaRef}
          type="text"
          value={editText}
          onChange={handleTextInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={inputClassName}
          autoFocus
        />
      );
    }
  }

  // If not editing, show rendered text with equations
  const segments = parseTextWithEquations(text, equations);

  return (
    <div 
      onClick={handleContainerClick}
      className={`cursor-text min-h-[2.5rem] px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors ${className}`}
    >
      {segments.length === 0 && !text ? (
        <span className="text-gray-400">{placeholder}</span>
      ) : (
        <span className="text-white">
          {segments.map((segment, idx) => {
            if (segment.type === 'text') {
              return <span key={`text-${idx}`}>{segment.content}</span>;
            } else if (segment.type === 'equation') {
              return (
                <span key={`eq-wrapper-${idx}`} onClick={handleEquationClick}>
                  <InlineEquationEditor
                    key={`eq-${segment.equation.id}-${idx}`}
                    equation={segment.equation}
                    onSave={handleEquationSave}
                    editable={true}
                  />
                </span>
              );
            }
            return null;
          })}
        </span>
      )}
    </div>
  );
};

export default EditableTextWithEquations;
