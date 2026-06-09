import { featureRegistry } from "@/features";
import { WelcomePage } from "@/features/welcome/web/WelcomePage";

export default function HomePage() {
  return <WelcomePage features={featureRegistry.all()} />;
}
