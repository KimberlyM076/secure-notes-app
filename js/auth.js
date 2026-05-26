const FALLBACK_API_BASE_URL = "http://localhost:5000";
const API_BASE_STORAGE_KEY = "lotusApiBaseUrl";
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

function normalizeBaseUrl(value) {
    if (!value || typeof value !== "string") return "";
    return value.trim().replace(/\/+$/, "");
}

function readApiBaseFromMeta() {
    const tag = document.querySelector('meta[name="lotus-api-base-url"]');
    return normalizeBaseUrl(tag?.content || "");
}

function getApiBaseCandidates() {
    const params = new URLSearchParams(window.location.search);
    const apiFromQuery = normalizeBaseUrl(params.get("api") || params.get("apiBaseUrl") || "");

    if (apiFromQuery) {
        localStorage.setItem(API_BASE_STORAGE_KEY, apiFromQuery);
        window.LOTUS_API_BASE_URL = apiFromQuery;
    }

    const fromGlobal = normalizeBaseUrl(window.LOTUS_API_BASE_URL || "");
    const fromStorage = normalizeBaseUrl(localStorage.getItem(API_BASE_STORAGE_KEY) || "");
    const fromMeta = readApiBaseFromMeta();
    const fromOrigin = normalizeBaseUrl(window.location.origin || "");
    const fromHost5000 = normalizeBaseUrl(`${window.location.protocol}//${window.location.hostname}:5000`);

    const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

    const candidates = [
        apiFromQuery,
        fromGlobal,
        fromStorage,
        fromMeta,
        fromOrigin,
        fromHost5000,
        isLocalHost ? FALLBACK_API_BASE_URL : ""
    ].filter(Boolean);

    return [...new Set(candidates)];
}

function getDefaultRedirectUri() {
    const appOrigin = normalizeBaseUrl(window.location.origin) || FALLBACK_API_BASE_URL;
    return `${appOrigin}/notes.html`;
}

function getDefaultLogoutUri() {
    const appOrigin = normalizeBaseUrl(window.location.origin) || FALLBACK_API_BASE_URL;
    return `${appOrigin}/`;
}

function getSafeLogoutReturnTo(config) {
    try {
        const rawValue = config?.logoutRedirectUri || getDefaultLogoutUri();
        const parsed = new URL(rawValue, window.location.origin);
        return parsed.origin;
    } catch {
        return window.location.origin;
    }
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
            // Prefer static config at project root for Netlify/static hosting.
            try {
                const staticResponse = await fetch("/auth-config.json", { cache: "no-store" });
                if (staticResponse.ok) {
                    const staticConfig = await staticResponse.json();
                    if (staticConfig?.domain && staticConfig?.clientId) {
                        if (staticConfig.apiBaseUrl) {
                            const normalizedApiBaseUrl = normalizeBaseUrl(staticConfig.apiBaseUrl);
                            if (normalizedApiBaseUrl) {
                                resolvedApiBaseUrl = normalizedApiBaseUrl;
                                window.LOTUS_API_BASE_URL = normalizedApiBaseUrl;
                                localStorage.setItem(API_BASE_STORAGE_KEY, normalizedApiBaseUrl);
                            }
                        }

                        return normalizeAuthConfig(staticConfig);
                    }
                }
            } catch (error) {
                console.warn("Static auth-config.json not available:", error.message);
            }

            const uniqueBases = getApiBaseCandidates();
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
                    localStorage.setItem(API_BASE_STORAGE_KEY, baseUrl);
                    return normalizeAuthConfig(config);
                } catch (error) {
                    errors.push(`${baseUrl} -> ${error.message}`);
                }
            }

            throw new Error(
                `Unable to load Auth0 config from known backends: ${errors.join(" | ")}. ` +
                `If your frontend and backend are on different hosts, open this page with ?api=https://your-backend-domain`
            );
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
            returnTo: getSafeLogoutReturnTo(config)
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

function wireGuestButton(guestButton) {
    if (!guestButton) return;

    guestButton.addEventListener("click", () => {
        sessionStorage.setItem("lotusGuestMode", "true");
        window.location.href = "/notes.html?guest=1";
    });
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
    const guestButton = document.getElementById("guestAccessBtn");
    if (!loginButton && !signupButton && !guestButton) return;

    try {
        const user = await getAuthenticatedUser();
        if (user) {
            window.location.href = "notes.html";
            return;
        }

        wireAuthButtons(loginButton, signupButton);
        wireGuestButton(guestButton);

        if (isEntryPage()) {
            await maybeRunRouteAction();
        }
    } catch (error) {
        console.error(error);
        showAuthError(`Auth configuration error: ${error.message}`);
    }
});