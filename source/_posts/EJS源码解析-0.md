---
uuid: 082942a0-9702-11e7-8b41-a53d09958c8f
title: 'EJS源码解析[0]-如何使用EJS'
date: 2017-09-11 23:01:04
tags:
  - EJS
  - 源码解析
---

> 最近做的一个新项目，所以想着换一个新的模版引擎尝试一下。（之前我们一直在使用[`handlebars`](http://handlebarsjs.com/)）  
<!-- more -->
> 本次源码分析所使用的是TJ大神开发的[1.x版本](https://github.com/tj/ejs)  
> 当然现在该项目已经停止维护了，目前正在维护的是[2.x版本](https://github.com/mde/ejs)


## 什么是EJS

`EJS`是一个`JavaScript`模版库，用来将`EJS`模版结合着`JSON`数据转换为`HTML`
并且可以直接在模版中写`JavaScript`的语法

### 简单的示例
```javascript
let template = '<h1>Hello, <%= name %></h1>'
let data = {
  name: 'Niko Bellic'
}

let renderStr = ejs.render(template, data)

console.log(renderStr) // => <h1>Hello, Niko Bellic</h1>
```

`EJS`模版主要还是`HTML`标签，仅仅添加了几对特定的标签（`<%  %>`, `<%= %>`, `<%-  %>`, `<%  -%>`, `<%#  %>`）。

## 为什么要用EJS

近年来，前端各种MV*框架层出不穷，`React`，`Angular`，`Vue`，当然这应该也是未来几年的趋势了，但是这些大都是前端运行时进行渲染，动态的生成`HTML`。  <small>（`React`是有着[服务端渲染](https://facebook.github.io/react/docs/react-dom-server.html)的解决方案，为了解决SEO的问题）</small>  
但是`EJS`这类的模版引擎是不依赖于宿主语言环境的，只要是`JavaScript`即可，也就是说可以用于`server`端（`node.js`）直接渲染，返回给前端渲染好的页面。（这个在大部分后台页面的开发中还是需要的）  
当请求某个链接时，直接将渲染完成的页面呈现给用户，主要的作用有两点：  
1. 避免了代码都存在前端，被某些恶意用户看到。  
2. 对搜索引擎SEO更友好。  

<small>当然，`MV*`框架依然是近几年的趋势，也是建议多去使用和研究那些框架，但是模版引擎和前端的那几个框架并不冲突，也是可以一起使用的。</small>

## 如何使用EJS

`EJS`提供了数个标签来供我们使用，在标签内可以直接写`JavaScript`代码，如果使用服务端来渲染，你甚至可以直接引用一些`npm`包，来做一些想做的事情。

### `<% code %>`

`EJS`会执行标签内的代码，一般用于逻辑处理或者循环创建使用。

```html
<% if (user) { %>
    <h2><%= user.name %></h2>
<% } %>
```

如上文在`EJS`处理后的代码应该是类似这个样子的。*（源代码比这个内容更丰富一些。。。）*

```javascript
(function () {
  var buf = []

  if (user) {
    buf.push('<h2>')
    buf.push(user.name)
    buf.push('</h2>')
  }

  return buf.join('')
})
```

### `<%- code %>`

`EJS`会将标签内的代码执行，并获取返回值，将返回值输出到字符串中。

```html
<span><%= 'Hello' %></span>

<!-- convert -->

<span>Hello</span>
```

### `<%= code %>`

`<%= code %>`与`<%- code %>`类似，只不过会将返回值进行转义后输出。

```html
<span><%= '<hello />' %></span>

<!-- convert -->

<span>&lt;hello /&gt;</span>
```

### `<%# comment %>`

昂。。这个标签里边的内容是作为注释存在的。。估计很少有人会用-.- 在模版生成后，会移除里边的内容

### 在标签后边添加`-`

这个有很多种写法都可以支持，比如：`<% -%>`，`<%= -%>`，`<%- -%>`
**这样会移除该标签后边的第一个换行符（如果有的话）**

```html
<h1>
  <%- 'Title' %>
</h1>

<!-- convert -->

<h1>
  Title
</h1>

<!-- line -->

<h1>
  <%- 'Title' -%>
</h1>

<!-- convert -->

<h1>
  Title</h1>
```

## 一些完整的示例

仓库中存放了一些各种使用姿势的示例：  
https://github.com/Jiasm/ejs-examples
