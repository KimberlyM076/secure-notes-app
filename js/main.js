import { createNote, renderNotes } from './notes.js';

if (!sessionStorage.getItem("isAuthenticated")) {
    window.location.href = "index.html";
}


document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("isAuthenticated");
            window.location.href = "index.html";
        });
    }

});

function hashPassword(password) {
    return btoa(password);
}

function handleAuth() {
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('errorMessage');

    if (!passwordInput.value) {
        errorMessage.textContent = 'Please enter a password.';
        return;
    }

    const storedPassword = localStorage.getItem('lotusNotesPassword');

//First time USER sign-up
    if (!storedPassword) {
        const hashed = hashPassword(passwordInput.value);
        localStorage.setItem('lotusNotesPassword', hashed);
        alert('Password set successfully. You can now create and view your notes.');
        window.location.href = 'notes.html';
    }

    //Returning USER login
    else {
        const hashedInput = hashPassword(passwordInput.value);
        if (hashedInput === storedPassword) {
            sessionStorage.setItem("isAuthenticated", "true");
            window.location.href = 'notes.html';
        } else {
            errorMessage.textContent = 'Incorrect password. Please try again.';
        }
    }
}


let logoutTimer;

function startAutoLogout() {
    clearTimeout(logoutTimer);
    logoutTimer = setTimeout(() => {
        alert('You have been logged out due to inactivity.');
        window.location.href = 'index.html';
    }, 5 * 60 * 1000); // 5 minutes
}

document.addEventListener("click", startAutoLogout);
document.addEventListener("keypress", startAutoLogout);

//reset timer on user activity
function resetTimer() {
    startAutoLogout();
}

document.addEventListener('click', resetTimer);
document.addEventListener('keypress', resetTimer);
document.addEventListener('mousemove', resetTimer);

//start timer immediately on page load
startAutoLogout();
