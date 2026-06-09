import { normalizeFeaturePath } from "./routing";

describe("normalizeFeaturePath", () => {
  it("maps missing path parts to the namespace root", () => {
    expect(normalizeFeaturePath()).toBe("/");
  });

  it("maps path parts to a feature-local path", () => {
    expect(normalizeFeaturePath(["create"])).toBe("/create");
    expect(normalizeFeaturePath(["edit", "123"])).toBe("/edit/123");
  });
});
