#!/usr/bin/env python
# -*- coding:utf-8 -*-

import math

def pageFun(totle,perpage,page,url):
    """
    a page function
    """
    pagehtml = '&nbsp;';
    if(totle > perpage) :
        totlepage = int(math.ceil(totle*1.0/perpage))
        offset = 2
        step = 1
        tend = 5
        if(page > totlepage) :
            page   = totlepage
        
        if(page-offset<=1) :
            if page == 1 :
                pagehtml = '<span class="prev">« 前页</span>'
            else :
                pagehtml = '<a href="'+url.replace('@',str(page-1))+'">« 前页</a>'
                
            if(totlepage > tend+1) :
                for i in range(1,tend+1):
                    if(i == page) :
                        pagehtml = pagehtml + '<span class="thispage">'+str(i)+'</span>'
                    else :
                        pagehtml = pagehtml + '<a href="'+url.replace('@',str(i))+'">'+str(i)+'</a>'
                
                if(totlepage-1 > tend):
                    pagehtml = pagehtml + '...<a href="'+url.replace('@',str(totlepage-1))+'">'+str(totlepage-1)+'</a>'
                    pagehtml = pagehtml + '<a href="'+url.replace('@',str(totlepage))+'">'+str(totlepage)+'</a>'
                else :
                    pagehtml = pagehtml + '...<a href="'+url.replace('@',str(totlepage))+'">'+str(totlepage)+'</a>'
                pagehtml = pagehtml + '<a href="'+url.replace('@',str(page+1))+'">下页 »</a>'
            else:
                for i in range(1,totlepage+1):
                    if(i == page) :
                        pagehtml = pagehtml + '<span class="thispage">'+str(i)+'</span>'
                    else :
                        pagehtml = pagehtml + '<a href="'+url.replace('@',str(i))+'">'+str(i)+'</a>'
                if(page == totlepage):
                    pagehtml = pagehtml + '<span class="next">下页 »</a>'
                else :
                    pagehtml = pagehtml + '<a href="'+url.replace('@',str(page+1))+'">下页 »</a>'
                    
        elif(page+offset>= totlepage):
            pagehtml = '<a href="'+url.replace('@',str(page-1))+'">« 前页</a>'
            if(totlepage > tend+1) :
                pagehtml = pagehtml + '<a href="'+url.replace('@',str(1))+'">1</a>'
                pagehtml = pagehtml + '<a href="'+url.replace('@',str(2))+'">2</a>...'
                for i in range(totlepage-4,totlepage+1):
                    if(i == page) :
                        pagehtml = pagehtml + '<span class="thispage">'+str(i)+'</span>'
                    else :
                        pagehtml = pagehtml + '<a href="'+url.replace('@',str(i))+'">'+str(i)+'</a>'            
            else:
                for i in range(1,totlepage+1):
                    if(i == page) :
                        pagehtml = pagehtml + '<span class="thispage">'+str(i)+'</span>'
                    else :
                        pagehtml = pagehtml + '<a href="'+url.replace('@',str(i))+'">'+str(i)+'</a>'
            
            if(page == totlepage):
                pagehtml = pagehtml + '<span class="next">下页 »</a>'
            else :
                pagehtml = pagehtml + '<a href="'+url.replace('@',str(page+1))+'">下页 »</a>'
        else:
            pagehtml = '<a href="'+url.replace('@',str(page-1))+'">« 前页</a>'
            pagehtml = pagehtml + '<a href="'+url.replace('@',str(1))+'">1</a>'
            pagehtml = pagehtml + '<a href="'+url.replace('@',str(2))+'">2</a>...'
            for i in range(page-1,page+2):
                    if(i == page) :
                        pagehtml = pagehtml + '<span class="thispage">'+str(i)+'</span>'
                    else :
                        pagehtml = pagehtml + '<a href="'+url.replace('@',str(i))+'">'+str(i)+'</a>'
            pagehtml = pagehtml + '...<a href="'+url.replace('@',str(totlepage-1))+'">'+str(totlepage-1)+'</a>'
            pagehtml = pagehtml + '<a href="'+url.replace('@',str(totlepage))+'">'+str(totlepage)+'</a>'
            pagehtml = pagehtml + '<a href="'+url.replace('@',str(page+1))+'">下页 »</a>'
    return pagehtml
    