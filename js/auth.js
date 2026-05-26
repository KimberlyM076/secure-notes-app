const FALLBACK_API_BASE_URL = "http://localhost:5000";
let resolvedApiBaseUrl = window.LOTUS_API_BASE_URL || "";

let authSettingsPromise;
let authClientPromise;

function showAuthError(message) {
    const container = document.querySelector(".auth-card") || document.body;
    const existing = document.getElementById("authErrorMessage");

    if (existing) {
        existing.textContent = message;
        return;
    }

    const p = document.createElement("p");
    p.id = "authErrorMessage";
    p.style.color = "#b00020";
    p.style.marginTop = "12px";
    p.textContent = message;
    container.appendChild(p);
}

function getDefaultRedirectUri() {
    return `${resolvedApiBaseUrl || FALLBACK_API_BASE_URL}/auth/callback`;
}

function getDefaultLogoutUri() {
    return `${resolvedApiBaseUrl || FALLBACK_API_BASE_URL}/index.html`;
}

function normalizeAuthConfig(config) {
    return {
        ...config,
        redirectUri: config.redirectUri || getDefaultRedirectUri(),
        logoutRedirectUri: config.logoutRedirectUri || getDefaultLogoutUri()
    };
}

async function getAuthSettings() {
    if (!authSettingsPromise) {
        authSettingsPromise = (async () => {
            const candidateBases = [
                window.LOTUS_API_BASE_URL,
                window.location.origin,
                FALLBACK_API_BASE_URL
            ].filter(Boolean);

            const uniqueBases = [...new Set(candidateBases)];
            const errors = [];

            for (const baseUrl of uniqueBases) {
                try {
                    const response = await fetch(`${baseUrl}/auth-config`);
                    if (!response.ok) {
                        const errorText = await response.text();
                        errors.push(`${baseUrl} -> ${response.status}`);
                        console.warn(`Auth config fetch failed for ${baseUrl}:`, errorText);
                        continue;
                    }

                    const config = await response.json();
                    if (!config.domain || !config.clientId) {
                        errors.push(`${baseUrl} -> invalid payload`);
                        continue;
                    }

                    resolvedApiBaseUrl = baseUrl;
                    window.LOTUS_API_BASE_URL = baseUrl;
                    return normalizeAuthConfig(config);
                } catch (error) {
                    errors.push(`${baseUrl} -> ${error.message}`);
                }
            }

            throw new Error(`Unable to load Auth0 config from known backends: ${errors.join(" | ")}`);
        })();
    }

    return authSettingsPromise;
}

async function getAuthClient() {
    if (!authClientPromise) {
        authClientPromise = getAuthSettings().then((config) => auth0.createAuth0Client({
            domain: config.domain,
            clientId: config.clientId,
            authorizationParams: {
                redirect_uri: config.redirectUri
            },
            cacheLocation: "localstorage"
        }));
    }

    return authClientPromise;
}

async function handleAuthCallback(client) {
    const hasCallbackParams = window.location.search.includes("code=") && window.location.search.includes("state=");
    if (!hasCallbackParams) return;

    await client.handleRedirectCallback();
    window.history.replaceState({}, document.title, window.location.pathname);
}

export async function getAuthenticatedUser() {
    const client = await getAuthClient();
    await handleAuthCallback(client);

    const isAuthenticated = await client.isAuthenticated();
    if (!isAuthenticated) return null;

    return client.getUser();
}

export async function login() {
    const client = await getAuthClient();
    try {
        await client.loginWithRedirect();
    } catch (error) {
        showAuthError(`Login failed: ${error.message}`);
        throw error;
    }
}

export async function signup() {
    const client = await getAuthClient();
    try {
        await client.loginWithRedirect({
            authorizationParams: {
                screen_hint: "signup"
            }
        });
    } catch (error) {
        showAuthError(`Signup failed: ${error.message}`);
        throw error;
    }
}

export async function logout() {
    const config = await getAuthSettings();
    const client = await getAuthClient();
    await client.logout({
        logoutParams: {
            returnTo: config.logoutRedirectUri
        }
    });
}

export async function requireAuth() {
    const user = await getAuthenticatedUser();
    if (user) return user;

    await login();
    return null;
}

function isEntryPage() {
    const path = window.location.pathname.toLowerCase();
    return path.endsWith("/index.html") || path.endsWith("/login.html") || path === "/" || path === "/login" || path === "/signup";
}

function wireAuthButtons(loginButton, signupButton) {
    if (loginButton) {
        loginButton.addEventListener("click", async () => {
            await login();
        });
    }

    if (signupButton) {
        signupButton.addEventListener("click", async () => {
            await signup();
        });
    }
}

async function maybeRunRouteAction() {
    const params = new URLSearchParams(window.location.search);
    const action = (params.get("action") || "").toLowerCase();

    if (action === "signup") {
        await signup();
    }

    if (action === "login") {
        await login();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const loginButton = document.getElementById("auth0LoginBtn");
    const signupButton = document.getElementById("auth0SignupBtn");
    if (!loginButton && !signupButton) return;

    try {
        const user = await getAuthenticatedUser();
        if (user) {
            window.location.href = "notes.html";
            return;
        }

        wireAuthButtons(loginButton, signupButton);

        if (isEntryPage()) {
            await maybeRunRouteAction();
        }
    } catch (error) {
        console.error(error);
        showAuthError(`Auth configuration error: ${error.message}`);
    }
});