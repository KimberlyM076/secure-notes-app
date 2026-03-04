import {getNotes, saveNotes} from './storage.js';

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

function deleteNote(id) {
    let notes = getNotes();
    notes = notes.filter(note => note.id !== id);
    saveNotes(notes);
}