FROM redis:latest
COPY sentinel.conf /usr/local/etc/redis/sentinel.conf
CMD [ "redis-sentinel", "/usr/local/etc/redis/sentinel.conf"]
