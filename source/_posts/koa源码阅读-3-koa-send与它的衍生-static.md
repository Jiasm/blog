---
uuid: a7cf6480-9f10-11e8-a6a9-87cc56477fb6
title: 'koa源码阅读[3]-koa-send与它的衍生(static)'
date: 2018-08-24 00:50:51
tags:
---

`koa`源码阅读的第四篇，涉及到向接口请求方提供文件数据。  

> 第一篇：[koa源码阅读-0](/2018/07/22/koa源码阅读-0)  
> 第二篇：[koa源码阅读-1-koa与koa-compose](/2018/07/29/koa源码阅读-1-koa与koa-compose)  
> 第三篇：[koa源码阅读-2-koa-router](/2018/08/03/koa源码阅读-2-koa-router)  

处理静态文件是一个繁琐的事情，因为静态文件都是来自于服务器上，肯定不能放开所有权限让接口来读取。  
各种路径的校验，权限的匹配，都是需要考虑到的地方。  
而`koa-send`和`koa-static`就是帮助我们处理这些繁琐事情的中间件。  
`koa-send`是`koa-static`的基础，可以在`NPM`的界面上看到，`static`的`dependencies`中包含了`koa-send`。  

![](/images/koajs-code-review/koa-static-dependencies.png)  

<!-- more -->

`koa-send`主要是用于更方便的处理静态文件，与`koa-router`之类的中间件不同的是，它并不是直接作为一个函数注入到`app.use`中的。  
而是在某些中间件中进行调用，传入当前请求的`Context`及文件对应的位置，然后实现功能。  

_[koa-send的GitHub地址](https://github.com/koajs/send)_  

## 原生的文件读取、传输方式

在`Node`中，如果使用原生的`fs`模块进行文件数据传输，大致是这样的操作：
```javascript
const fs      = require('fs')
const Koa     = require('koa')
const Router  = require('koa-router')

const app     = new Koa()
const router  = new Router()
const file    = './test.log'
const port    = 12306

router.get('/log', ctx => {
  const data = fs.readFileSync(file).toString()
  ctx.body = data
})

app.use(router.routes())
app.listen(port, () => console.log(`Server run as http://127.0.0.1:${port}`))
```

_或者用`createReadStream`代替`readFileSync`也是可行的，区别会在下边提到_  

这个简单的示例仅针对一个文件进行操作，而如果我们要读取的文件是有很多个，甚至于可能是通过接口参数传递过来的。  
所以很难保证这个文件一定是真实存在的，而且我们可能还需要添加一些权限设置，防止一些敏感文件被接口返回。  

```javascript
router.get('/file', ctx => {
  const { fileName } = ctx.query
  const path = path.resolve('./XXX', fileName)
  // 过滤隐藏文件
  if (path.startsWith('.')) {
    ctx.status = 404
    return
  }

  // 判断文件是否存在
  if (!fs.existsSync(path)) {
    ctx.status = 404
    return
  }

  // balabala

  const rs = fs.createReadStream(path)
  ctx.body = rs // koa做了针对stream类型的处理，详情可以看之前的koa篇
})
```

添加了各种逻辑判断以后，读取静态文件就变得安全不少，可是这也只是在一个`router`中做的处理。  
如果有多个接口都会进行静态文件的读取，势必会存在大量的重复逻辑，所以将其提炼为一个公共函数将是一个很好的选择。

## koa-send的方式

这就是`koa-send`做的事情了，提供了一个封装非常完善的处理静态文件的中间件。  
这里是两个最基础的使用例子：
```javascript
const path = require('path')
const send = require('koa-send')

// 针对某个路径下的文件获取
router.get('/file', async ctx => {
  await send(ctx, ctx.query.path, {
    root: path.resolve(__dirname, './public')
  })
})

// 针对某个文件的获取
router.get('/index', async ctx => {
  await send(ctx, './public/index.log')
})
```

假设我们的目录结构是这样的，`simple-send.js`为执行文件：
```bash
.
├── public
│   ├── a.log
│   ├── b.log
│   └── index.log
└── simple-send.js
```

使用`/file?path=XXX`就可以很轻易的访问到`public`下的文件。  
以及访问`/index`就可以拿到`/public/index.log`文件的内容。  

## koa-send提供的功能

`koa-send`提供了很多便民的选项，除去常用的`root`以外，还有大概小十个的选项可供使用：

options|type|default|desc
:-:|:-:|:-:|:--
`maxage`|`Number`|`0`|设置浏览器可以缓存的毫秒数<br/>对应的`Header`: `Cache-Control: max-age=XXX`
`immutable`|`Boolean`|`false`|通知浏览器该URL对应的资源不可变，可以无限期的缓存<br/>对应的`Header`: `Cache-Control: max-age=XXX, immutable`
`hidden`|`Boolean`|`false`|是否支持隐藏文件的读取<br/>`.`开头的文件被称为隐藏文件
`root`|`String`|-|设置静态文件路径的根目录，任何该目录之外的文件都是禁止访问的。
`index`|`String`|-|设置一个默认的文件名，在访问目录的时候生效，会自动拼接到路径后边 __(此处有一个小彩蛋)__
`gzip`|`Boolean`|`true`|如果访问接口的客户端支持`gzip`，并且存在`.gz`后缀的同名文件的情况下会传递`.gz`文件
`brotli`|`Boolean`|`true`|逻辑同上，如果支持`brotli`且存在`.br`后缀的同名文件
`format`|`Boolean`|`true`|开启以后不会强要求路径结尾的`/`，`/path`和`/path/`表示的是一个路径 __(仅在`path`是一个目录的情况下生效)__
`extensions`|`Array`|`false`|如果传递了一个数组，会尝试将数组中的所有`item`作为文件的后缀进行匹配，匹配到哪个就读取哪个文件
`setHeaders`|`Function`|-|用来手动指定一些`Headers`，意义不大

### 参数们的具体表现

有些参数的搭配可以实现一些神奇的效果，有一些参数会影响到`Header`，也有一些参数是用来优化性能的，类似`gzip`和`brotli`的选项。  

`koa-send`的主要逻辑可以分为这几块：
1. `path`路径有效性的检查
2. `gzip`等压缩逻辑的应用
3. 文件后缀、默认入口文件的匹配
4. 读取文件数据

在函数的开头部分有这样的逻辑：
```javascript
const resolvePath = require('resolve-path')
const {
  parse
} = require('path')

async function send (ctx, path. opts = {}) {
  const trailingSlash = path[path.length - 1] === '/'
  const index = opts.index

  // 此处省略各种参数的初始值设置

  path = path.substr(parse(path).root.length)

  // ...

  // normalize path
  path = decode(path) // 内部调用的是`decodeURIComponent`
  // 也就是说传入一个转义的路径也是可以正常使用的

  if (index && trailingSlash) path += index

  path = resolvePath(root, path)

  // hidden file support, ignore
  if (!hidden && isHidden(root, path)) return
}

function isHidden (root, path) {
  path = path.substr(root.length).split(sep)
  for (let i = 0; i < path.length; i++) {
    if (path[i][0] === '.') return true
  }
  return false
}
```

### 路径检查

首先是判断传入的`path`是否为一个目录，_(结尾为`/`会被认为是一个目录)_。  
如果是目录，并且存在一个有效的`index`参数，则会将`index`拼接到`path`后边。  
也就是大概这样的操作：
```javascript
send(ctx, './public/', {
  index: 'index.js'
})

// ./public/index.js
```

[resolve-path](https://www.npmjs.com/package/resolve-path) 是一个用来处理路径的包，用来帮助过滤一些异常的路径，类似`path//file`、`/etc/XXX` 这样的恶意路径，并且会返回处理后绝对路径。  

`isHidden`用来判断是否需要过滤隐藏文件。  
因为但凡是`.`开头的文件都会被认为隐藏文件，同理目录使用`.`开头也会被认为是隐藏的，所以就有了`isHidden`函数的实现。  

_其实我个人觉得这个使用一个正则就可以解决的问题。。为什么还要分割为数组呢？_  
```javascript
function isHidden (root, path) {
  path = path.substr(root.length)

  return new RegExp(`${sep}\\.`).test(path)
}
```
_已经给社区提交了`PR`。_

### 压缩的开启与文件夹的处理

在上边的这一坨代码执行完以后，我们就得到了一个有效的路径，_(如果是无效路径，`resolvePath`会直接抛出异常)_  
接下来做的事情就是检查是否有可用的压缩文件使用，此处没有什么逻辑，就是简单的`exists`操作，以及`Content-Encoding`的修改 _(用于开启压缩)_。  

**后缀的匹配：**
```javascript
if (extensions && !/\.[^/]*$/.exec(path)) {
  const list = [].concat(extensions)
  for (let i = 0; i < list.length; i++) {
    let ext = list[i]
    if (typeof ext !== 'string') {
      throw new TypeError('option extensions must be array of strings or false')
    }
    if (!/^\./.exec(ext)) ext = '.' + ext
    if (await fs.exists(path + ext)) {
      path = path + ext
      break
    }
  }
}
```

可以看到这里的遍历是完全按照我们调用`send`是传入的顺序来走的，并且还做了`.`符号的兼容。  
也就是说这样的调用都是有效的：
```javascript
await send(ctx, 'path', {
  extensions: ['.js', 'ts', '.tsx']
})
```

如果在添加了后缀以后能够匹配到真实的文件，那么就认为这是一个有效的路径，然后进行了`break`的操作，也就是文档中所说的：`First found is served.`。

在结束这部分操作以后会进行目录的检测，判断当前路径是否为一个目录：
```javascript
let stats
try {
  stats = await fs.stat(path)

  if (stats.isDirectory()) {
    if (format && index) {
      path += '/' + index
      stats = await fs.stat(path)
    } else {
      return
    }
  }
} catch (err) {
  const notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR']
  if (notfound.includes(err.code)) {
    throw createError(404, err)
  }
  err.status = 500
  throw err
}
```

#### 一个小彩蛋

可以发现一个很有意思的事情，如果发现当前路径是一个目录以后，并且明确指定了`format`，那么还会再尝试拼接一次`index`。  
这就是上边所说的那个彩蛋了，当我们的`public`路径结构长得像这样的时候：
```bash
└── public
    └── index
        └── index # 实际的文件 hello
```

我们可以通过一个简单的方式获取到最底层的文件数据：
```javascript
router.get('/surprises', async ctx => {
  await send(ctx, '/', {
    root: './public',
    index: 'index'
  })
})

// > curl http://127.0.0.1:12306/surprises
// hello
```

这里就用到了上边的几个逻辑处理，首先是`trailingSlash`的判断，如果以`/`结尾会拼接`index`，以及如果当前`path`匹配为是一个目录以后，又会拼接一次`index`。  
所以一个简单的`/`加上`index`的参数就可以直接获取到`/index/index`。  
_一个小小的彩蛋，实际开发中应该很少会这么玩_  

### 最终的读取文件操作

最后终于来到了文件读取的逻辑处理，首先就是调用`setHeaders`的操作。  

因为经过上边的层层筛选，这里拿到的`path`和你调用`send`时传入的`path`不是同一个路径。  
不过倒也没有必要必须在`setHeaders`函数中进行处理，因为可以看到在函数结束时，将实际的`path`返回了出来。  
我们完全可以在`send`执行完毕后再进行设置，至于官方`readme`中所写的`and doing it after is too late because the headers are already sent.`。  
这个不需要担心，因为`koa`的返回数据都是放到`ctx.body`中的，而`body`的解析是在所有的中间件全部执行完以后才会进行处理。  
也就是说所有的中间件都执行完以后才会开始发送`http`请求体，在此之前设置`Header`都是有效的。

```javascript
if (setHeaders) setHeaders(ctx.res, path, stats)

// stream
ctx.set('Content-Length', stats.size)
if (!ctx.response.get('Last-Modified')) ctx.set('Last-Modified', stats.mtime.toUTCString())
if (!ctx.response.get('Cache-Control')) {
  const directives = ['max-age=' + (maxage / 1000 | 0)]
  if (immutable) {
    directives.push('immutable')
  }
  ctx.set('Cache-Control', directives.join(','))
}
if (!ctx.type) ctx.type = type(path, encodingExt) // 接口返回的数据类型，默认会取出文件后缀
ctx.body = fs.createReadStream(path)

return path
```

以及包括上边的`maxage`和`immutable`都是在这里生效的，但是要注意的是，如果`Cache-Control`已经存在值了，`koa-send`是不会去覆盖的。  

#### 使用Stream与使用readFile的区别

在最后给`body`赋值的位置可以看到，是使用的`Stream`而并非是`readFile`，使用`Stream`进行传输能带来至少两个好处：  

1. 第一种方式，如果是大文件，在读取完成后会临时存放到内存中，并且`toString`是有长度限制的，如果是一个巨大的文件，`toString`调用会抛出异常的。  
2. 采用第一种方式进行读取文件，是要在全部的数据都读取完成后再返回给接口调用方，在读取数据的期间，接口都是处于`Wait`的状态，没有任何数据返回。  

可以做一个类似这样的Demo：
```javascript
const http      = require('http')
const fs        = require('fs')
const filePath  = './test.log'
  
http.createServer((req, res) => {
  if (req.url === '/') {
    res.end('<html></html>')
  } else if (req.url === '/sync') {
    const data = fs.readFileSync(filePath).toString()

    res.end(data)
  } else if (req.url === '/pipe') {
    const rs = fs.createReadStream(filePath)

    rs.pipe(res)
  } else {
    res.end('404')
  }
}).listen(12306, () => console.log('server run as http://127.0.0.1:12306'))
```

首先访问首页`http://127.0.0.1:12306/`进入一个空的页面 _(主要是懒得搞`CORS`了)_，然后在控制台调用两个`fetch`就可以得到这样的对比结果了：

![sync-timeline](/images/koajs-code-review/sync-timeline.png)  
![pipe-timeline](/images/koajs-code-review/pipe-timeline.png)  

可以看出在下行传输的时间相差无几的同时，使用`readFileSync`的方式会增加一定时间的`Waiting`，而这个时间就是服务器在进行文件的读取，时间长短取决于读取的文件大小，以及机器的性能。

## koa-static

`koa-static`是一个基于`koa-send`的浅封装。  
因为通过上边的实例也可以看到，`send`方法需要自己在中间件中调用才行。  
手动指定`send`对应的`path`之类的参数，这些也是属于重复性的操作，所以`koa-static`将这些逻辑进行了一次封装。  
让我们可以通过直接注册一个中间件来完成静态文件的处理，而不再需要关心参数的读取之类的问题：
```javascript
const Koa = require('koa')
const app = new Koa()
app.use(require('koa-static')(root, opts))
```

`opts`是透传到`koa-send`中的，只不过会使用第一个参数`root`来覆盖`opts`中的`root`。  
并且添加了一些细节化的操作：
- 默认添加一个`index.html`
```javascript
if (opts.index !== false) opts.index = opts.index || 'index.html'
```
- 默认只针对`HEAD`和`GET`两种`METHOD`
```javascript
if (ctx.method === 'HEAD' || ctx.method === 'GET') {
  // ...
}
```
- 添加一个`defer`选项来决定是否先执行其他中间件。
如果`defer`为`false`，则会先执行`send`，优先匹配静态文件。
否则则会等到其余中间件先执行，确定其他中间件没有处理该请求才会去寻找对应的静态资源。  
只需指定`root`，剩下的工作交给`koa-static`，我们就无需关心静态资源应该如何处理了。

## 小结

`koa-send`与`koa-static`算是两个非常轻量级的中间件了。  
本身没有太复杂的逻辑，就是一些重复的逻辑被提炼成的中间件。  
不过确实能够减少很多日常开发中的任务量，可以让人更专注的关注业务，而非这些边边角角的功能。  