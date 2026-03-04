//Notes data model and storage functions

//Each note will have the following structure:
// {
//   id: "unique-id",
//   title: "Note title",
//   content: "Note content",
//   createdAt: "2026-03-04T12:00:00Z",
//   updatedAt: "2026-03-04T12:00:00Z"
// }

//All notes will be stored as an array:
//[
//  { note1 },
//  { note2 }
//]

//And then, will be saved as:
//localStorage.setItem("secureNotesData", JSON.stringify(notesArray));
const STORAGE_KEY = 'secure-notesData';

function getNotes() {
    const notes = localStorage.getItem(STORAGE_KEY);
    return notes ? JSON.parse(notes) : [];
}

function saveNotes(notesArray) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notesArray));
}