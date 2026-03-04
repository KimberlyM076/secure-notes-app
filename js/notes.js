import {getNotes, saveNotes} from './storage.js';

// CRUD operations for notes

// Creating a new note
function createNote(title, content) {
    const notes = getNotes();

    const newNote = {
        id: crypto.randomUUID(),
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    notes.push(newNote);
    saveNotes(notes);
}

// Deleting a note
function deleteNote(id) {
    let notes = getNotes();
    notes = notes.filter(note => note.id !== id);
    saveNotes(notes);
}

// Updating a note
function updateNote(id, newTitle, newContent) {
    const notes = getNotes();
    const note = notes.find(note => note.id === id);

    if (!note) {
        return;
    }

    note.title = newTitle;
    note.content = newContent;
    note.updatedAt = new Date().toISOString();
    saveNotes(notes);
}

// Retrieving a note by ID
function getNoteById(id) {
    const notes = getNotes();
    return notes.find(note => note.id === id);
}

//Clearing all notes (For testing purposes)
function clearAllNotes() {
    localStorage.removeItem('secureNotesData');
}



export { createNote, deleteNote, updateNote, getNoteById, clearAllNotes };