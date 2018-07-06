# RedisClusterSampleOnDocker
A sample setup of a Redis cluster behind a single HAProxy, with automatic failover on Docker

* Clone repository
* Run `docker-compose up -d --build`
* Connect to redis on localhost port 6379 to read/write from the master
* Connect on HAProxy status page on http://localhost:8080
