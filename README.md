#Mlook 
base on Celery & Tornado

# 安装

* 安装 Tornado, 参考: [http://www.tornadoweb.org](http://www.tornadoweb.org)
* 安装 Celery, 参考: [http://www.celeryproject.org](http://www.celeryproject.org)
* 配置 celeryconfig.py
* 运行 celeryd
* 下载并拷贝 kindlegen 至 /lib 目录，并添加可执行权限
* 运行 python website.py 或 ./server.sh start 9001
* 可以编辑 rules.py 添加网站规则以支持更多小说网站

# 许可

Mlook is Licensed under the MIT license: [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)

# 参考
* Tornado [http://www.tornadoweb.org](http://www.tornadoweb.org)
* Celery [http://www.celeryproject.org](http://www.celeryproject.org)
* Kindlegen [http://www.amazon.com/gp/feature.html?ie=UTF8&docId=1000234621](http://www.amazon.com/gp/feature.html?ie=UTF8&docId=1000234621)