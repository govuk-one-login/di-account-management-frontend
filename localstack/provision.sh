#!/bin/bash

# Creates account-mgmt-backend infra dependencies

# Set the endpoint URL for DynamoDB
ENDPOINT_URL="http://localhost:4566"

# Set the AWS region
export REGION="${AWS_DEFAULT_REGION:-eu-west-2}"

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
                "S": "gov-uk"
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
                "S": "connectFamilies"
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
                           "S": "hmrc"
                         },
                         "last_accessed": {
                           "N": "1696969856"
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
                           "S": "veteransCard"
                         },
                         "last_accessed": {
                           "N": "1699969996"
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
while [ $i -le 50 ]; do
  # Generate a unique session_id and event_id for each item
  SESSION_ID="session_${i}"
  EVENT_ID=$(uuid)

  # Adjust the timestamp to simulate different times
  TIMESTAMP=$((1680025701 + i * 100))

  random_choice=$((1 + RANDOM % 5))

  case $random_choice in
    1)
      echo "creating scenario 1"
      activity_log='
      {
        "user_id": {"S": "'"$BUILD_CLIENT_ID"'"},
        "timestamp": {"N": "'$TIMESTAMP'"},
        "session_id": {"S": "'$SESSION_ID'"},
        "client_id": {"S": "vehicleOperatorLicense"},
        "event_type": {"S": "AUTH_AUTH_CODE_ISSUED"},
        "event_id": {"S": "'$EVENT_ID'"}
      }'
      ;;
    2)
      echo "creating scenario 2"
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
      ;;
    3)
      echo "creating scenario 3"
      activity_log='
      {
        "user_id": {"S": "'"$BUILD_CLIENT_ID"'"},
        "timestamp": {"N": "'$TIMESTAMP'"},
        "session_id": {"S": "'$SESSION_ID'"},
        "client_id": {"S": "vehicleOperatorLicense"},
        "event_type": {"S": "AUTH_AUTH_CODE_ISSUED"},
        "event_id": {"S": "'$EVENT_ID'"},
        "reported_suspicious": {"BOOL": true}
      }'
      ;;
    4)
      echo "creating scenario 4"
      activity_log='
      {
        "user_id": {"S": "'"$BUILD_CLIENT_ID"'"},
        "timestamp": {"N": "'$TIMESTAMP'"},
        "session_id": {"S": "'$SESSION_ID'"},
        "client_id": {"S": "vehicleOperatorLicense"},
        "event_type": {"S": "AUTH_AUTH_CODE_ISSUED"},
        "event_id": {"S": "'$EVENT_ID'"},
        "reported_suspicious": {"BOOL": true},
        "reported_suspicious_time": {"N": "'$TIMESTAMP'"}
      }'
      ;;
    5)
      echo "creating scenario 5"
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
        "zendesk_ticket_number": {"S": "ZEN-1234"}
      }'
      ;;
    *)
      echo "Something went wrong with the random choice calculation which generated a value of $random_choice "
      ;;
  esac


  # Use AWS CLI to put item into DynamoDB
  aws --endpoint-url=$ENDPOINT_URL dynamodb put-item  \
      --table-name $ACTIVITY_LOG_TABLE_NAME \
      --region $REGION \
      --item "$activity_log"

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
