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
Koa-compose则是作为整合中间件最为关键的一个工具、洋葱模型的具体实现，所以要将两者放在一起来看。

<!-- more -->

## koa基本结构

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

*而在代码结构上，只有`application`对外的Koa是采用的`Class`的方式，其他三个文件均是抛出一个普通的`Object`。*  

## 拿一个完整的流程来解释

### 创建服务

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

### 使用koa-compose合并中间件

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
        resolve()
      })
    })
  },
  function (ctx, next) {
    return new Promise(resolve => {
      next().then(() => {
        ctx.body = ctx.body.toUpperCase()
        resolve()
      })
    })
  },
  function (ctx, next) {
    return new Promise(resolve => {
      ctx.body = 'Hello World'
      resolve()
    })
  },
  function (ctx, next) {
    return new Promise(resolve => {
      console.log('never output')
      resolve()
    })
  }
]
```

就像在第四个函数中输出表示的那样，第四个中间件不会被执行，因为第三个中间件并没有调用`next`，所以实现类似这样的一个洋葱模型是很有意思的一件事情。  
首先抛开不变的`ctx`不谈，洋葱模型的实现核心在于`next`的处理。  
因为`next`是你进入下一层中间件的钥匙，只有手动触发以后才会进入下一层中间件。  
然后我们还需要保证`next`要在中间件执行完毕后进行`resolve`，返回到上一层中间件：  
```javascript
return function (context, next) {
  // last called middleware #
  let index = -1
  return dispatch(0)
  function dispatch (i) {
    if (i <= index) return Promise.reject(new Error('next() called multiple times'))
    index = i
    let fn = middleware[i]
    if (i === middleware.length) fn = next
    if (!fn) return Promise.resolve()
    try {
      return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}
```

所以明确了这两点以后，上边的代码就会变得很清晰：
1. next用来进入下一个中间件
2. next在当前中间件执行完成后会触发回调通知上一个中间件

可以看到在调用`koa-compose`以后实际上会返回一个自执行函数。  
在执行函数的开头部分，用于防止在一个中间件中多次调用`next`。  
因为如果多次调用`next`，就会导致下一个中间件的多次执行，这样就破坏了洋葱模型。  

其次就是`compose`实际上提供了一个在洋葱模型全部执行完毕后的回调，一个可选的参数，实际上作用与调用`compose`后边的`then`处理没有太大区别。  

以及上边提到的，`next`是进入下一个中间件的钥匙，可以在这一个柯里化函数的应用上看出来：  
```javascript
Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
```

将自身绑定了`index`参数后传入本次中间件，作为调用函数的第二个参数，也就是`next`，效果就像调用了`dispatch(1)`，这样就是一个洋葱模型的实现。  

P.S. 一个从`Koa1.x`切换到`Koa2.x`的暗坑，`co`会对数组进行特殊处理，使用`Promise.all`进行包装，但是`koa2.x`没有这样的操作。  
所以如果在中间件中要针对一个数组进行异步操作，一定要手动添加`Promise.all`，或者说等草案中的`await*`。  

```javascript
// koa1.x
yield [Promise.resolve(1), Promise.resolve(2)]              // [1, 2]

// koa2.x
await [Promise.resolve(1), Promise.resolve(2)]              // [<Promise>, <Promise>]

// ==>
await Promise.all([Promise.resolve(1), Promise.resolve(2)]) // [1, 2]
await* [Promise.resolve(1), Promise.resolve(2)]             // [1, 2]
```

### 接收请求，处理返回值

经过上边的代码，一个Koa服务已经算是运行起来了，接下来就是访问看效果了。  
在接收到一个请求后，Koa会拿之前提到的`context`与`request`、`response`来创建本次请求所使用的上下文。  
在`Koa1.x`中，上下文是绑定在`this`上的，而在`Koa2.x`是作为第一个参数传入进来的。  
个人猜测可能是因为`Generator`不能使用箭头函数，而`async`函数可以使用箭头函数导致的吧:) *纯属个人YY*  

总之，我们通过上边提到的三个模块创建了一个请求所需的上下文，基本上是一通儿赋值，代码就不贴了，没有太多逻辑，就是有一个小细节比较有意思：
```javascript
request.response = response
response.request = request
```

让两者之间产生了一个引用关系，既可以通过`request`获取到`response`，也可以通过`response`获取到`request`。  
而且这是一个递归的引用，类似这样的操作：
```javascript
let obj = {}

obj.obj = obj

obj.obj.obj.obj === obj // true
```

同时如上文提到的，在`context`创建的过程中，将一大批的`request`和`response`的属性、方法代理到了自身，有兴趣的可以自己翻看源码（看着有点晕）：[koa.js | context.js](https://github.com/koajs/koa/blob/master/lib/context.js#L190)  
这个[delegate](https://github.com/tj/node-delegates/blob/master/index.js)的实现也算是比较简单，通过取出原始的属性，然后存一个引用，在自身的属性被触发时调用对应的引用，类似一个民间版的`Proxy`吧，期待后续能够使用Proxy代替它。  

然后我们会将生成好的`context`作为参数传入`koa-compose`生成的洋葱中去。  
因为无论何种情况，洋葱肯定会返回结果的（出错与否），所以我们还需要在最后有一个`finished`的处理，做一些类似将`ctx.body`转换为数据进行输出之类的操作。  

Koa使用了大量的`get`、`set`访问器来实现功能，例如最常用的`ctx.body = 'XXX'`，它是来自`response`的`set body`。  
这应该是`request`、`response`中逻辑最复杂的一个方法了。  
里边要处理很多东西，例如在`body`内容为空时帮助你修改请求的`status code`为204，并移除无用的`headers`。  
以及如果没有手动指定`status code`，会默认指定为`200`。  
甚至还会根据当前传入的参数来判断`content-type`应该是`html`还是普通的`text`：
```javascript
// string
if ('string' == typeof val) {
  if (setType) this.type = /^\s*</.test(val) ? 'html' : 'text'
  this.length = Buffer.byteLength(val)
  return
}
```

以及还包含针对流(Stream)的特殊处理，例如如果要用Koa实现静态资源下载的功能，也是可以直接调用`ctx.body`进行赋值的，所有的东西都已经在`response.js`中帮你处理好了：
```javascript
// stream
if ('function' == typeof val.pipe) {
  onFinish(this.res, destroy.bind(null, val))
  ensureErrorHandler(val, err => this.ctx.onerror(err))

  // overwriting
  if (null != original && original != val) this.remove('Content-Length')

  if (setType) this.type = 'bin'
  return
}

// 可以理解为是这样的代码
let stream = fs.createReadStream('package.json')
ctx.body = stream

// set body中的处理
onFinish(res, () => {
  destory(stream)
})

stream.pipe(res) // 使response接收流是在洋葱模型完全执行完以后再进行的
```

*onFinish用来监听流是否结束、destory用来关闭流*  

其余的访问器基本上就是一些常见操作的封装，例如针对`querystring`的封装。  
在使用原生`http`模块的情况下，处理URL中的参数，是需要自己引入额外的包进行处理的，最常见的是`querystring`。  
Koa也是在内部引入的该模块。  
所以对外抛出的`query`大致是这个样子的：
```javascript
get query() {
  let query = parse(this.req).query
  return qs.parse(query)
}

// use
let { id, name } = ctx.query // 因为 get query也被代理到了context上，所以可以直接引用
```

*parse为parseurl库，用来从request中提出query参数*

亦或者针对`cookies`的封装，也是内置了最流行的`cookies`。  
在第一次触发`get cookies`时才去实例化`Cookie`对象，将这些繁琐的操作挡在用户看不到的地方，在Koa中使用Cookie就像这样就可以了：  
```javascript
this.cookies.get('uid')

this.cookies.set('name', 'Niko')

// 如果不想用cookies模块，完全可以自己赋值为自己想用的cookie
this.cookies = CustomeCookie

this.cookies.mget(['uid', 'name'])
```

这是因为在`get cookies`里边有判断，如果没有一个可用的Cookie实例，才会默认去实例化。

#### 洋葱模型执行完成后的一些操作

Koa的一个请求流程是这样的，先执行洋葱里边的所有中间件，在执行完成以后，还会有一个回调函数。  
该回调用来根据中间件执行过程中所做的事情来决定返回给客户端什么数据。  
拿到`ctx.body`、`ctx.status`这些参数进行处理。  
包括前边提到的流(`Stream`)的处理都在这里：
```javascript
if (body instanceof Stream) return body.pipe(res) // 等到这里结束后才会调用我们上边`set body`中对应的`onfinished`的处理
```

同时上边还有一个特殊的处理，如果为false则不做任何处理，直接返回：
```javascript
if (!ctx.writable) return
```
其实这个也是`response`提供的一个访问器，这里边用来判断当前请求是否已经调用过`end`给客户端返回了数据，如果已经触发了`response.end()`以后，则`response.finished`会被置为`true`，也就是说，本次请求已经结束了，同时访问器中还处理了一个`bug`，请求已经返回结果了，但是依然没有关闭套接字：
```javascript
get writable() {
  // can't write any more after response finished
  if (this.res.finished) return false

  const socket = this.res.socket
  // There are already pending outgoing res, but still writable
  // https://github.com/nodejs/node/blob/v4.4.7/lib/_http_server.js#L486
  if (!socket) return true
  return socket.writable
}
```

这里就有一个Koa与Express对比的劣势了，因为Koa采用的是一个洋葱模型，对于返回值，如果是使用`ctx.body = 'XXX'`来进行赋值，这会导致最终调用`response.end`时在洋葱全部执行完成后再进行的，也就是上边所描述的回调中，而Express就是在中间件中就可以自由控制何时返回数据：  
```javascript
// express.js
router.get('/', function (req, res) {
  res.send('hello world')

  // 在发送数据后做一些其他处理
  appendLog()
})

// koa.js
app.use(ctx => {
  ctx.body = 'hello world'

  // 然而依然发生在发送数据之前
  appendLog()
})
```

不过好在还是可以通过直接调用原生的`response`对象来进行发送数据的，当我们手动调用了`response.end`以后，就意味着最终的回调会直接跳过，不做任何处理。  
```javascript
app.use(ctx => {
  ctx.res.end('hello world')

  // 在发送数据后做一些其他处理
  appendLog()
})
```

#### 异常处理

koa的整个请求，实际上还是一个`Promise`，所以在洋葱模型后边的监听不仅仅有`resolve`，对`reject`也同样是有处理的。  
期间任何一环出bug都会导致后续的中间件以及前边等待回调的中间件终止，直接跳转到最近的一个异常处理模块。  
所以，如果有类似接口耗时统计的中间件，一定要记得在`try-catch`中执行`next`的操作：
```javascript
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (e) {
    console.error(e)
    ctx.body = 'error' // 因为内部的中间件并没有catch 捕获异常，所以抛出到了这里
  }
})

app.use(async (ctx, next) => {
  let startTime = new Date()
  try {
    await next()
  } finally {
    let endTime = new Date() // 抛出异常，但是不影响这里的正常输出
  }
})

app.use(ctx => Promise.reject(new Error('test')))
```

P.S. 如果异常被捕获，则会继续执行后续的`response`：
```javascript
app.use(async (ctx, next) => {
  try {
    throw new Error('test')
  } catch (e) {
    await next()
  }
})

app.use(ctx => {
  ctx.body = 'hello'
})

// curl 127.0.0.1 
// > hello
```

如果自己的中间件没有捕获异常，就会走到默认的异常处理模块中。  
在默认的异常模块中，基本上是针对statusCode的一些处理，以及一些默认的错误显示：
```javascript
const code = statuses[err.status]
const msg = err.expose ? err.message : code
this.status = err.status
this.length = Buffer.byteLength(msg)
this.res.end(msg)
```

*statuses是一个第三方模块，包括各种http code的信息： [statuses](https://github.com/jshttp/statuses)*  
建议在最外层的中间件都自己做异常处理，因为默认的错误提示有点儿太难看了（纯文本），自己处理跳转到异常处理页面会好一些，以及避免一些接口因为默认的异常信息导致解析失败。

#### redirect的注意事项

在原生`http`模块中进行`302`的操作（俗称重定向），需要这么做：
```javascript
response.writeHead(302, {
  'Location': 'redirect.html'
})
response.end()
// or
response.statusCode = 302
response.setHeader('Location', 'redirect.html')
response.end()
```

而在`Koa`中也有`redirect`的封装，可以通过直接调用`redirect`函数来完成重定向，但是需要注意的是，调用完`redirect`之后并没有直接触发`response.end()`，它仅仅是添加了一个`statusCode`及`Location`而已，后续的代码还会继续执行，所以建议在`redirect`之后手动结束当前的请求，也就是直接`return`，不然很有可能后续的`status`、`body`赋值很可能会导致一些诡异的问题。
```javascript
app.use(ctx => {
  ctx.redirect('https://baidu.com')

  // 建议直接return

  // 后续的代码还在执行
  ctx.body = 'hello world'
  ctx.status = 200 // statusCode的改变导致redirect失效 
})
```

*所以建议在redirect之后进行return的操作，终止后续代码的执行。*

## 小记

Koa是一个很好玩的框架，在阅读源码的过程中，其实也发现了一些小问题：
1. 多人合作维护一份代码，确实能够看出各人都有不同的编码风格，例如`typeof val !== 'string'`和`'number' == typeof code`，很显然的两种风格。2333
2. delegate的调用方式在属性特别多的时候并不是很好看，一大长串的链式调用，如果换成循环会更好看一下

不过，Koa依然是一个很棒的框架，很适合阅读源码来进行学习，这些都是一些小细节的问题，无伤大雅。  

总结一下Koa与koa-compose的作用：
- Koa 注册中间件、注册Http服务、生成请求上下文调用中间件、处理中间件对上下文对象的操作、返回数据结束请求
- Koa-compose 将数组中的中间件集合转换为串行调用，并提供钥匙(next)用来跳转下一个中间件，以及监听`next`获取内部中间件执行结束的通知