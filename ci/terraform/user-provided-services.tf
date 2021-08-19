resource "cloudfoundry_user_provided_service" "kms" {
  name  = "${var.environment}-account-management-kms-provider"
  space = data.cloudfoundry_space.space.id

  credentials = {
    AWS_ACCESS_KEY_ID     = aws_iam_access_key.account_management_app_access_keys.id
    AWS_SECRET_ACCESS_KEY = aws_iam_access_key.account_management_app_access_keys.id
    AWS_REGION            = var.aws_region
    KMS_KEY_ID            = aws_kms_key.account_management_jwt_key.id
    KMS_KEY_ALIAS         = aws_kms_alias.account_management_jwt_alias.name
  }
}

resource "cloudfoundry_user_provided_service" "idp" {
  name  = "${var.environment}-account-management-idp-provider"
  space = data.cloudfoundry_space.space.id

  credentials = {
    client_id   = random_string.account_management_client_id.result
    client_name = "${var.environment}-account-managment"
    idp_url     = "https://api.${var.cf_domain}"
  }
}
