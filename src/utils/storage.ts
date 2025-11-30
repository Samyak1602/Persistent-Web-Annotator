import { Note, StorageData } from '../types';

const STORAGE_KEY = 'notes';

export async function getAllNotes(): Promise<Note[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

export async function saveNote(note: Note): Promise<void> {
  const notes = await getAllNotes();
  notes.push(note);
  await chrome.storage.local.set({ [STORAGE_KEY]: notes });
}

export async function deleteNote(noteId: string): Promise<void> {
  const notes = await getAllNotes();
  const filtered = notes.filter(note => note.id !== noteId);
  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
}

export async function getNotesByUrl(url: string): Promise<Note[]> {
  const notes = await getAllNotes();
  return notes.filter(note => note.url === url);
}

export async function searchNotes(query: string): Promise<Note[]> {
  const notes = await getAllNotes();
  const lowerQuery = query.toLowerCase();
  return notes.filter(
    note =>
      note.content.toLowerCase().includes(lowerQuery) ||
      note.url.toLowerCase().includes(lowerQuery)
  );
}

