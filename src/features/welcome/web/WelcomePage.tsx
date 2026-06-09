import type { FeatureDefinition } from "@/features/types";

type WelcomePageProps = {
  features: FeatureDefinition[];
};

export function WelcomePage({ features }: WelcomePageProps) {
  return (
    <main className="shell welcome-page">
      <section className="welcome-intro" aria-labelledby="welcome-title">
        <p className="eyebrow">Talking Dev Playground</p>
        <h1 id="welcome-title">Registered experiments</h1>
        <p>Pick a namespace to open its web routes and related API experiments.</p>
      </section>

      <section className="feature-grid" aria-label="Registered namespaces">
        {features.map((feature) => (
          <a className="feature-card" href={`/${feature.namespace}`} key={feature.namespace}>
            <span className="feature-namespace">/{feature.namespace}</span>
            <strong>{feature.title}</strong>
            <span>{feature.description}</span>
          </a>
        ))}
      </section>
    </main>
  );
}
