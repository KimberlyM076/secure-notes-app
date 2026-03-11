// Check authentication when page loads
document.addEventListener("DOMContentLoaded", () => {

    const isAuthenticated = sessionStorage.getItem("isAuthenticated");

    if (!isAuthenticated) {
        window.location.href = "index.html";
        return;
    }

    loadNotes();

    // Save note button
    const saveBtn = document.getElementById("saveNoteBtn");

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {

            const title = document.getElementById("noteTitle").value.trim();
            const content = document.getElementById("noteContent").value.trim();

            if (!title || !content) return;

            await createNote(title, content);

            document.getElementById("noteTitle").value = "";
            document.getElementById("noteContent").value = "";
        });
    }

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "index.html";
        });
    }

});


// Create a new note
async function createNote(title, content) {

    const userId = sessionStorage.getItem("userId");

    await fetch("http://localhost:5000/notes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title,
            content,
            userId
        })
    });

    loadNotes();
}


// Load notes from backend
async function loadNotes() {

    const userId = sessionStorage.getItem("userId");

    const res = await fetch(`http://localhost:5000/notes?userId=${userId}`);

    const notes = await res.json();

    renderNotes(notes);

}


// Display notes
function renderNotes(notes = []) {

    const container = document.getElementById("notesContainer");

    if (!container) return;

    container.innerHTML = "";

    if (notes.length === 0) {
        container.textContent = "No notes yet.";
        return;
    }

    notes.forEach(note => {

        const noteDiv = document.createElement("div");
        noteDiv.className = "note";

        const title = document.createElement("h3");
        title.textContent = note.title;

        const content = document.createElement("p");
        content.textContent = note.content;

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", () => {
            deleteNote(note._id);
        });

        noteDiv.appendChild(title);
        noteDiv.appendChild(content);
        noteDiv.appendChild(deleteBtn);

        container.appendChild(noteDiv);

    });

}


// Delete a note
async function deleteNote(id) {

    await fetch(`http://localhost:5000/notes/${id}`, {
        method: "DELETE"
    });

    loadNotes();

}

export { createNote, renderNotes };