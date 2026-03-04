import {getNotes, saveNotes} from './storage.js';

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
    const notes = getNotes();
    const container = document.getElementById('notesContainer');

    if (!container) {        
        return; //prevents crash if HTML is not ready yet
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
            renderNotes();
        });

        noteDiv.appendChild(titleElement);
        noteDiv.appendChild(contentElement);
        noteDiv.appendChild(deleteBtn);

        container.appendChild(noteDiv);
    });
}

export { createNote, deleteNote, updateNote, getNoteById, clearAllNotes };

window.createNote = createNote;
window.deleteNote = deleteNote;
window.renderNotes = renderNotes;
window.updateNotePrompt = updateNotePrompt;