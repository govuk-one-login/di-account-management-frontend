#!/bin/zsh

REGION="eu-west-2"

i=1
while [ $i -le 20 ]; do
  SESSION_ID="session_${i}"
  TIMESTAMP=$((1680025701 + i * 100))

  raw_event='{
    "id": {
      "S": "'$(uuid)'"
    },
    "timestamp": {
      "N": "'${TIMESTAMP}'"
    },
    "event": {
      "M": {
        "timestamp": {
          "N": "'${TIMESTAMP}'"
        },
        "client_id": {
          "S": "vehicleOperatorLicense"
        },
        "event_id": {
          "S": "'$(uuid)'"
        },
        "event_name": {
          "S": "AUTH_AUTH_CODE_ISSUED"
        },
        "user": {
          "M": {
            "session_id": {
              "S": "'${SESSION_ID}'"
            },
            "user_id": {
              "S": "F5CE808F-75AB-4ECD-BBFC-FF9DBF5330FA"
            }
          }
        }
      }
    },
    "remove_at": {
      "N": "1709550857"
    }
  }'

  echo "writing ${i}"

  gds aws di-account-dev aws dynamodb put-item  \
          --table-name raw_events \
          --region $REGION \
          --item "$raw_event"

  i=$((i + 1))
done
