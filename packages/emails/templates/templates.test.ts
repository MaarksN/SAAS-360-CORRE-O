import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const templateDir = path.resolve(import.meta.dirname);

function readTemplate(name: string) {
  return readFileSync(path.join(templateDir, name), "utf8");
}

void test("email templates expose the expected exported components and CTA copy", () => {
  const invite = readTemplate("org-invite.tsx");
  const critical = readTemplate("critical-error.tsx");
  const finished = readTemplate("workflow-finished.tsx");

  assert.match(invite, /export function OrganizationInviteEmail/);
  assert.match(invite, /Aceitar convite/);
  assert.match(critical, /export function CriticalErrorEmail/);
  assert.match(critical, /Erro critico detectado/);
  assert.match(finished, /export function WorkflowFinishedEmail/);
  assert.match(finished, /Workflow terminou/);
});