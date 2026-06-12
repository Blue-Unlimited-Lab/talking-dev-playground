"use client";

import { useEffect, useState } from "react";
import {
  decodeFramesToVisibleText,
  paletteForSignal,
  summarizeFramesIntoWordRows,
  type MorseFrame,
  type MorseState,
  type MorseWordRow,
} from "../morse";

const idleSignal = {
  state: "gap",
  ...paletteForSignal("gap"),
} satisfies MorseFrame;

function frameFromState(state: MorseState): MorseFrame {
  return {
    state,
    ...paletteForSignal(state),
  };
}

function stateFromStreamData(data: string): MorseState | null {
  if (data === ".") {
    return "dot";
  }

  if (data === "-") {
    return "dash";
  }

  if (data === "/") {
    return "gap";
  }

  return null;
}

export function MorsePage() {
  const [signals, setSignals] = useState<MorseFrame[]>([]);
  const [currentSignal, setCurrentSignal] = useState<MorseFrame>(idleSignal);
  const [queueText, setQueueText] = useState("");
  const [queueStatus, setQueueStatus] = useState("Ready");

  useEffect(() => {
    const source = new EventSource("/API/v1/morse/stream");

    source.onmessage = (event) => {
      const state = stateFromStreamData(event.data);
      if (!state) {
        return;
      }

      const signal = frameFromState(state);

      setCurrentSignal(signal);
      setSignals((current) => [...current, signal].slice(-200));
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, []);

  const decodedText = decodeFramesToVisibleText(signals);
  const { activeRow, rows, latestCompletedRow, latestCompletedLamp } = summarizeFramesIntoWordRows(signals);
  const lampRow = latestCompletedRow;
  const lampFrame: MorseFrame = latestCompletedLamp ?? currentSignal;

  async function queueWord() {
    const text = queueText.trim();
    if (!text) {
      setQueueStatus("Enter a word first");
      return;
    }

    const queuedText = `${text} `;

    const response = await fetch("/API/v1/morse/queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: queuedText }),
    });

    if (!response.ok) {
      setQueueStatus("Queue failed");
      return;
    }

    setQueueText("");
    setQueueStatus(`Queued ${text}`);
  }

  return (
    <main>
      <h1>Morse Stream</h1>
      <p>
        A three-state stream sends one 0.4 second Morse frame at a time. Each word builds
        letter by letter, then lands on its own row with the Morse shown beside it.
      </p>
      <section aria-label="Queue custom word">
        <label htmlFor="morse-queue-input">Custom word</label>
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          <input
            id="morse-queue-input"
            aria-label="Custom word"
            value={queueText}
            onChange={(event) => setQueueText(event.target.value)}
            placeholder="type a word"
            style={{
              minWidth: 240,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(148, 163, 184, 0.45)",
              fontSize: 16,
            }}
          />
          <button
            type="button"
            onClick={() => {
              void queueWord();
            }}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #0f172a",
              background: "#0f172a",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            Queue
          </button>
        </div>
        <p role="status">{queueStatus}</p>
      </section>
      <section aria-label="Current Morse signal">
        <div
          aria-label={`Morse signal lamp: ${lampRow?.word || "waiting"}`}
          role="img"
          style={{
            position: "relative",
            display: "grid",
            placeItems: "center",
            width: 180,
            height: 180,
            borderRadius: 18,
            border: `3px solid ${lampFrame?.colorHex ?? currentSignal.colorHex}`,
            backgroundColor: lampRow ? (lampFrame?.colorHex ?? currentSignal.colorHex) : "transparent",
            boxShadow: lampRow ? `0 0 36px ${lampFrame?.colorHex ?? currentSignal.colorHex}` : "none",
            color: "#0f172a",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            transition: "background-color 180ms ease, box-shadow 180ms ease",
          }}
        >
          <span>{lampRow?.word || currentSignal.colorName}</span>
        </div>
      </section>
      <p>
        Decoded text: <strong>{decodedText || "Waiting for signal"}</strong>
      </p>
      <section aria-label="Morse words">
        <div
          style={{
            display: "grid",
            gap: 12,
            marginTop: 20,
          }}
        >
          <WordRow row={activeRow} label="forming above" faded />
          {rows.map((row) => (
            <WordRow key={`${row.word}-${row.morse}`} row={row} />
          ))}
        </div>
      </section>
    </main>
  );
}

function WordRow({ row, label, faded = false }: { row: MorseWordRow; label?: string; faded?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: 16,
        alignItems: "center",
        padding: "12px 16px",
        borderRadius: 14,
        border: "1px solid rgba(148, 163, 184, 0.25)",
        background: faded ? "rgba(15, 23, 42, 0.04)" : "transparent",
        opacity: row.word || row.morse ? 1 : 0.5,
      }}
    >
      <div>
        {label ? (
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {label}
          </div>
        ) : null}
        <div style={{ fontSize: 24, fontWeight: 700 }}>{row.word || "..."}</div>
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 18 }}>{row.morse || "..."}</div>
    </div>
  );
}
