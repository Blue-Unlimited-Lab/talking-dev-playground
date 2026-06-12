import { describe, expect, it } from "vitest";
import {
  MORSE_ALPHABET,
  decodeFramesToText,
  decodeFramesToVisibleText,
  encodeTextToFrames,
  summarizeFramesIntoWordRows,
  type MorseFrame,
} from "./morse";

function compactFrameShape(frames: MorseFrame[]) {
  return frames.map((frame) => frame.state);
}

describe("morse helpers", () => {
  it("keeps all letters, digits, and space in the canonical alphabet reference", () => {
    const expectedAlphabet = {
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

    expect(MORSE_ALPHABET).toEqual(expectedAlphabet);
  });

  it("encodes text into 0.4 second Morse frames", () => {
    const frames = encodeTextToFrames("AB");

    expect(compactFrameShape(frames)).toEqual([
      "dot",
      "gap",
      "dash",
      "dash",
      "dash",
      "gap",
      "gap",
      "gap",
      "dash",
      "dash",
      "dash",
      "gap",
      "dot",
      "gap",
      "dot",
      "gap",
      "dot",
    ]);
  });

  it("round-trips letters and spaces through the same alphabet reference", () => {
    const originalText = "GREEN BLUE SOLOMON BABY BLUE";

    expect(decodeFramesToText(encodeTextToFrames(originalText))).toBe(originalText);
  });

  it("keeps word boundaries intact for adjacent words", () => {
    const frames = encodeTextToFrames("SOLOMON BLUE");

    expect(decodeFramesToText(frames)).toBe("SOLOMON BLUE");
  });

  it("only reveals completed letters in the visible decode", () => {
    const frames = encodeTextToFrames("SO");

    expect(decodeFramesToVisibleText(frames.slice(0, 7))).toBe("");
    expect(decodeFramesToVisibleText(frames.slice(0, 8))).toBe("S");
  });

  it("summarizes completed words with their Morse on the side", () => {
    const frames = encodeTextToFrames("HI ");
    const summary = summarizeFramesIntoWordRows(frames);

    expect(summary.rows[0]).toEqual({ word: "HI", morse: ".... .." });
    expect(summary.activeRow).toEqual({ word: "", morse: "" });
    expect(summary.latestCompletedRow).toEqual({ word: "HI", morse: ".... .." });
  });
});
