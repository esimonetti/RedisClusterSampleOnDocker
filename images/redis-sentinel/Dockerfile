FROM redis:4.0.10
COPY sentinel.conf /usr/local/etc/redis/sentinel.conf
CMD ["redis-sentinel", "/usr/local/etc/redis/sentinel.conf"]
