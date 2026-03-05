// ===============================
// Lotus Notes - Storage Module
// ===============================

// Storage key
const STORAGE_KEY = 'lotusNotes';

// Get all notes
export function getNotes() {
    const notes = localStorage.getItem(STORAGE_KEY);
    return notes ? JSON.parse(notes) : [];
}

// Save notes array
export function saveNotes(notes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}