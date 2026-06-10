import { createFrame, encodeTextToFrames, type MorseFrame } from "../../morse";

export const MORSE_DEMO_TEXT = "GREEN BLUE SOLOMON BABY BLUE";
export const MORSE_FRAME_DELAY_MS = 400;
const queuedTexts: string[] = [];

export function sleep(ms: number, timer = setTimeout) {
  return new Promise<void>((resolve) => timer(resolve, ms));
}

export async function queueHandler(request: Request) {
  const payload = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof payload?.text === "string" ? payload.text.trim() : "";

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  queuedTexts.push(text);

  return Response.json({ queued: text });
}

function shiftQueuedFrames() {
  const queuedText = queuedTexts.shift();
  return queuedText ? encodeTextToFrames(queuedText) : null;
}

export function createSseStream(
  sequence: MorseFrame[] = encodeTextToFrames(MORSE_DEMO_TEXT),
  wait = sleep,
) {
  const encoder = new TextEncoder();
  const streamSequence = sequence.length > 0 ? sequence : [createFrame("gap")];

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const queuedFrames = shiftQueuedFrames();
          const activeSequence = queuedFrames && queuedFrames.length > 0 ? queuedFrames : streamSequence;

          for (const signal of activeSequence) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(signal)}\n\n`));
            await wait(MORSE_FRAME_DELAY_MS);
          }
        }
      } catch {
        controller.close();
      }
    },
    cancel() {},
  });
}

export async function streamHandler() {
  const stream = createSseStream();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
