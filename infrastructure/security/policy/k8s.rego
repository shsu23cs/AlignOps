package main

# Deny containers that run in privileged mode (highly insecure root access)
deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  container.securityContext.privileged == true
  msg := sprintf("Security Violation: Container '%v' in Deployment '%v' is running in privileged mode. Privileged containers are strictly forbidden.", [container.name, input.metadata.name])
}

# Require CPU/Memory resource constraints (limits and requests) to prevent resource starvation
deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not container.resources.limits.cpu
  msg := sprintf("Resource Policy Violation: Container '%v' in Deployment '%v' lacks CPU limits. All workloads must have CPU resource limits.", [container.name, input.metadata.name])
}

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not container.resources.limits.memory
  msg := sprintf("Resource Policy Violation: Container '%v' in Deployment '%v' lacks Memory limits. All workloads must have Memory resource limits.", [container.name, input.metadata.name])
}

# Ensure all services define an application selector
deny[msg] {
  input.kind == "Service"
  not input.spec.selector.app
  msg := sprintf("Metadata Violation: Service '%v' must define an 'app' selector to bind pods.", [input.metadata.name])
}

# Require standard tracking metadata labels
deny[msg] {
  input.kind == "Deployment"
  not input.metadata.labels.app
  msg := sprintf("Compliance Violation: Deployment '%v' must have an 'app' metadata label for service tracking.", [input.metadata.name])
}
