import { notFound } from "next/navigation";

import { getWebConfig } from "@birthub/config";

import { AgentRunPanel } from "../../../../../components/agents/agent-run-panel";
import { getInstalledAgentById } from "../../../../../lib/agents";

interface AgentRunPageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentRunPage({ params }: Readonly<AgentRunPageProps>) {
  const { id } = await params;
  const agent = await getInstalledAgentById(id);

  if (!agent) {
    notFound();
  }

  const config = getWebConfig();

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h2 style={{ margin: 0 }}>Run Agent</h2>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Execucao live governada com logs persistidos, replay SSE, memoria compartilhada e output automatico.
        </p>
      </header>
      <AgentRunPanel agentId={agent.id} apiUrl={config.NEXT_PUBLIC_API_URL} />
    </section>
  );
}
