export const MORSE_ALPHABET = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  0: "-----",
  1: ".----",
  2: "..---",
  3: "...--",
  4: "....-",
  5: ".....",
  6: "-....",
  7: "--...",
  8: "---..",
  9: "----.",
  " ": "/",
} as const;

export type MorseCharacter = keyof typeof MORSE_ALPHABET;
export type MorseState = "dot" | "dash" | "gap";
export type MorseFrame = {
  state: MorseState;
  colorName: string;
  colorHex: string;
  isLit: boolean;
};

export type MorseWordRow = {
  word: string;
  morse: string;
};

type MorseSignal = {
  state: MorseState;
  durationUnits: number;
};

const signalPalette: Record<MorseState, Omit<MorseFrame, "state">[]> = {
  dot: [
    { colorName: "green", colorHex: "#22c55e", isLit: true },
    { colorName: "mint", colorHex: "#34d399", isLit: true },
    { colorName: "lime", colorHex: "#84cc16", isLit: true },
    { colorName: "emerald", colorHex: "#10b981", isLit: true },
    { colorName: "seafoam", colorHex: "#2dd4bf", isLit: true },
  ],
  dash: [
    { colorName: "baby blue", colorHex: "#89cff0", isLit: true },
    { colorName: "cyan", colorHex: "#22d3ee", isLit: true },
    { colorName: "azure", colorHex: "#38bdf8", isLit: true },
    { colorName: "sky", colorHex: "#0ea5e9", isLit: true },
    { colorName: "ice", colorHex: "#7dd3fc", isLit: true },
  ],
  gap: [
    { colorName: "solomon", colorHex: "#6f5b4b", isLit: false },
    { colorName: "charcoal", colorHex: "#334155", isLit: false },
    { colorName: "graphite", colorHex: "#475569", isLit: false },
    { colorName: "ash", colorHex: "#64748b", isLit: false },
    { colorName: "sand", colorHex: "#78716c", isLit: false },
  ],
};

const reverseAlphabet = Object.fromEntries(
  Object.entries(MORSE_ALPHABET).map(([character, morse]) => [morse, character]),
) as Record<string, string>;

export function paletteForSignal(state: MorseState, random = Math.random) {
  const palette = signalPalette[state];
  return palette[Math.floor(random() * palette.length)] ?? palette[0];
}

export function createFrame(state: MorseState, random = Math.random): MorseFrame {
  return {
    state,
    ...paletteForSignal(state, random),
  };
}

function createSignal(state: MorseState, durationUnits: number): MorseSignal {
  return { state, durationUnits };
}

function encodeTextToSignals(text: string) {
  const normalized = text.toUpperCase();
  const signals: MorseSignal[] = [];
  const tokens = normalized.match(/\S+|\s+/gu) ?? [];

  for (const token of tokens) {
    if (/^\s+$/u.test(token)) {
      signals.push(createSignal("gap", 7));
      continue;
    }

    for (let characterIndex = 0; characterIndex < token.length; characterIndex += 1) {
      const character = token[characterIndex] as MorseCharacter | undefined;
      const morse = character ? MORSE_ALPHABET[character] : undefined;

      if (!morse) {
        continue;
      }

      for (let symbolIndex = 0; symbolIndex < morse.length; symbolIndex += 1) {
        const symbol = morse[symbolIndex];
        signals.push(createSignal(symbol === "." ? "dot" : "dash", symbol === "." ? 1 : 3));

        if (symbolIndex < morse.length - 1) {
          signals.push(createSignal("gap", 1));
        }
      }

      if (characterIndex < token.length - 1) {
        signals.push(createSignal("gap", 3));
      }
    }
  }

  return signals;
}

function decodeSignalsToText(signals: MorseSignal[], flushTrailingSymbol = true) {
  const decoded: string[] = [];
  let currentSymbol = "";

  const flushCurrentSymbol = () => {
    if (!currentSymbol) {
      return;
    }

    decoded.push(reverseAlphabet[currentSymbol] ?? "?");
    currentSymbol = "";
  };

  for (const signal of signals) {
    if (signal.state === "dot") {
      currentSymbol += ".";
      continue;
    }

    if (signal.state === "dash") {
      currentSymbol += "-";
      continue;
    }

    if (signal.durationUnits >= 3) {
      flushCurrentSymbol();
    }

    if (signal.durationUnits >= 7 && decoded[decoded.length - 1] !== " ") {
      decoded.push(" ");
    }
  }

  if (flushTrailingSymbol) {
    flushCurrentSymbol();
  }

  return decoded.join("").trim();
}

function expandSignalsToFrames(signals: MorseSignal[], random = Math.random) {
  return signals.flatMap((signal) =>
    Array.from({ length: signal.durationUnits }, () => createFrame(signal.state, random)),
  );
}

function compressFramesToSignals(frames: MorseFrame[]) {
  if (frames.length === 0) {
    return [];
  }

  const signals: MorseSignal[] = [];
  let currentState = frames[0].state;
  let durationUnits = 1;

  for (let index = 1; index < frames.length; index += 1) {
    const frame = frames[index];

    if (frame.state === currentState) {
      durationUnits += 1;
      continue;
    }

    signals.push(createSignal(currentState, durationUnits));
    currentState = frame.state;
    durationUnits = 1;
  }

  signals.push(createSignal(currentState, durationUnits));

  return signals;
}

export function encodeTextToFrames(text: string, random = Math.random) {
  return expandSignalsToFrames(encodeTextToSignals(text), random);
}

export function decodeFramesToText(frames: MorseFrame[]) {
  return decodeSignalsToText(compressFramesToSignals(frames));
}

export function decodeFramesToVisibleText(frames: MorseFrame[]) {
  const signals = compressFramesToSignals(frames);
  const decoded: string[] = [];
  let currentSymbol = "";

  for (const signal of signals) {
    if (signal.state === "dot") {
      currentSymbol += ".";
      continue;
    }

    if (signal.state === "dash") {
      currentSymbol += "-";
      continue;
    }

    if (signal.durationUnits >= 3 && currentSymbol) {
      decoded.push(reverseAlphabet[currentSymbol] ?? "?");
      currentSymbol = "";
    }

    if (signal.durationUnits >= 7 && decoded[decoded.length - 1] !== " ") {
      decoded.push(" ");
    }
  }

  return decoded.join("").trim();
}

export function summarizeFramesIntoWordRows(frames: MorseFrame[]) {
  const signals = compressFramesToSignals(frames);
  const completedRows: MorseWordRow[] = [];
  let currentWord = "";
  let currentMorse = "";
  let currentSymbol = "";
  let latestCompletedLamp: MorseFrame | null = null;
  let lastVisibleSignal: MorseSignal | null = null;

  const commitSymbol = () => {
    if (!currentSymbol) {
      return;
    }

    currentWord += reverseAlphabet[currentSymbol] ?? "?";
    currentMorse = currentMorse ? `${currentMorse} ${currentSymbol}` : currentSymbol;
    currentSymbol = "";
  };

  const finalizeWord = () => {
    if (!currentWord) {
      return;
    }

    completedRows.push({
      word: currentWord,
      morse: currentMorse,
    });

    if (lastVisibleSignal) {
      latestCompletedLamp = createFrame(lastVisibleSignal.state);
    }

    currentWord = "";
    currentMorse = "";
  };

  for (const signal of signals) {
    if (signal.state === "dot") {
      currentSymbol += ".";
      lastVisibleSignal = signal;
      continue;
    }

    if (signal.state === "dash") {
      currentSymbol += "-";
      lastVisibleSignal = signal;
      continue;
    }

    if (signal.durationUnits >= 3) {
      commitSymbol();
    }

    if (signal.durationUnits >= 7) {
      finalizeWord();
    }
  }

  const activeRow: MorseWordRow = {
    word: currentWord,
    morse: currentMorse ? `${currentMorse}${currentSymbol ? ` ${currentSymbol}` : ""}` : currentSymbol,
  };

  return {
    activeRow,
    rows: completedRows,
    latestCompletedRow: completedRows[0] ?? null,
    latestCompletedLamp,
  };
}
