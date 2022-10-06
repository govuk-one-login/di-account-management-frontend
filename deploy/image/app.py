# from flask import Flask
#
# app = Flask(__name__)
#
#
# @app.route("/")
# def hello():
#     print("This is a log message")
#     return "Hello World!"

import time
import redis
import socket
import requests
from flask import Flask
import os
app = Flask(__name__)
cache = redis.Redis(host=os.getenv('REDIS_URL','redis://:MVrPokyz45imdiBeMyuBzNCAECpI92Sk@clustercfg.shared-redis-cache-cluster.gnivhg.euw2.cache.amazonaws.com'), port=6379)
def get_hit_count():
    retries = 5
    while True:
        try:
            return cache.incr('hits')
        except redis.exceptions.ConnectionError as exc:
            print("Exception occured while connecting redis")
            if retries == 0:
                raise exc
            retries -= 1
            time.sleep(0.5)


@app.route("/")
def hello():
    print("This is a log message")
    return "Hello World!"

@app.route('/redis')
def hit():
    count = get_hit_count()
    return "<html>Welcome to Redis Test App - Home Page - on node %s.<br \>Hit count = %i.<br \></html>" % (socket.gethostname(), int(count))