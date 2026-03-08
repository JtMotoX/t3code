function normalizeWebSocketProtocol(protocol: string): string {
  if (protocol === "http:") return "ws:";
  if (protocol === "https:") return "wss:";
  return protocol;
}

function normalizeHttpProtocol(protocol: string): string {
  if (protocol === "ws:") return "http:";
  if (protocol === "wss:") return "https:";
  return protocol;
}

function resolveUrlAgainstWindow(input: string): URL | null {
  if (typeof window === "undefined") return null;
  try {
    return new URL(input, window.location.href);
  } catch {
    return null;
  }
}

export function resolveWebSocketUrl(input?: string): string {
  if (typeof window === "undefined") return input ?? "";

  if (typeof input === "string" && input.length > 0) {
    const parsed = resolveUrlAgainstWindow(input);
    if (!parsed) return input;
    parsed.protocol = normalizeWebSocketProtocol(parsed.protocol);
    return parsed.toString();
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

export function resolveConfiguredWebSocketUrl(): string {
  if (typeof window === "undefined") return "";

  const bridgeUrl = window.desktopBridge?.getWsUrl?.();
  const envUrl = import.meta.env.VITE_WS_URL as string | undefined;
  const candidate =
    typeof bridgeUrl === "string" && bridgeUrl.length > 0
      ? bridgeUrl
      : typeof envUrl === "string" && envUrl.length > 0
        ? envUrl
        : undefined;

  return resolveWebSocketUrl(candidate);
}

export function resolveServerHttpOrigin(): string {
  if (typeof window === "undefined") return "";

  const resolvedWsUrl = resolveConfiguredWebSocketUrl();
  if (resolvedWsUrl.length === 0) return window.location.origin;

  const parsed = resolveUrlAgainstWindow(resolvedWsUrl);
  if (!parsed) return window.location.origin;
  parsed.protocol = normalizeHttpProtocol(parsed.protocol);
  return parsed.origin;
}
