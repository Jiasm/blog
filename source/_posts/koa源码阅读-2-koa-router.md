---
uuid: 36042ab0-970a-11e8-b6da-f38a26a70a49
title: 'koa源码阅读[2]-koa-router'
date: 2018-08-03 18:44:34
tags:
  - javascript
  - koa
---

第三篇，有关koa生态中比较重要的一个中间件：[koa-router](https://github.com/alexmingoia/koa-router)  
## koa-router是什么

首先，因为koa是一个管理中间件的平台，而注册一个中间件使用`use`来执行。  
无论是什么请求，都会将所有的中间件执行一遍（如果没有中途结束的话）  
所以，这就会让开发者很困扰，如果我们要做路由该怎么写逻辑？  

<!-- more -->

```javascript
app.use(ctx => {
  switch (ctx.url) {
    case '/':
    case '/index':
      ctx.body = 'index'
      break
    case 'list':
      ctx.body = 'list'
      break
    default:
      ctx.body = 'not found'
  }
})
```

诚然，这样是一个简单的方法，但是必然不适用于大型项目，数十个接口通过一个`switch`来控制未免太繁琐了。  
更何况请求可能只支持`get`或者`post`，以及这种方式并不能很好的支持URL中包含参数的请求`/info/:uid`。  
在express中是不会有这样的问题的，提供了`get`、`post`等之类的与`METHOD`同名的函数用来注册回调：  
*express*
```javascript
const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('hi there.')
})
```

但是`koa`做了很多的精简，将很多逻辑都拆分出来作为独立的中间件来存在。  
所以导致很多`express`项目迁移为`koa`时，需要额外的安装一些中间件，`koa-router`应该说是最常用的一个。  
在koa中则需要额外的安装`koa-router`来实现类似的路由功能：  
*koa*
```javascript
const Koa = require('koa')
const Router = require('koa-router')

const app = new Koa()
const router = new Router()

router.get('/', async ctx => {
  ctx.body = 'hi there.'
})

app.use(router.routes())
  .use(router.allowedMethods())
```

看起来代码确实多了一些，毕竟将很多逻辑都从框架内部转移到了中间件中来处理，并不能够很方便的调用内部的一些函数。  
也算是为了保持一个简练的koa框架所取舍的一些东西吧。  
*koa-router的逻辑确实要比koa的复杂一些，可以将koa想象为一个市场，而koa-router则是其中一个摊位*  
*koa仅需要保证市场的稳定运行，而真正和顾客打交道的确是在里边摆摊的koa-router*  

## koa-router的大致结构

`koa-router`的结构并不是很复杂，也就分了两个文件：
```bash
.
├── layer.js
└── router.ja
```

`layer`主要是针对一些信息的封装，主要路基由`router`提供：  

tag|desc
:--|:--
layer|信息存储：路径、METHOD、路径对应的正则匹配、路径中的参数、路径对应的中间件
router|主要逻辑：对外暴露注册路由的函数、提供处理路由的中间件，检查请求的URL并调用对应的layer中的路由处理

## koa-router的运行流程

可以拿上边所抛出的基本例子来说明`koa-router`是怎样的一个执行流程：
```javascript
const router = new Router() // 实例化一个Router对象

// 注册一个路由的监听
router.get('/', async ctx => {
  ctx.body = 'hi there.'
})

app
  .use(router.routes()) // 将该Router对象的中间件注册到Koa实例上，后续请求的主要处理逻辑
  .use(router.allowedMethods()) // 添加针对OPTIONS的响应处理，一些预检请求会先触发 OPTIONS 然后才是真正的请求
```

### 创建实例时的一些事情

首先，在`koa-router`实例化的时候，是可以传递一个配置项参数作为初始化的配置信息的。  
然而这个配置项在`readme`中只是简单的被描述为：  

Param|Type|Description
:-:|:-:|:-:
[opts]|Object|
[opts.prefix]|String|prefix router paths(路由的前缀)

告诉我们可以添加一个`Router`注册时的前缀，也就是说如果按照模块化分，可以不必在每个路径匹配的前端都添加巨长的前缀：
```javascript
const Router = require('koa-router')
const router = new Router({
  prefix: '/my/awesome/prefix'
})

router.get('/index', ctx => { ctx.body = 'pong!' })

// curl /my/awesome/prefix/index => pong!
```

*P.S. 不过要记住，如果`prefix`以`/`结尾，则路由的注册就可以省去前缀的`/`了，不然会出现`/`重复的情况*  

然而实际上在注册一个路由监听时，是有一些其他的参数可以使用的，但是不太清楚为什么文档中没有提到：
Param|Type|Default|Description
:-:|:-:|:-:|:-:
sensitive|Boolean|`false`|是否严格匹配大小写
strict|Boolean|`false`|如果设置为`false`则匹配路径后边的`/`是可选的
methods|Array|`['HEAD','OPTIONS','GET','PUT','PATCH','POST','DELETE']`|设置路由可以支持的METHOD
routerPath|String|`null`|

实际上实例化`Router`时的代码：
```javascript
function Router(opts) {
  if (!(this instanceof Router)) {
    return new Router(opts)
  }

  this.opts = opts || {}
  this.methods = this.opts.methods || [
    'HEAD',
    'OPTIONS',
    'GET',
    'PUT',
    'PATCH',
    'POST',
    'DELETE'
  ]

  this.params = {}
  this.stack = []
}
```

#### sensitive

如果设置了`sensitive`，则会以更严格的匹配规则来监听路由，不会忽略URL中的大小写，完全按照注册时的来匹配：
```javascript
const Router = require('koa-router')
const router = new Router({
  sensitive: true
})

router.get('/index', ctx => { ctx.body = 'pong!' })

// curl /index => pong!
// curl /Index => 404
```

#### strict

`strict`与`sensitive`功能类似，也是用来设置让路径的匹配变得更加严格，在默认情况下，路径结尾处的`/`是可选的，如果开启该参数以后，如果在注册路由时尾部没有添加`/`，则匹配的路由也一定不能够添加`/`结尾：
```javascript
const Router = require('koa-router')
const router = new Router({
  strict: true
})

router.get('/index', ctx => { ctx.body = 'pong!' })

// curl /index  => pong!
// curl /Index  => pong!
// curl /index/ => 404
```

#### methods

`methods`配置项存在的意义在于，如果我们有一个接口需要同时支持`GET`和`POST`，`router.get`、`router.post`这样的写法必然是丑陋的。  
所以我们可能会想到使用`router.all`来简化操作：
```javascript
const Router = require('koa-router')
const router = new Router()

router.all('/ping', ctx => { ctx.body = 'pong!' })

// curl -X GET  /index  => pong!
// curl -X POST /index  => pong!
```

这简直是太完美了，可以很轻松的实现我们的需求，但是如果再多实验一些其他的`methods`以后，尴尬的事情就发生了：  
```bash
> curl -X DELETE /index  => pong!
> curl -X PUT    /index  => pong!
```

这显然不是符合我们预期的结果，所以，在这种情况下，基于目前`koa-router`需要进行如下修改来实现我们想要的功能：
```javascript
const Koa = require('koa')
const Router = require('router')

const app = new Koa()
// 修改处1
const methods = ['GET', 'POST']
const router = new Router({
  methods
})

// 修改处2
router.all('/', async (ctx, next) => {
  if (!~methods.indexOf(ctx.method)) {
    return await next()
  }

  ctx.body = 'pong!'
})

app.use(router.routes())
app.use(router.allowedMethods())
```

这样的两处修改，就可以实现我们所期望的功能：  
```bash
> curl -X GET    /index  => pong!
> curl -X POST   /index  => pong!
> curl -X DELETE /index  => Not Implemented
> curl -X PUT    /index  => Not Implemented
```

我个人觉得这是`allowedMethods`实现的一个逻辑问题，不过也许也是我个人理解有误，`allowedMethods`中比较关键的一些源码：
```javascript
Router.prototype.allowedMethods = function (options) {
  options = options || {}
  let implemented = this.methods

  return function allowedMethods(ctx, next) {
    return next().then(function() {
      let allowed = {}

      // 如果进行了ctx.body赋值，必然不会执行后续的逻辑
      // 所以就需要我们自己在中间件中进行判断
      if (!ctx.status || ctx.status === 404) {
        if (!~implemented.indexOf(ctx.method)) {
          if (options.throw) {
            let notImplementedThrowable
            if (typeof options.notImplemented === 'function') {
              notImplementedThrowable = options.notImplemented() // set whatever the user returns from their function
            } else {
              notImplementedThrowable = new HttpError.NotImplemented()
            }
            throw notImplementedThrowable
          } else {
            ctx.status = 501
            ctx.set('Allow', allowedArr.join(', '))
          }
        } else if (allowedArr.length) {
          // ...
        }
      }
    })
  }
}
```

首先，`allowedMethods`是作为一个后置的中间件存在的，因为在返回的函数中先调用了`next`，其次才是针对`METHOD`的判断，而这样带来的一个后果就是，如果我们在路由的回调中进行类似`ctx.body = XXX`的操作，实际上会修改本次请求的`status`值的，使之并不会成为`404`，而无法正确的触发`METHOD`检查的逻辑。  
想要正确的触发`METHOD`逻辑，就需要自己在路由监听中手动判断`ctx.method`是否为我们想要的，然后在跳过当前中间件的执行。  
而这一判断的步骤实际上与`allowedMethods`中间件中的`!~implemented.indexOf(ctx.method)`逻辑完全是重复的，不太清楚`koa-router`为什么会这么处理。  

__当然，`allowedMethods`是不能够作为一个前置中间件来存在的，因为一个`Koa`中可能会挂在多个`Router`，`Router`之间的配置可能不尽相同，不能保证所有的`Router`都和当前`Router`可处理的`METHOD`是一样的。__  
所以，个人感觉`methods`参数的存在意义并不是很大。。  

#### routerPath

这个参数的存在。。感觉会导致一些很诡异的情况。  
这就要说到在注册完中间件以后的`router.routes()`的操作了：
```javascript
Router.prototype.routes = Router.prototype.middleware = function () {
  let router = this
  let dispatch = function dispatch(ctx, next) {
    let path = router.opts.routerPath || ctx.routerPath || ctx.path
    let matched = router.match(path, ctx.method)
    // 如果匹配到则执行对应的中间件
  }
  return dispatch
}
```

因为我们实际上向`koa`注册的是这样的一个中间件，在每次请求发送过来时，都会执行`dispatch`，而在`dispatch`中判断是否命中某个`router`时，则会用到这个配置项，这样的一个表达式：`router.opts.routerPath || ctx.routerPath || ctx.path`，`router`代表当前`Router`实例，

### 注册路由的监听

### 请求的处理

### Layer所扮演的角色

## 小记