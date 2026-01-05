resource "aws_cloudformation_stack" "account_mgmt_frontend_image" {
  name         = "account-mgmt-frontend-image"
  count        = contains(["build", "dev"], var.environment) ? 1 : 0
  template_url = "https://template-storage-templatebucket-1upzyw6v9cs42.s3.amazonaws.com/container-image-repository/template.yaml"
  capabilities = ["CAPABILITY_NAMED_IAM"]
  parameters = {
    PipelineStackName = "account-mgmt-frontend-pipeline"
    RetainedImageCount = "100"
  }
}
