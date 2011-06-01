#!/usr/bin/env python
# -*- coding:utf-8 -*-
import os
import sys
import math

import tornado.web

from crawler import Book
from rules import *

import celerytasks
sys.path.append(os.path.dirname(__file__))

from homehandlers import *
from bookhandlers import *


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