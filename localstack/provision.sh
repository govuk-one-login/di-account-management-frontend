#!/bin/sh

# Creates account-mgmt-backend infra dependencies

# Generate the first key
OUTPUT_GENERATOR=$(aws kms create-key)
GENERATOR_KEY_ARN=$(echo "$OUTPUT_GENERATOR" | python -c "import sys, json; print(json.load(sys.stdin)['KeyMetadata']['Arn'])")
echo $GENERATOR_KEY_ARN > /tmp/keys/GENERATOR_KEY_ARN

# Generate the second key
OUTPUT_WRAPPING=$(aws kms create-key)
WRAPPING_KEY_ARN=$(echo "$OUTPUT_WRAPPING" | python -c "import sys, json; print(json.load(sys.stdin)['KeyMetadata']['Arn'])")
echo $WRAPPING_KEY_ARN > /tmp/keys/WRAPPING_KEY_ARN


# Set the endpoint URL for DynamoDB
ENDPOINT_URL="http://localhost:4566"

# Set the AWS region
export REGION="${AWS_REGION:-us-east-1}"

# either `export MY_ONE_LOGIN_USER_ID=xyz` otherwise the value defaults to `user_id`
# or what ever the hardcoded replacement is
export BUILD_CLIENT_ID="${MY_ONE_LOGIN_USER_ID:-user_id}"
export TABLE_NAME=user_services
export ACTIVITY_LOG_TABLE_NAME=activity_log

aws --endpoint-url=$ENDPOINT_URL dynamodb create-table \
    --table-name $TABLE_NAME \
    --attribute-definitions AttributeName=user_id,AttributeType=S \
    --key-schema AttributeName=user_id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --region $REGION

aws --endpoint-url=$ENDPOINT_URL dynamodb put-item \
    --table-name $TABLE_NAME  \
    --region $REGION \
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


aws --endpoint-url=$ENDPOINT_URL dynamodb create-table \
    --table-name $ACTIVITY_LOG_TABLE_NAME \
    --attribute-definitions AttributeName=user_id,AttributeType=S AttributeName=event_id,AttributeType=S\
    --key-schema AttributeName=user_id,KeyType=HASH AttributeName=event_id,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --region $REGION

# Generate 20 activity logs
i=1
while [ $i -le 20 ]; do
  # Generate a unique session_id and event_id for each item
  SESSION_ID="session_${i}"
  EVENT_ID=$(python -c 'import uuid; print(uuid.uuid4())')

  # Adjust the timestamp to simulate different times
  TIMESTAMP=$((1680025701 + i * 100))

  # Use AWS CLI to put item into DynamoDB
  aws --endpoint-url=$ENDPOINT_URL dynamodb put-item \
      --table-name $ACTIVITY_LOG_TABLE_NAME \
      --region $REGION \
      --item '{
        "user_id": {"S": "'"$BUILD_CLIENT_ID"'"},
        "timestamp": {"N": "'$TIMESTAMP'"},
        "session_id": {"S": "'$SESSION_ID'"},
        "client_id": {"S": "vehicleOperatorLicense"},
        "event_type": {"S": "AUTH_AUTH_CODE_ISSUED"},
        "event_id": {"S": "'$EVENT_ID'"},
        "reported_suspicious": {"BOOL": false}
      }'

  i=$((i + 1))
done

# Creates account-mgmt-frontend infra dependencies

aws --endpoint-url $ENDPOINT_URL dynamodb create-table \
  --table-name account-mgmt-frontend-SessionStore \
  --region $REGION \
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

aws --endpoint-url $ENDPOINT_URL dynamodb update-time-to-live \
  --table-name account-mgmt-frontend-SessionStore \
  --region $REGION \
  --time-to-live-specification Enabled=true,AttributeName=expires

aws sqs --endpoint-url $ENDPOINT_URL create-queue --queue-name audit-events \
  --region $REGION
