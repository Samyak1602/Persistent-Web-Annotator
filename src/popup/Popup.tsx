import React, { useState, useEffect } from 'react';
import { getNotesByUrl, getAllNotes, deleteNote, searchNotes } from '../utils/storage';
import { Note } from '../types';

const Popup: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentTab();
  }, []);

  useEffect(() => {
    if (isSearchMode) {
      if (searchQuery.trim()) {
        loadSearchResults();
      } else {
        setNotes([]);
      }
    } else {
      loadCurrentTabNotes();
    }
  }, [isSearchMode, searchQuery, currentUrl]);

  const loadCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url) {
        setCurrentUrl(tab.url);
      }
    } catch (error) {
      console.error('Error loading current tab:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentTabNotes = async () => {
    if (!currentUrl) return;
    try {
      const urlNotes = await getNotesByUrl(currentUrl);
      setNotes(urlNotes.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadSearchResults = async () => {
    try {
      const results = await searchNotes(searchQuery);
      setNotes(results.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Error searching notes:', error);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      
      // Notify content script to remove highlight
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'DELETE_NOTE',
          noteId,
        });
      }

      // Reload notes
      if (isSearchMode) {
        loadSearchResults();
      } else {
        loadCurrentTabNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-[400px] max-h-[600px] flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Web Annotator</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsSearchMode(false);
              setSearchQuery('');
            }}
            className={`px-3 py-1 text-sm rounded-md ${
              !isSearchMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Current Page
          </button>
          <button
            onClick={() => setIsSearchMode(true)}
            className={`px-3 py-1 text-sm rounded-md ${
              isSearchMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Global Search
          </button>
        </div>
      </div>

      {/* Search Bar (only in search mode) */}
      {isSearchMode && (
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes across all pages..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {isSearchMode
              ? searchQuery
                ? 'No notes found'
                : 'Enter a search query to find notes'
              : 'No notes on this page. Right-click selected text and choose "Add ContextMemo" to create one.'}
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    {isSearchMode && (
                      <div className="text-xs text-gray-500 mb-1 truncate">
                        {truncateUrl(note.url)}
                      </div>
                    )}
                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {note.content}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
                    title="Delete note"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {formatDate(note.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;

