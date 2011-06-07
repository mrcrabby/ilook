#!/usr/bin/env python
# -*- coding:utf-8 -*-
import os
import sys
import math

from pymongo.objectid import ObjectId

sys.path.append(os.path.dirname(__file__))
from basehandlers import *
               
class ViewbookHandler(BaseHandler):
    def get(self,id,type=None):
        class_star = 'bigstar'
        if id is None:
            raise tornado.web.HTTPError(500, "pargam error")
            #self.redirect('/404');
        try:
            entries=self.db.book.find_one({'_id':ObjectId(id)})
        except:
            raise tornado.web.HTTPError(500, "pargam error")
        
        if entries is not None and len(entries) > 0 :
            
            if(int(entries['ratenum']) > 0) :
                num = math.ceil(entries['rate']/entries['ratenum']) * 5
                if(num<10): num = 0+str(num)
                class_star = class_star+str(num)
            else :
                class_star = class_star+'00'
            others=self.db.book.find({'cate_name':entries['cate_name']}).limit(5)
            user = self.get_current_user()
            self.render("viewbook.html",entry=entries,others=others,user=user,class_star=class_star)
        else :
            raise tornado.web.HTTPError(404, "page not found")
            
        
