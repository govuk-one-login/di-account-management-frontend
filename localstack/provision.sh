#!/bin/bash

#
# Creates account-mgmt-backend infra dependencies in localstack
#
# This script can be run within a docker container running localstack by mounting
# at the localstack bootstrap location /etc/localstack/init/ready.d/init-aws.sh or
# it can be run at the command line where an instance of loclastack is running in
# the background.
#
# Anticipated use cases are:
# * local developers running the script by placing it inside a docker container in
#   the location stated above with the file name that localstack looks for when
#   starting up.
# * in a GitHub action step where it will be run directly in a process where localstack
#   is running in the background.

#############################################
# Create environment variables for localstack
#############################################
setup_environment() {
  # Set the endpoint URL for DynamoDB
  ENDPOINT_URL="http://localhost:4566"

  # Set the AWS region
  export REGION="${AWS_DEFAULT_REGION:-eu-west-2}"

  # either `export MY_ONE_LOGIN_USER_ID=xyz` otherwise the value defaults to `user_id`
  # or what ever the hardcoded replacement is
  export BUILD_CLIENT_ID="${MY_ONE_LOGIN_USER_ID:-user_id}"
  export USER_SERVICES_TABLE_NAME=user_services
  export ACTIVITY_LOG_TABLE_NAME=activity_log

  # Set the AWS region
  export REGION="${AWS_DEFAULT_REGION:-eu-west-2}"
}

#
# Create kms keys that are needed by localstack and by our app.  Behaves differently
# if running inside a container where it has full access to the file system or locally
# where it has limited access to the file system.
#
create_keys_for_localstack() {
  if [ -n "$RUNNING_OUTSIDE_DOCKER" ]; then
    echo "Running outside docker"
    mkdir -p ./tmp/keys
    keys_directory=./tmp/keys
  else
    echo "Running inside docker"
    keys_directory=/tmp/keys
  fi

  # Generate the first key
  OUTPUT_GENERATOR=$(aws --endpoint-url=$ENDPOINT_URL kms create-key --region "$REGION")
  GENERATOR_KEY_ARN=$(echo "$OUTPUT_GENERATOR" | python3 -c "import sys, json; print(json.load(sys.stdin)['KeyMetadata']['Arn'])")
  echo "$GENERATOR_KEY_ARN" > $keys_directory/GENERATOR_KEY_ARN

  # Generate the second key
  OUTPUT_WRAPPING=$(aws --endpoint-url=$ENDPOINT_URL kms create-key --region "$REGION")
  WRAPPING_KEY_ARN=$(echo "$OUTPUT_WRAPPING" | python3 -c "import sys, json; print(json.load(sys.stdin)['KeyMetadata']['Arn'])")
  echo "$WRAPPING_KEY_ARN" > $keys_directory/WRAPPING_KEY_ARN

  # Generate the third key
  OUTPUT_LOCAL_KEY_ID=$(aws --endpoint-url=$ENDPOINT_URL kms create-key --region "$REGION" --description "RSA key with 2048 bits" --key-usage SIGN_VERIFY --customer-master-key-spec RSA_2048)
  LOCAL_KEY_ID=$(echo "$OUTPUT_LOCAL_KEY_ID" | python3 -c "import sys, json; print(json.load(sys.stdin)['KeyMetadata']['KeyId'])")
  echo "$LOCAL_KEY_ID" > $keys_directory/LOCAL_KEY_ID
}

create_and_populate_user_services_table() {
  aws --endpoint-url=$ENDPOINT_URL dynamodb create-table \
      --table-name $USER_SERVICES_TABLE_NAME \
      --attribute-definitions AttributeName=user_id,AttributeType=S \
      --key-schema AttributeName=user_id,KeyType=HASH \
      --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
      --region "$REGION"

  aws --endpoint-url=$ENDPOINT_URL dynamodb put-item \
      --table-name $USER_SERVICES_TABLE_NAME  \
      --region "$REGION" \
      --item '
        {
          "user_id": {
            "S": "'"$BUILD_CLIENT_ID"'"
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
                    "S": "CMAD"
                  },
                  "last_accessed": {
                    "N": "1688169356"
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
                    "S": "dfeApplyForTeacherTraining"
                  },
                  "last_accessed": {
                    "N": "1688169356"
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
              },
              {
                "M": {
                  "count_successful_logins": {
                    "N": "4"
                  },
                  "client_id": {
                    "S": "airPollutionAssesment"
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
}

create_and_populate_activity_log_table() {
  aws --endpoint-url=http://localhost:4566 \
      dynamodb create-table \
        --table-name $ACTIVITY_LOG_TABLE_NAME \
        --attribute-definitions \
            AttributeName=user_id,AttributeType=S \
            AttributeName=event_id,AttributeType=S \
            AttributeName=session_id,AttributeType=S \
            AttributeName=timestamp,AttributeType=N \
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
      --local-secondary-indexes `# !!!! experimental !!!!` \
        '[
          {
            "IndexName": "TimestampSLI",
            "KeySchema": [
              {"AttributeName": "user_id", "KeyType": "HASH"},
              {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
            "Projection": {"ProjectionType": "ALL"}
          }
        ]
        ' \
      --region eu-west-2

  npm install -g uuid@10.0.0

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
          "client_id": {"S": "govukApp"},
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
          "client_id": {"S": "govukApp"},
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
          "client_id": {"S": "apprenticeshipsService"},
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
          "client_id": {"S": "dfeApplyForTeacherTraining"},
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
        --region "$REGION" \
        --item "$activity_log"

    i=$((i + 1))
  done
}

# Creates account-mgmt-frontend infra dependencies
create_session_store_table() {
  aws --endpoint-url $ENDPOINT_URL dynamodb create-table \
    --table-name account-mgmt-frontend-SessionStore \
    --region "$REGION" \
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
    --region "$REGION" \
    --time-to-live-specification Enabled=true,AttributeName=expires
}

create_sqs_queues() {
  aws sqs --endpoint-url $ENDPOINT_URL create-queue --queue-name audit-events \
    --region "$REGION"

  # SQS Queue listening to the SNS alarm topic which from which messages can be received to view the alarm details
  aws sqs --endpoint-url $ENDPOINT_URL create-queue --queue-name slack-alerts --region "$REGION"
}

create_sns_topics() {
  aws sns --endpoint-url $ENDPOINT_URL create-topic --name SuspiciousActivityTopicArn\
    --region "$REGION"

  aws sns --endpoint-url $ENDPOINT_URL create-topic --name DeleteAccountTopicArn\
    --region "$REGION"

  # SNS Topic used by CloudWatch Alarms when they are activated
  aws sns --endpoint-url $ENDPOINT_URL create-topic --name SlackAlarmTopic --region "$REGION"

  aws sns --endpoint-url $ENDPOINT_URL create-topic --name DeleteAccountTopicArn\
    --region $REGION
}

create_state_machine() {
  # Example state machine
  aws stepfunctions --endpoint-url $ENDPOINT_URL create-state-machine \
      --region eu-west-2 \
      --name "ExampleStateMachine" \
      --type "STANDARD" \
      --role-arn "arn:aws:iam::000000000000:role/stepfunctions-role" \
      --definition '
        {
          "Comment": "Example StepFunction",
          "StartAt": "FirstState",
          "States": {
            "FirstState": {
              "Type": "Pass",
              "Result": "Hello, world!",
              "End": true
            }
          }
        }'
}

#####################
# Setup alarms and subscribe an SQS queue to the SNS topic that the alarms publish to so they can be read from
# the command line
#
# View alarm details
# awslocal cloudwatch describe-alarms --alarm-names ReportSuspiciousActivityStepFunctionExecutionFailure --region=eu-west-2
#
# Change the state of the alarm
# awslocal cloudwatch set-alarm-state --state-reason "Threshold crossed" --alarm-name ReportSuspiciousActivityStepFunctionExecutionFailure --state-value ALARM --region eu-west-2
#
# Get the alarms from the SQS queue
# awslocal sqs receive-message --queue-url http://sqs.eu-west-2.localhost.localstack.cloud:4566/000000000000/slack-alerts
#######################
setup_alarms() {
  # Cloudwatch alarm for state machine execution failures
  aws cloudwatch put-metric-alarm \
      --endpoint-url http://localhost:4566 \
      --region eu-west-2 \
      --alarm-name ReportSuspiciousActivityStepFunctionExecutionFailure \
      --alarm-description "Alarm for failures executing the report suspicious activity workflow" \
      --namespace AWS/States \
      --metric-name ExecutionFailed \
      --period 300 \
      --evaluation-periods 1 \
      --threshold 1 \
      --comparison-operator GreaterThanThreshold \
      --dimensions Name=StateMachineArn,Value=arn:aws:states:eu-west-2:000000000000:stateMachine:ExampleStateMachine \
      --alarm-actions arn:aws:sns:eu-west-2:000000000000:SlackAlarmTopic

  # Subscribe the slack-alerts SQS queue to the SlackAlarmTopic SNS topic
  aws sns --endpoint-url $ENDPOINT_URL subscribe \
    --region eu-west-2 \
    --topic-arn arn:aws:sns:eu-west-2:000000000000:SlackAlarmTopic \
    --protocol sqs \
    --notification-endpoint arn:aws:sqs:eu-west-2:000000000000:slack-alerts
}

setup_environment
create_keys_for_localstack
create_and_populate_user_services_table
create_and_populate_activity_log_table
create_session_store_table
create_sqs_queues
create_sns_topics
create_state_machine
