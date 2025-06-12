#!/bin/bash

# Script to run end-to-end tests
# See https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3054010402/How+to+run+tests+against+your+deployed+application+in+a+SAM+deployment+pipeline 
# for more information as to how this is used

# Exit the script with error code 1 if any command fails
set -euxo pipefail

if [[ "${1:-}" == "update-snapshots" ]]; then
  npm run run-tests:update-snapshots
else
  npm run run-tests
fi