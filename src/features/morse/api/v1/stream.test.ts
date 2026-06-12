import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { encodeTextToFrames } from "../../morse";
import {
  createSseStream,
  chooseRandomDemoWord,
  parseDemoWords,
  parseMorseFrameDelayMs,
  resetMorseQueueForTests,
  queueHandler,
  streamHandler,
} from "./stream";

async function readFirstChunk(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body was not readable");
  }

  const { value } = await reader.read();
  await reader.cancel();
  return new TextDecoder().decode(value);
}

async function readChunks(reader: ReadableStreamDefaultReader<Uint8Array>, count: number) {
  const decoder = new TextDecoder();
  const chunks: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    chunks.push(decoder.decode(value));
  }

  return chunks;
}

async function openReader(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body was not readable");
  }
  return reader;
}

describe("morse streamHandler", () => {
  beforeEach(() => {
    resetMorseQueueForTests();
  });

  afterEach(() => {
    resetMorseQueueForTests();
  });

  it("parses one demo word per line", () => {
    expect(parseDemoWords(" green \n\nblue\r\nsolomon\n")).toEqual(["GREEN", "BLUE", "SOLOMON"]);
  });

  it("chooses a random demo word from the external list", () => {
    expect(chooseRandomDemoWord(["GREEN", "BLUE", "SOLOMON"], () => 0.4)).toBe("BLUE");
  });

  it("returns SSE headers", async () => {
    const response = await streamHandler(new Request("http://localhost/API/v1/morse/stream"));

    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toContain("no-cache");
    expect(response.headers.get("Connection")).toBe("keep-alive");
  });

  it("parses the configured emit cycle delay from the request", () => {
    expect(parseMorseFrameDelayMs(new Request("http://localhost/API/v1/morse/stream"))).toBe(400);
    expect(parseMorseFrameDelayMs(new Request("http://localhost/API/v1/morse/stream?delayMs=700"))).toBe(700);
    expect(parseMorseFrameDelayMs(new Request("http://localhost/API/v1/morse/stream?delayMs=725"))).toBe(700);
    expect(parseMorseFrameDelayMs(new Request("http://localhost/API/v1/morse/stream?delayMs=1200"))).toBe(1000);
  });

  it("emits symbolic SSE messages for Morse states", async () => {
    const response = new Response(
      createSseStream([{ state: "dot" }], async () => {}),
      {
        headers: {
          "Content-Type": "text/event-stream",
        },
      },
    );

    const firstChunk = await readFirstChunk(response);

    expect(firstChunk).toBe(
      "data: .\n\n",
    );
  });

  it("queues custom text for the next stream cycle", async () => {
    const response = await queueHandler(
      new Request("http://localhost/API/v1/morse/queue", {
        method: "POST",
        body: JSON.stringify({ text: "SOS" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ queued: "SOS" });

    const stream = new Response(createSseStream(undefined, async () => {}));
    const firstChunk = await readFirstChunk(stream);

    expect(firstChunk).toMatch(/^data: [.\-/]\n\n$/);
  });

  it("queues new words after the word currently being transported", async () => {
    const stream = new Response(createSseStream(encodeTextToFrames("A "), async () => {}));
    const reader = await openReader(stream);

    const firstWordFrames = encodeTextToFrames("A ").length;
    const initialChunks = await readChunks(reader, firstWordFrames);
    await queueHandler(
      new Request("http://localhost/API/v1/morse/queue", {
        method: "POST",
        body: JSON.stringify({ text: "T" }),
      }),
    );
    await queueHandler(
      new Request("http://localhost/API/v1/morse/queue", {
        method: "POST",
        body: JSON.stringify({ text: "E" }),
      }),
    );

    const nextChunks = await readChunks(reader, encodeTextToFrames("T ").length + encodeTextToFrames("E ").length);
    await reader.cancel();

    expect(initialChunks[0]).toMatch(/^data: [.\-/]\n\n$/);
    expect(nextChunks.join("")).toContain("data: -");
    expect(nextChunks.join("")).toContain("data: .");
  });

  it("falls back to a generated gap frame when a sequence source returns no frames", async () => {
    const response = new Response(createSseStream([], async () => {}));
    const firstChunk = await readFirstChunk(response);

    expect(firstChunk).toContain("data: /");
  });
});
