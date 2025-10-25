# Gunicorn configuration for production deployment
import os
import multiprocessing

# Server socket
bind = "unix:/tmp/gunicorn.sock"
# bind = "0.0.0.0:8000"

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000

# Restart workers after this many requests to prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Timeout for handling requests
timeout = 30
keepalive = 2

# Logging
loglevel = "info"
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'pharma_mis'

# Server mechanics
preload_app = True
pidfile = "/tmp/gunicorn.pid"

# Environment
raw_env = ['ENVIRONMENT=production']
