const ADMIN_SESSION_COOKIE = "admin_session";

type RuntimeEnv = {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

type CookieValue = {
  value: string;
};

type RequestLike = {
  cookies?: {
    get(name: string): CookieValue | undefined;
  };
};

function getEnv(name: string) {
  const runtime = globalThis as RuntimeEnv;
  return runtime.process?.env?.[name];
}

export function getAdminSessionCookieName() {
  return ADMIN_SESSION_COOKIE;
}

export function isAdminRequest(request: RequestLike) {
  const sessionCookie = request.cookies?.get(ADMIN_SESSION_COOKIE)?.value;
  return sessionCookie === "1";
}

export function isAdminCredentials(username: string, password: string) {
  const adminUsername = getEnv("ADMIN_USERNAME") || "admin";
  const adminPassword = getEnv("ADMIN_PASSWORD") || "admin123";

  return username === adminUsername && password === adminPassword;
}
