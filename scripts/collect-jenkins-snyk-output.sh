#!/usr/bin/env bash
# Saves the real output of the latest Experiment 6 Jenkins build into
# docs/experiments/experiment-6/outputs/. Uses a Jenkins API token
# (Jenkins: your name > Security > API Token), not your password.
#
#   JENKINS_USER=admin JENKINS_API_TOKEN=... scripts/collect-jenkins-snyk-output.sh
set -euo pipefail

JENKINS_URL="${JENKINS_URL:-http://localhost:8080}"
JOB="${JENKINS_JOB:-deploysourabh-snyk}"
BUILD="${JENKINS_BUILD:-lastBuild}"
: "${JENKINS_USER:?Set JENKINS_USER}"
: "${JENKINS_API_TOKEN:?Set JENKINS_API_TOKEN}"

out="$(cd "$(dirname "$0")/.." && pwd)/docs/experiments/experiment-6/outputs"
mkdir -p "$out"
base="$JENKINS_URL/job/$JOB/$BUILD"
get() { curl --fail --silent --show-error --user "$JENKINS_USER:$JENKINS_API_TOKEN" "$@"; }

get "$base/api/json?tree=number,result,duration,timestamp,url" -o "$out/build.json"
get "$base/consoleText" -o "$out/console-output.txt"
get "$base/wfapi/describe" -o "$out/stages.json" 2>/dev/null || echo "Stage data not available (pipeline-stage-view plugin missing?)"
if get "$base/artifact/*zip*/archive.zip" -o "$out/artifacts.zip"; then
  if command -v unzip >/dev/null; then
    unzip -oq "$out/artifacts.zip" -d "$out/artifacts" && rm "$out/artifacts.zip"
  fi
else
  echo "No archived artifacts on this build"
fi

echo "Saved build output to $out"
cat "$out/build.json"; echo
