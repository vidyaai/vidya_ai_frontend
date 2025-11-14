// src/components/Assignments/EquationRenderer.jsx
import React from 'react';
import 'katex/dist/katex.min.css';
import InlineEquationEditor from './InlineEquationEditor';
import { parseTextWithEquations } from './utils/equationParser';

/**
 * Component to render LaTeX equations using KaTeX
 * This is now a simple wrapper around InlineEquationEditor
 */
const EquationRenderer = ({ 
  latex, 
  displayMode = false, 
  className = '',
  equation = null,
  onSave = null,
  editable = false
}) => {
  // If we have a full equation object, use InlineEquationEditor
  if (equation) {
    return (
      <InlineEquationEditor
        equation={equation}
        onSave={onSave}
        editable={editable}
        className={className}
      />
    );
  }

  // Otherwise, create a minimal equation object for rendering only
  const minimalEquation = {
    id: 'temp',
    latex: latex || '',
    type: displayMode ? 'display' : 'inline'
  };

  return (
    <InlineEquationEditor
      equation={minimalEquation}
      onSave={onSave}
      editable={false}
      className={className}
    />
  );
};

/**
 * Component to render text with embedded equations using <eq ID> placeholders
 * This is the main component to use for question text, options, and answers
 */
export const TextWithEquations = ({ 
  text = '', 
  equations = [], 
  className = '',
  onEquationSave = null,
  editable = false
}) => {
  // Parse text and extract segments
  const segments = parseTextWithEquations(text, equations);

  if (segments.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment, idx) => {
        if (segment.type === 'text') {
          return <span key={`text-${idx}`}>{segment.content}</span>;
        } else if (segment.type === 'equation') {
          return (
            <InlineEquationEditor
              key={`eq-${segment.equation.id}-${idx}`}
              equation={segment.equation}
              onSave={onEquationSave}
              editable={editable}
            />
          );
        }
        return null;
      })}
    </span>
  );
};

/**
 * Component to render a list of equations (for options, etc.)
 * Now uses placeholder-based parsing instead of position-based
 */
export const EquationList = ({ 
  items = [], 
  equations = [], 
  className = '',
  onEquationSave = null,
  editable = false
}) => {
  return (
    <div className={className}>
      {items.map((item, index) => {
        // Get equations for options context with this index
        const itemEquations = equations.filter(
          eq => eq?.position?.context === 'options' && 
               eq?.position?.option_index === index
        );

        return (
          <div key={index} className="mb-2">
            <TextWithEquations 
              text={item} 
              equations={itemEquations}
              onEquationSave={onEquationSave}
              editable={editable}
            />
          </div>
        );
      })}
    </div>
  );
};

export default EquationRenderer;
