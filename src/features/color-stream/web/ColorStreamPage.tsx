"use client";

import { useEffect, useState } from "react";

export function ColorStreamPage() {
  const [lines, setLines] = useState<string[]>([]);
  const [currentColor, setCurrentColor] = useState("green");
  const [showUpdated, setShowUpdated] = useState(false);

  useEffect(() => {
    const source = new EventSource("/API/v1/color-stream/stream");
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    source.onmessage = (event) => {
      setCurrentColor(event.data);
      setShowUpdated(true);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        setShowUpdated(false);
      }, 200);
      setLines((current) => [
        `[${new Date().toISOString()}] New color arrived: ${event.data}`,
        ...current,
      ]);
    };

    source.onerror = () => {
      source.close();
      setLines((current) => ["Stream closed", ...current]);
    };

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      source.close();
    };
  }, []);

  return (
    <main>
      <h1>Color Stream</h1>
      <section aria-label="Current color">
        <div
          aria-label={`Current color box: ${currentColor}`}
          role="img"
          data-updated={showUpdated ? "true" : "false"}
          style={{
            position: "relative",
            display: "grid",
            placeItems: "center",
            width: 160,
            height: 160,
            borderRadius: 16,
            border: "2px solid #111827",
            backgroundColor: currentColor,
            transition: "background-color 200ms ease",
            color: "#111827",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              opacity: showUpdated ? 1 : 0,
              transition: "opacity 200ms ease",
            }}
          >
            updated
          </span>
        </div>
      </section>
      <div role="log" aria-live="polite">
        {lines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </main>
  );
}
