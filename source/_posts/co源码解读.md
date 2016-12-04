---
uuid: 892300a0-b97a-11e6-8d94-e70f0eca18da
title: co源码解读
date: 2016/08/23 17:16
tags: node.js
---

### 背景：

闲来无事，翻了下co的源码来看，源码短小精悍，算上注释，一共240行左右；

决定写一篇博客来记录下学习的心得。

TJ大神的co：[https://github.com/tj/co](https://github.com/tj/co)
<!-- more -->

### 作用：

co通过将[Generator函数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)拆成一个[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)将码农从[callback hell](http://callbackhell.com/)中拯救了出来；

下边放出一段代码，对比下co与普通回调版本的区别：

```javascript
/**
 *  回调版本
 */
let fs =require('fs')

fs.readFile('./package.json', (err, data) => {
  if (err) {
    return console.log(err)
  }
  console.log(data.toString())
  fs.readFile('./package.json', (err, data) => {
    if (err) {
      return console.log(err)
    }
    console.log(data.toString())
  })
})
/**
 *  co版本
 */
let co = require('co')
let fs =require('fs')
co(function* (){
  let a = yield fs.readFile.bind(null,'./package.json')
  console.log(a.toString())
  let b = yield fs.readFile.bind(null,'./package.json')
  console.log(b.toString())
}).then(console.log, console.error)
```

从代码上看，貌似co是一个同步执行的过程呢。当然，也只是看起来像而已。

### 正题：

先来说一下co整个执行的过程：

- 调用co，传入一个Generator函数，函数会返回一个Promise对象
- 如果传入参数为Generator函数，会执行该函数来进行Generator的初始化
- 手动执行一次next() 这时Generator函数就会停在第一次遇到yield关键字的地方
- 获取到yield后边的值，将其转换为一个Promise函数，然后执行之
- 重复上边两步，直到函数执行完毕

co关于yield后边的值也是有一定的要求的，只能是一个 Function｜Promise｜Generator ｜ Array | Object；

而 Array和Object中的item也必须是 Function｜Promise｜Generator。

并且关于function 普通函数并不一定会得到预期的结果，co需要的是 接收一个回调函数 并执行的函数，类似于这样：

```javascript
function doSomething (callback){
  callback(null,'hello')
}
co(function* (){
  let result = yield doSomething
  console.log(result)// => hello
})
```

总而言之，co执行的肯定是一个Promise，而co会帮你把其他几种类型的值转换为Promise，co绝大部份的代码都是在处理类型的转换；

当然，在讲类型转换的那一块之前，还是将co执行Generator的那几个函数说一下子，也就是调用co返回的Promise中的那三个函数（onFulfilled、onRejected、next）；

因next与Generator对象的next方法名相同 这里使用 gen.next 表示 Generator对象的next方法。

#### onFulfilled：

调用gen.next并将上次执行的结果传入gen.next；

调用next，将gen.next返回的值传入next。

#### onRejected：

执行流程与 onFulfilled 一致，只不过是将调用的 gen.next 换为了 gen.throw 用来将错误异常抛出。

#### next：

函数会判断传入参数的done属性，如果为true（ 则表示该Generator已经执行完毕），会调用co返回的Promise对象的resolve方法，结束代码执行；

如果done为false 则表示还需要继续执行，这里会将 yield后边的值（参数的value属性）转换为Promise，并调用then方法传入 onFulfilled 和 onRejected两个函数。

co整个的执行流程其实就是这样的-.- 

剩余代码所完成的事情就是将各种不同的类型转换为可执行的Promise对象。

#### thunkToPromise（Function）：

函数返回一个Promise对象，在Promise内部执行了传入的function；

并会认为回调的第一个参数为Error（这个貌似是个标准...）；

将其余参数打包到一个数组中返回。

#### arrayToPromise（Array）：

Promise有一个方法叫做all，会返回数组中所有Promise执行后的返回值（如果有其中一项被reject掉，所有的都会被reject）；

方法会返回 [Promise.all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) 的执行结果

```javascript
Promise.all([Promise.resolve('hello'), Promise.resolve('world')]).then(data =>{
  console.log(data) // => ['hello', 'world']
})
```

#### objectToPromise（Object）：

函数用来将一个Object对象转换为Promise；

应该是co源码中行数最多的一个函数了😜  具体做的事儿呢；

就是将一个Object的每一个key都转换为Promise，并塞到一个数组中；

执行Promise.all()将上边的数组塞进去；

当某一个key所对应的Promise函数执行完毕后，会将执行的结果塞回对应的key中；

全部执行完毕后，就会返回该Object。

```javascript
{
  a: Promise.resolve('hello'),
  b: Promise.resolve('world')
}
// =>
{
  a:'hello',
  b:'world'
}
```

其余的几个函数就是判断类型了， isPromise、isGenerator、isGeneratorFunction、isObject。

### 小记：

因我司在用koa来搭建web项目，所以会接触到这些东西，就想写点博客记录一下；

本人文笔简直负分，望各位海涵，如有什么不懂的，欢迎邮件骚扰。

[jiashunming@outlook.com](mailto:jiashunming@outlook.com) 

文章相关代码会在GitHub更新：

[https://github.com/Jiasm/blog-resource/tree/master/co](https://github.com/Jiasm/blog-resource/tree/master/co) 
