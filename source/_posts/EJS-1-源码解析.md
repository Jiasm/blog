---
uuid: 112b61d0-9879-11e7-b474-b37818c72919
title: 'EJS[1]-源码解析'
date: 2017-09-13 19:45:40
tags:
  - EJS
  - 源码解析
---

> 官方文档中有提到两个，最基本的使用也确实只有那两个，但是实际上可以调用的函数有五个。  
> 本篇会介绍下这五个API的作用&本人对于该API实现的一些想法。

<!-- more -->

`EJS`v1.x，代码篇幅上可以称得上短小精悍，算上注释不过400行。

建议先看完第一篇再看本文，[如何使用EJS](/2017/09/11/EJS-0-如何使用EJS/)。

## parse

我们会从最里边的`parse`函数说起。`parse`函数是根据`EJS`模版来生成一段可执行的脚本字符串。

`parse`、`compile`、`render`三个函数的参数是属于透传的，第一个参数`str`为模版源字符串，第二个参数`options`是可选的配置参数。

`parse`函数在拿到`str`以后，会将字符串拆成一个个的字符来匹配。

抛开匹配到界定符的逻辑外，其余的一些匹配都是自增+1形式的，比如`\n`、`\\`、`\'`或任意的普通文本。
也就是说，如果一个`EJS`模版文件没有用到太多的动态脚本，强烈建议开启`cache`。
就如同下图的代码，`EJS`会循环字符串的所有字符，执行一遍拼接，这个工作后续是有大量的重复的，如果开启了`cache`后，就可以避免这个问题，这也是可以提升性能的。

```javascript
ejs.render('<h1>Title</h1>')
```

其次就是判断字符命中为界定符：
会进一步的去查找结束的界定符，如果没有找到则会抛出异常。

```javascript
var open = options.open || exports.open || '<%'
var close = options.close || exports.close || '%>'
for (var i = 0, len = str.length; i < len; ++i) {
  var stri = str[i];

  // 判断是否匹配为开始界定符
  if (str.slice(i, open.length + i) == open) {

    // ... some code

    var end = str.indexOf(close, i);

    // 如果没有找到结束的界定符，抛出异常
    if (end < 0){
      throw new Error('Could not find matching close tag "' + close + '".');
    }
  }
}
```

在得到了`JavaScript`脚本的范围（在字符串中的下标）后，我们就可以开始着手拼接脚本的工作了。
首先我们需要判断这一段脚本的类型，因为我们知道`EJS`提供了有三种脚本标签`<% code %>`、`<%- code %>`、`<%= code %>`

三种处理方式也是不一样的，第一个会直接执行脚本，其余两个会输出脚本执行的返回值。
所以三种标签的差异就体现在这里：
这里是将要包裹脚本的前缀后缀给创建了出来。
最终的返回结果会是 `prefix + js + postfix`。
我们会发现`prefix`里边有一个`line`变量，这里用到了[逗号运算符／逗号操作符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Comma_Operator)，很巧妙。
作为一个行号的输出，既不会影响程序的执行，又可以在出错的时候帮助我们快速定位问题所在。

```javascript
  switch (str[i]) {
    case '=': // 序列化返回值
      prefix = "', escape((" + line + ', ';
      postfix = ")), '";
      ++i;
      break;
    case '-': // 直接返回
      prefix = "', (" + line + ', ';
      postfix = "), '";
      ++i;
      break;
    default: // 仅仅是执行
      prefix = "');" + line + ';';
      postfix = "; buf.push('";
  }
```

三种标签拼接后的示例：

```javascript
//                                       var buf = []

ejs.render('<h1><%= "Title" %></h1>') // buf.push('<h1>', escape((1, 'Title')), '</h1>')

ejs.render('<h1><%- "Title" %></h1>') // buf.push('<h1>', (1, 'Title'), '</h1>')

ejs.render('<h1><% "Title" %></h1>')  // buf.push('<h1>'); 1; 'Title'; buf.push('</h1>')

//                                       return buf.join('')
```

P.S. `parse`函数在后边还会处理一个`EJS`v1.x版本有的`Filters`特性，因为不常用，而且v2.x版本已经移除了，所以就不再赘述。

## compile

`compile`函数中会调用`parse`函数，获取脚本字符串。
并将字符串作为一个函数的主体来创建新的函数。
如果开启了`debug`，`compile`会添加一些额外的信息在脚本中。一些类似于堆栈监听之类的。

```javascript
str = exports.parse(str, options) // 获取脚本字符串
var fn = new Function('locals, filters, escape, rethrow', str) // 创建函数

return function (locals) {
  fn.call(this, locals, filters, escape, rethrow);
}
```

## render

`render`函数会调用`compile`函数，并执行它得到模版处理后的结果。
`cache`的判断也是在`render`函数这里做的。
我们存在内存中用来缓存的模版并不是执行后的结果，而是创建好的那个函数，也就是`compile`的返回值，也就是说，我们缓存的其实是构建函数的那一个步骤，我们可以传入不同的变量来实现动态的渲染，并且不必多次重复构建模版函数。


## renderFile

`renderFile`函数只能够在node环境下使用。。因为有涉及到了`io`的操作，需要取读取文件内容，然后调用`render`函数。
同时`renderFile`也是可以使用`cache`的，但是为了避免`renderFile`的`path`和缓存的`key`重复，所以`renderFile`中有这么一个小操作。
```javascript
var key = path + ':string';
```

## 小记

`EJS`v1.x源码非常清晰易懂，很适合作为研究模版引擎类的入门。
v2.x使用了一些面向对象的程序设计。。篇幅更是达到了接近900行（费解-.-不知道意义何在）。。有机会尝试着会去读一些v2.x版本的代码。

## TODO

接下来会做一下几个模版引擎的横向对比，关于性能方面、开发难易程度、功能的完善上，各种balabala...
