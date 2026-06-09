import nextConfig from "../../next.config";

describe("Next dev config", () => {
  it("allows local network and yord origins for dev HMR", () => {
    expect(nextConfig.allowedDevOrigins).toEqual([
      "127.0.0.1",
      "192.168.*.*",
      "*.yord.xyz",
      "**.yord.xyz",
    ]);
  });
});
