---
uuid: 36042ab0-970a-11e8-b6da-f38a26a70a49
title: 'koa源码阅读[2]-koa-router'
date: 2018-08-03 18:44:34
tags:
  - javascript
  - koa
---

第三篇，有关koa生态中比较重要的一个中间件：[koa-router](https://github.com/alexmingoia/koa-router)  

> 第一篇：[koa源码阅读-0](/2018/07/22/koa源码阅读-0)  
> 第二篇：[koa源码阅读-1-koa与koa-compose](/2018/07/29/koa源码阅读-1-koa与koa-compose)  

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
在`express`中是不会有这样的问题的，自身已经提供了`get`、`post`等之类的与`METHOD`同名的函数用来注册回调：  
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
所以在`koa`中则需要额外的安装`koa-router`来实现类似的路由功能：  
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

看起来代码确实多了一些，毕竟将很多逻辑都从框架内部转移到了中间件中来处理。  
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

File|Description
:--|:--
`layer`|信息存储：路径、METHOD、路径对应的正则匹配、路径中的参数、路径对应的中间件
`router`|主要逻辑：对外暴露注册路由的函数、提供处理路由的中间件，检查请求的URL并调用对应的layer中的路由处理

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
  .use(router.allowedMethods()) // 添加针对OPTIONS的响应处理，以及一些METHOD不支持的处理
```

### 创建实例时的一些事情

首先，在`koa-router`实例化的时候，是可以传递一个配置项参数作为初始化的配置信息的。  
然而这个配置项在`readme`中只是简单的被描述为：  

Param|Type|Description
:-:|:-:|:--
`[opts]`|`Object`|
`[opts.prefix]`|`String`|prefix router paths(路由的前缀)

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

实例化`Router`时的代码：
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

可见的只有一个`methods`的赋值，但是在查看了其他源码后，发现除了`prefix`还有一些参数是实例化时传递进来的，但是不太清楚为什么文档中没有提到：  

Param|Type|Default|Description
:-:|:-:|:--|:--
`sensitive`|`Boolean`|`false`|是否严格匹配大小写
`strict`|`Boolean`|`false`|如果设置为`false`则匹配路径后边的`/`是可选的
`methods`|`Array[String]`|`['HEAD','OPTIONS','GET','PUT','PATCH','POST','DELETE']`|设置路由可以支持的METHOD
`routerPath`|String|`null`|

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
  // 理想情况下，这些判断应该交由中间件来完成
  if (!~methods.indexOf(ctx.method)) {
    return await next()
  }

  ctx.body = 'pong!'
})
```

这样的两处修改，就可以实现我们所期望的功能：  
```bash
> curl -X GET    /index  => pong!
> curl -X POST   /index  => pong!
> curl -X DELETE /index  => Not Implemented
> curl -X PUT    /index  => Not Implemented
```

我个人觉得这是`allowedMethods`实现的一个逻辑问题，不过也许是我没有get到作者的点，`allowedMethods`中比较关键的一些源码：
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
    // 执行后续操作
  }
  return dispatch
}
```

因为我们实际上向`koa`注册的是这样的一个中间件，在每次请求发送过来时，都会执行`dispatch`，而在`dispatch`中判断是否命中某个`router`时，则会用到这个配置项，这样的一个表达式：`router.opts.routerPath || ctx.routerPath || ctx.path`，`router`代表当前`Router`实例，也就是说，如果我们在实例化一个`Router`的时候，如果填写了`routerPath`，这会导致无论任何请求，都会优先使用`routerPath`来作为路由检查：
```javascript
const router = new Router({
  routerPath: '/index'
})

router.all('/index', async (ctx, next) => {
  ctx.body = 'pong!'
})
app.use(router.routes())

app.listen(8888, _ => console.log('server run as http://127.0.0.1:8888'))
```

如果有这样的代码，无论请求什么URL，都会认为是`/index`来进行匹配：
```bash
> curl http://127.0.0.1:8888
pong!
> curl http://127.0.0.1:8888/index
pong!
> curl http://127.0.0.1:8888/whatever/path
pong!
```

#### 巧用routerPath实现转发功能

同样的，这个短路运算符一共有三个表达式，第二个的`ctx`则是当前请求的上下文，也就是说，如果我们有一个早于`routes`执行的中间件，也可以进行赋值来修改路由判断所使用的`URL`：
```javascript
const router = new Router()

router.all('/index', async (ctx, next) => {
  ctx.body = 'pong!'
})

app.use((ctx, next) => {
  ctx.routerPath = '/index' // 手动改变routerPath
  next()
})
app.use(router.routes())

app.listen(8888, _ => console.log('server run as http://127.0.0.1:8888'))
```

这样的代码也能够实现相同的效果。  
实例化中传入的`routerPath`让人捉摸不透，但是在中间件中改变`routerPath`的这个还是可以找到合适的场景，这个可以简单的理解为转发的一种实现，转发的过程是对客户端不可见的，在客户端看来依然访问的是最初的URL，但是在中间件中改变`ctx.routerPath`可以很轻易的使路由匹配到我们想转发的地方去  

```javascript
// 老版本的登录逻辑处理
router.post('/login', ctx => {
  ctx.body = 'old login logic!'
})

// 新版本的登录处理逻辑
router.post('/login-v2', ctx => {
  ctx.body = 'new login logic!'
})

app.use((ctx, next) => {
  if (ctx.path === '/login') { // 匹配到旧版请求，转发到新版
    ctx.routerPath = '/login-v2' // 手动改变routerPath
  }
  next()
})
app.use(router.routes())
```

这样就实现了一个简易的转发：
```bash
> curl -X POST http://127.0.0.1:8888/login
new login logic!
```

### 注册路由的监听

上述全部是关于实例化`Router`时的一些操作，下面就来说一下使用最多的，注册路由相关的操作，最熟悉的必然就是`router.get`，`router.post`这些的操作了。  
但实际上这些也只是一个快捷方式罢了，在内部调用了来自`Router`的`register`方法：  
 
```javascript
Router.prototype.register = function (path, methods, middleware, opts) {
  opts = opts || {}

  let router = this
  let stack = this.stack

  // support array of paths
  if (Array.isArray(path)) {
    path.forEach(function (p) {
      router.register.call(router, p, methods, middleware, opts)
    })

    return this
  }

  // create route
  let route = new Layer(path, methods, middleware, {
    end: opts.end === false ? opts.end : true,
    name: opts.name,
    sensitive: opts.sensitive || this.opts.sensitive || false,
    strict: opts.strict || this.opts.strict || false,
    prefix: opts.prefix || this.opts.prefix || '',
    ignoreCaptures: opts.ignoreCaptures
  })

  if (this.opts.prefix) {
    route.setPrefix(this.opts.prefix)
  }

  // add parameter middleware
  Object.keys(this.params).forEach(function (param) {
    route.param(param, this.params[param])
  }, this)

  stack.push(route)

  return route
}
```

*该方法在注释中标为了 private 但是其中的一些参数在代码中各种地方都没有体现出来，鬼知道为什么会留着那些参数，但既然存在，就需要了解他是干什么的*  
这个是路由监听的基础方法，函数签名大致如下：

Param|Type|Default|Description
:--|:--|:--|:--
`path`|`String`/`Array[String]`|-|一个或者多个的路径
`methods`|`Array[String]`|-|该路由需要监听哪几个`METHOD`
`middleware`|`Function`/`Array[Function]`|-|由函数组成的中间件数组，路由实际调用的回调函数
`opts`|`Object`|`{}`|一些注册路由时的配置参数，上边提到的`strict`、`sensitive`和`prefix`在这里都有体现

可以看到，函数大致就是实现了这样的流程：  
1. 检查`path`是否为数组，如果是，遍历`item`进行调用自身
2. 实例化一个`Layer`对象，设置一些初始化参数
3. 设置针对某些参数的中间件处理（如果有的话）
4. 将实例化后的对象放入`stack`中存储

所以在介绍这几个参数之前，简单的描述一下`Layer`的构造函数是很有必要的：
```javascript
function Layer(path, methods, middleware, opts) {
  this.opts = opts || {}
  this.name = this.opts.name || null
  this.methods = []
  this.paramNames = []
  this.stack = Array.isArray(middleware) ? middleware : [middleware]

  methods.forEach(function(method) {
    var l = this.methods.push(method.toUpperCase());
    if (this.methods[l-1] === 'GET') {
      this.methods.unshift('HEAD')
    }
  }, this)

  // ensure middleware is a function
  this.stack.forEach(function(fn) {
    var type = (typeof fn)
    if (type !== 'function') {
      throw new Error(
        methods.toString() + " `" + (this.opts.name || path) +"`: `middleware` "
        + "must be a function, not `" + type + "`"
      )
    }
  }, this)

  this.path = path
  this.regexp = pathToRegExp(path, this.paramNames, this.opts)
}
```
layer是负责存储路由监听的信息的，每次注册路由时的URL，URL生成的正则表达式，该URL中存在的参数，以及路由对应的中间件。  
统统交由`Layer`来存储，重点需要关注的是实例化过程中的那几个数组参数：  

- methods
- paramNames
- stack

`methods`存储的是该路由监听对应的有效`METHOD`，并会在实例化的过程中针对`METHOD`进行大小写的转换。  
`paramNames`因为用的插件问题，看起来不那么清晰，实际上在`pathToRegExp`内部会对`paramNames`这个数组进行`push`的操作，这么看可能会舒服一些`pathToRegExp(path, &this.paramNames, this.opts)`，在拼接`hash`结构的路径参数时会用到这个数组  
`stack`存储的是该路由监听对应的中间件函数，`router.middleware`部分逻辑会依赖于这个数组

#### path

在函数头部的处理逻辑，主要是为了支持多路径的同时注册，如果发现第一个`path`参数为数组后，则会遍历`path`参数进行调用自身。  
所以针对多个`URL`的相同路由可以这样来处理：
```javascript
router.register(['/', ['/path1', ['/path2', 'path3']]], ['GET'], ctx => {
  ctx.body = 'hi there.'
})
```
这样完全是一个有效的设置：
```bash
> curl http://127.0.0.1:8888/
hi there.
> curl http://127.0.0.1:8888/path1
hi there.
> curl http://127.0.0.1:8888/path3
hi there.
```

#### methods

而关于`methods`参数，则默认认为是一个数组，即使是只监听一个`METHOD`也需要传入一个数组作为参数，如果是空数组的话，即使`URL`匹配，也会直接跳过，执行下一个中间件，这个在后续的`router.routes`中会提到

#### middleware

`middleware`则是一次路由真正执行的事情了，依旧是符合`koa`标准的中间件，可以有多个，按照洋葱模型的方式来执行。  
这也是`koa-router`中最重要的地方，能够让我们的一些中间件只在特定的`URL`时执行。  
这里写入的多个中间件都是针对该`URL`生效的。  

*P.S. 在`koa-router`中，还提供了一个方法，叫做`router.use`，这个会注册一个基于`router`实例的中间件*  

#### opts

`opts`则是用来设置一些路由生成的配置规则的，包括如下几个可选的参数：

Param|Type|Default|Description
:--|:--|:--|:--
`name`|`String`|-|设置该路由所对应的`name`，命名`router`
`prefix`|`String`|-|__非常鸡肋的参数，完全没有卵用__，看似会设置路由的前缀，实际上没有一点儿用
`sensitive`|`Boolean`|`false`|是否严格匹配大小写，覆盖实例化`Router`中的配置
`strict`|`Boolean`|`false`|是否严格匹配大小写，如果设置为`false`则匹配路径后边的`/`是可选的
`end`|`Boolean`|`true`|路径匹配是否为完整URL的结尾
`ignoreCaptures`|`Boolean`|-|是否忽略路由匹配正则结果中的捕获组

##### name

首先是`name`，主要是用于这几个地方：
1. 抛出异常时更方便的定位
2. 可以通过`router.url(<name>)`、`router.route(<name>)`获取到对应的`router`信息
3. 在中间件执行的时候，`name`会被塞到`ctx.routerName`中

```javascript
router.register('/test1', ['GET'], _ => {}, {
  name: 'module'
})

router.register('/test2', ['GET'], _ => {}, {
  name: 'module'
})

console.log(router.url('module') === '/test1') // true

try {
  router.register('/test2', ['GET'], null, {
    name: 'error-module'
  })
} catch (e) {
  console.error(e) // Error: GET `error-module`: `middleware` must be a function, not `object`
}
```

如果多个`router`使用相同的命名，则通过`router.url`调用返回最先注册的那一个：
```javascript
// route用来获取命名路由
Router.prototype.route = function (name) {
  var routes = this.stack

  for (var len = routes.length, i=0; i<len; i++) {
    if (routes[i].name && routes[i].name === name) {
      return routes[i] // 匹配到第一个就直接返回了
    }
  }

  return false
}

// url获取该路由对应的URL，并使用传入的参数来生成真实的URL
Router.prototype.url = function (name, params) {
  var route = this.route(name)

  if (route) {
    var args = Array.prototype.slice.call(arguments, 1)
    return route.url.apply(route, args)
  }

  return new Error('No route found for name: ' + name)
}
```

##### 跑题说下router.url的那些事儿

如果在项目中，想要针对某些`URL`进行跳转，使用`router.url`来生成`path`则是一个不错的选择：
```javascript
router.register(
  '/list/:id', ['GET'], ctx => {
    ctx.body = `Hi ${ctx.params.id}, query: ${ctx.querystring}`
  }, {
    name: 'list'
  }
)

router.register('/', ['GET'], ctx => {
  // /list/1?name=Niko
  ctx.redirect(
    router.url('list', { id: 1 }, { query: { name: 'Niko' } })
  )
})

// curl -L http://127.0.0.1:8888 => Hi 1, query: name=Niko
```

可以看到，`router.url`实际上调用的是`Layer`实例的`url`方法，该方法主要是用来处理生成时传入的一些参数。  
源码地址：[layer.js#L116](https://github.com/alexmingoia/koa-router/blob/master/lib/layer.js#L116)  
函数接收两个参数，`params`和`options`，因为本身`Layer`实例是存储了对应的`path`之类的信息，所以`params`就是存储的在路径中的一些参数的替换，`options`在目前的代码中，仅仅存在一个`query`字段，用来拼接`search`后边的数据：
```javascript
const Layer = require('koa-router/lib/layer')
const layer = new Layer('/list/:id/info/:name', [], [_ => {}])

console.log(layer.url({ id: 123, name: 'Niko' }))
console.log(layer.url([123, 'Niko']))
console.log(layer.url(123, 'Niko'))
console.log(
  layer.url(123, 'Niko', {
    query: {
      arg1: 1,
      arg2: 2
    }
  })
)
```

上述的调用方式都是有效的，在源码中有对应的处理，首先是针对多参数的判断，如果`params`不是一个`object`，则会认为是通过`layer.url(参数, 参数, 参数, opts)`这种方式来调用的。  
将其转换为`layer.url([参数, 参数], opts)`形式的。  
这时候的逻辑仅需要处理三种情况了：
1. 数组形式的参数替换
2. `hash`形式的参数替换
3. 无参数

这个参数替换指的是，一个`URL`会通过一个[第三方的库](https://www.npmjs.com/package/path-to-regexp)用来处理链接中的参数部分，也就是`/:XXX`的这一部分，然后传入一个`hash`实现类似模版替换的操作：  
```javascript
// 可以简单的认为是这样的操作：
let hash = { id: 123, name: 'Niko' }
'/list/:id/:name'.replace(/(?:\/:)(\w+)/g, (_, $1) => `/${hash[$1]}`)
```

然后`layer.url`的处理就是为了将各种参数生成类似`hash`这样的结构，最终替换`hash`获取完整的`URL`。  

##### prefix

上边实例化`Layer`的过程中看似是`opts.prefix`的权重更高，但是紧接着在下边就有了一个判断逻辑进行调用`setPrefix`重新赋值，在翻遍了整个的源码后发现，这样唯一的一个区别就在于，会有一条`debug`应用的是注册`router`时传入的`prefix`，而其他地方都会被实例化`Router`时的`prefix`所覆盖。  

而且如果想要路由正确的应用`prefix`，则需要调用`setPrefix`，因为在`Layer`实例化的过程中关于`path`的存储就是来自远传入的`path`参数。  
而应用`prefix`前缀则需要手动触发`setPrefix`：
```javascript
// Layer实例化的操作
function Layer(path, methods, middleware, opts) {
  // 省略不相干操作
  this.path = path
  this.regexp = pathToRegExp(path, this.paramNames, this.opts)
}

// 只有调用setPrefix才会应用前缀
Layer.prototype.setPrefix = function (prefix) {
  if (this.path) {
    this.path = prefix + this.path
    this.paramNames = []
    this.regexp = pathToRegExp(this.path, this.paramNames, this.opts)
  }

  return this
}
```

这个在暴露给使用者的几个方法中都有体现，类似的`get`、`set`以及`use`。  
当然在文档中也提供了可以直接设置所有`router`前缀的方法，`router.prefix`：
文档中就这样简单的告诉你可以设置前缀，`prefix`在内部会循环调用所有的`layer.setPrefix`：  
```javascript
router.prefix('/things/:thing_id')
```

但是在翻看了`layer.setPrefix`源码后才发现这里其实是含有一个暗坑的。  
因为`setPrefix`的实现是拿到`prefix`参数，拼接到当前`path`的头部。  
这样就会带来一个问题，如果我们多次调用`setPrefix`会导致多次`prefix`叠加，而非替换：
```javascript
router.register('/index', ['GET'], ctx => {
  ctx.body = 'hi there.'
})

router.prefix('/path1')
router.prefix('/path2')

// > curl http://127.0.0.1:8888/path2/path1/index
// hi there.
```

> __prefix方法会叠加前缀，而不是覆盖前缀__

##### sensitive与strict

这俩参数没啥好说的，就是会覆盖实例化`Router`时所传递的那俩参数，效果都一致。

##### end

`end`是一个很有趣的参数，这个在`koa-router`中引用的其他模块中有体现到，[path-to-regexp](https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L337)：
```javascript
if (end) {
  if (!strict) route += '(?:' + delimiter + ')?'

  route += endsWith === '$' ? '$' : '(?=' + endsWith + ')'
} else {
  if (!strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?'
  if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')'
}

return new RegExp('^' + route, flags(options))
```

`endWith`可以简单地理解为是正则中的`$`，也就是匹配的结尾。  
看代码的逻辑，大致就是，如果设置了`end: true`，则无论任何情况都会在最后添加`$`表示匹配的结尾。  
而如果`end: false`，则只有在同时设置了`strict: false`或者`isEndDelimited: false`时才会触发。  
所以我们可以通过这两个参数来实现URL的模糊匹配：
```javascript
router.register(
  '/list', ['GET'], ctx => {
    ctx.body = 'hi there.'
  }, {
    end: false,
    strict: true
  }
)
```

也就是说上述代码最后生成的用于匹配路由的正则表达式大概是这样的：
```javascript
/^\/list(?=\/|$)/i

// 可以通过下述代码获取到正则
require('path-to-regexp').tokensToRegExp('/list/', {end: false, strict: true})
```

结尾的`$`是可选的，这就会导致，我们只要发送任何开头为`/list`的请求都会被这个中间件所获取到。

##### ignoreCaptures

`ignoreCaptures`参数用来设置是否需要返回`URL`中匹配的路径参数给中间件。  
而如果设置了`ignoreCaptures`以后这两个参数就会变为空对象：
```javascript
router.register('/list/:id', ['GET'], ctx => {
  console.log(ctx.captures, ctx.params)
  // ['1'], { id: '1' }
})

// > curl /list/1

router.register('/list/:id', ['GET'], ctx => {
  console.log(ctx.captures, ctx.params)
  // [ ], {  }
}, {
  ignoreCaptures: true
})
// > curl /list/1
```

这个是在中间件执行期间调用了来自`layer`的两个方法获取的。  
首先调用`captures`获取所有的参数，如果设置了`ignoreCaptures`则会导致直接返回空数组。  
然后调用`params`将注册路由时所生成的所有参数以及参数们实际的值传了进去，然后生成一个完整的`hash`注入到`ctx`对象中：  
```javascript
// 中间件的逻辑
ctx.captures = layer.captures(path, ctx.captures)
ctx.params = layer.params(path, ctx.captures, ctx.params)
ctx.routerName = layer.name
return next()
// 中间件的逻辑 end

// layer提供的方法
Layer.prototype.captures = function (path) {
  if (this.opts.ignoreCaptures) return []
  return path.match(this.regexp).slice(1)
}

Layer.prototype.params = function (path, captures, existingParams) {
  var params = existingParams || {}

  for (var len = captures.length, i=0; i<len; i++) {
    if (this.paramNames[i]) {
      var c = captures[i]
      params[this.paramNames[i].name] = c ? safeDecodeURIComponent(c) : c
    }
  }

  return params
}

// 所做的事情大致如下：
// [18, 'Niko'] + ['age', 'name']
// =>
// { age: 18, name: 'Niko' }
```

#### router.param的作用

上述是关于注册路由时的一些参数描述，可以看到在`register`中实例化`Layer`对象后并没有直接将其放入`stack`中，而是执行了这样的一个操作以后才将其推入`stack`：
```javascript
Object.keys(this.params).forEach(function (param) {
  route.param(param, this.params[param])
}, this)

stack.push(route) // 装载
```

这里是用作添加针对某个`URL`参数的中间件处理的，与`router.param`两者关联性很强：
```javascript
Router.prototype.param = function (param, middleware) {
  this.params[param] = middleware
  this.stack.forEach(function (route) {
    route.param(param, middleware)
  })
  return this
}
```

两者操作类似，前者用于对新增的路由监听添加所有的`param`中间件，而后者用于针对现有的所有路由添加`param`中间件。  
因为在`router.param`中有着`this.params[param] = XXX`的赋值操作。  
这样在后续的新增路由监听中，直接循环`this.params`就可以拿到所有的中间件了。  

`router.param`的操作在文档中也有介绍，[文档地址](https://github.com/alexmingoia/koa-router/blob/master/README.md#routerparamparam-middleware--router)  
大致就是可以用来做一些参数校验之类的操作，不过因为在`layer.param`中有了一些[特殊的处理](https://github.com/alexmingoia/koa-router/blob/master/lib/layer.js#L197)，所以我们不必担心`param`的执行顺序，`layer`会保证`param`一定是早于依赖这个参数的中间件执行的：
```javascript
router.register('/list/:id', ['GET'], (ctx, next) => {
  ctx.body = `hello: ${ctx.name}`
})

router.param('id', (param, ctx, next) => {
  console.log(`got id: ${param}`)
  ctx.name = 'Niko'
  next()
})

router.param('id', (param, ctx, next) => {
  console.log('param2')
  next()
})


// > curl /list/1
// got id: 1
// param2
// hello: Niko
```

#### 最常用的get/post之类的快捷方式

以及说完了上边的基础方法`register`，我们可以来看下暴露给开发者的几个`router.verb`方法：  

```javascript
// get|put|post|patch|delete|del
// 循环注册多个METHOD的快捷方式
methods.forEach(function (method) {
  Router.prototype[method] = function (name, path, middleware) {
    let middleware

    if (typeof path === 'string' || path instanceof RegExp) {
      middleware = Array.prototype.slice.call(arguments, 2)
    } else {
      middleware = Array.prototype.slice.call(arguments, 1)
      path = name
      name = null
    }

    this.register(path, [method], middleware, {
      name: name
    })

    return this
  }
})

Router.prototype.del = Router.prototype['delete'] // 以及最后的一个别名处理，因为del并不是有效的METHOD
```

令人失望的是，`verb`方法将大量的`opts`参数都砍掉了，默认只留下了一个`name`字段。  
只是很简单的处理了一下命名`name`路由相关的逻辑，然后进行调用`register`完成操作。

#### router.use-Router内部的中间件

以及上文中也提到的`router.use`，可以用来注册一个中间件，使用`use`注册中间件分为两种情况：
1. 普通的中间件函数
2. 将现有的`router`实例作为中间件传入

##### 普通的use

这里是`use`方法的关键代码：
```javascript
Router.prototype.use = function () {
  var router = this
  middleware.forEach(function (m) {
    if (m.router) { // 这里是通过`router.routes()`传递进来的
      m.router.stack.forEach(function (nestedLayer) {
        if (path) nestedLayer.setPrefix(path)
        if (router.opts.prefix) nestedLayer.setPrefix(router.opts.prefix) // 调用`use`的Router实例的`prefix`
        router.stack.push(nestedLayer)
      })

      if (router.params) {
        Object.keys(router.params).forEach(function (key) {
          m.router.param(key, router.params[key])
        })
      }
    } else { // 普通的中间件注册
      router.register(path || '(.*)', [], m, { end: false, ignoreCaptures: !hasPath })
    }
  })
}

// 在routes方法有这样的一步操作
Router.prototype.routes = Router.prototype.middleware = function () {
  function dispatch() {
    // ...
  }

  dispatch.router = this // 将router实例赋值给了返回的函数

  return dispatch
}
```

第一种是比较常规的方式，传入一个函数，一个可选的`path`，来进行注册中间件。  
不过有一点要注意的是，`.use('path')`这样的用法，中间件不能独立存在，必须要有一个可以与之路径相匹配的路由监听存在：
```javascript
router.use('/list', ctx => {
  // 如果只有这么一个中间件，无论如何也不会执行的
})

// 必须要存在相同路径的`register`回调
router.get('/list', ctx => { })

app.use(router.routes())
```

原因是这样的：
1. `.use`和`.get`都是基于`.register`来实现的，但是`.use`在`methods`参数中传递的是一个空数组
2. 在一个路径被匹配到时，会将所有匹配到的中间件取出来，然后检查对应的`methods`，如果`length !== 0`则会对当前匹配组标记一个`flag`
3. 在执行中间件之前会先判断有没有这个`flag`，如果没有则说明该路径所有的中间件都没有设置`METHOD`，则会直接跳过进入其他流程（*比如allowedMethod*）

```javascript
Router.prototype.match = function (path, method) {
  var layers = this.stack
  var layer
  var matched = {
    path: [],
    pathAndMethod: [],
    route: false
  }

  for (var len = layers.length, i = 0; i < len; i++) {
    layer = layers[i]

    if (layer.match(path)) {
      matched.path.push(layer)

      if (layer.methods.length === 0 || ~layer.methods.indexOf(method)) {
        matched.pathAndMethod.push(layer)

        // 只有在发现不为空的`methods`以后才会设置`flag`
        if (layer.methods.length) matched.route = true
      }
    }
  }

  return matched
}

// 以及在`routes`中有这样的操作
Router.prototype.routes = Router.prototype.middleware = function () {
  function dispatch(ctx, next) {

    // 如果没有`flag`，直接跳过
    if (!matched.route) return next()
  }

  return dispatch
}
```

##### 将其他router实例传递进来

可以看到，如果选择了`router.routes()`来方式来复用中间件，会遍历该实例的所有路由，然后设置`prefix`。  
并将修改完的`layer`推出到当前的`router`中。  
那么现在就要注意了，在上边其实已经提到了，`Layer`的`setPrefix`是拼接的，而不是覆盖的。  
而`use`是会操作`layer`对象的，所以这样的用法会导致之前的中间件路径也被修改。  
而且如果传入`use`的中间件已经注册在了`koa`中就会导致相同的中间件会执行两次(*如果有调用`next`的话*)：

```javascript
const middlewareRouter = new Router()
const routerPage1 = new Router({
  prefix: '/page1'
})

const routerPage2 = new Router({
  prefix: '/page2'
})

middlewareRouter.get('/list/:id', async (ctx, next) => {
  console.log('trigger middleware')
  ctx.body = `hi there.`
  await next()
})

routerPage1.use(middlewareRouter.routes())
routerPage2.use(middlewareRouter.routes())

app.use(middlewareRouter.routes())
app.use(routerPage1.routes())
app.use(routerPage2.routes())
```

就像上述代码，实际上会有两个问题：
1. 最终有效的访问路径为`/page2/page1/list/1`，因为`prefix`会拼接而非覆盖
2. 当我们在中间件中调用`next`以后，`console.log`会连续输出三次，因为所有的`routes`都是动态的，实际上`prefix`都被修改为了`/page2/page1`

__一定要小心使用，不要认为这样的方式可以用来实现路由的复用__

### 请求的处理

以及，终于来到了最后一步，当一个请求来了以后，`Router`是怎样处理的。  
一个`Router`实例可以抛出两个中间件注册到`koa`上：
```javascript
app.use(router.routes())
app.use(router.allowedMethods())
```

`routes`负责主要的逻辑。  
`allowedMethods`负责提供一个后置的`METHOD`检查中间件。  


`allowedMethods`没什么好说的，就是根据当前请求的`method`进行的一些校验，并返回一些错误信息。  
而上边介绍的很多方法其实都是为了最终的`routes`服务：
```javascript
Router.prototype.routes = Router.prototype.middleware = function () {
  var router = this

  var dispatch = function dispatch(ctx, next) {
    var path = router.opts.routerPath || ctx.routerPath || ctx.path
    var matched = router.match(path, ctx.method)
    var layerChain, layer, i

    if (ctx.matched) {
      ctx.matched.push.apply(ctx.matched, matched.path)
    } else {
      ctx.matched = matched.path
    }

    ctx.router = router

    if (!matched.route) return next()

    var matchedLayers = matched.pathAndMethod
    var mostSpecificLayer = matchedLayers[matchedLayers.length - 1]
    ctx._matchedRoute = mostSpecificLayer.path
    if (mostSpecificLayer.name) {
      ctx._matchedRouteName = mostSpecificLayer.name
    }

    layerChain = matchedLayers.reduce(function(memo, layer) {
      memo.push(function(ctx, next) {
        ctx.captures = layer.captures(path, ctx.captures)
        ctx.params = layer.params(path, ctx.captures, ctx.params)
        ctx.routerName = layer.name
        return next()
      })
      return memo.concat(layer.stack)
    }, [])

    return compose(layerChain)(ctx, next)
  };

  dispatch.router = this

  return dispatch
}
```

首先可以看到，`koa-router`同时还提供了一个别名`middleware`来实现相同的功能。  
以及函数的调用最终会返回一个中间件函数，这个函数才是真正被挂在到`koa`上的。  
`koa`的中间件是纯粹的中间件，不管什么请求都会执行所包含的中间件。  
__所以不建议为了使用`prefix`而创建多个`Router`实例，这会导致在`koa`上挂载多个`dispatch`用来检查URL是否符合规则__  

进入中间件以后会进行URL的判断，就是我们上边提到的可以用来做`foraward`实现的地方。  
匹配调用的是`router.match`方法，虽说看似赋值是`matched.path`，而实际上在`match`方法的实现中，里边全部是匹配到的`Layer`实例：
```javascript
Router.prototype.match = function (path, method) {
  var layers = this.stack // 这个就是获取的Router实例中所有的中间件对应的layer对象
  var layer
  var matched = {
    path: [],
    pathAndMethod: [],
    route: false
  }

  for (var len = layers.length, i = 0; i < len; i++) {
    layer = layers[i]

    if (layer.match(path)) { // 这里就是一个简单的正则匹配
      matched.path.push(layer)

      if (layer.methods.length === 0 || ~layer.methods.indexOf(method)) {
        // 将有效的中间件推入
        matched.pathAndMethod.push(layer)

        // 判断是否存在METHOD
        if (layer.methods.length) matched.route = true
      }
    }
  }

  return matched
}

// 一个简单的正则匹配
Layer.prototype.match = function (path) {
  return this.regexp.test(path)
}
```

而之所以会存在说判断是否有`ctx.matched`来进行处理，而不是直接对这个属性进行赋值。  
这是因为上边也提到过的，一个`koa`实例可能会注册多个`koa-router`实例。  
这就导致一个`router`实例的中间件执行完毕后，后续可能还会有其他的`router`实例也命中了某个`URL`，但是这样会保证`matched`始终是在累加的，而非每次都会覆盖。 
> __`path`与`pathAndMethod`都是`match`返回的两个数组，两者的区别在于`path`返回的是匹配URL成功的数据，而`pathAndMethod`则是匹配URL且匹配到METHOD的数据__   

```javascript
const router1 = new Router()
const router2 = new Router()

router1.post('/', _ => {})

router1.get('/', async (ctx, next) => {
  ctx.redirectBody = 'hi'
  console.log(`trigger router1, matched length: ${ctx.matched.length}`)
  await next()
})

router2.get('/', async (ctx, next) => {
  ctx.redirectBody = 'hi'
  console.log(`trigger router2, matched length: ${ctx.matched.length}`)
  await next()
})

app.use(router1.routes())
app.use(router2.routes())

// >  curl http://127.0.0.1:8888/
// => trigger router1, matched length: 2
// => trigger router2, matched length: 3
```

关于中间件的执行，在`koa-router`中也使用了`koa-compose`来合并洋葱：  

```javascript
var matchedLayers = matched.pathAndMethod

layerChain = matchedLayers.reduce(function(memo, layer) {
  memo.push(function(ctx, next) {
    ctx.captures = layer.captures(path, ctx.captures)
    ctx.params = layer.params(path, ctx.captures, ctx.params)
    ctx.routerName = layer.name
    return next()
  })
  return memo.concat(layer.stack)
}, [])

return compose(layerChain)(ctx, next)
```

这坨代码会在所有匹配到的中间件之前添加一个`ctx`属性赋值的中间件操作，也就是说`reduce`的执行会让洋葱模型对应的中间件函数数量至少`X2`。  
__layer中可能包含多个中间件，不要忘了`middleware`，这就是为什么会在`reduce`中使用`concat`而非`push`__  
因为要在每一个中间件执行之前，修改`ctx`为本次中间件触发时的一些信息。  
包括匹配到的URL参数，以及当前中间件的`name`之类的信息。  

```javascript
[
  layer1[0], // 第一个register中对应的中间件1
  layer1[1], // 第一个register中对应的中间件2
  layer2[0]  // 第二个register中对应的中间件1
]

// =>

[
  (ctx, next) => {
    ctx.params = layer1.params // 第一个register对应信息的赋值  
    return next()
  },
  layer1[0], // 第一个register中对应的中间件1
  layer1[1], // 第一个register中对应的中间件2
  (ctx, next) => {
    ctx.params = layer2.params // 第二个register对应信息的赋值  
    return next()
  },
  layer2[0]  // 第二个register中对应的中间件1
]
```

在`routes`最后，会调用`koa-compose`来合并`reduce`所生成的中间件数组，以及用到了之前在`koa-compose`中提到了的第二个可选的参数，用来做洋葱执行完成后最终的回调处理。  

----

## 小记

至此，`koa-router`的使命就已经完成了，实现了路由的注册，以及路由的监听处理。  
在阅读`koa-router`的源码过程中感到很迷惑：  
- 明明代码中已经实现的功能，为什么在文档中就没有体现出来呢。  
- 如果文档中不写明可以这样来用，为什么还要在代码中有对应的实现呢？  

两个最简单的举证：
1. 可以通过修改`ctx.routerPath`来实现`forward`功能，但是在文档中不会告诉你
2. 可以通过`router.register(path, ['GET', 'POST'])`来快速的监听多个`METHOD`，但是`register`被标记为了`@private`

参考资料：
- [koa-router | docs](https://github.com/alexmingoia/koa-router/blob/master/README.md)
- [path-to-regexp | docs](https://github.com/pillarjs/path-to-regexp/blob/master/Readme.md)

示例代码在仓库中的位置：[learning-koa-router](https://github.com/jiasm/notebook/blob/master/labs/demo/node/learning-koa-router)  