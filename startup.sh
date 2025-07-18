#!/bin/bash

# Service name and expected log line
SERVICE_NAME="account-management-frontend"
READY_MESSAGE="Server listening on port"

# Start the app in detached mode
docker-compose up --build -d

echo ".... Waiting for ${SERVICE_NAME} service to start producing logs..."

# Wait until the first log line appears for this service
initial_line=""
while [ -z "$initial_line" ]; do
  initial_line=$(docker-compose logs "$SERVICE_NAME" 2>&1 | tail -n 1)
  sleep 0.1
done

# Start timer at first log line
start_time=$(python3 -c 'import time; print(int(time.time() * 1000))')

echo ".... ${SERVICE_NAME} log stream started, timing until ready..."

# Wait for readiness message
until docker-compose logs "$SERVICE_NAME" | grep -q "$READY_MESSAGE"; do
  sleep 0.1
done

# End timer
end_time=$(python3 -c 'import time; print(int(time.time() * 1000))')
duration=$((end_time - start_time))

echo ".... ${SERVICE_NAME} became ready in ${duration}ms"
