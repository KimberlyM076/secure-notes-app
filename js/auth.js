const passwordInput = document.getElementById('passwordInput');
const authButton = document.getElementById('authButton');
const errorMessage = document.getElementById('errorMessage');

authButton.addEventListener('click', handleAuth);

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleAuth() {
    const password = passwordInput.value;

    if (!password) {
        errorMessage.textContent = 'Password cannot be left empty.';
        return;
    }

    const storedHash = localStorage.getItem('secureNotesPassword');
    const hashedInput = await hashPassword(password);

    //First time user, set the password
    if (!storedHash) {
        localStorage.setItem('secureNotesPassword', hashedInput);
        sessionStorage.setItem('isAuthenticated', 'true');
        window.location.href = 'notes.html';
        errorMessage.textContent = 'Password set successfully. You can now access your notes.';
    }
    //Existing user, check the password
    else if (hashedInput === storedHash) {
        sessionStorage.setItem('isAuthenticated', 'true');
        alert('Login successful! Redirecting to your notes...');
        window.location.href = 'notes.html';
    } else {
        errorMessage.textContent = 'Incorrect password. Please try again.';
    }
}
    