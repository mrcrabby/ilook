#!/usr/bin/env python
# -*- coding:utf-8 -*-

import os
import hashlib
import urllib2
import urlparse
import zipfile
import logging
import re

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))

from tornado import template
from BeautifulSoup import BeautifulSoup
from scrapy.selector import HtmlXPathSelector

from rules import *

import codecs
import encodings
encodings.aliases.aliases['gb2312'] = 'gb18030'
encodings.aliases.aliases['gbk'] 	= 'gb18030'

user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.44 Safari/534.24"

tpl_dir  = os.path.join(os.path.dirname(__file__), 'tpl')
data_dir = os.path.join(os.path.dirname(__file__), 'data')


iswindows = 'win32' in sys.platform.lower() or 'win64' in sys.platform.lower()
isosx     = 'darwin' in sys.platform.lower()
isfreebsd = 'freebsd' in sys.platform.lower()
islinux   = not(iswindows or isosx or isfreebsd)

if iswindows:
    kindlegen = os.path.join(os.path.dirname(__file__), 'lib', 'kindlegen.exe')
else:
    kindlegen = os.path.join(os.path.dirname(__file__), 'lib', 'kindlegen')

def get_contents(url, referer=None):
    """docstring for get_contents"""

    try:
        req = urllib2.Request(url)
        req.add_header('User-Agent', user_agent)

        if referer is not None:
            req.add_header('Referer', referer)

        response = urllib2.urlopen(req)
        data = response.read()

        response.close()
        response = None
        del response
        return data
    except Exception, e:
        logging.error("get %s failed!" % url)
        return None

class Book(object):
    """docstring for Book"""
    
    id = ""
    name = ""
    author = ''
    cover = None
    chapter_list = []
    
    source = ""
    book_dir = ""
    chapters_dir = ""
    
    index = 1
    
    def __init__(self, source=None, id=None):
        
        if id is None:
            self.id = hashlib.sha1(source).hexdigest()
        else:
            self.id = id
        
        self.source = source
        self.book_dir = os.path.join(data_dir, self.id)
        self.chapters_dir = os.path.join(self.book_dir, 'chapters')
        
        if os.path.isfile(os.path.join(self.book_dir, 'bookname')):
            fp = open(os.path.join(self.book_dir, 'bookname'), 'r')
            self.name = fp.read()
            fp.close()
        
    def init(self):
        """docstring for init"""
        if os.path.isdir(self.book_dir) is False:
            os.mkdir(self.book_dir)
        
        if os.path.isdir(self.chapters_dir) is False:
            os.mkdir(self.chapters_dir)
    
    def lock(self):
        """docstring for lock"""
        
        fp = open(os.path.join(self.book_dir, 'lock'), 'w')
        fp.write('lock')
        fp.close()
        
    def unlock(self):
        """docstring for unlock"""
        lock_file = os.path.join(self.book_dir, 'lock')
        if os.path.isfile(lock_file): os.unlink(lock_file)
    
    def set_name(self, name):
        self.name = name
        self.render("bookname", os.path.join(self.book_dir, "bookname"), name=self.name)
        
    @property
    def is_lock(self):
        """docstring for is_lock"""
        return os.path.isfile(os.path.join(self.book_dir, 'lock'))
    
    @property
    def is_exists(self):
        """docstring for exists"""
        return os.path.isdir(self.book_dir)
        
    @property
    def is_ready(self):
        """docstring for is_ready"""
    
        if os.path.isfile(os.path.join(self.book_dir, "book.mobi")) \
            and os.path.isfile(os.path.join(self.book_dir, "book.epub")):
            return True
        else:
            return False
    
    @property
    def mobi(self):
        mobi = os.path.join(self.book_dir, "book.mobi")
        
        if os.path.isfile(mobi):
            return os.path.join(self.book_dir, "book.mobi") #"%s/book.mobi" % self.id
        else:
            return None
    
    @property
    def epub(self):
        """docstring for get_epub"""
        
        epub = os.path.join(self.book_dir, "book.epub")
        if os.path.isfile(epub):
            return os.path.join(self.book_dir, "book.epub") #"%s/book.epub" % self.id
        else:
            return None

    def add_chapter(self, title, content, source=None, index=None):
        """docstring for fname"""
        
        if index is None:
            index = self.index
            self.index += 1
            
        file_name = "chapter_%04d.html" % index
        self.render("chapter.html", os.path.join(self.chapters_dir, file_name), title=title, content=content)

        self.chapter_list.append({
            'index': index,
            'title': title,
            'file': file_name
        })
        
    def collect(self):
        pass
        
    def create(self):
        """docstring for create_index"""
        self.render("toc.html", os.path.join(self.book_dir, "toc.html"), title=self.name, chapters=self.chapter_list)
        self.render("toc.ncx", os.path.join(self.book_dir, "toc.ncx"), title=self.name, chapters=self.chapter_list)
        self.render("content.opf", os.path.join(self.book_dir, "content.opf"), title=self.name, author=self.author, chapters=self.chapter_list, cover=self.cover)
        self.render("cover.html", os.path.join(self.book_dir, "cover.html"), title=self.name, author=self.author, cover=self.cover)
        self.render("style.css", os.path.join(self.book_dir, "style.css"))
    
    def render(self, tpl_name, file_name, **kargs):
        """docstring for render"""
        content = self.render_string(tpl_name, id=self.id, **kargs)
        
        fp = open(file_name, 'w')
        fp.write(content)
        fp.close()
        
    def render_string(self, tpl_name, **kargs):
        """docstring for render_string"""
        return template.Loader(tpl_dir).load(tpl_name).generate(**kargs)
    
    def set_cover(self, data):
        """docstring for set_cover"""
        
        fp = open(os.path.join(self.book_dir, "cover.jpg"), 'w')
        fp.write(data)
        fp.close()
        
        self.cover = "cover.jpg"
      
    def toEpub(self):
        """docstring for toEpub"""

        epub_file = os.path.join(self.book_dir, "book.epub")

        zip = zipfile.ZipFile(epub_file, mode='w', compression=zipfile.ZIP_DEFLATED)
        
        zip.write(os.path.join(tpl_dir, 'mimetype'), 'mimetype', zipfile.ZIP_STORED)
        zip.write(os.path.join(tpl_dir, 'META-INF', 'container.xml'), 'META-INF/container.xml')
        zip.write(os.path.join(tpl_dir, 'style.css'), "style.css")
        zip.write(os.path.join(self.book_dir, 'content.opf'), "content.opf")
        zip.write(os.path.join(self.book_dir, 'cover.html'), "cover.html")
        zip.write(os.path.join(self.book_dir, 'toc.html'), "toc.html")
        zip.write(os.path.join(self.book_dir, 'toc.ncx'), "toc.ncx")
        
        for chapter in self.chapter_list:
            zip.write(os.path.join(self.chapters_dir, chapter['file']), "chapters/%s" % chapter['file'])
            
        zip.close()

    def toPdf(self):
        """docstring for toPdf"""
        pass
        
    def toText(self):
        """docstring for toText"""
        pass
    
    def toMobi(self):
        """docstring for toMobi"""
        
        if os.path.isfile(kindlegen):
            os.system('%s %s -o "%s"' % (kindlegen, os.path.join(self.book_dir, "content.opf"), "book.mobi"))

class Crawler(object):
    """docstring for Crawler"""
    
    remove_tags = ['script','object','video','embed','iframe','noscript','img']
    remove_attrs = ['title','width','height','onclick','onload']
    
    def __init__(self, url):
        self.url = url
        
    def write_file(self, data, filename='t.html'):
        """docstring for write_file"""
        fp = open(filename, 'w')
        fp.write(data)
        fp.close()
        
    def collect(self):
        """docstring for run"""
        
        url_obj = urlparse.urlparse(self.url)
        
        if url_obj.hostname in Rules:
            rule = Rules[url_obj.hostname]
        else:
            logging.error("rule not found!")
            return
            
        if 'url_validate' in rule and not re.match(rule['url_validate'], self.url):
            logging.error("url invalid!")
            return
        
        logging.debug("start collect index...")
        html = get_contents(self.url)
        
        if html is None:
            logging.error("get %s failed!" % self.url)
            return
            
        book = Book(self.url)

        if book.is_lock:
            logging.info("book is queueing")
            return
        else:
            book.init()
            # book.lock()

        if 'encoding' in rule:
            encoding = rule['encoding']
        else:
            encoding = 'utf-8'
        
        soup = BeautifulSoup(html, fromEncoding=encoding)
        html = soup.renderContents('utf-8')
        
        hxs = HtmlXPathSelector(text=html)
        
        # self.write_file(html)

        book_name = hxs.select(rule['book_name']).extract()
        
        if type(book_name) is list:
            book_name = book_name[0].strip()
        elif not book_name:
            book_name = soup.html.head.title.string
        
        book.set_name(book_name)
        
        if 'book_author' in rule:
            book_author = hxs.select(rule['book_author']).extract()
            
            if type(book_author) is list:
                book.author = book_author[0].strip()
            elif type(book_author) is str:
                book.author = book_author
            
        if 'book_cover' in rule:
            cover_url = hxs.select(rule['book_cover']).extract()
            
            if type(cover_url) is list:
                print cover_url
                cover_url = cover_url[0]
            
            if cover_url:
                cover_data = get_contents(cover_url, self.url)
                book.set_cover(cover_data)
        
        if 'chapter_url' in rule:
            
            if 'book_id' in rule:
                book_id = rule['book_id'](self.url)
                chapter_url = rule['chapter_url'] % book_id
            else:
                chapter_url = hxs.select(rule['chapter_url']).extract()
                if type(chapter_url) is list:
                    chapter_url = chapter_url[0]
            
            html = get_contents(chapter_url)
            
            soup = BeautifulSoup(html, fromEncoding=encoding)
            html = soup.renderContents('utf-8')

            hxs = HtmlXPathSelector(text=html)
            chapter_list =  hxs.select(rule['chapter_list']).extract()
            
        else:
            chapter_list =  hxs.select(rule['chapter_list']).extract()
            
        logging.debug("start collect %s" % book.name)
        logging.debug("start collect chapters...")

        for chapter in chapter_list:
            
            try:
                subsoup = BeautifulSoup(chapter)
            
                a = subsoup.find('a')
            
                if a['href'].partition("://")[0] in ('http', 'https'):
                    chapter_url = a['href']
                else:
                    chapter_url = urlparse.urljoin(self.url, a['href'])
                
                chapter_content = get_contents(chapter_url, self.url)
            
                if chapter_content is None:
                    continue
            
                subsoup = BeautifulSoup(chapter_content, fromEncoding=encoding)
                chapter_content = subsoup.renderContents('utf-8')

                hxs = HtmlXPathSelector(text=chapter_content)
            
                chapter_title = hxs.select(rule['chapter_title']).extract()
                
                if type(chapter_title) is list:
                    chapter_title = chapter_title[0].strip()
                else:
                    chapter_title = subsoup.html.head.title.string
            
                if 'chapter_content_url' in rule:
                    chapter_content_url = hxs.select(rule['chapter_content_url']).extract()
                    
                    if type(chapter_content_url) is list and len(chapter_content_url) > 0:
                        chapter_content_url = chapter_content_url[0].strip()
                    # elif not chapter_content_url:
                    else:
                        continue

                    chapter_content = get_contents(chapter_content_url, chapter_url)
                
                    subsoup = BeautifulSoup(chapter_content, fromEncoding=encoding)
                    chapter_content = subsoup.renderContents('utf-8')
                else:
                    chapter_content = hxs.select(rule['chapter_content']).extract()
                
                    if type(chapter_content) is list:
                        chapter_content = ''.join(chapter_content).strip()
                
                if not chapter_content:
                    continue
                    
                if 'chapter_content_filter' in rule:
                    chapter_content = rule['chapter_content_filter'](chapter_content)
            
                subsoup = BeautifulSoup(chapter_content)
            
                for tag in subsoup.findAll(self.remove_tags):
                    tag.extract()
                
                for tag in list(subsoup.findAll(attrs={"style":"display:none"})):
                    tag.extract()
            
                book.add_chapter(chapter_title, subsoup.renderContents('utf-8'))
            except Exception, e:
                logging.error(e)
        
        logging.debug("start building...")
        
        book.create()
        book.toEpub()
        book.toMobi()
        book.unlock()

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s:%(msecs)03d %(levelname)-8s %(message)s',
        datefmt='%m-%d %H:%M')
    # Crawler("http://read.dangdang.com/book_15062").collect()
    # Crawler("http://read.360buy.com/5033/index.html").collect()
    Crawler("http://www.qidian.com/BookReader/1887208.aspx").collect()
    
    
        