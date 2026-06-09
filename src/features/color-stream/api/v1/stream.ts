const colors = ["green", "red"] as const;

export function pickRandomColor(random = Math.random) {
  return colors[Math.floor(random() * colors.length)] ?? "green";
}

export function pickRandomDelayMs(random = Math.random) {
  return 500 + Math.floor(random() * 1501);
}

export function sleep(ms: number, timer = setTimeout) {
  return new Promise<void>((resolve) => timer(resolve, ms));
}

export function createSseStream(
  getColor = pickRandomColor,
  getDelayMs = pickRandomDelayMs,
  wait = sleep,
) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const color = getColor();
          controller.enqueue(encoder.encode(`data: ${color}\n\n`));
          await wait(getDelayMs());
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
