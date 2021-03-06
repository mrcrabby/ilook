#!/usr/bin/env python
# -*- coding:utf-8 -*-
import os
import sys

sys.path.append(os.path.dirname(__file__))
from basehandlers import *
import pageFun
               
class BookHandler(BaseHandler):
    def get(self,page=1,type=None):
        if page is not None:
            page=int(page)
        if(page<1): page=1
        totlenum = self.db.book.count();
        url='/book/@'
        perpage = 10
        pagehtml = pageFun.pageFun(totlenum,perpage,page,url)
        entries=self.db.book.find().limit(perpage).skip((page-1)*perpage)
        user = self.get_current_user()
        self.render("booklist.html",entries=entries,pagehtml=pagehtml,user=user)
