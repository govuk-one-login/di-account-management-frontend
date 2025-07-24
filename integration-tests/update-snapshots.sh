#!/bin/bash

# This script is necessary because Playwright does not support removing obsolete snapshots.
# See https://github.com/microsoft/playwright/issues/16582
# Once Playwright does support removing obsolete snapshots then this script can be
# removed and the test:update-snapshots command in package.json can just be updated
# to `npm ci && bddgen && playwright test --update-snapshots --remove-obsolete-snapshots`
# where --remove-obsolete-snapshots is a theortical flag used by Playwright to remove
# obsolete snapshots. UPDATE_SNAPSHOTS can also be removed from env.ts and the initial directory
# of snapshotPathTemplate in playwright.config.ts can be set to "snapshots". 
# /snapshots-updated can also be removed from .gitignore.

npm ci
bddgen
export UPDATE_SNAPSHOTS=1
rm -rf snapshots-updated
playwright test --update-snapshots

if [ $? -eq 0 ]; then
  rm -rf snapshots
  mv snapshots-updated snapshots
else
  rm -rf snapshots-updated
fi