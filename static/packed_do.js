(function(){var a=document,i={},e={},h=function(k){return k.constructor===Array},c=function(k){if(window.console&&window.console.log){window.console.log(k)}},g={core_lib:["/static/jquery-1.5.2.min.js"],mods:{}},j=a.getElementsByTagName("script")[0],d=function(l,p,r,k,o){if(!l){return}if(i[l]){e[l]=false;if(k){k(l,o)}return}if(e[l]){setTimeout(function(){d(l,p,r,k,o)},1);return}e[l]=true;var q,m=p||l.toLowerCase().substring(l.lastIndexOf(".")+1);if(m==="js"){q=a.createElement("script");q.setAttribute("type","text/javascript");q.setAttribute("src",l);q.setAttribute("async",true)}else{if(m==="css"){q=a.createElement("link");q.setAttribute("type","text/css");q.setAttribute("rel","stylesheet");q.setAttribute("href",l);i[l]=true}}if(r){q.charset=r}if(m==="css"){j.parentNode.insertBefore(q,j);if(k){k(l,o)}return}q.onload=q.onreadystatechange=function(){if(!this.readyState||this.readyState==="loaded"||this.readyState==="complete"){i[this.getAttribute("src")]=true;if(k){k(this.getAttribute("src"),o)}q.onload=q.onreadystatechange=null}};j.parentNode.insertBefore(q,j)},b=function(r){if(!r||!h(r)){return}var n=0,q,l=[],p=g.mods,k=[],m={},o=function(v){var u=0,s,t;if(m[v]){return k}m[v]=true;if(p[v].requires){t=p[v].requires;for(;s=t[u++];){if(p[s]){o(s);k.push(s)}else{k.push(s)}}return k}return k};for(;q=r[n++];){if(p[q]&&p[q].requires&&p[q].requires[0]){k=[];m={};l=l.concat(o(q))}l.push(q)}return l},f=function(k){if(!k||!h(k)){return}this.queue=k;this.current=null};f.prototype={_interval:10,start:function(){var k=this;this.current=this.next();if(!this.current){this.end=true;return}this.run()},run:function(){var m=this,k,l=this.current;if(typeof l==="function"){l();this.start();return}else{if(typeof l==="string"){if(g.mods[l]){k=g.mods[l];d(k.path,k.type,k.charset,function(n){m.start()},m)}else{if(/\.js|\.css/i.test(l)){d(l,"","",function(n,p){p.start()},m)}else{this.start()}}}}},next:function(){return this.queue.shift()}};this.Do=function(){var l=Array.prototype.slice.call(arguments,0),k=new f(b(g.core_lib.concat(l)));k.start()};this.Do.add=function(l,k){if(!l||!k||!k.path){return}g.mods[l]=k};Do(g.core_lib)})();