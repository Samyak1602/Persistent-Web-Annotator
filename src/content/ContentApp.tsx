import React, { useState, useEffect, useRef } from 'react';
import FloatingInput from '../components/FloatingInput';
import { saveNote } from '../utils/storage';
import { createLocator } from '../utils/domLocator';
import { Note } from '../types';

interface SelectionData {
  range: Range;
  rect: DOMRect;
  selectionText: string;
}

const ContentApp: React.FC = () => {
  const [selection, setSelection] = useState<SelectionData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleOpenInput = (event: CustomEvent<SelectionData>) => {
      setSelection(event.detail);
      setIsVisible(true);
    };

    window.addEventListener('web-annotator:open-input', handleOpenInput as EventListener);

    return () => {
      window.removeEventListener('web-annotator:open-input', handleOpenInput as EventListener);
    };
  }, []);

  const handleSave = async (content: string) => {
    if (!selection) return;

    try {
      const locator = createLocator(selection.range);
      const note: Note = {
        id: crypto.randomUUID(),
        url: window.location.href,
        content,
        domLocator: locator,
        createdAt: Date.now(),
      };

      await saveNote(note);

      // Highlight the range
      highlightRange(selection.range, note.id);

      // Close the input
      setIsVisible(false);
      setSelection(null);

      // Clear selection
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleCancel = () => {
    setIsVisible(false);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  if (!isVisible || !selection) return null;

  return (
    <FloatingInput
      position={{ x: selection.rect.left, y: selection.rect.top }}
      onSave={handleSave}
      onCancel={handleCancel}
      defaultText={selection.selectionText}
    />
  );
};

function highlightRange(range: Range, noteId: string): void {
  try {
    // Check if already highlighted
    const existingHighlight = document.querySelector(`[data-note-id="${noteId}"]`);
    if (existingHighlight) {
      return;
    }

    if (range.collapsed) {
      return;
    }

    const span = document.createElement('span');
    span.className = 'web-annotator-highlight';
    span.setAttribute('data-note-id', noteId);
    span.style.cssText = 'background-color: yellow; cursor: pointer;';
    
    try {
      // Extract contents and wrap in span
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    } catch (e) {
      // If that fails, try surroundContents
      try {
        range.surroundContents(span);
      } catch (e2) {
        console.error('Error highlighting range:', e2);
      }
    }
  } catch (error) {
    console.error('Error highlighting range:', error);
  }
}

export default ContentApp;

