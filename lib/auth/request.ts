export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  const configuredAppUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000");
  if (!configuredAppUrl) {
    return false;
  }

  let requestOrigin: URL;
  let configuredOrigin: URL;
  try {
    requestOrigin = new URL(origin);
    configuredOrigin = new URL(configuredAppUrl);
  } catch {
    return false;
  }

  if (process.env.NODE_ENV === "production" && configuredOrigin.protocol !== "https:") {
    return false;
  }

  if (requestOrigin.origin === configuredOrigin.origin) {
    return true;
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  return (
    process.env.NODE_ENV !== "production" &&
    localHosts.has(requestOrigin.hostname) &&
    localHosts.has(configuredOrigin.hostname) &&
    requestOrigin.protocol === configuredOrigin.protocol &&
    requestOrigin.port === configuredOrigin.port
  );
}
