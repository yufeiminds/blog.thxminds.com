#
# Copyright 2015 Thxminds
#

help:
	@echo "build	编译"
	@echo "clean	清理"
	@echo "rebuild	重建"
	@echo "preview	预览"
	@echo "serve	启动本地服务器"
	@echo "publish	发布到Github"

build:
	@writeup build

clean:
	@rm -rf _site
	@rm -rf .cache

rebuild:
	@make clean
	@make build

preview:
	@open _site/index.html

serve:
	@writeup serve

publish:
	@ghp-import _site -p -n -b gh-pages
