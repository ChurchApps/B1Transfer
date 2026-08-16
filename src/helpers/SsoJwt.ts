let inboundJwt = "";

export function splitSsoJwt(pathname: string, search: string, hash: string): { jwt: string; url: string } {
  const searchParams = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const jwt = hashParams.get("jwt") || searchParams.get("jwt") || "";
  searchParams.delete("jwt");
  hashParams.delete("jwt");
  const qs = searchParams.toString();
  const hs = hashParams.toString();
  return { jwt, url: pathname + (qs ? "?" + qs : "") + (hs ? "#" + hs : "") };
}

export function takeInboundJwt(): string {
  if (typeof window === "undefined") return inboundJwt;
  const { jwt, url } = splitSsoJwt(window.location.pathname, window.location.search, window.location.hash);
  if (jwt) inboundJwt = jwt;
  if (url !== window.location.pathname + window.location.search + window.location.hash) window.history.replaceState(null, "", url);
  return inboundJwt;
}

export function resolveSsoJwt(cookieJwt?: string): string {
  return takeInboundJwt() || cookieJwt || "";
}

export function clearSsoJwt() {
  inboundJwt = "";
}
