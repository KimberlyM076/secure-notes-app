import {getNotes, saveNotes} from './storage.js';

document.addEventListener('DOMContentLoaded', () => {

    const isAuthenticated = sessionStorage.getItem("isAuthenticated")
        || localStorage.getItem("isAuthenticated");

    if (!isAuthenticated) {
        window.location.href = "index.html";
    }

});

// CRUD operations for notes

// Creating a new note
function createNote(title, content) {

    // Safety checks
    if (!title || !content) return;
    if (typeof title !== "string" || typeof content !== "string") return;
    if (title.trim() === "" || content.trim() === "") return;

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
    renderNotes();
}

// Deleting a note
function deleteNote(id) {
    if (!id || typeof id !== "string") return;

    let notes = getNotes();
    const filteredNotes = notes.filter(note => note.id !== id);

     // If nothing changed, note didn't exist
    if (filteredNotes.length === notes.length) return;

    saveNotes(filteredNotes);
    renderNotes();
}

// Updating a note
function updateNote(id, newTitle, newContent) {

    // Safety checks
    if (!id || !newTitle || !newContent) return;
    if (typeof id !== "string" || typeof newTitle !== "string" || typeof newContent !== "string") return;
    if (newTitle.trim() === "" || newContent.trim() === "") return;

// Find the note to update
    const notes = getNotes();
    const note = notes.find(note => note.id === id);

    if (!note) {
        return;
    }

    note.title = newTitle;
    note.content = newContent;
    note.updatedAt = new Date().toISOString();
    saveNotes(notes);
    renderNotes();
}

// Retrieving a note by ID
function getNoteById(id) {

    if (!id || typeof id !== "string") return null;

    const notes = getNotes();
    const note = notes.find(note => note.id === id);
    return note || null;
}

//Clearing all notes (For testing purposes)
function clearAllNotes() {
    localStorage.removeItem('secureNotesData');
}

function renderNotes() {
    const container = document.getElementById('notesContainer');

    if (!container) {
        console.warn("notesContainer not found.");
        return;
    }

    const notes = getNotes();

    if (notes.length === 0) {
        container.textContent = "No notes yet.";
        return;
    }

    container.innerHTML = '';

    notes.forEach(note => {
        const noteDiv = document.createElement('div');
        noteDiv.classList.add('note');
        
        const titleElement = document.createElement("h3");
        titleElement.textContent = note.title;

        const contentElement = document.createElement("p");
        contentElement.textContent = note.content;

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => {
        deleteNote(note.id);
        });

        noteDiv.appendChild(titleElement);
        noteDiv.appendChild(contentElement);
        noteDiv.appendChild(deleteBtn);

        container.appendChild(noteDiv);
    });
}

export { createNote, deleteNote, updateNote, getNoteById, clearAllNotes, renderNotes };

document.addEventListener('DOMContentLoaded', () => {
    renderNotes();
});

document.addEventListener('DOMContentLoaded', () => {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');

    if (!isAuthenticated) {
        window.location.href = 'index.html'; // or login.html
        return;
    }

    renderNotes();

    // Save note button
    const saveBtn = document.getElementById('saveNoteBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const title = document.getElementById('noteTitle').value;
            const content = document.getElementById('noteContent').value;

            createNote(title, content);

            // Clear inputs after save
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
        });
    }

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn").addEventListener("click", () => {

        sessionStorage.removeItem("isAuthenticated");
        localStorage.removeItem("isAuthenticated");

        window.location.href = "index.html?mode=login";
    });
});