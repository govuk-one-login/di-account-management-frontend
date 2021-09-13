locals {
  scopes = [
    "openid",
    "phone",
    "email",
    "am"
  ]
}

resource "random_string" "account_management_client_id" {
  lower   = true
  upper   = true
  special = false
  number  = true
  length = 32
}

data "aws_kms_public_key" "account_management_jwt_key" {
  depends_on = [aws_kms_key.account_management_jwt_key]
  key_id = aws_kms_key.account_management_jwt_key.arn
}

data "aws_dynamodb_table" "client_registry_table" {
  name = "${var.environment}-client-registry"
}

resource "aws_dynamodb_table_item" "account_management_client" {
  table_name = data.aws_dynamodb_table.client_registry_table.name
  hash_key   = data.aws_dynamodb_table.client_registry_table.hash_key

  item     = jsonencode({
    ClientID = {
      S = random_string.account_management_client_id.result
    }
    ClientName = {
      S = "${var.environment}-account-management"
    }
    Contacts = {
      L = []
    }
    PostLogoutRedirectUrls = {
      L = []
    }
    RedirectUrls = {
      L = [
        {
          S = "https://account-management.${var.cf_domain}/auth/callback"
        }
      ]
    }
    Scopes = {
      L = [for scope in local.scopes:
        {
          S = scope
        }
      ]
    }
    PublicKey = {
      S = data.aws_kms_public_key.account_management_jwt_key.public_key
    }
    ServiceType = {
      S = "MANDATORY"
    }
  })
}
