#!/usr/bin/env bash

set -eu
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
REPO_NAME="account-management-image-repository"
REPO_URL="706615647326.dkr.ecr.eu-west-2.amazonaws.com/account-management-image-repository"
IMAGE_TAG=latest

function usage() {
  cat <<USAGE
  A script to deploy the GOV.UK Sign-in account management app to the sandpit environment.
  Requires a GDS CLI, AWS CLI and jq installed and configured.

  Usage:
    $0 [-b|--build] [-t|--terraform] [--destroy] [-p|--prompt]

  Options:
    -b, --build               run docker build and push new version (default)
    -t, --terraform           run terraform to deploy changes (default)
    --destroy                 run terraform with the -destroy flag (destroys all managed resources)
    -p, --prompt              will prompt for plan review before applying any terraform

    If no options specified the default actions above will be carried out without prompting.
USAGE
}

BUILD=0
TERRAFORM=0
TERRAFORM_OPTS="-auto-approve"
if [[ $# == 0 ]]; then
  BUILD=1
  TERRAFORM=1
fi
while [[ $# -gt 0 ]]; do
  case $1 in
    -b|--build)
      BUILD=1
      ;;
    -t|--terraform)
      TERRAFORM=1
      ;;
    --destroy)
      TERRAFORM_OPTS="-destroy"
      ;;
    -p|--prompt)
      TERRAFORM_OPTS=""
      ;;
    *)
      usage
      exit 1
      ;;
  esac
  shift
done

echo "Generating temporary ECR credentials..."
gds aws di-tools-dev -- aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin "${REPO_URL}"

if [[ $BUILD == "1" ]]; then
  pushd "${DIR}" > /dev/null
  echo "Building image..."
  docker buildx build --platform=linux/amd64 -t "${REPO_NAME}" .
  echo "Tagging image..."
  docker tag "${REPO_NAME}:latest" "${REPO_URL}:${IMAGE_TAG}"

  echo "Pushing image..."
  docker push "${REPO_URL}:${IMAGE_TAG}"
  IMAGE_DIGEST="$(docker inspect "${REPO_URL}:${IMAGE_TAG}" | jq -r '.[0].RepoDigests[0] | split("@") | .[1]')"
  echo "Digest = ${IMAGE_DIGEST}"
  echo "Complete"
  popd > /dev/null

  zip redirect.zip redirect.js > /dev/null
else
  docker pull "${REPO_URL}:${IMAGE_TAG}"
  IMAGE_DIGEST="$(docker inspect "${REPO_URL}:${IMAGE_TAG}" | jq -r '.[0].RepoDigests[0] | split("@") | .[1]')"
fi

if [[ $TERRAFORM == "1" ]]; then
  echo -n "Getting AWS credentials ... "
  eval $(gds aws digital-identity-dev -e)
  echo "done!"

  echo "Running Terraform..."
  pushd "${DIR}/ci/terraform" > /dev/null
  rm -rf .terraform/
  terraform init -backend-config=sandpit.hcl
  terraform apply ${TERRAFORM_OPTS} -var-file sandpit.tfvars -var "account_management_image_uri=${REPO_URL}" -var "account_management_image_digest=${IMAGE_DIGEST}"
  popd > /dev/null

  if [[ $TERRAFORM_OPTS != "-destroy" ]]; then
    echo -n "Waiting for ECS deployment to complete ... "
    aws ecs wait services-stable --services "sandpit-account-management-ecs-service" --cluster "sandpit-app-cluster"
    echo "done!"
  fi
fi

echo "Deployment complete!"
