/**
 * Utility functions for parsing and managing equations in question text
 */

/**
 * Parse text containing equation placeholders and return array of text/equation segments
 * @param {string} text - Text with <eq ID> placeholders
 * @param {Array} equations - Array of equation objects with id, latex, position, type
 * @returns {Array} Array of segments: {type: 'text'|'equation', content: string, equation: object}
 */
export function parseTextWithEquations(text, equations = []) {
  if (!text || !equations || equations.length === 0) {
    return [{ type: 'text', content: text || '' }];
  }

  // Create a map of equation IDs to equation objects for quick lookup
  const equationMap = {};
  equations.forEach(eq => {
    equationMap[eq.id] = eq;
  });

  // Regular expression to match <eq ID> placeholders
  const placeholderRegex = /<eq\s+([^>]+)>/g;
  
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = placeholderRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = placeholderRegex.lastIndex;
    const equationId = match[1].trim();

    // Add text segment before the placeholder
    if (matchStart > lastIndex) {
      const textContent = text.substring(lastIndex, matchStart);
      if (textContent) {
        segments.push({ type: 'text', content: textContent });
      }
    }

    // Add equation segment
    const equation = equationMap[equationId];
    if (equation) {
      segments.push({
        type: 'equation',
        content: match[0], // The placeholder text
        equation: equation
      });
    } else {
      // If equation not found, treat placeholder as text
      segments.push({ type: 'text', content: match[0] });
    }

    lastIndex = matchEnd;
  }

  // Add remaining text after last placeholder
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      segments.push({ type: 'text', content: remainingText });
    }
  }

  // If no placeholders found, return the whole text
  if (segments.length === 0) {
    segments.push({ type: 'text', content: text });
  }

  return segments;
}

/**
 * Update an equation's LaTeX in the equations array
 * @param {Array} equations - Array of equation objects
 * @param {string} equationId - ID of equation to update
 * @param {string} newLatex - New LaTeX string
 * @returns {Array} Updated equations array
 */
export function updateEquationLatex(equations, equationId, newLatex) {
  return equations.map(eq => {
    if (eq.id === equationId) {
      return { ...eq, latex: newLatex };
    }
    return eq;
  });
}

/**
 * Validate LaTeX syntax (basic check)
 * @param {string} latex - LaTeX string to validate
 * @returns {object} {isValid: boolean, error: string}
 */
export function validateLatex(latex) {
  if (!latex || latex.trim() === '') {
    return { isValid: false, error: 'LaTeX cannot be empty' };
  }

  // Check for balanced braces
  let braceCount = 0;
  for (let char of latex) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (braceCount < 0) {
      return { isValid: false, error: 'Unbalanced closing brace }' };
    }
  }
  
  if (braceCount !== 0) {
    return { isValid: false, error: 'Unbalanced braces' };
  }

  // Check for balanced brackets
  let bracketCount = 0;
  for (let char of latex) {
    if (char === '[') bracketCount++;
    if (char === ']') bracketCount--;
    if (bracketCount < 0) {
      return { isValid: false, error: 'Unbalanced closing bracket ]' };
    }
  }
  
  if (bracketCount !== 0) {
    return { isValid: false, error: 'Unbalanced brackets' };
  }

  // Check for balanced parentheses in specific LaTeX commands
  let parenCount = 0;
  for (let char of latex) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return { isValid: false, error: 'Unbalanced closing parenthesis )' };
    }
  }
  
  if (parenCount !== 0) {
    return { isValid: false, error: 'Unbalanced parentheses' };
  }

  return { isValid: true, error: '' };
}

/**
 * Find all equation placeholders in text
 * @param {string} text - Text to search
 * @returns {Array} Array of {id: string, placeholder: string, start: number, end: number}
 */
export function findEquationPlaceholders(text) {
  if (!text) return [];

  const placeholderRegex = /<eq\s+([^>]+)>/g;
  const placeholders = [];
  let match;

  while ((match = placeholderRegex.exec(text)) !== null) {
    placeholders.push({
      id: match[1].trim(),
      placeholder: match[0],
      start: match.index,
      end: placeholderRegex.lastIndex
    });
  }

  return placeholders;
}

/**
 * Insert a new equation placeholder into text at a specific position
 * @param {string} text - Original text
 * @param {number} position - Character position to insert at
 * @param {string} equationId - ID of the equation
 * @returns {string} Updated text with placeholder
 */
export function insertEquationPlaceholder(text, position, equationId) {
  const placeholder = `<eq ${equationId}>`;
  return text.slice(0, position) + placeholder + text.slice(position);
}

/**
 * Remove an equation placeholder from text
 * @param {string} text - Original text
 * @param {string} equationId - ID of the equation to remove
 * @returns {string} Updated text without placeholder
 */
export function removeEquationPlaceholder(text, equationId) {
  const placeholderRegex = new RegExp(`<eq\\s+${equationId}>`, 'g');
  return text.replace(placeholderRegex, '');
}

/**
 * Get equations used in a specific context (question_text or options)
 * @param {Array} equations - Array of all equations
 * @param {string} context - 'question_text' or 'options'
 * @param {number} optionIndex - Optional index for options context
 * @returns {Array} Filtered equations
 */
export function getEquationsByContext(equations, context, optionIndex = null) {
  return equations.filter(eq => {
    if (!eq.position) return false;
    
    if (context === 'options' && optionIndex !== null) {
      return eq.position.context === 'options' && eq.position.option_index === optionIndex;
    }
    
    return eq.position.context === context;
  });
}
