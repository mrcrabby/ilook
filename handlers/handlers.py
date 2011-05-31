#!/usr/bin/env python
# -*- coding:utf-8 -*-

import tornado.web

from crawler import Book
from rules import *

import celerytasks

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
        
class HomeHandler(BaseHandler):
    def get(self):
        #entries=''
        #entries=self.db.book.find().sort({'good':1}).limit(20)
        entries=self.db.book.find().limit(20)
        self.render("index.html", entries=entries)
        #pass

class BookHandler(BaseHandler):
    def get(self,page=1,type=None):
        if page is not None:
            page=int(page)
        if(page<1): page=1
        entries=self.db.book.find().limit(20).skip((page-1)*20)
        self.render("booklist.html", entries=entries)

class CrawHandler(BaseHandler):
    """docstring for HomeHandler"""
    def get(self, error=None, url=None, book_id=None):
        """docstring for fname"""
        
        if url is None:
            url = self.get_argument("url", None)
        
        allow_sites = Rules.keys()
        
        self.render("home.html", error = error, url=url, book_id=book_id, allow_sites=allow_sites)
        
        
    def post(self):
        """docstring for fname"""
        
        url = self.get_argument("url", "").strip()
        
        if not url:
            self.get(2, url)
        elif not self.is_url(url):
            self.get(3, url)
        elif not self.in_rules(url):
            self.get(4, url)
        elif not self.url_validate(url):
            self.get(5, url)
        else:
            
            book = Book(url)
            if not book.is_exists:
                celerytasks.crawler.apply_async(args=[url]) #, eta=datetime.now() + timedelta(seconds=10))
                
            self.redirect('book/%s' % book.id)
            
class BookcrawHandler(BaseHandler):
    """docstring for BookHandler"""
    
    def get(self, book_id):
        """docstring for get"""
        
        book = Book(id=book_id)
        self.render('down.html', book=book)
    
class DownHandler(BaseHandler):
    """docstring for DownHandler"""
    
    def get(self, book_id, filetype):
        
        mime_types = {
            'mobi':'application/x-mobipocket-ebook',
            'epub':'application/epub-zip'
        }
        
        book = Book(id=book_id)
        
        if filetype is 'epub':
            book_file = book.epub
        else:
            book_file = book.mobi
            
        fp = open(book_file, 'r')
        data = fp.read()
        fp.close()
        
        self.set_header("Content-Type", mime_types[filetype])
        self.set_header("Content-Length", len(data))
        self.set_header("Content-Disposition", 'attachment; filename="%s.%s"' % (book.id, filetype))
        self.set_header("Cache-Control", "private, max-age=0, must-revalidate")
        self.set_header("Pragma", "public")
        self.write(data)