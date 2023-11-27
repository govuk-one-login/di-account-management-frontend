#!/bin/zsh

REGION="eu-west-2"

i=1
while [ $i -le 20 ]; do
  EVENT_ID=$(uuid)
  SESSION_ID="session_${i}"
  TIMESTAMP=$((1680025701 + i * 100))

  if [ $((RANDOM % 2)) -eq 0 ]; then
    activity_log='{
        "user_id": {"S": "F5CE808F-75AB-4ECD-BBFC-FF9DBF5330FA"},
        "timestamp": {"N": "'$TIMESTAMP'"},
        "session_id": {"S": "'$SESSION_ID'"},
        "client_id": {"S": "vehicleOperatorLicense"},
        "event_type": {"S": "AUTH_AUTH_CODE_ISSUED"},
        "event_id": {"S": "'$EVENT_ID'"},
        "reported_suspicious": {"BOOL": false}
      }'
  else
    activity_log='{
        "user_id": {"S": "F5CE808F-75AB-4ECD-BBFC-FF9DBF5330FA"},
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

  gds aws di-account-dev aws dynamodb put-item  \
        --table-name activity_log \
        --region $REGION \
        --item "$activity_log"

  i=$((i + 1))
done

gds aws di-account-dev aws dynamodb scan --table-name activity_log
