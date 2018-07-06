FROM haproxy:1.8.12
COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg
CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg", "-V", "-d"]
