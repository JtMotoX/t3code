import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveConfiguredWebSocketUrl, resolveServerHttpOrigin, resolveWebSocketUrl } from "./wsUrl";

const originalWindow = globalThis.window;

function setWindowLocation(input: { href: string; origin: string; protocol: string; host: string }) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: input,
      desktopBridge: undefined,
    },
  });
}

beforeEach(() => {
  setWindowLocation({
    href: "http://localhost:3000/chat",
    origin: "http://localhost:3000",
    protocol: "http:",
    host: "localhost:3000",
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

describe("resolveWebSocketUrl", () => {
  it("uses ws for http pages when no explicit URL is configured", () => {
    expect(resolveWebSocketUrl()).toBe("ws://localhost:3000");
  });

  it("uses wss for https pages when no explicit URL is configured", () => {
    setWindowLocation({
      href: "https://tunnel.example/chat",
      origin: "https://tunnel.example",
      protocol: "https:",
      host: "tunnel.example",
    });

    expect(resolveWebSocketUrl()).toBe("wss://tunnel.example");
  });

  it("upgrades explicit https URLs to wss", () => {
    expect(resolveWebSocketUrl("https://tunnel.example/ws")).toBe("wss://tunnel.example/ws");
  });

  it("keeps explicit ws URLs unchanged", () => {
    expect(resolveWebSocketUrl("ws://localhost:3020/socket")).toBe("ws://localhost:3020/socket");
  });
});

describe("resolveConfiguredWebSocketUrl", () => {
  it("prefers the desktop bridge URL", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          href: "http://localhost:3000/chat",
          origin: "http://localhost:3000",
          protocol: "http:",
          host: "localhost:3000",
        },
        desktopBridge: {
          getWsUrl: () => "https://bridge.example/socket",
        },
      },
    });

    expect(resolveConfiguredWebSocketUrl()).toBe("wss://bridge.example/socket");
  });
});

describe("resolveServerHttpOrigin", () => {
  it("maps websocket URLs back to https origins for asset requests", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          href: "https://tunnel.example/chat",
          origin: "https://tunnel.example",
          protocol: "https:",
          host: "tunnel.example",
        },
        desktopBridge: {
          getWsUrl: () => "wss://api.example/socket?token=abc",
        },
      },
    });

    expect(resolveServerHttpOrigin()).toBe("https://api.example");
  });
});
