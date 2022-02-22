#!/usr/bin/env bash

set -eu
REPO_NAME="account-management-image-repository"
REPO_URL="706615647326.dkr.ecr.eu-west-2.amazonaws.com/account-management-image-repository"
IMAGE_TAG=latest

echo "Generating temporary push credentials..."
gds aws di-tools-dev -- aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin "${REPO_URL}"

echo "Building image..."
docker buildx build --platform=linux/amd64 -t "${REPO_NAME}" .
echo "Tagging image..."
docker tag account-management-image-repository:latest "${REPO_URL}:${IMAGE_TAG}"

echo "Pushing image..."
docker push "${REPO_URL}:${IMAGE_TAG}"

echo "Complete"
