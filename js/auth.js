//Lotus Notes authentication
document.addEventListener('DOMContentLoaded', initAuth);

function initAuth() {
    const signupSection = document.getElementById('signup-section');
    const loginSection = document.getElementById('login-section');

    const createAccountBtn = document.getElementById('createAccountBtn');
    const loginBtn = document.getElementById('login-btn');
    const showLoginLink = document.getElementById("showLoginLink");


    const storedHash = localStorage.getItem('passwordHash');

    //Show correct section based on whether a password hash exists
    if (storedHash) {
        signupSection.style.display = 'none';
        loginSection.style.display = 'block';
    } else {
        signupSection.style.display = 'block';
        loginSection.style.display = 'none';
    }

    if (showLoginLink) {
        showLoginLink.addEventListener("click", (e) => {
        e.preventDefault();

        document.getElementById("signup-section").style.display = "none";
        document.getElementById("login-section").style.display = "block";
        });
    }


    //Attaching listeners safely after DOM is loaded
    if (createAccountBtn) {
        createAccountBtn.addEventListener('click', handleSignup);
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault(); //stops page refresh on form submit
        handleLogin();
    });
}
    const savedPassword = localStorage.getItem("lotusPassword");

    if (!savedPassword) {
      alert("No account found. Please create one first.");
      return;
    }

    if (enteredPassword === savedPassword) {

      // Set session
      localStorage.setItem("isLoggedIn", "true");

      // Redirect to notes page
      window.location.href = "notes.html";

    } else {
      alert("Incorrect password.");
    }
  }

//Password hashing using Web Crypto API
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

//signup logic
async function handleSignup() {
    const passwordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const message = document.getElementById('signupMessage');

    if (!passwordInput || !confirmPasswordInput || !message) return;

    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (password !== confirmPassword) {
        message.textContent = 'Passwords do not match';
        return;
    }

    const hashedPassword = await hashPassword(password);

    localStorage.setItem('lotusNotesPassword', hashedPassword);
    sessionStorage.setItem('isAuthenticated', 'true');
    message.textContent = 'Account created successfully';

    window.location.href = 'notes.html';
}

//login logic
async function handleLogin() {
    const passwordInput = document.getElementById('loginPassword');
    const message = document.getElementById('loginMessage');

    if (!passwordInput || !message) return;

    const password = passwordInput.value.trim();

    if (!password) {
        message.textContent = 'Please enter your password';
        return;
    }

    const storedHash = localStorage.getItem('lotusNotesPassword');

    if (!storedHash) {
        message.textContent = 'No account found. Please create an account first.';
        return;
    }

    const hashedInput = await hashPassword(password);

    if (hashedInput === storedHash) {
        sessionStorage.setItem('isAuthenticated', 'true');
        window.location.href = 'notes.html';
    } else {
        message.textContent = 'Invalid password';
    }
}