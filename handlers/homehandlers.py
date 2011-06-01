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
        self.render("index.html", entries=entries)
