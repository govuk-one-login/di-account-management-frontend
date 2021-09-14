output "account_management_client_details" {
  value = {
    client_id             = random_string.account_management_client_id.result
    client_name           = "${var.environment}-account-managment"
    KMS_KEY_ID            = aws_kms_key.account_management_jwt_key.id
  }
  sensitive = true
}

output "account_management_your_account_url" {
  value = "${var.your_account_url}"
}