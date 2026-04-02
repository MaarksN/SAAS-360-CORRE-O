import { expect, test } from "@playwright/test";

import { bootstrapSession, mockAgentStudio } from "./support";

test.describe("Agent Studio critical flow", () => {
  test("create agent, run, inspect logs and edit prompt", async ({ page }) => {
    await bootstrapSession(page);
    await mockAgentStudio(page);

    await page.goto("/agents");
    await expect(page.getByText("Agents")).toBeVisible();

    await page.getByRole("link", { name: "Overview" }).first().click();
    await expect(page.getByText("Prompt oficial")).toBeVisible();

    await page.getByRole("link", { name: "Run" }).click();
    await page.getByRole("button", { name: "Executar agente" }).click();
    await expect(page.getByText("Resultado em tempo real (SSE)")).toBeVisible();
    await expect(page.getByText("Planner validated tenant context.")).toBeVisible();
    await expect(page.getByText("Pipeline review completed")).toBeVisible();
  });
});
