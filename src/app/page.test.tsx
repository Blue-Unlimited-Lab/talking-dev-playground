import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the playground title", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Talking Dev Playground" })).toBeInTheDocument();
  });
});
