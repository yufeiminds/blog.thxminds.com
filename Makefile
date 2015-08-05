
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
	@ghp-import _site -p -n -b master
