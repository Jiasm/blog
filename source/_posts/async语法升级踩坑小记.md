---
uuid: a9da0b40-c233-11e8-9d1d-3511dc62be4a
title: async语法升级踩坑小记
date: 2018-09-28 08:59:38
tags:
  - javascript
  - typescript
---

> 从今年过完年回来，三月份开始，就一直在做重构相关的事情。  
> 就在今天刚刚上线了最新一次的重构代码，希望高峰期安好，接近半年的Node.js代码重构。  
> 包含从`callback`+`async.waterfall`到`generator`+`co`，统统升级为了`async`，还顺带推动了`TypeScript`在我司的使用。  
> 这些日子也踩了不少坑，也总结了一些小小的优化方案，进行精简后将一些比较关键的点，拿出来分享给大家，希望有同样在做重构的小伙伴们可以绕过这些。  

<!-- more -->

## 为什么要升级

首先还是要谈谈改代码的理由，毕竟重构肯定是要有合理的理由的。  
如果单纯想看升级相关事项可以直接选择跳过这部分。

### Callback

从最原始的开始说起，期间确实遇到了几个年代久远的项目，`Node 0.x`，使用的普通`callback`，也有一些会应用上[async.waterfall](https://www.npmjs.com/package/async)这样在当年看起来很优秀的工具。 

```javascript
// 普通的回调函数调用
var fs = require('fs')

fs.readFile('test1.txt', function (err, data1) {
  if (err) return console.error(err)


  fs.readFile('test2.txt', function (err, data2) {
    if (err) return console.error(err)

    // 执行后续逻辑
    console.log(data1.toString() + data2.toString())
    // ...
  })
})

// 使用了async以后的复杂逻辑
var async = require('fs')

async.waterfall([
  function (callback) {
    fs.readFile('test1.txt', function (err, data) {
      if (err) callback(err)

      callback(null, data.toString())
    })
  },
  function (result, callback) {
    fs.readFile('test2.txt', function (err, data) {
      if (err) callback(err)

      callback(null, result + data.toString())
    })
  }
], function (err, result) {
  if (err) return console.error(err)

  // 获取到正确的结果
  console.log(result) // 输出两个文件拼接后的内容
})
```

虽说`async.waterfall`解决了`callback hell`的问题，不会出现一个函数前边有二三十个空格的缩进。  
但是这样的流程控制在某些情况下会让代码变得很诡异，例如我很难在某个函数中选择下一个应该执行的函数，而是只能按照顺序执行，如果想要进行跳过，可能就要在中途的函数中进行额外处理：  

```javascript
async.waterfall([
  function (callback) {
    if (XXX) {
      callback(null, null, null, true)
    } else {
      callback(null, data1, data2)
    }
  },
  function (data1, data2, isPass, callback) {
    if (isPass) {
      callback(null, null, null, isPass)
    } else {
      callback(null, data1 + data2)
    }
  }
])
```

所以很可能你的代码会变成这样，里边存在大量的不可读的函数调用，那满屏充斥的`null`占位符。  

所以`callback`这种形式的，一定要进行修改， __这属于难以维护的代码__。  

### Generator

实际上`generator`是依托于`co`以及类似的工具来实现的将其转换为`Promise`，从编辑器中看，这样的代码可读性已经没有什么问题了，但是问题在于他始终是需要额外引入`co`来帮忙实现的，`generator`本身并不具备帮你执行异步代码的功能。  
_不要再说什么async/await是generator的语法糖了_  

因为我司`Node`版本已经统一升级到了`8.11.x`，所以`async/await`语法已经可用。  
这就像如果`document.querySelectorAll`、`fetch`已经可以满足需求了，为什么还要引入`jQuery`呢。  

所以，将`generator`函数改造为`async/await`函数也是势在必行。  

## 期间遇到的坑

将`callback`的升级为`async`/`await`其实并没有什么坑，反倒是在`generator` + `co` 那里遇到了一些问题：  

### 数组执行的问题

在`co`的代码中，大家应该都见到过这样的：
```javascript
const results = yield list.map(function * (item) {
  return yield getData(item)
})
```

在循环中发起一些异步请求，有些人会告诉你，从`yield`改为`async`/`await`仅仅替换关键字就好了。  

那么恭喜你得到的`results`实际上是一个由`Promise`实例组成的数组。  

```javascript
const results = await list.map(async item => {
  return await getData(item)
})

console.log(results) // [Promise, Promise, Promise, ...]
```

因为`async`并不会判断你后边的是不是一个数组（这个是在`co`中有额外的处理）而仅仅检查表达式是否为一个`Promise`实例。  
所以正确的做法是，添加一层`Promise.all`，或者说等新的语法`await*`，`Node.js 10.x`貌似还不支持。。  

```javascript
// 关于这段代码的优化方案在下边的建议中有提到
const results = await Promise.all(list.map(async item => {
  return await getData(item)
}))

console.log(results) // [1, 2, 3, ...]
```

### await / yield 执行顺序的差异

这个一般来说遇到的概率不大，但是如果真的遇到了而栽了进去就欲哭无泪了。  

首先这样的代码在执行上是没有什么区别的：

```javascript
yield 123 // 123

await 123 // 123
```

这样的代码也是没有什么区别的：

```javascript
yield Promise.resolve(123) // 123

await Promise.resolve(123) // 123
```

但是这样的代码，问题就来了：

```javascript
yield true ? Promise.resolve(123) : Promise.resolve(233) // 123

await true ? Promise.resolve(123) : Promise.resolve(233) // Promise<123>
```

从字面上我们其实是想要得到`yield`那样的效果，结果却得到了一个`Promise`实例。  
这个是因为`yield`、`await`两个关键字执行顺序不同所导致的。  

在MDN的文档中可以找到对应的说明：[MDN | Operator precedence](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table)  

可以看到`yield`的权重非常低，仅高于`return`，所以从字面上看，这个执行的结果很符合我们想要的。  
而`await`关键字的权重要高很多，甚至高于最普通的四则运算，所以必然也是高于三元运算符的。  

也就是说`await`版本的实际执行是这样子的：

```javascript
(await true) ? Promise.resolve(123) : Promise.resolve(233) // Promise<123>
```

那么我们想要获取预期的结果，就需要添加`()`来告知解释器我们想要的执行顺序了：

```javascript
await (true ? Promise.resolve(123) : Promise.resolve(233)) // 123
```

### 一定不要漏写 await 关键字

这个其实算不上升级时的坑，在使用`co`时也会遇到，但是这是一个很严重，而且很容易出现的问题。  

如果有一个异步的操作用来返回一个布尔值，告诉我们他是否为管理员，我们可能会写这样的代码：
```javascript
async function isAdmin (id) {
  if (id === 123) return true

  return false
}

if (await isAdmin(1)) {
  // 管理员的操作
} else {
  // 普通用户的操作
}
```

因为这种写法接近同步代码，所以遗漏关键字是很有可能出现的：  

```javascript
if (isAdmin(1)) {
  // 管理员的操作
} else {
  // 普通用户的操作
}
```

因为`async`函数的调用会返回一个`Promise`实例，得益于我强大的弱类型脚本语言，`Promise`实例是一个`Object`，那么就不为空，也就是说会转换为`true`，那么所有调用的情况都会进入`if`块。  

那么解决这样的问题，有一个比较稳妥的方式，强制判断类型，而不是简单的使用`if else`，使用类似`(a === 1)`、`(a === true)`这样的操作。_eslint、ts 之类的都很难解决这个问题_  

## 一些建议

### 何时应该用 async ，何时应该直接用 Promise

首先，`async`函数的执行返回值就是一个`Promise`，所以可以简单地理解为`async`是一个基于`Promise`的包装：
```javascript
function fetchData () {
  return Promise().resolve(123)
}

// ==>

async function fetchData () {
  return 123
}
```  

所以可以认为说`await`后边是一个`Promise`的实例。  
而针对一些非`Promise`实例则没有什么影响，直接返回数据。  

在针对一些老旧的`callback`函数，当前版本的`Node`已经提供了官方的转换工具[util.promisify](https://nodejs.org/dist/latest-v8.x/docs/api/util.html#util_util_promisify_original)，用来将符合`Error-first callback`规则的异步操作转换为`Promise`实例：  

而一些没有遵守这样规则的，或者我们要自定义一些行为的，那么我们会尝试手动实现这样的封装。  
在这种情况下一般会采用直接使用`Promise`，因为这样我们可以很方便的控制何时应该`reject`，何时应该`resolve`。  

但是如果遇到了在回调执行的过程中需要发起其他异步请求，难道就因为这个`Promise`导致我们在内部也要使用`.then`来处理么？  

```javascript
function getList () {
  return new Promise((resolve, reject) => {
    oldMethod((err, data) => {
      fetch(data.url).then(res => res.json()).then(data => {
        resolve(data)
      })
    })
  })
}

await getList()
```

但上边的代码也太丑了，所以关于上述问题，肯定是有更清晰的写法的，不要限制自己的思维。  
__`async`也是一个普通函数__，完全可以放在任何函数执行的地方。  

所以关于上述的逻辑可以进行这样的修改：
```javascript
function getList () {
  return new Promise((resolve, reject) => {
    oldMethod(async (err, data) => {
      const res = await fetch(data.url)
      const data = await res.json()

      resolve(data)
    })
  })
}

await getList()
```

这完全是一个可行的方案，对于`oldMethod`来说，我按照约定调用了传入的回调函数，而对于`async`匿名函数来说，也正确的执行了自己的逻辑，并在其内部触发了外层的`resolve`，实现了完整的流程。  

_代码变得清晰很多，逻辑没有任何修改。_  

### 合理的减少 await 关键字

`await`只能在`async`函数中使用，`await`后边可以跟一个`Promise`实例，这个是大家都知道的。  
但是同样的，有些`await`其实并没有存在的必要。  

首先有一个我面试时候经常会问的题目：  

```javascript
Promise.resolve(Promise.resolve(123)).then(console.log) // ?
```

最终输出的结果是什么。  

这就要说到`resolve`的执行方式了，如果传入的是一个`Promise`实例，亦或者是一个`thenable`对象（_简单的理解为支持`.then((resolve, reject) => {})`调用的对象_），那么`resolve`实际返回的结果是内部执行的结果。  
也就是说上述示例代码直接输出`123`，哪怕再多嵌套几层都是一样的结果。  

通过上边所说的，不知大家是否理解了 _合理的减少 await 关键字_ 这句话的意思。  

结合着前边提到的在`async`函数中返回数据是一个类似`Promise.resolve`/`Promise.reject`的过程。  
而`await`就是类似监听`then`的动作。

所以像类似这样的代码完全可以避免：
```javascript
const imgList = []

async function getImage (url) {
  const res = await fetch(url)

  return await res.blob()
}

await Promise.all(imgList.map(async url => await getImage(url)))

// ==>

async function getImage (url) {
  const res = fetch(url)

  return res.blob()
}

await Promise.all(imgList.map(url => getImage(url)))
```

上下两种方案效果完全相同。  

### Express 与 koa 的升级

首先，`Express`是通过调用`response.send`来完成请求返回数据的。  
所以直接使用`async`关键字替换原有的普通回调函数即可。  

而`Koa`也并不是说你必须要升级到`2.x`才能够使用`async`函数。  
在`Koa1.x`中推荐的是`generator`函数，也就意味着其内部是调用了`co`来帮忙做转换的。  
而看过`co`源码的小伙伴一定知道，里边同时存在对于`Promise`的处理。  
也就是说传入一个`async`函数完全是没有问题的。  

但是`1.x`的请求上下文使用的是`this`，而`2.x`则是使用的第一个参数`context`。  
所以在升级中这里可能是唯一需要注意的地方，__在`1.x`不要使用箭头函数来注册中间件__。  

```javascript
// express
express.get('/', async (req, res) => {
  res.send({
    code: 200
  })
})

// koa1.x
router.get('/', async function (next) {
  this.body = {
    code: 200
  }
})

// koa2.x
router.get('/', async (ctx, next) => {
  ctx.body = {
    code: 200
  }
})
```

## 小结

重构项目是一件很有意思的事儿，但是对于一些注释文档都很缺失的项目来说，重构则是一件痛苦的事情，因为你需要从代码中获取逻辑，而作为动态脚本语言的`JavaScript`，其在大型项目中的可维护性并不是很高。  
所以如果条件允许，还是建议选择`TypeScript`之类的工具来帮助更好的进行开发。