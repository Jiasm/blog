---
uuid: a7337b50-c6c7-11e7-96f2-dd6a04de452b
title: 正则表达式-JavaScript
date: 2017-11-11 18:04:06
tags:
 - javascript
 - regexp
---

## 什么是正则表达式

> 正则表达式是用于匹配字符串中字符组合的模式。在 JavaScript中，正则表达式也是对象。
> 这些模式被用于 `RegExp` 的 `exec` 和 `test` 方法, 以及 `String` 的 `match`、`replace`、`search` 和 `split` 方法。

<!-- more -->

正则表达式存在于大部分的编程语言，就算是在写`shell`时也会不经意的用到正则。
比如大家最喜欢的`rm -rf ./*`，这里边的`*`就是正则的通配符，匹配任意字符。

在`JavaScript`也有正则表达式的实现，差不多就长这个样子：`/\d/`（匹配一个数字）。
个人认为正则所用到的地方还是很多的，比如模版字符的替换、解析`URL`，表单验证 等等一系列。
如果在`Node.js`中用处就更为多，比如请求头的解析、文件内容的批量替换以及写爬虫时候一定会遇到的解析`HTML`标签。

![](https://os4ty6tab.qnssl.com/cblued/static/regexp-pic-1.1bula4mepbmpjg.png)

## 正则表达式在JavaScript中的实现

### 支持的语法

### 如何使用正则表达式

### 一些全新的特性

## 参考资料

- [MDN-正则表达式](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
- [RegExp named capture groups](http://2ality.com/2017/05/regexp-named-capture-groups.html)
- [在线正则匹配规则](https://jex.im/regulex)
