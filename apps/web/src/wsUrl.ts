function trimToUndefined(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function fallbackWebSocketScheme(protocol: string): "ws" | "wss" {
  return protocol === "https:" ? "wss" : "ws";
}

export function resolveWebSocketUrl(input?: {
  readonly explicitUrl?: string | undefined;
  readonly bridgeUrl?: string | null | undefined;
  readonly envUrl?: string | undefined;
  readonly location?: Pick<Location, "hostname" | "port" | "protocol">;
}): string {
  const explicitUrl = trimToUndefined(input?.explicitUrl);
  if (explicitUrl) return explicitUrl;

  const bridgeUrl = trimToUndefined(input?.bridgeUrl);
  if (bridgeUrl) return bridgeUrl;

  const envUrl = trimToUndefined(input?.envUrl);
  if (envUrl) return envUrl;

  const location = input?.location ?? window.location;
  const scheme = fallbackWebSocketScheme(location.protocol);
  const host = location.port.length > 0 ? `${location.hostname}:${location.port}` : location.hostname;
  return `${scheme}://${host}`;
}

export function webSocketUrlToHttpOrigin(wsUrl: string): string {
  const httpUrl = wsUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
  try {
    return new URL(httpUrl).origin;
  } catch {
    return httpUrl;
  }
}
