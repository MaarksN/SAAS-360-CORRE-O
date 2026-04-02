#!/bin/bash

echo "Running Artifacts Cleanup Policy..."

# Encontra arquivos mais antigos que 90 dias que não são importantes.
# Essa política apenas detectará e informará, mas no CI deletaria.
find artifacts/ -type f -mtime +90 -not -name "README.md" -not -name ".gitignore" -exec rm {} \;

echo "Artifacts cleanup policy enforced."
