import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFrame, encodeTextToFrames, type MorseFrame } from "../../morse";

export const MORSE_FRAME_DELAY_MS = 400;
const MORSE_DEMO_WORDS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../demo-words.txt",
);
const queuedWords: string[] = [];
let demoWordIndex = 0;

type MorseSequenceSource =
  | MorseFrame[]
  | (() => Promise<MorseFrame[]> | MorseFrame[]);

export function sleep(ms: number, timer = setTimeout) {
  return new Promise<void>((resolve) => timer(resolve, ms));
}

export function parseDemoWords(contents: string) {
  return contents
    .split(/\r?\n/u)
    .map((line) => line.trim().toUpperCase())
    .filter(Boolean);
}

export function chooseRandomDemoWord(words: string[], random = Math.random) {
  return words[Math.floor(random() * words.length)] ?? "";
}

export async function loadDemoWords(read = readFile) {
  const contents = await read(MORSE_DEMO_WORDS_PATH, "utf8");
  const words = parseDemoWords(contents);

  if (words.length === 0) {
    throw new Error("Morse demo word list is empty");
  }

  return words;
}

async function createRandomDemoSequence(random = Math.random) {
  const demoWords = await loadDemoWords();
  return encodeTextToFrames(chooseRandomDemoWord(demoWords, random));
}

export async function queueHandler(request: Request) {
  const payload = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof payload?.text === "string" ? payload.text.trim() : "";

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  for (const word of text.split(/\s+/).filter(Boolean)) {
    queuedWords.push(word);
  }

  return Response.json({ queued: text });
}

function splitFramesIntoWordSequences(frames: MorseFrame[]) {
  const words: MorseFrame[][] = [];
  let currentWord: MorseFrame[] = [];
  let currentGapLength = 0;

  for (const frame of frames) {
    currentWord.push(frame);

    if (frame.state === "gap") {
      currentGapLength += 1;
      if (currentGapLength >= 7) {
        words.push(currentWord);
        currentWord = [];
        currentGapLength = 0;
      }
      continue;
    }

    currentGapLength = 0;
  }

  if (currentWord.length > 0) {
    words.push(currentWord);
  }

  return words;
}

function getDemoWordSequences(sequence: MorseFrame[]) {
  const fallbackSequence = sequence.length > 0 ? sequence : [createFrame("gap")];
  return splitFramesIntoWordSequences(fallbackSequence);
}

function shiftQueuedWord(demoSequences: MorseFrame[][]) {
  const queuedWord = queuedWords.shift();
  if (queuedWord) {
    return encodeTextToFrames(`${queuedWord} `);
  }

  if (demoWordIndex < demoSequences.length) {
    const demoSequence = demoSequences[demoWordIndex];
    demoWordIndex += 1;
    return demoSequence;
  }

  demoWordIndex = 0;
  return demoSequences[demoWordIndex++] ?? null;
}

function toStreamSignal(signal: MorseFrame) {
  return { state: signal.state };
}

export function createSseStream(
  sequenceSource: MorseSequenceSource = createRandomDemoSequence,
  wait = sleep,
) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const fallbackSequence =
            typeof sequenceSource === "function" ? await sequenceSource() : sequenceSource;
          const demoSequences = getDemoWordSequences(fallbackSequence);
          const activeSequence = shiftQueuedWord(demoSequences) ?? [createFrame("gap")];

          for (const signal of activeSequence) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(toStreamSignal(signal))}\n\n`));
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

export function resetMorseQueueForTests() {
  queuedWords.length = 0;
  demoWordIndex = 0;
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
