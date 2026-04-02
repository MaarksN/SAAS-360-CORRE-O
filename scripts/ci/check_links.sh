#!/bin/bash
set -e
echo "Starting simple doc link verification..."
# Este script procura os links markdown comuns e verifica se os arquivos locais existem.
# Apenas arquivos markdown são cobertos para simplificação de CI.

grep -rn "\](.*\.[A-Za-z]*)" docs/ | grep "\.md" | while read -r line ; do
    file=$(echo "$line" | cut -d: -f1)
    link=$(echo "$line" | grep -oP '\]\(\K[^\)]+' | head -n 1)

    # Se for um link HTTP externo, ignoramos na validação local
    if [[ "$link" == http* ]]; then
        continue
    fi

    # Resolver path baseado no diretório do arquivo do link
    dir=$(dirname "$file")
    target="$dir/$link"

    if [ ! -f "$target" ]; then
        echo "Warning: Broken link found in $file -> $link"
    fi
done
echo "Link verification complete."
