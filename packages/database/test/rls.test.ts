import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

import { WorkflowStatus } from "@prisma/client";
import { resolveDatabaseProofUrl } from "../../../tests/support/database-proof.js";
import { createPrismaClient } from "../src/client.js";

const databaseUrl = resolveDatabaseProofUrl("packages/database/test/rls.test.ts");
const testIfDatabase = databaseUrl ? test : test.skip;

void testIfDatabase("RLS bloqueia SELECT de tenant B quando a sessao esta fixada no tenant A", async () => {
  const prisma = createPrismaClient({ databaseUrl });

  try {
    // 1. Geramos os IDs de Tenant antecipadamente para o setup
    const tenantIdA = randomUUID();
    const tenantIdB = randomUUID();

    // 2. Criamos as Organizações garantindo que o tenantId seja enviado
    // Nota: Se o seu schema usa o ID da Org como TenantID, passamos o mesmo valor.
    const organizationA = await prisma.organization.create({
      data: {
        id: tenantIdA,
        tenantId: tenantIdA,
        name: "Tenant A",
        slug: `tenant-a-${Date.now()}-${Math.random().toString(36).substring(7)}`
      }
    });

    const organizationB = await prisma.organization.create({
      data: {
        id: tenantIdB,
        tenantId: tenantIdB,
        name: "Tenant B",
        slug: `tenant-b-${Date.now()}-${Math.random().toString(36).substring(7)}`
      }
    });

    // 3. Criamos o Workflow explicitamente vinculado ao Tenant B
    const workflowB = await prisma.workflow.create({
      data: {
        name: "Workflow B",
        organizationId: organizationB.id,
        status: WorkflowStatus.PUBLISHED,
        tenantId: tenantIdB
      }
    });

    // 4. Teste de Fogo: Tentamos acessar o Workflow B usando a sessão do Tenant A
    const rows = await prisma.$transaction(async (tx) => {
      // Configuramos a sessão do Postgres para o Tenant A
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${organizationA.tenantId}', true)`);
      
      // Tentamos buscar o workflow que pertence ao Tenant B
      // O RLS deve fazer com que o Postgres retorne zero linhas, mesmo o ID existindo
      return tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM workflows WHERE id = ${workflowB.id}`;
    });

    // Validação: O array deve vir vazio porque o RLS barrou a visibilidade
    assert.equal(rows.length, 0, "O RLS deveria ter bloqueado o acesso ao workflow do outro tenant");

  } catch (error) {
    console.error("Erro detalhado no teste:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
});
