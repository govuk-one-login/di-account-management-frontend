data "cloudfoundry_service" "redis" {
  name = "redis"
}

resource "cloudfoundry_service_instance" "redis" {
  name         = "${var.cf_space_name}-redis"
  space        = data.cloudfoundry_space.space.id
  service_plan = data.cloudfoundry_service.redis.service_plans["tiny-5_x"]
}

