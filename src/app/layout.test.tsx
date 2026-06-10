import { afterEach, describe, expect, it } from "vitest";
import RootLayout from "./layout";

const originalValue = process.env.NEXT_PUBLIC_SUPPRESS_HTML_HYDRATION_WARNING;

describe("RootLayout", () => {
  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_SUPPRESS_HTML_HYDRATION_WARNING;
      return;
    }

    process.env.NEXT_PUBLIC_SUPPRESS_HTML_HYDRATION_WARNING = originalValue;
  });

  it("does not suppress hydration warnings by default", () => {
    delete process.env.NEXT_PUBLIC_SUPPRESS_HTML_HYDRATION_WARNING;

    const tree = RootLayout({
      children: <div>child</div>,
    });

    expect(tree.props.suppressHydrationWarning).toBe(false);
  });

  it("enables html suppressHydrationWarning when the env var is true", () => {
    process.env.NEXT_PUBLIC_SUPPRESS_HTML_HYDRATION_WARNING = "true";

    const tree = RootLayout({
      children: <div>child</div>,
    });

    expect(tree.props.suppressHydrationWarning).toBe(true);
  });

  it("still renders the expected document structure", () => {
    const tree = RootLayout(
      {
        children: <div>child</div>,
      },
    );

    expect(tree.type).toBe("html");
    expect(tree.props.lang).toBe("en");
    expect(tree.props.children).toBeTruthy();
  });
});
