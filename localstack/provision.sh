#!/bin/sh

# Creates account-mgmt-backend infra dependencies

# either `export MY_ONE_LOGIN_USER_ID=xyz` otherwise the value defaults to `<YOUR_SUBJECT_ID_HERE>`
# or what ever the hardcoded replacement is
export BUILD_CLIENT_ID="user_id"
export TABLE_NAME=user_services
export ACTIVITY_LOG_TABLE_NAME=activity_logs

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


aws --endpoint-url=http://localhost:4566 dynamodb create-table \
    --table-name $ACTIVITY_LOG_TABLE_NAME \
    --attribute-definitions AttributeName=user_id,AttributeType=S AttributeName=timestamp,AttributeType=N\
    --key-schema AttributeName=user_id,KeyType=HASH AttributeName=timestamp,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --region eu-west-2

aws --endpoint-url=http://localhost:4566 dynamodb put-item \
    --table-name $ACTIVITY_LOG_TABLE_NAME  \
    --region eu-west-2 \
    --item '
    {
      "user_id": {
        "S": "'"$BUILD_CLIENT_ID"'"
      },
      "timestamp": {
        "N": "1680025701"
      },
      "session_id": {
        "S": "session_123"
      },
      "client_id": {
        "S": "vehicleOperatorLicense"
      },
      "event_type": {
        "S": "AUTH_AUTH_CODE_ISSUED"
      },
      "event_id": {
        "S": "4a3e09e0-ce9e-4fd5-b47e-4934f35c6e40"
      },
      "reported_suspicious": {
        "BOOL": false
      }
    }'

aws --endpoint-url=http://localhost:4566 dynamodb put-item \
    --table-name $ACTIVITY_LOG_TABLE_NAME  \
    --region eu-west-2 \
    --item '
    {
      "user_id": {
        "S": "'"$BUILD_CLIENT_ID"'"
      },
      "timestamp": {
        "N": "1680025701"
      },
      "session_id": {
        "S": "session_123"
      },
      "client_id": {
        "S": "vehicleOperatorLicense"
      },
      "event_type": {
        "S": "AUTH_AUTH_CODE_ISSUED"
      },
      "event_id": {
         "S": "4a3e09e0-ce9e-4fd5-b47e-4934f35c6e40"
      },
      "reported_suspicious": {
         "BOOL": false
      }
    }'

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
