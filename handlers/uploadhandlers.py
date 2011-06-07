#!/usr/bin/env python
# -*- coding:utf-8 -*-
import os
import math
import sys

sys.path.append(os.path.dirname(__file__))
from basehandlers import *
               
class UploadHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        self.render("upload.html", entries=entries)
    
    def post(self):
        pass
