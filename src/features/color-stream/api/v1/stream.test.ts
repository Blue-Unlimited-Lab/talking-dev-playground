import { describe, expect, it, vi } from "vitest";
import { createSseStream, streamHandler } from "./stream";

async function readFirstChunk(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body was not readable");
  }

  const { value } = await reader.read();
  await reader.cancel();
  return new TextDecoder().decode(value);
}

describe("streamHandler", () => {
  it("returns SSE headers", async () => {
    const response = await streamHandler();

    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toContain("no-cache");
    expect(response.headers.get("Connection")).toBe("keep-alive");
  });

  it("begins with SSE data format", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const response = new Response(createSseStream(), {
      headers: {
        "Content-Type": "text/event-stream",
      },
    });

    const firstChunk = await readFirstChunk(response);

    expect(firstChunk).toMatch(/^data: green\n\n$/);
  });
});
