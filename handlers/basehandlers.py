#!/usr/bin/env python
# -*- coding:utf-8 -*-
import os
import urlparse

import tornado.web

from rules import *
        

class BaseHandler(tornado.web.RequestHandler):
    @property
    def db(self):
        return self.application.db

    def get_current_user(self):
        user_id = self.get_secure_cookie("user")
        if not user_id: return None
        return self.db.get("SELECT * FROM authors WHERE id = %s", int(user_id))
    
    def is_url(self, text):
        """docstring for is_url"""
        return text.partition("://")[0] in ('http', 'https')
    
    def in_rules(self, url):
        """docstring for in_rules"""
        
        url = urlparse.urlparse(url)
        
        return url.hostname in Rules
        
    def url_validate(self, url):
        """docstring for validate"""
        url_parsed = urlparse.urlparse(url)
        rule = Rules[url_parsed.hostname]
        
        if 'url_validate' in rule and not re.match(rule['url_validate'], url):
            return False
        else:
            return True
    