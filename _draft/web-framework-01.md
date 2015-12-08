# 搭建自己的Python Web框架

- date: 2015-10-20
- tags: thought
- cover: http://7xkb4l.com1.z0.glb.clouddn.com/blog/mountain.jpg

Python学习之路，基于Flask搭建一个完整的Restful API框架。这会是一篇长文，也零散纪录了自己的一些心得体会。

---

今天的Web应用呈现松耦合，服务化的趋势，单一服务的复杂度降低，但整体来看却比数年前的架构复杂得多。

我打算在这一系列文章中，记录我在基于Flask开发一个简单的对外提供Restful API的服务框架所经历的一些，和读者一步一步共同成长。

在搭建一个可用的Web框架之前，我们会思考：

> 一个Web框架需要包含什么内容呢？

随着文章的进展我将不断补充这个提纲:

1. [Introduction](#)
2. [Api](#)
3. [Sso](#)
4. [Exception](#)
5. [Authentication](#)
6. [待定](#)

### Restful

最基本的，是对外提供API的能力，根据不同的请求，作出不同的响应，一个定义良好的API规范，是一个框架至关重要的核心。

现有的API风格中，最通行的是一种名为 ``Restful`` 的风格，我们敬爱的阮一峰老师写过一篇关于 ``Restful`` 的[文章][Restful]，简单易懂。

之所以使用 ``Restful`` 风格，是因为 Restful 将数据抽象成一个个实体资源，与我们后面要实现的权限控制和服务划分不谋而合。

一个符合 ``Restful`` 风格的请求按照语义可分为主语(资源)、谓词(对该资源进行的动作)、上下文(参数和当前请求所处的状态)。

假如我想设计一个文档处理服务：

主语和谓词很好理解，文档是一类资源，每一个文档是一个特定的资源。对文档进行新建、编辑、删除、浏览等操作则是一个动作，这些动作就是体现在HTTP语义上就是谓词。

而上下文的表示方法则多种多样了，我们常说HTTP是个无状态协议，那么就意味着我们必需拥有某种办法来修改或维持请求的上下文，比如登录用户，保存正在编辑文章等。

几种比较常见的实现方式有 ``Cookie`` 和 ``Header``, 这个微型框架使用 HTTP Header 作为上下文维持的技术，主要为了进行跨域请求，由于 Cookie 本身是挂在 **域** 下面的（参见 [RFC 2109][RFC Cookie]），所以进行跨域请求的时候不能通过Cookie来传递上下文。

一个有效的HTTP Header类似于下面这样

```python
GET /dict/SerpHoverTrans?q=State HTTP/1.1
Host: cn.bing.com
Pragma: no-cache
Cache-Control: no-cache
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36
Accept: */*
Referer: http://xxx
Accept-Encoding: gzip, deflate, sdch
Accept-Language: zh-CN,zh;q=0.8,en;q=0.6
Cookie: 
```

我们的框架在此基础上添加了一个Header：

```
Authorization: auth-token-xxxx
```

RFC中的[这篇文章][RFC Methods]定义了现有的所有HTTP Method，

### API Handlers




[Restful]: http://www.ruanyifeng.com/blog/2011/09/restful.html "阮一峰老师的Restful"
[RFC Methods]: http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html "RFC 关于HTTP Method的相关定义"
[RFC Cookie]: http://baidu.com/ "RFC 关于Cookie的定义"
