#!/bin/bash

echo "Checking Python package naming in agents/..."

# Encontrar diretórios em agents que usam hífen em vez de underscore
BAD_DIRS=$(find agents/ -mindepth 1 -maxdepth 1 -type d -name "*-*")

if [ -n "$BAD_DIRS" ]; then
  echo "Error: Found directories with kebab-case in agents/ (must use snake_case for Python compatibility):"
  echo "$BAD_DIRS"
  exit 1
fi

echo "Python naming conventions passed."