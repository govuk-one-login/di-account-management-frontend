#!/bin/bash

if [[ "${1:-}" == "run-server" ]]; then
  npx playwright run-server --port 3000 --host 0.0.0.0 &
  python3 -m http.server 8000
else
  npm run test
fi