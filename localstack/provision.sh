#!/bin/bash

# Creates account-mgmt-backend infra dependencies

# Set the endpoint URL for DynamoDB
ENDPOINT_URL="http://localhost:4566"

# Set the AWS region
REGION="eu-west-2"

# either `export MY_ONE_LOGIN_USER_ID=xyz` otherwise the value defaults to `<YOUR_SUBJECT_ID_HERE>`
# or what ever the hardcoded replacement is
export BUILD_CLIENT_ID="${MY_ONE_LOGIN_USER_ID:-<YOUR_SUBJECT_ID_HERE>}"
export TABLE_NAME=user_services
export ACTIVITY_LOG_TABLE_NAME=activity_log

aws --endpoint-url=http://localhost:4566 dynamodb create-table \
    --table-name $TABLE_NAME \
    --attribute-definitions AttributeName=user_id,AttributeType=S \
    --key-schema AttributeName=user_id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --region eu-west-2

aws --endpoint-url=http://localhost:4566 dynamodb put-item \
    --table-name $TABLE_NAME  \
    --region eu-west-2 \
    --item '
    {
      "user_id": {
        "S":  "'"$BUILD_CLIENT_ID"'"
      },
      "services": {
        "L": [
          {
            "M": {
              "count_successful_logins": {
                "N": "4"
              },
              "client_id": {
                "S": "gov.uk"
              },
              "last_accessed": {
                "N": "1666169856"
              },
              "last_accessed_pretty": {
                "S": "20 January 1970"
              }
            }
          },
          {
            "M": {
              "count_successful_logins": {
                "N": "4"
              },
              "client_id": {
                "S": "cqGoT1LYLsjn-iwGcDTzamckhZU"
              },
              "last_accessed": {
                "N": "1666169856"
              },
              "last_accessed_pretty": {
                "S": "20 January 1970"
              }
            }
          }
        ]
      }
    }'


aws --endpoint-url=http://localhost:4566 \
    dynamodb create-table \
      --table-name $ACTIVITY_LOG_TABLE_NAME \
      --attribute-definitions \
          AttributeName=user_id,AttributeType=S \
          AttributeName=event_id,AttributeType=S \
          AttributeName=session_id,AttributeType=S \
    --key-schema \
        AttributeName=user_id,KeyType=HASH \
        AttributeName=event_id,KeyType=RANGE \
    --global-secondary-indexes \
        '[
            {
              "IndexName": "SessionIdIndex",
              "KeySchema": [
                { "AttributeName": "session_id", "KeyType": "HASH"}
              ],
              "Projection": {"ProjectionType":"ALL"},
              "ProvisionedThroughput": {"ReadCapacityUnits": 1, "WriteCapacityUnits": 1}
            }
        ]' \
    --provisioned-throughput \
        ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --region eu-west-2

npm install -g uuid

# Generate 20 activity logs
i=1
while [ $i -le 20 ]; do
  # Generate a unique session_id and event_id for each item
  SESSION_ID="session_${i}"
  EVENT_ID=$(uuid)

  # Adjust the timestamp to simulate different times
  TIMESTAMP=$((1680025701 + i * 100))

  if [ $((RANDOM % 2)) -eq 0 ]; then
    activity_log='
    {
      "user_id": {"S": "'"$BUILD_CLIENT_ID"'"},
      "timestamp": {"N": "'$TIMESTAMP'"},
      "session_id": {"S": "'$SESSION_ID'"},
      "client_id": {"S": "vehicleOperatorLicense"},
      "event_type": {"S": "AUTH_AUTH_CODE_ISSUED"},
      "event_id": {"S": "'$EVENT_ID'"},
      "reported_suspicious": {"BOOL": false}
    }'
  else
    activity_log='
    {
      "user_id": {"S": "'"$BUILD_CLIENT_ID"'"},
      "timestamp": {"N": "'$TIMESTAMP'"},
      "session_id": {"S": "'$SESSION_ID'"},
      "client_id": {"S": "vehicleOperatorLicense"},
      "event_type": {"S": "AUTH_AUTH_CODE_ISSUED"},
      "event_id": {"S": "'$EVENT_ID'"},
      "reported_suspicious": {"BOOL": true},
      "reported_suspicious_time": {"N": "'$TIMESTAMP'"},
      "zendesk_ticket_number": {"S": "12345"}
    }'
  fi


  # Use AWS CLI to put item into DynamoDB
  aws --endpoint-url=$ENDPOINT_URL dynamodb put-item  \
      --table-name $ACTIVITY_LOG_TABLE_NAME \
      --region $REGION \
      --item "$activity_log"

  i=$((i + 1))
done

# Creates account-mgmt-frontend infra dependencies

aws --endpoint-url http://localhost:4566 dynamodb create-table \
  --table-name account-mgmt-frontend-SessionStore \
  --region eu-west-2 \
  --attribute-definitions AttributeName=id,AttributeType=S AttributeName=user_id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --global-secondary-indexes '
  [
    {
      "IndexName": "users-sessions",
      "KeySchema": [
        {
          "AttributeName": "user_id",
          "KeyType": "HASH"
        }
      ],
      "Projection": {
        "ProjectionType": "KEYS_ONLY"
      },
      "ProvisionedThroughput": {
        "ReadCapacityUnits": 5,
        "WriteCapacityUnits": 5
      }
    }
  ]'

aws --endpoint-url http://localhost:4566 dynamodb update-time-to-live \
  --table-name account-mgmt-frontend-SessionStore \
  --region eu-west-2 \
  --time-to-live-specification Enabled=true,AttributeName=expires

aws sqs --endpoint-url http://localhost:4566 create-queue --queue-name audit-events \
  --region eu-west-2
