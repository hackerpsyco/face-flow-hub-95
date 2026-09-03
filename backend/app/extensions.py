from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()

class DummyRedis:
    """Fallback in-memory cache when Redis server is unavailable."""
    def __init__(self):
        self._store = {}
    def get(self, key):
        return self._store.get(key)
    def set(self, key, value, ex=None):
        self._store[key] = value
        return True
    def delete(self, key):
        self._store.pop(key, None)
        return True

redis_client = DummyRedis()

def init_redis(app):
    global redis_client
    redis_url = app.config.get("REDIS_URL")
    if redis_url and not redis_url.startswith("dummy"):
        try:
            import redis
            client = redis.from_url(redis_url)
            client.ping()
            redis_client = client
        except Exception:
            # Fall back to in-memory store cleanly
            redis_client = DummyRedis()
    else:
        redis_client = DummyRedis()
