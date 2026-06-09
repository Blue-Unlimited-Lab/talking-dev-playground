import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the registered playground namespaces", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Registered experiments" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Welcome/ })).toHaveAttribute("href", "/welcome");
  });
});
