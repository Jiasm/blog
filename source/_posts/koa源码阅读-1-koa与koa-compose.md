---
uuid: b0c0fa80-92f5-11e8-90cf-cf954482d09f
title: 'koa源码阅读[1]-koa与koa-compose'
date: 2018-07-29 14:07:36
tags:
  - koajs
  - javascript
  - 源码阅读
---

接上次挖的坑，对Koa2相关的源码进行分析 [第一篇](/2018/07/22/koa 源码阅读-0/)。  
不得不说，koa是一个很轻量、很优雅的http框架，尤其是在2.x以后移除了co的引入，使其代码变得更为清晰。  

Express和Koa同为一批人进行开发，与Express相比，Koa显得非常的迷你。  
因为Express是一个大而全的http框架，内置了类似router之类的中间件进行处理。  
而在Koa中，则将类似功能的中间件全部摘了出来，早期Koa里边是内置了koa-compose的，而现在也是将其分了出来。  
Koa只保留一个简单的中间件的整合，Http请求的处理，作为一个功能性的中间件框架来存在，自身仅有少量的逻辑。  
Koa-compose则是作为整合中间件最为关键的一个工具，所以要将两者放在一起来看。

<!-- more -->

## koa

### 基本结构

```bash
.
├── application.js
├── request.js
├── response.js
└── context.js
```

关于Koa整个框架的实现，也只是简单的拆分为了四个文件。  

就象在上一篇笔记中模拟的那样，创建了一个对象用来注册中间件，监听http服务，这个就是`application.js`在做的事情。  
而框架的意义呢，就是在框架内，我们要按照框架的规矩来做事情，同样的，框架也会提供给我们一些更易用的方式来让我们完成需求。
针对`http.createServer`回调的两个参数`request`和`response`进行的一次封装，简化一些常用的操作。  
例如我们对`Header`的一些操作，在原生`http`模块中可能要这样写：
```javascript
// 获取Content-Type
request.getHeader('Content-Type')

// 设置Content-Type
response.setHeader('Content-Type', 'application/json')
response.setHeader('Content-Length', '18')
// 或者，忽略前边的statusCode，设置多个Header
response.writeHead(200, {
  'Content-Type': 'application/json',
  'Content-Length': '18'
})
```

而在Koa中可以这样处理：
```javascript
// 获取Content-Type
context.request.get('Content-Type')

// 设置Content-Type
context.response.set({
  'Content-Type': 'application/json',
  'Content-Length': '18'
})
```

简化了一些针对`request`与`response`的操作，将这些封装在了`request.js`和`response.js`文件中。  
但同时这会带来一个使用上的困扰，这样封装以后其实获取或者设置`header`变得层级更深，需要通过`context`找到`request`、`response`，然后才能进行操作。  
所以，Koa使用了[node-delegates](https://github.com/tj/node-delegates)来进一步简化这些步骤，将`request.get`、`response.set`通通代理到`context`上。  
也就是说，代理后的操作是这样子的：
```javascript
context.get('Content-Type')

// 设置Content-Type
context.set({
  'Content-Type': 'application/json',
  'Content-Length': '18'
})
```

这样就变得很清晰了，获取`Header`，设置`Header`，*再也不会担心写成`request.setHeader`了*，一气呵成，通过`context.js`来整合`request.js`与`response.js`的行为。
同时`context.js`也会提供一些其他的工具函数，例如`Cookie`之类的操作。

由`application`引入`context`，`context`中又整合了`request`和`response`的功能，四个文件的作用已经很清晰了：
file|desc
:--|:--
applicaiton|中间件的管理、`http.createServer`的回调处理，生成`Context`作为本次请求的参数，并调用中间件
request|针对`http.createServer -> request`功能上的封装
response|针对`http.createServer -> response`功能上的封装
context|整合`request`与`response`的部分功能，并提供一些额外的功能

### 拿一个完整的流程来说明Koa源码的作用

首先，我们需要创建一个Http服务，在Koa2中创建服务与Koa1稍微有些区别，要求使用实例化的方式来进行创建：  
```javascript
const app = new Koa()
```

而在实例化的过程中，其实Koa只做了有限的事情，创建了几个实例属性。  
将引入的`context`、`request`以及`response`通过`Object.create`拷贝的方式放到实例中。  
```javascript
this.middleware = [] // 最关键的一个实例属性

// 用于在收到请求后创建上下文使用
this.context = Object.create(context)
this.request = Object.create(request)
this.response = Object.create(response)
```

在实例化完成后，我们就要进行注册中间件来实现我们的业务逻辑了，上边也提到了，Koa仅用作一个中间件的整合以及请求的监听。  
所以不会像Express那样提供`router.get`、`router.post`之类的操作，仅仅存在一个比较接近`http.createServer`的`use()`。  
接下来的步骤就是注册中间件并监听一个端口号启动服务：

```javascript
const port = 8000

app.use(async (ctx, next) => {
  console.time('request')
  await next()
  console.timeEnd('request')
})
app.use(async (ctx, next) => {
  await next()
  ctx.body = ctx.body.toUpperCase()
})

app.use(ctx => {
  ctx.body = 'Hello World'
})

app.use(ctx => {
  console.log('never output')
})

app.listen(port, () => console.log(`Server run as http://127.0.0.1:${port}`))
```

再翻看`application.js`的源码是，可以看到，暴露给外部的方法，常用的基本上就是`use`和`listen`。  
一个用来加载中间件，另一个用来监听端口并启动服务。

而这两个函数实际上并没有过多的逻辑，在`use`中仅仅是判断了传入的参数是否为一个`function`，以及在2.x版本针对`Generator`函数的一些特殊处理，将其转换为了`Promise`形式的函数，并将其`push`到构造函数中创建的`middleware`数组中。  
这个是从1.x过渡到2.x的一个工具，在3.x版本将直接移除`Generator`的支持。  
其实在`koa-convert`内部也是引用了`co`和`koa-compose`来进行转化，所以也就不再赘述。  

而在`listen`中做的事情就更简单了，只是简单的调用`http.createServer`来创建服务，并监听对应的端口之类的操作。  
有一个细节在于，`createServer`中传入的是`Koa`实例的另一个方法返回值`callback`，这个方法才是真正的回调处理，`listen`只是`http`模块的一个快捷方式。  
这个是为了一些用`socket.io`、`https`或者一些其他的`http`模块来进行使用的。  
也就意味着，只要是可以提供与`http`模块一致的行为，`Koa`都可以很方便的接入。  

所以我们就来看看`callback`的实现：  
```javascript
callback() {
  const fn = compose(this.middleware);

  if (!this.listenerCount('error')) this.on('error', this.onerror);

  const handleRequest = (req, res) => {
    const ctx = this.createContext(req, res);
    return this.handleRequest(ctx, fn);
  };

  return handleRequest;
}
```
在函数内部的第一步，就是要处理中间件，将一个数组中的中间件转换为我们想要的洋葱模型格式的。  
这里就用到了比较核心的[koa-compose](https://github.com/koajs/compose)  

其实它的功能上与`co`类似，只不过把`co`处理`Generator`函数那部分逻辑全部去掉了，本身`co`的代码也就是一两百行，所以精简后的`koa-compose`代码仅仅只有48行。  

我们知道，`async`函数实际上剥开它的语法糖以后是长这个样子的：
```javascript
async function func () {
  return 123
}

// ==>

function func () {
  return Promise.resolve(123)
}
// or
function func () {
  return new Promise(resolve => resolve(123))
}
```

所以拿上述`use`的代码举例，实际上`koa-compose`拿到的是这样的参数：
```javascript
[
  function (ctx, next) {
    return new Promise(resolve => {
      console.time('request')
      next().then(() => {
        console.timeEnd('request')
      })
    })
  },
  function (ctx, next) {
    return new Promise(resolve => {
      next().then(() => {
        ctx.body = ctx.body.toUpperCase()
      })
    })
  },
  function (ctx, next) {
    return new Promise(resolve => {
      ctx.body = 'Hello World'
    })
  },
  function (ctx, next) {
    return new Promise(resolve => {
      console.log('never output')
    })
  }
]
```