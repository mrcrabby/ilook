#!/usr/bin/env python
# -*- coding:utf-8 -*-
import os
import math
import sys
import hashlib
import time

sys.path.append(os.path.dirname(__file__))
from basehandlers import *
               
class AuthLoginHandler(BaseHandler):
    def get(self,error=None):
        user = self.get_current_user()
        error = self.get_argument("error", None)
        self.render("login.html", user=user,error=error)
    
    def post(self):
        email = self.get_argument("email", None)
        password = self.get_argument("password", None)
        password = hashlib.md5(password).hexdigest()
        user = self.db.user.find_one({'email':email,'password':password})
        if user is None:
            self.redirect('/login?error=1')
        else :
            self.set_secure_cookie('uid',str(user['_id']))
            self.set_secure_cookie('username',user['username'])
            self.redirect(self.get_argument("next", "/"))
    
class AuthLogoutHandler(BaseHandler):
    def get(self):
        self.clear_cookie("uid")
        self.clear_cookie("username")
        self.redirect(self.get_argument("next", "/"))
        
class SigupHandler(BaseHandler):
    def get(self):
        uid = self.get_current_user()
        if uid is None:
            self.render("sigup.html",user=uid)
            
    def post(self):
        email = self.get_argument("email", None)
        username = self.get_argument("name", None)
        password = self.get_argument("password", None)
        password = hashlib.md5(password).hexdigest()
        #uid，uname，email，kindle_mail avater date group_id
        #gid 1:admin 2:l_admin 3:user 4:vip 5:super_vip
        uid = self.db.user.insert({'username':username,'password':password,\
                             'email':email,'group_id':5,'avater':'',\
                             'upload':10,'downloads':0,'date':int(time.time())})
        
        uid =  str(uid)

        self.set_secure_cookie('uid',uid)
        self.set_secure_cookie('username',username)
        self.redirect('/')
        
        