import { describe, expect, it } from "vitest";

import { resolveWebSocketUrl, webSocketUrlToHttpOrigin } from "./wsUrl";

describe("resolveWebSocketUrl", () => {
  it("prefers the explicit url override", () => {
    expect(
      resolveWebSocketUrl({
        explicitUrl: "wss://explicit.example/ws",
        bridgeUrl: "ws://bridge.example",
        envUrl: "ws://env.example",
        location: { protocol: "https:", hostname: "ignored.example", port: "443" },
      }),
    ).toBe("wss://explicit.example/ws");
  });

  it("uses wss for https pages when no override is provided", () => {
    expect(
      resolveWebSocketUrl({
        location: { protocol: "https:", hostname: "secure.example", port: "443" },
      }),
    ).toBe("wss://secure.example:443");
  });

  it("uses ws for http pages when no override is provided", () => {
    expect(
      resolveWebSocketUrl({
        location: { protocol: "http:", hostname: "insecure.example", port: "8080" },
      }),
    ).toBe("ws://insecure.example:8080");
  });
});

describe("webSocketUrlToHttpOrigin", () => {
  it("maps secure websocket urls to https origins", () => {
    expect(webSocketUrlToHttpOrigin("wss://secure.example:443/socket?token=abc")).toBe(
      "https://secure.example",
    );
  });

  it("maps insecure websocket urls to http origins", () => {
    expect(webSocketUrlToHttpOrigin("ws://insecure.example:8080/socket")).toBe(
      "http://insecure.example:8080",
    );
  });
});
