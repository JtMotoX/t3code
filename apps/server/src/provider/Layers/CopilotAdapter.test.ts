import assert from "node:assert/strict";

import { ThreadId } from "@t3tools/contracts";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { it, vi } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { ServerConfig } from "../../config.ts";
import { CopilotAdapter } from "../Services/CopilotAdapter.ts";
import { makeCopilotAdapterLive } from "./CopilotAdapter.ts";

const asThreadId = (value: string): ThreadId => ThreadId.makeUnsafe(value);

class FakeCopilotSession {
  constructor(readonly sessionId: string) {}

  destroy = vi.fn(async () => undefined);
  on = vi.fn((_handler: (event: never) => void) => () => undefined);
  send = vi.fn(async () => "message-1");
  abort = vi.fn(async () => undefined);
  getMessages = vi.fn(async () => []);
}

class FakeCopilotClient {
  connected = false;
  readonly callLog: string[] = [];
  readonly session = new FakeCopilotSession("session-1");

  start = vi.fn(async () => {
    this.callLog.push("start");
    this.connected = true;
  });

  listModels = vi.fn(async () => {
    this.callLog.push("listModels");
    if (!this.connected) {
      throw new Error("Client not connected");
    }
    return [
      {
        id: "gpt-5.4",
        name: "GPT-5.4",
        capabilities: {
          supports: {
            vision: false,
            reasoningEffort: false,
          },
          limits: {
            max_context_window_tokens: 200_000,
          },
        },
      },
    ];
  });

  createSession = vi.fn(async () => {
    this.callLog.push("createSession");
    return this.session;
  });

  resumeSession = vi.fn(async () => {
    this.callLog.push("resumeSession");
    return this.session;
  });

  stop = vi.fn(async () => []);
}

const fakeClient = new FakeCopilotClient();
const layer = it.layer(
  makeCopilotAdapterLive({
    clientFactory: () => fakeClient,
  }).pipe(
    Layer.provideMerge(ServerConfig.layerTest(process.cwd(), process.cwd())),
    Layer.provideMerge(NodeServices.layer),
  ),
);

layer("CopilotAdapterLive startup", (it) => {
  it.effect("starts the SDK client before model validation on new sessions", () =>
    Effect.gen(function* () {
      fakeClient.connected = false;
      fakeClient.callLog.length = 0;
      fakeClient.start.mockClear();
      fakeClient.listModels.mockClear();
      fakeClient.createSession.mockClear();

      const adapter = yield* CopilotAdapter;
      const session = yield* adapter.startSession({
        provider: "copilot",
        threadId: asThreadId("thread-copilot-start"),
        model: "gpt-5.4",
        runtimeMode: "full-access",
      });

      assert.equal(session.provider, "copilot");
      assert.equal(session.threadId, "thread-copilot-start");
      assert.deepStrictEqual(fakeClient.callLog, ["start", "listModels", "createSession"]);
      assert.equal(fakeClient.start.mock.calls.length, 1);
      assert.equal(fakeClient.listModels.mock.calls.length, 1);
      assert.equal(fakeClient.createSession.mock.calls.length, 1);
    }),
  );
});
