const ACCESS_KEY = "easypro_access";
const REFRESH_KEY = "easypro_refresh";

/** Match SIMPLE_JWT lifetimes in backend settings */
const ACCESS_MAX_AGE = 60 * 60 * 24; // 1 day
const REFRESH_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/**
 * Share session cookies across easypro.mn subdomains
 * (easypro.mn, www, agent, company, dashboard).
 */
function sharedCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const fromEnv = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim();
  if (fromEnv) return fromEnv;

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return undefined;
  if (host === "easypro.mn" || host.endsWith(".easypro.mn")) {
    return ".easypro.mn";
  }
  return undefined;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ];
  if (window.location.protocol === "https:") {
    parts.push("Secure");
  }
  const domain = sharedCookieDomain();
  if (domain) {
    parts.push(`Domain=${domain}`);
  }
  document.cookie = parts.join("; ");
}

function eraseCookie(name: string) {
  if (typeof document === "undefined") return;
  const bases = [
    `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`,
  ];
  const domain = sharedCookieDomain();
  if (domain) {
    bases.push(
      `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax; Domain=${domain}`,
    );
  }
  // Also clear host-only cookies left from older deploys
  bases.push(`${encodeURIComponent(name)}=; Path=/; Max-Age=0`);
  for (const c of bases) {
    document.cookie = c;
  }
}

function migrateFromLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(key);
    if (value) {
      localStorage.removeItem(key);
    }
    return value;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromCookie = readCookie(ACCESS_KEY);
  if (fromCookie) return fromCookie;
  const legacy = migrateFromLocalStorage(ACCESS_KEY);
  if (legacy) {
    writeCookie(ACCESS_KEY, legacy, ACCESS_MAX_AGE);
    return legacy;
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromCookie = readCookie(REFRESH_KEY);
  if (fromCookie) return fromCookie;
  const legacy = migrateFromLocalStorage(REFRESH_KEY);
  if (legacy) {
    writeCookie(REFRESH_KEY, legacy, REFRESH_MAX_AGE);
    return legacy;
  }
  return null;
}

export function setTokens(access: string, refresh: string) {
  writeCookie(ACCESS_KEY, access, ACCESS_MAX_AGE);
  writeCookie(REFRESH_KEY, refresh, REFRESH_MAX_AGE);
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

export function setAccessToken(access: string) {
  writeCookie(ACCESS_KEY, access, ACCESS_MAX_AGE);
  try {
    localStorage.removeItem(ACCESS_KEY);
  } catch {
    /* ignore */
  }
}

export function clearTokens() {
  eraseCookie(ACCESS_KEY);
  eraseCookie(REFRESH_KEY);
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
