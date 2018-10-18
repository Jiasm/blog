---
uuid: 84a237e0-d1f0-11e8-9712-c75c21b86b53
title: util.promisify 的那些事儿
date: 2018-10-18 01:39:18
tags:
---

`util.promisify`是在`node.js 8.x`版本中新增的一个工具，用于将老式的`Error first callback`转换为`Promise`对象，让老项目改造变得更为轻松。  

在官方推出这个工具之前，民间已经有很多类似的工具了，比如[es6-promisify](https://www.npmjs.com/package/es6-promisify)、[thenify](https://www.npmjs.com/package/thenify)、[bluebird.promisify](http://bluebirdjs.com/docs/api/promise.promisify.html)。  

以及很多其他优秀的工具，都是实现了这样的功能，帮助我们在处理老项目的时候，不必费神将各种代码使用`Promise`再重新实现一遍。  

<!-- more -->

## 工具实现的大致思路

首先要解释一下这种工具大致的实现思路，因为在`Node`中异步回调有一个约定：`Error first`，也就是说回调函数中的第一个参数一定要是`Error`对象，其余参数才是正确时的数据。  

知道了这样的规律以后，工具就很好实现了，在匹配到第一个参数有值的情况下，触发`reject`，其余情况触发`resolve`，一个简单的示例代码：  
```javascript
function util (func) {
  return (...arg) => new Promise((resolve, reject) => {
    func(...arg, (err, arg) => {
      if (err) reject(err)
      else resolve(arg)
    })
  })
}
```

1. 调用工具函数返回一个匿名函数，匿名函数接收原函数的参数。  
2. 匿名函数被调用后根据这些参数来调用真实的函数，同时拼接一个用来处理结果的`callback`。
3. 检测到`err`有值，触发`reject`，其他情况触发`resolve`

__resolve 只能传入一个参数，所以`callback`中没有必要使用`...arg`获取所有的返回值__  

## 常规的使用方式

> 拿一个官方文档中的示例  

```javascript
const { promisify } = require('util')
const fs = require('fs')

const statAsync = promisify(fs.stat)

statAsync('.').then(stats => {
  // 拿到了正确的数据
}, err => {
  // 出现了异常
})
```

以及因为是`Promise`，我们可以使用`await`来进一步简化代码：  

```javascript
const { promisify } = require('util')
const fs = require('fs')

const statAsync = promisify(fs.stat)

// 假设在 async 函数中
try {
  const stats = await statAsync('.')
  // 拿到正确结果
} catch (e) {
  // 出现异常
}
```

用法与其他工具并没有太大的区别，我们可以很轻易的将回调转换为`Promise`，然后应用于新的项目中。  

## 自定义的 Promise 化

有那么一些场景，是不能够直接使用`promisify`来进行转换的，有大概这么两种情况：
1. 没有遵循`Error first callback`约定的回调函数
2. 返回多个参数的回调函数

首先是第一个，如果没有遵循我们的约定，很可能导致`reject`的误判，得不到正确的反馈。  
而第二项呢，则是因为`Promise.resolve`只能接收一个参数，多余的参数会被忽略。  

所以为了实现正确的结果，我们可能需要手动实现对应的`Promise`函数，但是自己实现了以后并不能够确保使用方不会针对你的函数调用`promisify`。  

所以，`util.promisify`还提供了一个`Symbol`类型的`key`，`util.promisify.custom`。  

`Symbol`类型的大家应该都有了解，是一个唯一的值，这里是`util.prosimify`用来指定自定义的`Promise`化的结果的，使用方式如下：  

```javascript
const { promisify } = require('util')
// 比如我们有一个对象，提供了一个返回多个参数的回调版本的函数
const obj = {
  getData (callback) {
    callback(null, 'Niko', 18) // 返回两个参数，姓名和年龄
  }
}

// 这时使用promisify肯定是不行的
// 因为Promise.resolve只接收一个参数，所以我们只会得到 Niko

promisify(obj.getData)().then(console.log) // Niko

// 所以我们需要使用 promisify.custom 来自定义处理方式

obj.getData[promisify.custom] = async () => ({ name: 'Niko', age: 18 })

// 当然了，这是一个曲线救国的方式，无论如何 Promise 不会返回多个参数过来的
promisify(obj.getData)().then(console.log) // { name: 'Niko', age: 18 }
```

~~_关于`Promise`为什么不能`resolve`多个值，我有一个大胆的想法，一个没有经过考证，强行解释的理由：如果能`resolve`多个值，你让`async`函数怎么`return`（当个乐子看这句话就好，不要当真）_~~  
_不过应该确实跟`return`有关，因为`Promise`是可以链式调用的，每个`Promise`中执行`then`以后都会将其返回值作为一个新的`Promise`对象`resolve`的值，在`JavaScript`中并没有办法`return`多个参数，所以即便第一个`Promise`可以返回多个参数，只要经过`return`的处理就会丢失_  

在使用上就是很简单的针对可能会被调用`promisify`的函数上添加`promisify.custom`对应的处理即可。  
当后续代码调用`promisify`时就会进行判断：  
1. 如果目标函数存在`promisify.custom`属性，则会判断其类型：
    1. 如果不是一个可执行的函数，抛出异常
    2. 如果是可执行的函数，则直接返回其对应的函数
2. 如果目标函数不存在对应的属性，按照`Error first callback`的约定生成对应的处理函数然后返回

添加了这个`custom`属性以后，就不用再担心使用方针对你的函数调用`promisify`了。  
而且可以验证，赋值给`custom`的函数与`promisify`返回的函数地址是一处：  

```javascript
obj.getData[promisify.custom] = async () => ({ name: 'Niko', age: 18 })

// 上边的赋值为 async 函数也可以改为普通函数，只要保证这个普通函数会返回 Promise 实例即可
// 这两种方式与上边的 async 都是完全相等的

obj.getData[promisify.custom] = () => Promise.resolve({ name: 'Niko', age: 18 })
obj.getData[promisify.custom] = () => new Promise(resolve({ name: 'Niko', age: 18 }))

console.log(obj.getData[promisify.custom] === promisify(obj.getData)) // true
```

### 一些内置的 custom 处理

在一些内置包中，也能够找到`promisify.custom`的踪迹，比如说最常用的`child_process.exec`就内置了`promisify.custom`的处理：  

```javascript
const { exec } = require('child_process')
const { promisify } = require('util')

console.log(typeof exec[promisify.custom]) // function
```

因为就像前边示例中所提到的曲线救国的方案，官方的做法也是将函数签名中的参数名作为`key`，将其所有参数存放到一个`Object`对象中进行返回，比如`child_process.exec`的返回值抛开`error`以外会包含两个，`stdout`和`stderr`，一个是命令执行后的正确输出，一个是命令执行后的错误输出：  

```javascript
promisify(exec)('ls').then(console.log)
// -> { stdout: 'XXX', stderr: '' }
```

或者我们故意输入一些错误的命令，当然了，这个只能在`catch`模块下才能够捕捉到，一般命令正常执行`stderr`都会是一个空字符串：  

```javascript
promisify(exec)('lss').then(console.log, console.error)
// -> { ..., stdout: '', stderr: 'lss: command not found' }
```

包括像`setTimeout`、`setImmediate`也都实现了对应的`promisify.custom`。  
之前为了实现`sleep`的操作，还手动使用`Promise`封装了`setTimeout`：  

```javascript
const sleep = promisify(setTimeout)

console.log(new Date())

await sleep(1000)

console.log(new Date())
```

## 内置的 promisify 转换后函数

如果你的`Node`版本使用`10.x`以上的，还可以从很多内置的模块中找到类似`.promises`的子模块，这里边包含了该模块中常用的回调函数的`Promise`版本（都是`async`函数），无需再手动进行`promisify`转换了。   

而且我本人觉得这是一个很好的指引方向，因为之前的工具实现，有的选择直接覆盖原有函数，有的则是在原有函数名后边增加`Async`进行区分，官方的这种在模块中单独引入一个子模块，在里边实现`Promise`版本的函数，其实这个在使用上是很方便的，就拿`fs`模块进行举例： 

```javascript
// 之前引入一些 fs 相关的 API 是这样做的
const { readFile, stat } = require('fs')

// 而现在可以很简单的改为
const { readFile, stat } = require('fs').promises
// 或者
const { promises: { readFile, stat } } = require('fs')
```

后边要做的就是将调用`promisify`相关的代码删掉即可，对于其他使用`API`的代码来讲，这个改动是无感知的。  
所以如果你的`node`版本够高的话，可以在使用内置模块之前先去翻看文档，有没有对应的`promises`支持，如果有实现的话，就可以直接使用。  

## promisify 的一些注意事项

1. 一定要符合`Error first callback`的约定
2. 不能返回多个参数
3. 注意进行转换的函数是否包含`this`的引用

前两个问题，使用前边提到的`promisify.custom`都可以解决掉。  
但是第三项可能会在某些情况下被我们所忽视，这并不是`promisify`独有的问题，就一个很简单的例子：  

```javascript
const obj = {
  name: 'Niko',
  getName () {
    return this.name
  }
}

obj.getName() // Niko

const func = obj.getName

func() // undefined
```

类似的，如果我们在进行`Promise`转换的时候，也是类似这样的操作，那么可能会导致生成后的函数`this`指向出现问题。  
修复这样的问题有两种途径：
1. 使用箭头函数，也是推荐的做法
2. 在调用`promisify`之前使用`bind`绑定对应的`this`

不过这样的问题也是建立在`promisify`转换后的函数被赋值给其他变量的情况下会发生。  
如果是类似这样的代码，那么完全不必担心`this`指向的问题：  

```javascript
const obj = {
  name: 'Niko',
  getName (callback) {
    callback(null, this.name)
  }
}

// 这样的操作是不需要担心 this 指向问题的
obj.XXX = promisify(obj.getName)

// 如果赋值给了其他变量，那么这里就需要注意 this 的指向了
const func = promisify(obj.getName) // 错误的 this
```

## 小结

个人认为`Promise`作为当代`javaScript`异步编程中最核心的一部分，了解如何将老旧代码转换为`Promise`是一件很有意思的事儿。  
而我去了解官方的这个工具，原因是在搜索`Redis`相关的`Promise`版本时看到了这个[readme](https://github.com/mjackson/then-redis)：  

> This package is no longer maintained. node_redis now includes support for promises in core, so this is no longer needed.

然后跳到了`node_redis`里边的实现方案，里边提到了`util.promisify`，遂抓过来研究了一下，感觉还挺有意思，总结了下分享给大家。

### 参考资料

- [util.promisify](https://nodejs.org/api/util.html#util_util_promisify_original)
- [child_process.exec](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)
- [fs.promises](https://nodejs.org/api/fs.html#fs_fs_promises_api)