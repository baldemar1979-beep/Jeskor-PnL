import { AppShell } from "@/components/app-shell";
import { ScenarioSimulator } from "@/components/scenario-simulator";
import { SectionCard } from "@/components/section-card";
import { sampleData } from "@/lib/sample-data";

export default function ScenariosPage() {
  return (
    <AppShell eyebrow="What-If" title="Scenario planning simulator">
      <SectionCard
        title="Interactive assumptions"
        subtitle="Adjust multiple assumptions at the same time without changing the underlying financial records."
      >
        <ScenarioSimulator data={sampleData} />
      </SectionCard>
    </AppShell>
  );
}
