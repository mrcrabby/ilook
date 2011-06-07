#!/usr/bin/env python
# -*- coding:utf-8 -*-

from __future__ import division
import os
import logging
import time
import hashlib
import urlparse
import socket
import re
from datetime import datetime, timedelta
from urllib import unquote, quote_plus

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'handlers'))

import tornado.escape
import tornado.httpserver
import tornado.ioloop
#import tornado.web
import tornado.autoreload
from tornado.options import define, options
from pymongo import Connection
from handlers import *

try:
    import daemon
except:
    daemon = None

socket.setdefaulttimeout(30)

define("port", default=8801, help="The port to be listened", type=int)
define("daemon", default=False, help="daemon mode", type=bool)
define("debug", default=False, help="debug mode", type=bool)
define("mongodb_host", default="127.0.0.1:27019", help="mlook database host")
#define("mysql_database", default="blog", help="mlook database name")
define("mongodb_user", default="admin", help="mlook database user")
define("mongodb_password", default="admin", help="mlook database password")

data_dir = os.path.join(os.path.dirname(__file__), 'data')

class Application(tornado.web.Application):
    def __init__(self):
        urls = [
            (r"/", HomeHandler),
            (r"/book/?([0-9]+)?/?([0-9]+)?",BookHandler),
            (r"/viewbook/([a-z0-9]+)",ViewbookHandler),
            (r"/crawl/([a-z0-9]+)", BookcrawHandler),
            (r"/crawl/([a-z0-9]+).(epub|mobi)", DownHandler),
            (r"/login", AuthLoginHandler),
            (r"/logout", AuthLogoutHandler),
            (r"/upload", UploadHandler),
            (r"/sigup", SigupHandler),
        ]
        settings = dict(
            template_path = os.path.join(os.path.dirname(__file__), "views"),
            static_path = os.path.join(os.path.dirname(__file__), "static"),
            xsrf_cookies = True,
            cookie_secret = "kL5gEmGeJJFuYh711oETzKXQAGaYdEQnp2XdTP1o/Vo=",
            debug = options.debug,
            login_url = "/login",
            ui_modules={"Userstats": UserModule},
        )
        tornado.web.Application.__init__(self, urls, **settings)
        
        #db = conn.foo
        #test = {"id":1, "novle":"测试一下"}
        #db.foo.save(test)
        #cursor = db.foo.find()
        #for i in cursor:
         #   print i
        conn = Connection(host=options.mongodb_host)
        self.db = conn.mlook
        
        logging.basicConfig(level=logging.ERROR, format='%(asctime)s:%(msecs)03d %(levelname)-8s %(message)s',
            datefmt='%m-%d %H:%M', filename= os.path.join(os.path.dirname(__file__), "logs", "website.log"), filemode='a')

class UserModule(tornado.web.UIModule):
    def render(self, user=None):
        return self.render_string("modules/userstats.html", user=user)
        
def main():
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


def runserver():
    tornado.options.parse_command_line()
    
    if options.daemon and daemon:
        log = open(os.path.join(os.path.dirname(__file__), 'logs', 'website%s.log' % options.port), 'a+')
        ctx = daemon.DaemonContext(stdout=log, stderr=log,  working_directory='.')
        ctx.open()
    
    http_server = tornado.httpserver.HTTPServer(Application())
    
    if options.debug:
        http_server.listen(options.port)
    else:
        http_server.bind(options.port)
        #http_server.start(2)
        http_server.start()

    tornado.ioloop.IOLoop.instance().start()
    
if __name__ == "__main__":
    runserver()