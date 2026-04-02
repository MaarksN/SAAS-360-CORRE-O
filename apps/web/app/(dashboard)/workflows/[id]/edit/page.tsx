"use client";

import "reactflow/dist/style.css";

import { use, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";

import { getWebConfig } from "@birthub/config";
import { Play, Save, Shuffle, Zap } from "lucide-react";
import { useForm, type UseFormReturn } from "react-hook-form";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange
} from "reactflow";

import {
  applySidebarValues,
  autoLayout,
  buildValidation,
  decorateNodes,
  loadWorkflowDefinition,
  nodeTypes,
  saveWorkflowDefinition,
  type BuilderNodeData,
  type SidebarValues
} from "./workflow-editor-helpers";

type WorkflowStatus = "ARCHIVED" | "DRAFT" | "PUBLISHED";

const apiBaseUrl = getWebConfig().NEXT_PUBLIC_API_URL;

function useWorkflowForm(selectedNode: Node<BuilderNodeData> | null): UseFormReturn<SidebarValues> {
  const form = useForm<SidebarValues>({
    defaultValues: {
      configJson: JSON.stringify(selectedNode?.data.config ?? {}, null, 2),
      label: selectedNode?.data.label ?? ""
    }
  });

  useEffect(() => {
    form.reset({
      configJson: JSON.stringify(selectedNode?.data.config ?? {}, null, 2),
      label: selectedNode?.data.label ?? ""
    });
  }, [form, selectedNode]);

  return form;
}

function useWorkflowLoader({
  id,
  setEdges,
  setLoadingError,
  setNodes,
  setSelectedNodeId,
  setWorkflowName,
  setWorkflowStatus
}: {
  id: string;
  setEdges: (edges: Edge[]) => void;
  setLoadingError: (message: string | null) => void;
  setNodes: (nodes: Node<BuilderNodeData>[]) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowStatus: (status: WorkflowStatus) => void;
}) {
  useEffect(() => {
    let cancelled = false;

    void loadWorkflowDefinition(apiBaseUrl, id)
      .then(({ flow, payload }) => {
        if (cancelled) {
          return;
        }

        setWorkflowName(payload.workflow.name);
        setWorkflowStatus(payload.workflow.status);
        setNodes(autoLayout(flow.nodes));
        setEdges(flow.edges);
        setSelectedNodeId(flow.nodes[0]?.id ?? null);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadingError(error instanceof Error ? error.message : "Falha ao carregar workflow.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, setEdges, setLoadingError, setNodes, setSelectedNodeId, setWorkflowName, setWorkflowStatus]);
}

function StatusNotice({
  background,
  border,
  children,
  color
}: {
  background: string;
  border: string;
  children: ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        background,
        border,
        borderRadius: 10,
        color,
        fontSize: 12,
        marginTop: 6,
        padding: "0.65rem"
      }}
    >
      {children}
    </div>
  );
}

function WorkflowEditorCanvas({
  decoratedNodes,
  edges,
  isPending,
  onConnectEdge,
  onEdgesChange,
  onNodesChange,
  onPickNode,
  onPublish,
  onSave,
  onShuffle,
  validationErrors,
  workflowName,
  workflowStatus,
  setWorkflowName
}: {
  decoratedNodes: Node<BuilderNodeData>[];
  edges: Edge[];
  isPending: boolean;
  onConnectEdge: (connection: Connection) => void;
  onEdgesChange: OnEdgesChange;
  onNodesChange: OnNodesChange;
  onPickNode: (nodeId: string) => void;
  onPublish: () => void;
  onSave: () => void;
  onShuffle: () => void;
  setWorkflowName: (name: string) => void;
  validationErrors: string[];
  workflowName: string;
  workflowStatus: WorkflowStatus;
}) {
  const actionsDisabled = isPending || validationErrors.length > 0;

  return (
    <div
      style={{
        border: "1px solid #d0d8e1",
        borderRadius: 16,
        display: "grid",
        gridTemplateRows: "auto 1fr",
        overflow: "hidden"
      }}
    >
      <header
        style={{
          alignItems: "center",
          background: "linear-gradient(120deg, #0f4c5c, #1a936f)",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          padding: "0.7rem 0.9rem"
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <input
            onChange={(event) => setWorkflowName(event.target.value)}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              padding: "0.4rem 0.55rem"
            }}
            value={workflowName}
          />
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            Status atual: {workflowStatus} · editor persistido no backend real.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onShuffle}
            style={{ alignItems: "center", display: "inline-flex", gap: 6 }}
            type="button"
          >
            <Shuffle size={14} /> Organizar Canvas
          </button>
          <button
            disabled={actionsDisabled}
            onClick={onSave}
            style={{ alignItems: "center", display: "inline-flex", gap: 6 }}
            type="button"
          >
            <Save size={14} /> Salvar
          </button>
          <button
            disabled={actionsDisabled}
            onClick={onPublish}
            style={{ alignItems: "center", display: "inline-flex", gap: 6 }}
            type="button"
          >
            <Play size={14} /> Publicar
          </button>
        </div>
      </header>
      <div style={{ background: "radial-gradient(circle at 20% 0, #f6f9ff, #fff 60%)" }}>
        <ReactFlow
          edges={edges}
          fitView
          nodeTypes={nodeTypes}
          nodes={decoratedNodes}
          onConnect={onConnectEdge}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_event, node) => onPickNode(node.id)}
          onNodesChange={onNodesChange}
        >
          <MiniMap pannable zoomable />
          <Controls />
          <Background gap={20} size={1.2} />
        </ReactFlow>
      </div>
    </div>
  );
}

function WorkflowSidebar({
  form,
  loadingError,
  onSubmit,
  saveMessage,
  validationErrors
}: {
  form: UseFormReturn<SidebarValues>;
  loadingError: string | null;
  onSubmit: (values: SidebarValues) => void;
  saveMessage: string | null;
  validationErrors: string[];
}) {
  return (
    <aside
      style={{
        background: "#fff",
        border: "1px solid #d0d8e1",
        borderRadius: 16,
        display: "grid",
        gap: "0.75rem",
        gridTemplateRows: "auto auto 1fr",
        padding: "0.9rem"
      }}
    >
      <h3 style={{ margin: 0 }}>Node Sidebar</h3>
      <div style={{ color: "#455a64", fontSize: 13 }}>
        Esta tela agora carrega e salva o canvas real do workflow. Edite um node e publique sem depender de `initialNodes`.
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "grid", gap: "0.55rem" }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Label</span>
          <input {...form.register("label")} />
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Config JSON</span>
          <textarea
            {...form.register("configJson")}
            rows={14}
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          />
          {form.formState.errors.configJson ? (
            <small style={{ color: "#c1121f" }}>{form.formState.errors.configJson.message}</small>
          ) : null}
        </label>

        <button type="submit">
          <Zap size={14} /> Aplicar no Node
        </button>
      </form>

      {loadingError ? (
        <StatusNotice background="#fff5f5" border="1px solid #ffb3c1" color="#9d0208">
          {loadingError}
        </StatusNotice>
      ) : null}

      {saveMessage ? (
        <StatusNotice background="#edfdf4" border="1px solid #95d5b2" color="#1b4332">
          {saveMessage}
        </StatusNotice>
      ) : null}

      {validationErrors.length > 0 ? (
        <StatusNotice background="#fff5f5" border="1px solid #ffb3c1" color="#9d0208">
          {validationErrors.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </StatusNotice>
      ) : (
        <StatusNotice background="#edfdf4" border="1px solid #95d5b2" color="#1b4332">
          Canvas valido. Pronto para salvar/publicar.
        </StatusNotice>
      )}
    </aside>
  );
}

export default function WorkflowEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [workflowName, setWorkflowName] = useState(`Workflow ${id}`);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("DRAFT");
  const [nodes, setNodes, onNodesChange] = useNodesState<BuilderNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useWorkflowLoader({
    id,
    setEdges,
    setLoadingError,
    setNodes,
    setSelectedNodeId,
    setWorkflowName,
    setWorkflowStatus
  });

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );
  const form = useWorkflowForm(selectedNode);
  const validation = useMemo(() => buildValidation(nodes, edges), [edges, nodes]);
  const decoratedNodes = useMemo(
    () => decorateNodes(nodes, validation.invalidNodeIds),
    [nodes, validation.invalidNodeIds]
  );

  function handlePersist(status: Exclude<WorkflowStatus, "ARCHIVED">): void {
    setSaveMessage(null);
    startTransition(() => {
      void saveWorkflowDefinition(apiBaseUrl, id, workflowName, nodes, edges, status)
        .then((payload) => {
          setWorkflowStatus(payload.workflow.status);
          setSaveMessage(status === "PUBLISHED" ? "Workflow publicado." : "Workflow salvo em draft.");
        })
        .catch((error) => {
          setLoadingError(error instanceof Error ? error.message : "Falha ao salvar.");
        });
    });
  }

  function handleSidebarSubmit(values: SidebarValues): void {
    if (!selectedNodeId) {
      return;
    }

    try {
      setNodes((currentNodes) => applySidebarValues(currentNodes, selectedNodeId, values));
    } catch {
      form.setError("configJson", {
        message: "JSON invalido."
      });
    }
  }

  return (
    <section
      style={{
        display: "grid",
        gap: "0.75rem",
        gridTemplateColumns: "minmax(0, 1fr) 340px",
        height: "calc(100vh - 110px)"
      }}
    >
      <WorkflowEditorCanvas
        decoratedNodes={decoratedNodes}
        edges={edges}
        isPending={isPending}
        onConnectEdge={(connection) => setEdges((currentEdges) => addEdge(connection, currentEdges))}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onPickNode={setSelectedNodeId}
        onPublish={() => handlePersist("PUBLISHED")}
        onSave={() => handlePersist("DRAFT")}
        onShuffle={() => setNodes((currentNodes) => autoLayout(currentNodes))}
        setWorkflowName={setWorkflowName}
        validationErrors={validation.errors}
        workflowName={workflowName}
        workflowStatus={workflowStatus}
      />
      <WorkflowSidebar
        form={form}
        loadingError={loadingError}
        onSubmit={handleSidebarSubmit}
        saveMessage={saveMessage}
        validationErrors={validation.errors}
      />
    </section>
  );
}
