import { render, screen } from "@testing-library/react";
import type { FeatureDefinition } from "@/features/types";
import { WelcomePage } from "./WelcomePage";

const features: FeatureDefinition[] = [
  {
    namespace: "welcome",
    title: "Welcome",
    description: "Lists registered namespaces.",
    webRoutes: [],
    apiRoutes: [],
  },
  {
    namespace: "test-streaming",
    title: "Test Streaming",
    description: "Streaming experiments.",
    webRoutes: [],
    apiRoutes: [],
  },
];

describe("WelcomePage", () => {
  it("presents registered namespaces as links", () => {
    render(<WelcomePage features={features} />);

    expect(screen.getByRole("heading", { name: "Registered experiments" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Welcome/ })).toHaveAttribute("href", "/welcome");
    expect(screen.getByRole("link", { name: /Test Streaming/ })).toHaveAttribute("href", "/test-streaming");
  });
});
