// Lotus Notes Authentication
document.addEventListener("DOMContentLoaded", initAuth);

function initAuth() {

    //The Remember me feature allows users to stay logged in across browser 
    // sessions. When enabled, it stores a flag in localStorage to indicate 
    // that the user should be remembered. On page load, the app checks this 
    // flag along with the authentication status stored in sessionStorage. 
    // If both indicate that the user should be remembered and is authenticated, 
    // it automatically redirects them to the notes page without requiring them to log in again. This provides a seamless experience for users who prefer not to enter their password every time they visit the app, while still maintaining security by using sessionStorage for authentication status.
    const rememberMe = localStorage.getItem("lotusRememberMe") === "true";
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");

    if (rememberMe && isAuthenticated) {
        window.location.href = "notes.html";
        return;
    }

    const signupSection = document.getElementById("signup-section");
    const loginSection = document.getElementById("login-section");

    if (!signupSection || !loginSection) return;

    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");

    const storedHash = localStorage.getItem("lotusNotesPassword");

    const loginPassword = document.getElementById("loginPassword");
    if (loginPassword) loginPassword.value = "";

    // Decide which card to show
    if (mode === "login") {
        signupSection.style.display = "none";
        loginSection.style.display = "block";
    } 
    else {
    signupSection.style.display = "block";
    loginSection.style.display = "none";
    }

    // Switch from signup → login
    const showLoginLink = document.getElementById("showLoginLink");
    if (showLoginLink) {
        showLoginLink.addEventListener("click", (e) => {
            e.preventDefault();
            signupSection.style.display = "none";
            loginSection.style.display = "block";
        });
    }

    // Buttons
    const createAccountBtn = document.getElementById("createAccountBtn");
    const loginBtn = document.getElementById("loginBtn");

    if (createAccountBtn) {
        createAccountBtn.addEventListener("click", handleSignup);
    }

    if (loginBtn) {
        loginBtn.addEventListener("click", handleLogin);
    }

    // Allow Enter key login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(e){
            e.preventDefault();
            handleLogin();
        });
    }
}


// Password hashing
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}


// Signup
async function handleSignup() {

    const passwordInput = document.getElementById("signupPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const message = document.getElementById("signupMessage");

    if (!passwordInput || !confirmPasswordInput || !message) return;

    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!password || !confirmPassword) {
        message.textContent = "Please fill in both fields";
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match";
        return;
    }

    const hashedPassword = await hashPassword(password);

    localStorage.setItem("lotusNotesPassword", hashedPassword);
    sessionStorage.setItem("isAuthenticated", "true");

    window.location.href = "notes.html";
}


// Login
async function handleLogin() {

    console.log("Login clicked");

    const passwordInput = document.getElementById("loginPassword");
    const message = document.getElementById("loginMessage");

    if (!passwordInput || !message) return;

    const password = passwordInput.value.trim();

    if (!password) {
        message.textContent = "Please enter your password";
        return;
    }

    const storedHash = localStorage.getItem("lotusNotesPassword");

    if (!storedHash) {
        message.textContent = "No account found. Please create one first.";
        return;
    }

    const hashedInput = await hashPassword(password);

    const rememberMe = document.getElementById("rememberMe");

    if (hashedInput === storedHash) {

        if (rememberMe && rememberMe.checked) {
            localStorage.setItem("lotusRememberMe", "true");
            localStorage.setItem("isAuthenticated", "true");
        } else {
            localStorage.removeItem("lotusRememberMe");
            sessionStorage.setItem("isAuthenticated", "true");
        }

        window.location.href = "notes.html";

    } else {
        message.textContent = "Incorrect password";
    }
}