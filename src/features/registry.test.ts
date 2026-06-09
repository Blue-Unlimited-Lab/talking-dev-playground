import { createFeatureRegistry } from "./registry";
import type { FeatureDefinition } from "./types";

const feature = (namespace: string, title = namespace): FeatureDefinition => ({
  namespace,
  title,
  description: title + " experiments",
  webRoutes: [],
  apiRoutes: [],
});

describe("createFeatureRegistry", () => {
  it("returns registered features sorted by title", () => {
    const registry = createFeatureRegistry([feature("todo", "Todo"), feature("george", "George")]);

    expect(registry.all().map((item) => item.namespace)).toEqual(["george", "todo"]);
    expect(registry.find("todo")?.title).toBe("Todo");
  });

  it("rejects duplicate namespaces", () => {
    expect(() => createFeatureRegistry([feature("todo"), feature("todo")])).toThrow(
      'Feature namespace "todo" is already registered.',
    );
  });

  it("rejects namespaces that cannot map cleanly to URLs", () => {
    expect(() => createFeatureRegistry([feature("Todo")])).toThrow(
      'Feature namespace "Todo" must use lowercase letters, numbers, and hyphens.',
    );
  });
});
