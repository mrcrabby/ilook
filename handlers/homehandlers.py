#!/usr/bin/env python
# -*- coding:utf-8 -*-
import os
import math
import sys

sys.path.append(os.path.dirname(__file__))
from basehandlers import *
               
class HomeHandler(BaseHandler):
    def get(self):
        entries=self.db.book.find().limit(20)
        user = self.get_current_user()
        print user
        print self.get_secure_cookie("uid")
        self.render("index.html", entries=entries,user=user)
