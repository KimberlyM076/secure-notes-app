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

    const storedPassword = localStorage.getItem('secureNotesPassword');

//First time USER sign-up
    if (!storedPassword) {
        const hashed = hashPassword(passwordInput.value);
        localStorage.setItem('secureNotesPassword', hashed);
        alert('Password set successfully. You can now create and view your notes.');
        window.location.href = 'notes.html';
    }

    //Returning USER login
    else {
        const hashedInput = hashPassword(passwordInput.value);
        if (hashedInput === storedPassword) {
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
