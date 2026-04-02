"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchWithSession } from "../../../../lib/auth-client";

type MePayload = {
  plan?: {
    code?: string;
    creditBalanceCents?: number;
    currentPeriodEnd?: string | null;
    isPaid?: boolean;
    name?: string;
    status?: string | null;
  };
};

type UsagePayload = {
  usage?: Array<{
    metric: string;
    quantity: number;
  }>;
};

type InvoicesPayload = {
  items?: Array<{
    amountPaidCents: number;
    createdAt: string;
    currency: string;
    hostedInvoiceUrl?: string | null;
    id: string;
    invoicePdfUrl?: string | null;
    status: string;
  }>;
};

type BudgetPayload = {
  alerts?: Array<{
    level: string;
    message: string;
    timestamp: string;
  }>;
  records?: Array<{
    agentId: string;
    consumed: number;
    limit: number;
  }>;
  usageEvents?: Array<{
    agentId: string;
    costBRL: number;
    executionMode: string;
    timestamp: string;
  }>;
};

type BudgetEstimatePayload = {
  estimate?: {
    avgCostBRL: number;
    details: string;
  };
};

type BudgetForm = {
  agentId: string;
  limit: number;
};

type BudgetPanelProps = {
  budget: BudgetPayload;
  budgetEstimate: BudgetEstimatePayload;
  budgetForm: BudgetForm;
  budgetMessage: string;
  onAgentChange: (agentId: string) => void;
  onExportBudgetCsv: () => void;
  onLimitChange: (limit: number) => void;
  onSaveBudget: () => void;
};

function asCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: currency.toUpperCase(),
    style: "currency"
  }).format(cents / 100);
}

function statusColor(status: string | null | undefined): "status-red" | "status-yellow" | "status-green" {
  if (status === "active") {
    return "status-green";
  }

  if (status === "past_due" || status === "paused") {
    return "status-yellow";
  }

  return "status-red";
}

function BillingHero() {
  return (
    <section className="hero-card">
      <span className="badge">Billing Settings</span>
      <h1>Plano atual, renovacao e consumo</h1>
      <p>Visao consolidada para acompanhar assinatura, barras de uso e faturas com download.</p>
    </section>
  );
}

function PlanSummarySection({
  currentPlanName,
  currentPlanStatus,
  me
}: {
  currentPlanName: string;
  currentPlanStatus: string | null;
  me: MePayload | null;
}) {
  const renewalDate = me?.plan?.currentPeriodEnd
    ? new Date(me.plan.currentPeriodEnd).toLocaleDateString("pt-BR")
    : "Sem data";

  return (
    <section className="panel">
      <div className="stats-grid">
        <article>
          <span className="badge">Plano ativo</span>
          <strong>{currentPlanName}</strong>
          <p>{me?.plan?.isPaid ? "Assinatura paga" : "Plano gratuito / trial"}</p>
        </article>
        <article>
          <span className="badge">Status</span>
          <strong className={statusColor(currentPlanStatus)}>{currentPlanStatus ?? "unknown"}</strong>
          <p>Verde = ativo, amarelo = pendencia, vermelho = cancelado.</p>
        </article>
        <article>
          <span className="badge">Renovacao</span>
          <strong>{renewalDate}</strong>
          <p>Proxima data de cobranca estimada.</p>
        </article>
        <article>
          <span className="badge">Creditos</span>
          <strong>{asCurrency(me?.plan?.creditBalanceCents ?? 0, "usd")}</strong>
          <p>Saldo acumulado de downgrade/proration disponivel no tenant.</p>
        </article>
      </div>
    </section>
  );
}

function UsageSection({ usage, usageMax }: { usage: UsagePayload; usageMax: number }) {
  return (
    <section className="panel">
      <h2>Consumo de Tokens e Uso</h2>
      <div className="quota-grid">
        {(usage.usage ?? []).map((metric) => {
          const percentage = Math.min(100, Math.round((metric.quantity / usageMax) * 100));

          return (
            <article className="quota-card" key={metric.metric}>
              <span className="badge">{metric.metric}</span>
              <h2>{metric.quantity.toLocaleString("pt-BR")}</h2>
              <div className="meter" aria-hidden="true">
                <span style={{ width: `${percentage}%` }} />
              </div>
              <p>{percentage}% do maior indicador atual.</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function InvoiceAction({
  hostedInvoiceUrl,
  invoicePdfUrl
}: {
  hostedInvoiceUrl?: string | null | undefined;
  invoicePdfUrl?: string | null | undefined;
}) {
  if (invoicePdfUrl) {
    return (
      <a className="ghost-button" href={invoicePdfUrl}>
        Download PDF
      </a>
    );
  }

  if (hostedInvoiceUrl) {
    return (
      <a className="ghost-button" href={hostedInvoiceUrl}>
        Abrir no Stripe
      </a>
    );
  }

  return <span className="badge">Sem link</span>;
}

function InvoiceSection({ invoices }: { invoices: InvoicesPayload }) {
  return (
    <section className="panel">
      <h2>Invoices</h2>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Status</th>
              <th>Valor pago</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {(invoices.items ?? []).map((invoice) => (
              <tr key={invoice.id}>
                <td>{new Date(invoice.createdAt).toLocaleDateString("pt-BR")}</td>
                <td>
                  <span className={`status-pill ${statusColor(invoice.status)}`}>{invoice.status}</span>
                </td>
                <td>{asCurrency(invoice.amountPaidCents, invoice.currency)}</td>
                <td>
                  <InvoiceAction
                    hostedInvoiceUrl={invoice.hostedInvoiceUrl}
                    invoicePdfUrl={invoice.invoicePdfUrl}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BudgetAlerts({ alerts }: { alerts: BudgetPayload["alerts"] }) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
      {alerts.map((alert) => (
        <div
          key={`${alert.level}-${alert.timestamp}`}
          style={{
            background: "rgba(159,77,0,0.08)",
            border: "1px solid rgba(159,77,0,0.18)",
            borderRadius: 12,
            padding: "0.75rem"
          }}
        >
          <strong>{alert.level}</strong>
          <p style={{ margin: "0.35rem 0 0" }}>{alert.message}</p>
        </div>
      ))}
    </div>
  );
}

function BudgetPanel({
  budget,
  budgetEstimate,
  budgetForm,
  budgetMessage,
  onAgentChange,
  onExportBudgetCsv,
  onLimitChange,
  onSaveBudget
}: BudgetPanelProps) {
  return (
    <section className="panel" id="agent-budget">
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Budget por Agente</h2>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Configure limite, acompanhe historico e exporte CSV por tenant.
          </p>
        </div>
        <button className="ghost-button" onClick={onExportBudgetCsv} type="button">
          Exportar CSV
        </button>
      </div>

      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "2fr 1fr auto" }}>
        <input
          onChange={(event) => onAgentChange(event.target.value)}
          placeholder="ceo-pack, sales-pack, maestro-orchestrator-pack"
          value={budgetForm.agentId}
        />
        <input
          min={1}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          type="number"
          value={budgetForm.limit}
        />
        <button onClick={onSaveBudget} type="button">
          Salvar limite
        </button>
      </div>

      <div className="stats-grid" style={{ marginTop: "1rem" }}>
        <article>
          <span className="badge">Estimativa</span>
          <strong>R$ {budgetEstimate.estimate?.avgCostBRL?.toFixed(2) ?? "0.00"}</strong>
          <p>{budgetEstimate.estimate?.details ?? "Selecione um agente para estimar."}</p>
        </article>
        <article>
          <span className="badge">Alertas</span>
          <strong>{budget.alerts?.length ?? 0}</strong>
          <p>Warn 80% e bloqueio 100% ficam rastreados aqui.</p>
        </article>
      </div>

      <div className="table-wrapper" style={{ marginTop: "1rem" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Agente</th>
              <th>Consumido</th>
              <th>Limite</th>
            </tr>
          </thead>
          <tbody>
            {(budget.records ?? []).map((record) => (
              <tr key={record.agentId}>
                <td>{record.agentId}</td>
                <td>R$ {record.consumed.toFixed(2)}</td>
                <td>R$ {record.limit.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-wrapper" style={{ marginTop: "1rem" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Agente</th>
              <th>Modo</th>
              <th>Custo</th>
            </tr>
          </thead>
          <tbody>
            {(budget.usageEvents ?? []).map((event, index) => (
              <tr key={`${event.agentId}-${event.timestamp}-${index}`}>
                <td>{new Date(event.timestamp).toLocaleString("pt-BR")}</td>
                <td>{event.agentId}</td>
                <td>{event.executionMode}</td>
                <td>R$ {event.costBRL.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BudgetAlerts alerts={budget.alerts} />
      {budgetMessage ? <p style={{ color: "var(--muted)", marginBottom: 0 }}>{budgetMessage}</p> : null}
    </section>
  );
}

export default function BillingSettingsPage() {
  const [me, setMe] = useState<MePayload | null>(null);
  const [usage, setUsage] = useState<UsagePayload>({ usage: [] });
  const [invoices, setInvoices] = useState<InvoicesPayload>({ items: [] });
  const [budget, setBudget] = useState<BudgetPayload>({ alerts: [], records: [], usageEvents: [] });
  const [budgetEstimate, setBudgetEstimate] = useState<BudgetEstimatePayload>({});
  const [budgetForm, setBudgetForm] = useState<BudgetForm>({
    agentId: "ceo-pack",
    limit: 100
  });
  const [budgetMessage, setBudgetMessage] = useState("");

  async function refreshBudget(): Promise<void> {
    const [budgetResponse, estimateResponse] = await Promise.all([
      fetchWithSession("/api/v1/budgets/usage"),
      fetchWithSession(`/api/v1/budgets/estimate?agentId=${encodeURIComponent(budgetForm.agentId)}`)
    ]);

    if (budgetResponse.ok) {
      setBudget((await budgetResponse.json()) as BudgetPayload);
    }

    if (estimateResponse.ok) {
      setBudgetEstimate((await estimateResponse.json()) as BudgetEstimatePayload);
    }
  }

  useEffect(() => {
    void Promise.all([
      fetchWithSession("/api/v1/me"),
      fetchWithSession("/api/v1/billing/usage"),
      fetchWithSession("/api/v1/billing/invoices")
    ])
      .then(async ([meResponse, usageResponse, invoiceResponse]) => {
        if (meResponse.ok) {
          setMe((await meResponse.json()) as MePayload);
        }
        if (usageResponse.ok) {
          setUsage((await usageResponse.json()) as UsagePayload);
        }
        if (invoiceResponse.ok) {
          setInvoices((await invoiceResponse.json()) as InvoicesPayload);
        }
      })
      .catch(() => undefined);

    void refreshBudget().catch(() => undefined);
  }, []);

  const usageMax = useMemo(() => {
    const values = (usage.usage ?? []).map((item) => item.quantity);
    return Math.max(1, ...values);
  }, [usage.usage]);

  const currentPlanStatus = me?.plan?.status ?? null;
  const currentPlanName = me?.plan?.name ?? "Starter";

  async function updateBudgetLimit(): Promise<void> {
    const response = await fetchWithSession("/api/v1/budgets/limits", {
      body: JSON.stringify({
        agentId: budgetForm.agentId,
        limit: Number(budgetForm.limit)
      }),
      headers: {
        "content-type": "application/json"
      },
      method: "POST"
    });

    setBudgetMessage(response.ok ? "Limite atualizado com sucesso." : `Falha ao salvar limite (${response.status}).`);

    if (response.ok) {
      await refreshBudget();
    }
  }

  async function exportBudgetCsv(): Promise<void> {
    const response = await fetchWithSession("/api/v1/budgets/export.csv");

    if (!response.ok) {
      setBudgetMessage(`Falha ao exportar CSV (${response.status}).`);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "budget-usage.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setBudgetMessage("CSV exportado com sucesso.");
  }

  return (
    <>
      <BillingHero />
      <PlanSummarySection
        currentPlanName={currentPlanName}
        currentPlanStatus={currentPlanStatus}
        me={me}
      />
      <UsageSection usage={usage} usageMax={usageMax} />
      <InvoiceSection invoices={invoices} />
      <BudgetPanel
        budget={budget}
        budgetEstimate={budgetEstimate}
        budgetForm={budgetForm}
        budgetMessage={budgetMessage}
        onAgentChange={(agentId) => setBudgetForm((current) => ({ ...current, agentId }))}
        onExportBudgetCsv={() => void exportBudgetCsv()}
        onLimitChange={(limit) => setBudgetForm((current) => ({ ...current, limit }))}
        onSaveBudget={() => void updateBudgetLimit()}
      />
    </>
  );
}
