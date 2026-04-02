const fs = require('fs');
const path = require('path');

const agentsDir = path.join(__dirname, '../../.github/agents');
if (!fs.existsSync(agentsDir)) {
  fs.mkdirSync(agentsDir, { recursive: true });
}

for (let i = 1; i <= 300; i++) {
  const agentPath = path.join(agentsDir, `agent-${i}.agent.md`);
  const content = `---
name: "Agent ${i}"
domainContext: "mock domain"
outputStem: "agent-${i}"
tools: []
collaborators: []
userInvocable: true
---

# IDENTIDADE E MISSAO
mock identidade

# FORMATO DE SAIDA
mock formato de saida
`;
  fs.writeFileSync(agentPath, content);
}

// Ensure the planner agent exists
const plannerPath = path.join(agentsDir, `planner.agent.md`);
fs.writeFileSync(plannerPath, `---
name: "Planner Agent"
domainContext: "mock domain"
outputStem: "planner"
tools: []
collaborators: []
userInvocable: true
---

# IDENTIDADE E MISSAO
mock identidade

# FORMATO DE SAIDA
mock formato de saida
`);

console.log("Mock agents generated");
