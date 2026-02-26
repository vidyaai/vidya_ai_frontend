// src/components/Assignments/DisplayTextWithEquations.jsx
import React from 'react';
import InlineEquationEditor from './InlineEquationEditor';
import { parseTextWithEquations } from './utils/equationParser';

/**
 * Read-only component that renders plain text with embedded KaTeX equations.
 *
 * Equations are matched by ID via <eq ID> placeholders in `text`, so the full
 * `equations` array can be passed without context-filtering — the parser only
 * renders equations whose IDs appear in the text.
 *
 * @param {string}   text       - Text with optional <eq ID> placeholders
 * @param {Array}    equations  - Array of equation objects { id, latex, type, position }
 * @param {string}   className  - Extra CSS classes applied to the wrapper <span>
 * @param {string}   placeholder - Shown when text is empty
 */
const DisplayTextWithEquations = ({
  text = '',
  equations = [],
  className = '',
  placeholder = '',
}) => {
  if (!text && placeholder) {
    return <span className={`text-gray-400 ${className}`}>{placeholder}</span>;
  }

  if (!text) {
    return null;
  }

  const segments = parseTextWithEquations(text, equations || []);

  return (
    <span className={className}>
      {segments.map((segment, idx) => {
        if (segment.type === 'text') {
          return <span key={`text-${idx}`}>{segment.content}</span>;
        }

        if (segment.type === 'equation' && segment.equation) {
          return (
            <InlineEquationEditor
              key={`eq-${segment.equation.id}-${idx}`}
              equation={segment.equation}
              onSave={null}
              editable={false}
            />
          );
        }

        return null;
      })}
    </span>
  );
};

export default DisplayTextWithEquations;
