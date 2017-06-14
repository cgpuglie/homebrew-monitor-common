# Homebrew Monitor - Common

Common logic for Homebrew-monitor microservices

### Testing

The easiest way to test the shared module is to mount the dependency into a service with Docker.
```bash
docker run \
  -it --rm \
  -v /home/cpuglies/projects/homebrew-monitor-common/:/usr/src/homebrew-monitor-rest/node_modules/homebrew-monitor-common/ \
  homebrew-monitor-rest-test
```

For final testing, push to git repository and run end to end tests on entire stack.