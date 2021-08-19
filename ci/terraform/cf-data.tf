data "cloudfoundry_org" "org" {
  name = var.cf_org_name
}

data "cloudfoundry_space" "space" {
  name = var.environment
  org  = data.cloudfoundry_org.org.id
}

data "cloudfoundry_domain" "cloudapps" {
  name = var.cf_domain
}
