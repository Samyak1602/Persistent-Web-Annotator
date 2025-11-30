import React, { useState, useRef, useEffect } from 'react';

interface FloatingInputProps {
  position: { x: number; y: number };
  onSave: (content: string) => void;
  onCancel: () => void;
  defaultText?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  position,
  onSave,
  onCancel,
  defaultText = '',
}) => {
  const [content, setContent] = useState(defaultText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
    }
  };

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 320),
    y: Math.min(position.y + 20, window.innerHeight - 150),
  };

  return (
    <div
      ref={containerRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 p-4 min-w-[300px] max-w-[400px] z-[2147483647] pointer-events-auto"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Note
        </label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          placeholder="Enter your note..."
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!content.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Press Ctrl+Enter to save, Esc to cancel
      </div>
    </div>
  );
};

export default FloatingInput;

