import os

bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
workers = int(os.getenv("WEB_CONCURRENCY", 2))
threads = 2
timeout = 120
keepalive = 5
preload_app = True
accesslog = "-"
errorlog = "-"
loglevel = "info"
