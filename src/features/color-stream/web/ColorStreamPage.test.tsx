import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ColorStreamPage } from "./ColorStreamPage";

type EventSourceMock = {
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onerror: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
};

describe("ColorStreamPage", () => {
  const close = vi.fn();
  let eventSource: EventSourceMock;

  beforeEach(() => {
    close.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-09T12:34:56.000Z"));
    eventSource = {
      onmessage: null,
      onerror: null,
      close,
    };

    vi.stubGlobal(
      "EventSource",
      vi.fn(function EventSourceMockImpl() {
        return eventSource;
      }),
    );
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders the heading", () => {
    render(<ColorStreamPage />);

    expect(screen.getByRole("heading", { name: "Color Stream" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Current color box: green" })).toBeInTheDocument();
    expect(screen.getByText("updated")).toHaveStyle({ opacity: "0" });
  });

  it("appends a log line when a message arrives", () => {
    render(<ColorStreamPage />);

    expect(vi.mocked(EventSource)).toHaveBeenCalledWith("/API/v1/color-stream/stream");

    act(() => {
      eventSource.onmessage?.(new MessageEvent("message", { data: "green" }));
    });

    expect(screen.getByRole("log")).toHaveTextContent(
      "[2026-06-09T12:34:56.000Z] New color arrived: green for 200ms",
    );
  });

  it("prepends the newest log line before older entries", () => {
    render(<ColorStreamPage />);

    act(() => {
      eventSource.onmessage?.(new MessageEvent("message", { data: "green" }));
    });

    act(() => {
      vi.advanceTimersByTime(1);
    });

    act(() => {
      eventSource.onmessage?.(new MessageEvent("message", { data: "red" }));
    });

    const log = screen.getByRole("log");
    expect(log.textContent).toMatch(
      /^\[2026-06-09T12:34:56\.001Z\] New color arrived: red for 200ms\[2026-06-09T12:34:56\.000Z\] New color arrived: green for 200ms$/,
    );
  });

  it("updates the color box when a message arrives", () => {
    render(<ColorStreamPage />);

    act(() => {
      eventSource.onmessage?.(new MessageEvent("message", { data: "red" }));
    });

    expect(screen.getByRole("img", { name: "Current color box: red" })).toHaveStyle({
      backgroundColor: "rgb(255, 0, 0)",
    });
    expect(screen.getByText("updated")).toHaveStyle({ opacity: "1" });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText("updated")).toHaveStyle({ opacity: "0" });
  });
});
