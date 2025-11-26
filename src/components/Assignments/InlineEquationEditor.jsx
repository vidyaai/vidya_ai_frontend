import React, { useState, useEffect } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { validateLatex } from './utils/equationParser';

/**
 * InlineEquationEditor - Component for viewing and editing LaTeX equations
 * 
 * @param {object} equation - Equation object with id, latex, type properties
 * @param {function} onSave - Callback when equation is saved: (equationId, newLatex) => void
 * @param {function} onTypeChange - Callback when equation type changes: (equationId, newType) => void
 * @param {boolean} editable - Whether the equation can be edited
 * @param {string} className - Additional CSS classes
 */
const InlineEquationEditor = ({ equation, onSave, onTypeChange, editable = false, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [latexInput, setLatexInput] = useState(equation.latex);
  const [validationError, setValidationError] = useState('');
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    setLatexInput(equation.latex);
  }, [equation.latex]);

  const handleEdit = (e) => {
    if (editable) {
      // Stop propagation to prevent parent click handlers
      if (e) {
        e.stopPropagation();
      }
      setIsEditing(true);
      setLatexInput(equation.latex);
      setValidationError('');
      setPreviewError(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLatexInput(equation.latex);
    setValidationError('');
    setPreviewError(false);
  };

  const handleSave = () => {
    // Validate LaTeX
    const validation = validateLatex(latexInput);
    
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    // Save the equation
    if (onSave) {
      onSave(equation.id, latexInput);
    }

    setIsEditing(false);
    setValidationError('');
    setPreviewError(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleInputChange = (e) => {
    setLatexInput(e.target.value);
    setValidationError('');
    setPreviewError(false);
  };

  const renderEquation = (latex, type) => {
    try {
      if (type === 'display') {
        return <BlockMath math={latex} />;
      } else {
        return <InlineMath math={latex} />;
      }
    } catch (error) {
      return (
        <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-sm">
          [Invalid LaTeX: {latex}]
        </span>
      );
    }
  };

  // View mode - rendered equation
  if (!isEditing) {
    return (
      <span
        className={`inline-equation ${editable ? 'cursor-pointer hover:bg-blue-50 hover:outline hover:outline-1 hover:outline-blue-300 rounded px-1' : ''} ${className}`}
        onClick={handleEdit}
        title={editable ? 'Click to edit equation' : ''}
      >
        {renderEquation(equation.latex, equation.type)}
      </span>
    );
  }

  // Edit mode - LaTeX input with preview
  return (
    <div className={`inline-equation-editor border border-blue-400 rounded p-3 my-2 bg-blue-50 ${className}`}>
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            LaTeX
          </label>
          {onTypeChange && (
            <button
              onClick={() => {
                const newType = equation.type === 'inline' ? 'display' : 'inline';
                onTypeChange(equation.id, newType);
              }}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              type="button"
            >
              Switch to {equation.type === 'inline' ? 'Display' : 'Inline'}
            </button>
          )}
        </div>
        <input
          type="text"
          value={latexInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-black"
          placeholder="Enter LaTeX equation..."
          autoFocus
        />
        <p className="text-xs text-gray-500 mt-1">
          Press Ctrl+Enter to save, Esc to cancel
        </p>
      </div>

      {/* Preview */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Preview
        </label>
        <div className="p-3 bg-white border border-gray-300 rounded-md min-h-[3rem] flex items-center text-black">
          {latexInput ? (
            renderEquation(latexInput, equation.type)
          ) : (
            <span className="text-gray-400 text-sm">Preview will appear here...</span>
          )}
        </div>
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded text-red-700 text-sm">
          {validationError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
        >
          Cancel
        </button>
      </div>

      {/* Helper text */}
      <div className="mt-3 text-xs text-gray-600">
        <p className="font-medium mb-1">LaTeX Tips:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Fractions: <code className="bg-gray-100 px-1 rounded">\frac{'{'}numerator{'}'}{'{'}denominator{'}'}</code></li>
          <li>Superscript: <code className="bg-gray-100 px-1 rounded">x^{'{'}2{'}'}</code></li>
          <li>Subscript: <code className="bg-gray-100 px-1 rounded">x_{'{'}i{'}'}</code></li>
          <li>Square root: <code className="bg-gray-100 px-1 rounded">\sqrt{'{'}x{'}'}</code></li>
          <li>Greek letters: <code className="bg-gray-100 px-1 rounded">\alpha, \beta, \theta</code></li>
        </ul>
      </div>
    </div>
  );
};

export default InlineEquationEditor;
