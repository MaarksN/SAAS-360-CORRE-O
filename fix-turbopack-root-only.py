import json
import re

with open("apps/web/next.config.mjs", "r") as f:
    content = f.read()

if "turbopack" not in content:
    content = content.replace("compress: true,", 'turbopack: { resolveAlias: { "@birthub/*": "../../packages/*/dist/src/index.js" } },\n  compress: true,')

with open("apps/web/next.config.mjs", "w") as f:
    f.write(content)
