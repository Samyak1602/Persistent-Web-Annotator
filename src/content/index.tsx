import React from 'react';
import ReactDOM from 'react-dom/client';
import ContentApp from './ContentApp';
import { getAllNotes, deleteNote, saveNote } from '../utils/storage';
import { createLocator, restoreRange } from '../utils/domLocator';
import { Note } from '../types';
import '../styles/index.css';

// Create container for Shadow DOM
const container = document.createElement('div');
container.id = 'web-annotator-root';
container.style.cssText = 'position: fixed; top: 0; left: 0; pointer-events: none; z-index: 2147483647;';
document.documentElement.appendChild(container);

// Create Shadow DOM
const shadowRoot = container.attachShadow({ mode: 'open' });

// Create React root inside Shadow DOM
const reactRoot = document.createElement('div');
reactRoot.id = 'web-annotator-react-root';
shadowRoot.appendChild(reactRoot);

// Inject styles into Shadow DOM
const styleElement = document.createElement('style');
// Inject Tailwind CSS and custom styles
styleElement.textContent = `
  /* Tailwind base styles */
  *, ::before, ::after {
    box-sizing: border-box;
    border-width: 0;
    border-style: solid;
    border-color: #e5e7eb;
  }
  
  /* Tailwind utilities for FloatingInput */
  .fixed { position: fixed; }
  .bg-white { background-color: #ffffff; }
  .rounded-lg { border-radius: 0.5rem; }
  .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
  .border { border-width: 1px; }
  .border-gray-300 { border-color: #d1d5db; }
  .p-4 { padding: 1rem; }
  .min-w-\[300px\] { min-width: 300px; }
  .max-w-\[400px\] { max-width: 400px; }
  .z-\[2147483647\] { z-index: 2147483647; }
  .pointer-events-auto { pointer-events: auto; }
  .mb-2 { margin-bottom: 0.5rem; }
  .block { display: block; }
  .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
  .font-medium { font-weight: 500; }
  .text-gray-700 { color: #374151; }
  .mb-1 { margin-bottom: 0.25rem; }
  .w-full { width: 100%; }
  .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .rounded-md { border-radius: 0.375rem; }
  .focus\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
  .focus\:ring-2:focus { box-shadow: 0 0 0 2px var(--tw-ring-inset), 0 0 0 4px var(--tw-ring-color); }
  .focus\:ring-blue-500:focus { --tw-ring-color: #3b82f6; }
  .resize-none { resize: none; }
  .flex { display: flex; }
  .justify-end { justify-content: flex-end; }
  .gap-2 { gap: 0.5rem; }
  .text-gray-700 { color: #374151; }
  .bg-gray-100 { background-color: #f3f4f6; }
  .hover\:bg-gray-200:hover { background-color: #e5e7eb; }
  .focus\:ring-gray-500:focus { --tw-ring-color: #6b7280; }
  .text-white { color: #ffffff; }
  .bg-blue-600 { background-color: #2563eb; }
  .hover\:bg-blue-700:hover { background-color: #1d4ed8; }
  .disabled\:opacity-50:disabled { opacity: 0.5; }
  .disabled\:cursor-not-allowed:disabled { cursor: not-allowed; }
  .mt-2 { margin-top: 0.5rem; }
  .text-xs { font-size: 0.75rem; line-height: 1rem; }
  .text-gray-500 { color: #6b7280; }
  
  /* Highlight styles */
  .web-annotator-highlight {
    background-color: yellow !important;
    cursor: pointer !important;
    transition: background-color 0.2s;
  }
  .web-annotator-highlight:hover {
    background-color: #ffeb3b !important;
  }
`;
shadowRoot.appendChild(styleElement);

// Mount React app
const root = ReactDOM.createRoot(reactRoot);
root.render(<ContentApp />);

// Restore highlights on page load
async function restoreHighlights() {
  const notes = await getAllNotes();
  const currentUrl = window.location.href;
  const pageNotes = notes.filter(note => note.url === currentUrl);

  for (const note of pageNotes) {
    const range = restoreRange(note.domLocator);
    if (range) {
      highlightRange(range, note.id);
    }
  }
}

// Highlight a range with a span
function highlightRange(range: Range, noteId: string): void {
  try {
    // Check if already highlighted
    const existingHighlight = document.querySelector(`[data-note-id="${noteId}"]`);
    if (existingHighlight) {
      return;
    }

    const span = document.createElement('span');
    span.className = 'web-annotator-highlight';
    span.setAttribute('data-note-id', noteId);
    span.style.cssText = 'background-color: yellow; cursor: pointer;';
    
    try {
      // Try to surround contents first
      if (range.collapsed) {
        return;
      }
      
      // Check if range spans multiple nodes
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    } catch (e) {
      // If that fails, try a different approach
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

// Remove highlight by note ID
function removeHighlight(noteId: string): void {
  const highlight = document.querySelector(`[data-note-id="${noteId}"]`);
  if (highlight) {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
      parent.normalize();
    }
  }
}

// Listen for messages from background and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_FLOATING_INPUT') {
    // Get current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Dispatch custom event to React component
      window.dispatchEvent(new CustomEvent('web-annotator:open-input', {
        detail: { range, rect, selectionText: message.selectionText }
      }));
    }
  } else if (message.type === 'DELETE_NOTE') {
    removeHighlight(message.noteId);
    sendResponse({ success: true });
  } else if (message.type === 'RESTORE_HIGHLIGHTS') {
    restoreHighlights();
    sendResponse({ success: true });
  }
  
  return true;
});

// Restore highlights when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', restoreHighlights);
} else {
  restoreHighlights();
}

// Also restore on navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(restoreHighlights, 1000);
  }
}).observe(document, { subtree: true, childList: true });

