import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MORSE_FRAME_DELAY_MAX_MS,
  MORSE_FRAME_DELAY_MIN_MS,
  MORSE_FRAME_DELAY_MS,
  MORSE_FRAME_DELAY_STEP_MS,
  createFrame,
  encodeTextToFrames,
  type MorseFrame,
} from "../../morse";
const MORSE_DEMO_WORDS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../demo-words.txt",
);
const queuedWords: string[] = [];
let demoWordIndex = 0;
let demoWordsCache: string[] | null = null;

type MorseSequenceSource =
  | MorseFrame[]
  | (() => Promise<MorseFrame[]> | MorseFrame[]);

export function sleep(ms: number, timer = setTimeout) {
  return new Promise<void>((resolve) => timer(resolve, ms));
}

export function parseMorseFrameDelayMs(request: Request | URL | string | undefined) {
  const url = request
    ? request instanceof URL
      ? request
      : new URL(typeof request === "string" ? request : request.url)
    : null;
  const rawDelayMs = url?.searchParams.get("delayMs");
  const parsedDelayMs = rawDelayMs ? Number(rawDelayMs) : MORSE_FRAME_DELAY_MS;

  if (!Number.isFinite(parsedDelayMs)) {
    return MORSE_FRAME_DELAY_MS;
  }

  const roundedDelayMs =
    Math.round(parsedDelayMs / MORSE_FRAME_DELAY_STEP_MS) * MORSE_FRAME_DELAY_STEP_MS;
  return Math.min(MORSE_FRAME_DELAY_MAX_MS, Math.max(MORSE_FRAME_DELAY_MIN_MS, roundedDelayMs));
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
  const demoWords = await getDemoWords();
  return encodeTextToFrames(`${chooseRandomDemoWord(demoWords, random)} `);
}

async function getDemoWords() {
  if (!demoWordsCache) {
    demoWordsCache = await loadDemoWords();
  }

  return demoWordsCache;
}

export async function queueHandler(request: Request) {
  const payload = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof payload?.text === "string" ? payload.text.trim() : "";

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  for (const word of text.split(/\s+/u).filter(Boolean)) {
    queuedWords.push(`${word} `);
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
    return encodeTextToFrames(queuedWord);
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
  if (signal.state === "dot") {
    return ".";
  }

  if (signal.state === "dash") {
    return "-";
  }

  return "/";
}

function appendSequenceSeparator(sequence: MorseFrame[]) {
  const lastSignal = sequence[sequence.length - 1];
  if (lastSignal?.state === "gap") {
    return sequence;
  }

  return [...sequence, createFrame("gap"), createFrame("gap"), createFrame("gap")];
}

export function createSseStream(
  sequenceSource: MorseSequenceSource = createRandomDemoSequence,
  wait = sleep,
  frameDelayMs = MORSE_FRAME_DELAY_MS,
) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const fallbackSequence =
            typeof sequenceSource === "function" ? await sequenceSource() : sequenceSource;
          const demoSequences = getDemoWordSequences(fallbackSequence);
          const activeSequence = appendSequenceSeparator(
            shiftQueuedWord(demoSequences) ?? [createFrame("gap")],
          );

          for (const signal of activeSequence) {
            controller.enqueue(encoder.encode(`data: ${toStreamSignal(signal)}\n\n`));
            await wait(frameDelayMs);
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
  demoWordsCache = null;
}

export async function streamHandler(request: Request) {
  const stream = createSseStream(undefined, undefined, parseMorseFrameDelayMs(request));

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
