#!/usr/bin/env node
import { runPnpm } from './ci/shared.mjs';

runPnpm(['--filter', '@birthub/config', '--filter', '@birthub/logger', '--filter', '@birthub/workflows-core', 'build']);
runPnpm(['--filter', '@birthub/database', 'db:generate']);
