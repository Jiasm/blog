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

### JavaScript中的语法

赘述那些特殊字符的作用并没有什么意义，浪费时间。
推荐MDN的文档：[基础的正则表达式特殊字符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_Expressions#使用特殊字符)

关于特殊字符，个人认为以下几个比较重要：

#### 捕获组

`/123(\d+)0/` 括号中的被称之为捕获组。
**P.S.** 关于`贪婪模式`和`非贪婪模式`，发现有些地方会拿这样的例子：
```javascript
/.+/ // 贪婪模式
/.+?/ // 非贪婪模式
```
仅仅拿这样简单的例子来说的话，有点儿扯淡
```javascript
// 假设有这样的一个字符串
let html = '<p><span>text1</span><span>text2</span></p>'

// 现在我们要取出第一个`span`中的文本，于是我们写了这样的正则
html.match(/<span>(.+)<\/span>/)
// 却发现匹配到的竟然是 text1</span><span>text2
// 这是因为 我们括号中写的是 `(.+)` .为匹配任意字符, +则表示匹配一次以上。
// 当规则匹配到了`text1`的时候，还会继续查找下一个，发现`<`也命中了`.`这个规则
// 于是就持续的往后找，知道找到最后一个span，结束本次匹配。

// 但是当我们把正则修改成这样以后：
html.match(/<span>(.+?)<\/span>/)
// 这次就能匹配到我们想要的结果了
// `?`的作为是，匹配`0~1`次规则
// 但是如果跟在`*`、`+`之类的表示数量的特殊字符后，含义就会变为匹配尽量少的字符。
// 当正则匹配到了text1后，判断后边的</span>命中了规则，就直接返回结果，不会往后继续匹配。
```

简单来说就是：
1. 贪婪模式，能拿<span style="font-size: 2em;">多少</span>拿多少
2. 非贪婪模式，能拿多<span style="font-size: 2em;">少</span>拿多少

#### 非捕获组

我们读取了一个文本文件，里边是一个名单列表
我们想要取出所有`Stark`的名字，我们就可以写这样的正则：
```javascript
let nameList = `
Brandon Stark
Sansa Stark
John Snow
`

nameList.match(/^\w+(?=\s?Stark)/gm) // => ["Brandon", "Sansa"]
```
上边的`(?=)`就是非捕获组，意思就是规则会被命中，但是在结果中不会包含它。

### 如何使用正则表达式

### 一些全新的特性

## 参考资料

- [MDN-正则表达式](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
- [RegExp named capture groups](http://2ality.com/2017/05/regexp-named-capture-groups.html)
- [在线正则匹配规则](https://jex.im/regulex)
