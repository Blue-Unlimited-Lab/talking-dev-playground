import { describe, expect, it } from "vitest";
import { createSseStream, queueHandler, streamHandler } from "./stream";

async function readFirstChunk(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body was not readable");
  }

  const { value } = await reader.read();
  await reader.cancel();
  return new TextDecoder().decode(value);
}

describe("morse streamHandler", () => {
  it("returns SSE headers", async () => {
    const response = await streamHandler();

    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toContain("no-cache");
    expect(response.headers.get("Connection")).toBe("keep-alive");
  });

  it("emits JSON SSE messages for Morse states", async () => {
    const response = new Response(
      createSseStream(
        [{ state: "dot", colorName: "green", colorHex: "#22c55e", isLit: true }],
        async () => {},
      ),
      {
        headers: {
          "Content-Type": "text/event-stream",
        },
      },
    );

    const firstChunk = await readFirstChunk(response);

    expect(firstChunk).toBe(
      'data: {"state":"dot","colorName":"green","colorHex":"#22c55e","isLit":true}\n\n',
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

    expect(firstChunk).toContain('"state":"dot"');
  });
});
