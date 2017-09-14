---
uuid: 112b61d0-9879-11e7-b474-b37818c72919
title: 'EJS源码解析[1]'
date: 2017-09-13 19:45:40
tags:
  - EJS
  - 源码解析
---

## 模版对外暴露的`API`

> 官方文档中有提到两个，最基本的使用也确实只有那两个，但是实际上可以调用的函数有五个

### clearCache

清除缓存，将之前内存中存储的模版清空。
简单粗暴的一个函数。。。<small>老铁，没毛病。</small>
```javascript
exports.clearCache = function () {
  cache = {};
};
```

### parse

|参数|描述|
|:-:|:-:|
|str|要进行解析的模版字符串|
|options|一系列的配置参数|

解析模版字符串，将其转换为可执行的`JavaScript`代码并返回。
P.S. 该函数的执行会返回一个`JavaScript`脚本的字符串，我们可以通过`new Function()`或者`eval`（不推荐了）来执行该脚本获得渲染好的字符串。

### compile

|参数|描述|
|:-:|:-:|
|str|要进行解析的模版字符串|
|options|一系列的配置参数|

函数会调用`parse`，并将生成好的脚本塞进一个函数中，并将函数返回，我们可以通过调用该函数来获得渲染好的字符串。

### render

|参数|描述|
|:-:|:-:|
|str|要进行解析的模版字符串|
|options|一系列的配置参数|

函数调用`compile`，返回值即是渲染好的字符串。

### renderFile

|参数|描述|
|:-:|:-:|
|path|模版字符串存储的路径|
|options|一系列的配置参数|
|fn|获取到文件后执行的回调函数|

该函数会将`path`取出，取出对应的文件，然后将文件的文本作为模版字符串传入`render`方法中。
`fn`回调函数应遵守[`Error-First`](http://fredkschott.com/post/2014/03/understanding-error-first-callbacks-in-node-js/)的规则。（第一个参数为`err`，后续参数为`result`）

对外的`API`除去`clearCache`外的四个函数，是一个包含的关系，大致结构如下：

> `renderFile` [> readFile & call `render`]
>> `render` [> call `compile` & execute]
>>> `compile` [> call `parse` & wrap]
>>>> `parse` [> build `ejs` template & return result]
