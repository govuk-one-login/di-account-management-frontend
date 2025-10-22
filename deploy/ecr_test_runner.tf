resource "aws_cloudformation_stack" "account_mgmt_frontend_test_runner_image" {
  name         = "account-mgmt-frontend-test-image-repo"
  template_url = "https://template-storage-templatebucket-1upzyw6v9cs42.s3.amazonaws.com/test-image-repository/template.yaml"
  capabilities = ["CAPABILITY_NAMED_IAM"]
  parameters = {
    PipelineStackName = "account-mgmt-frontend-pipeline"
    RetainedImageCount = "100"
  }
}