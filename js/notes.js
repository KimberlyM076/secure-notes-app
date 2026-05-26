import { requireAuth, logout } from "./auth.js";

let currentUserId = "";
let allNotes = [];
let activeSearchQuery = "";
let editingNoteId = "";
let isGuestMode = false;

const GUEST_MODE_KEY = "lotusGuestMode";
const GUEST_NOTES_KEY = "lotusGuestNotes";
const API_BASE_STORAGE_KEY = "lotusApiBaseUrl";

function getApiBaseUrl() {
    const fromGlobal = (window.LOTUS_API_BASE_URL || "").trim().replace(/\/+$/, "");
    if (fromGlobal) return fromGlobal;

    const fromStorage = (localStorage.getItem(API_BASE_STORAGE_KEY) || "").trim().replace(/\/+$/, "");
    if (fromStorage) {
        window.LOTUS_API_BASE_URL = fromStorage;
        return fromStorage;
    }

    const fromOrigin = (window.location.origin || "").trim().replace(/\/+$/, "");
    return fromOrigin || "http://localhost:5000";
}

function getGuestNotes() {
    try {
        return JSON.parse(sessionStorage.getItem(GUEST_NOTES_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveGuestNotes(notes) {
    sessionStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(notes));
}

function isGuestRequest() {
    const params = new URLSearchParams(window.location.search);
    return params.get("guest") === "1" || sessionStorage.getItem(GUEST_MODE_KEY) === "true";
}

function setGuestBanner() {
    const guestBanner = document.getElementById("guestModeBanner");
    if (!guestBanner) return;

    if (!isGuestMode) {
        guestBanner.hidden = true;
        return;
    }

    guestBanner.hidden = false;
    guestBanner.textContent = "Guest mode: notes stay in this browser session only and are not saved to your account.";
}

function showTransientStatus(message, isError = false) {
    const notesStatus = document.getElementById("notesStatus");
    if (!notesStatus) return;

    notesStatus.textContent = message;
    notesStatus.style.color = isError ? "#b23a3a" : "#6f6f6f";
}

document.addEventListener("DOMContentLoaded", async () => {
    isGuestMode = isGuestRequest();

    if (isGuestMode) {
        sessionStorage.setItem(GUEST_MODE_KEY, "true");
        currentUserId = "guest-session";
        setGuestBanner();
        allNotes = getGuestNotes();
        applySearchAndRender();
    } else {
        const user = await requireAuth();
        if (!user) return;

        currentUserId = user.sub || user.email || "";
        if (!currentUserId) {
            showTransientStatus("Unable to identify your account. Please sign in again.", true);
            return;
        }

        try {
            await loadNotes();
        } catch (error) {
            showTransientStatus(error.message, true);
        }
    }

    const searchInput = document.getElementById("searchInput");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const saveBtn = document.getElementById("saveNoteBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            activeSearchQuery = searchInput.value.trim().toLowerCase();
            applySearchAndRender();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
            }
            activeSearchQuery = "";
            applySearchAndRender();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            const title = document.getElementById("noteTitle").value.trim();
            const content = document.getElementById("noteContent").value.trim();

            if (!title || !content) {
                showTransientStatus("Please enter both title and content before saving.", true);
                return;
            }

            try {
                if (editingNoteId) {
                    await updateNote(editingNoteId, title, content);
                    setEditMode(null);
                    showTransientStatus("Note updated successfully.");
                } else {
                    await createNote(title, content);
                    showTransientStatus("Note saved successfully.");
                }

                clearEditor();
            } catch (error) {
                showTransientStatus(error.message, true);
            }
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            setEditMode(null);
            clearEditor();
        });
    }

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        if (isGuestMode) {
            logoutBtn.textContent = "Exit Guest";
        }

        logoutBtn.addEventListener("click", async () => {
            if (isGuestMode) {
                sessionStorage.removeItem(GUEST_MODE_KEY);
                sessionStorage.removeItem(GUEST_NOTES_KEY);
                window.location.href = "/";
                return;
            }

            await logout();
        });
    }
});

async function createNote(title, content) {
    if (isGuestMode) {
        const newNote = {
            _id: `guest-${Date.now()}`,
            title,
            content,
            userId: currentUserId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        allNotes = [newNote, ...allNotes];
        saveGuestNotes(allNotes);
        applySearchAndRender();
        return;
    }

    const response = await fetch(`${getApiBaseUrl()}/notes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title,
            content,
            userId: currentUserId
        })
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`Unable to create note. ${message}`);
    }

    await loadNotes();
}

async function updateNote(noteId, title, content) {
    if (isGuestMode) {
        allNotes = allNotes.map((note) => note._id === noteId
            ? { ...note, title, content, updatedAt: new Date().toISOString() }
            : note);
        saveGuestNotes(allNotes);
        applySearchAndRender();
        return;
    }

    const response = await fetch(`${getApiBaseUrl()}/notes/${noteId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title,
            content,
            userId: currentUserId
        })
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`Unable to update note. ${message}`);
    }

    await loadNotes();
}

async function loadNotes() {
    if (isGuestMode) {
        allNotes = getGuestNotes();
        applySearchAndRender();
        return;
    }

    const res = await fetch(`${getApiBaseUrl()}/notes?userId=${encodeURIComponent(currentUserId)}`);
    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Unable to load notes. ${message}`);
    }

    const payload = await res.json();
    allNotes = Array.isArray(payload) ? payload : [];
    applySearchAndRender();
}

function applySearchAndRender() {
    const filtered = allNotes.filter((note) => {
        if (!activeSearchQuery) return true;
        const text = `${note.title || ""} ${note.content || ""}`.toLowerCase();
        return text.includes(activeSearchQuery);
    });

    updateStatus(filtered.length, allNotes.length);
    renderNotes(filtered);
}

function updateStatus(filteredCount, totalCount) {
    const notesStatus = document.getElementById("notesStatus");
    if (!notesStatus) return;

    if (!totalCount) {
        notesStatus.textContent = "No notes yet. Create your first note.";
        return;
    }

    if (!activeSearchQuery) {
        notesStatus.textContent = `${totalCount} note${totalCount === 1 ? "" : "s"} available.`;
        return;
    }

    notesStatus.textContent = `${filteredCount} result${filteredCount === 1 ? "" : "s"} for \"${activeSearchQuery}\".`;
}

function clearEditor() {
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteContent").value = "";
}

function setEditMode(note) {
    const saveBtn = document.getElementById("saveNoteBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");

    if (!saveBtn || !cancelEditBtn) return;

    if (!note) {
        editingNoteId = "";
        saveBtn.textContent = "Save Note";
        cancelEditBtn.hidden = true;
        return;
    }

    editingNoteId = note._id;
    document.getElementById("noteTitle").value = note.title || "";
    document.getElementById("noteContent").value = note.content || "";
    saveBtn.textContent = "Update Note";
    cancelEditBtn.hidden = false;
    document.getElementById("noteTitle").focus();
}


// Display notes
function renderNotes(notes = []) {

    const container = document.getElementById("notesContainer");

    if (!container) return;

    container.innerHTML = "";

    if (notes.length === 0) {
        container.innerHTML = `<p class="notes-empty">No notes match your search right now.</p>`;
        return;
    }

    notes.forEach(note => {

        const noteDiv = document.createElement("div");
        noteDiv.className = "note";

        const title = document.createElement("h3");
        title.textContent = note.title;

        const content = document.createElement("p");
        content.textContent = note.content;

        const actions = document.createElement("div");
        actions.className = "note-actions";

        const editBtn = document.createElement("button");
        editBtn.className = "note-action edit";
        editBtn.textContent = "Edit";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "note-action delete";
        deleteBtn.textContent = "Delete";

        editBtn.addEventListener("click", () => {
            setEditMode(note);
        });

        deleteBtn.addEventListener("click", () => {
            deleteNote(note._id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        noteDiv.appendChild(title);
        noteDiv.appendChild(content);
        noteDiv.appendChild(actions);

        container.appendChild(noteDiv);

    });

}


// Delete a note
async function deleteNote(id) {

    try {
        if (isGuestMode) {
            allNotes = allNotes.filter((note) => note._id !== id);
            saveGuestNotes(allNotes);

            if (editingNoteId === id) {
                setEditMode(null);
                clearEditor();
            }

            applySearchAndRender();
            showTransientStatus("Note deleted.");
            return;
        }

        const response = await fetch(`${getApiBaseUrl()}/notes/${id}?userId=${encodeURIComponent(currentUserId)}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(`Unable to delete note. ${message}`);
        }

        if (editingNoteId === id) {
            setEditMode(null);
            clearEditor();
        }

        await loadNotes();
        showTransientStatus("Note deleted.");
    } catch (error) {
        showTransientStatus(error.message, true);
    }

}

export { createNote, renderNotes };