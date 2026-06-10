import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encodeTextToFrames, paletteForSignal } from "../morse";
import { MorsePage } from "./MorsePage";

type EventSourceMock = {
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onerror: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
};

type FetchMock = ReturnType<typeof vi.fn>;

describe("MorsePage", () => {
  const close = vi.fn();
  let eventSource: EventSourceMock;
  let fetchMock: FetchMock;

  beforeEach(() => {
    close.mockReset();
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    eventSource = {
      onmessage: null,
      onerror: null,
      close,
    };
    fetchMock = vi.fn(async () => new Response(JSON.stringify({ queued: "SOS" }), { status: 200 }));

    vi.stubGlobal(
      "EventSource",
      vi.fn(function EventSourceMockImpl() {
        return eventSource;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the heading and initial idle lamp", () => {
    render(<MorsePage />);

    expect(screen.getByRole("heading", { name: "Morse Stream" })).toBeInTheDocument();
    expect(screen.getByText("Decoded text:")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Morse signal lamp: waiting/ })).toHaveStyle({
      backgroundColor: "rgba(0, 0, 0, 0)",
    });
  });

  it("keeps the lamp idle while a word is still forming", () => {
    render(<MorsePage />);

    expect(vi.mocked(EventSource)).toHaveBeenCalledWith("/API/v1/morse/stream");

    const frames = encodeTextToFrames("HI THERE");

    for (const signal of frames.slice(0, 15)) {
      act(() => {
        eventSource.onmessage?.(new MessageEvent("message", { data: JSON.stringify(signal) }));
      });
    }

    expect(screen.getByText("H", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Morse signal lamp: waiting" })).toHaveStyle({
      backgroundColor: "rgba(0, 0, 0, 0)",
    });
    expect(screen.getByText(".... ..")).toBeInTheDocument();
  });

  it("shows the latest completed word on the lamp after a full word boundary", () => {
    render(<MorsePage />);

    const frames = encodeTextToFrames("HI ");
    for (const signal of frames) {
      act(() => {
        eventSource.onmessage?.(new MessageEvent("message", { data: JSON.stringify(signal) }));
      });
    }

    expect(screen.getByText("HI", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Morse signal lamp: HI" })).toHaveStyle({
      backgroundColor: "rgb(34, 197, 94)",
    });
  });

  it("lights the lamp for signal states and clears it for gaps", () => {
    render(<MorsePage />);

    const dashSignal = paletteForSignal("dash");
    act(() => {
      eventSource.onmessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            state: "dash",
            ...dashSignal,
          }),
        }),
      );
    });

    expect(screen.getByRole("img", { name: "Morse signal lamp: waiting" })).toHaveStyle({
      backgroundColor: "rgba(0, 0, 0, 0)",
    });

    const gapSignal = paletteForSignal("gap");
    act(() => {
      eventSource.onmessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            state: "gap",
            ...gapSignal,
          }),
        }),
      );
    });

    expect(screen.getByRole("img", { name: "Morse signal lamp: waiting" })).toHaveStyle({
      backgroundColor: "rgba(0, 0, 0, 0)",
    });
  });

  it("queues custom words through the server", async () => {
    render(<MorsePage />);

    fireEvent.change(screen.getByLabelText("Custom word"), { target: { value: "sos" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Queue" }));
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith("/API/v1/morse/queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: "sos " }),
    });
    expect(screen.getByLabelText("Custom word")).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent("Queued sos");
  });
});
