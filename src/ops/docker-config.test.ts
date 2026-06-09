import { readFileSync } from "node:fs";

describe("Docker dev strategy", () => {
  it("uses the mainstream Node image for the app container", () => {
    const dockerfile = readFileSync("Dockerfile", "utf8");

    expect(dockerfile).toContain("FROM node:22-bookworm-slim AS deps");
    expect(dockerfile).toContain("FROM node:22-bookworm-slim AS dev");
  });

  it("mounts the codebase and keeps generated folders container-owned", () => {
    const compose = readFileSync("docker-compose.yml", "utf8");

    expect(compose).toContain("- .:/app");
    expect(compose).toContain("- playground_node_modules:/app/node_modules");
    expect(compose).toContain("- playground_next:/app/.next");
  });
});
