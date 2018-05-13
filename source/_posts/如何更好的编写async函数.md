---
uuid: 22d10490-55e7-11e8-90e5-d32659be4ecf
title: 如何更好的编写async函数
date: 2018-05-12 21:19:44
tags:
---
> 2018年已经到了5月份，`node`的`4.x`版本也已经停止了维护  
> 我司的某个服务也已经切到了`8.x`，目前正在做`koa2.x`的迁移  
> 将之前的`generator`全部替换为`async`  
> 但是，在替换的过程中，发现一些滥用`async`导致的时间上的浪费
> 所以来谈一下，如何优化`async`代码，更充分的利用异步事件流 **杜绝滥用async**

<!-- more -->

## 首先，你需要了解Promise

`Promise`是使用`async`/`await`的基础，所以你一定要先了解`Promise`是做什么的   
`Promise`是帮助解决回调地狱的一个好东西，能够让异步流程变得更清晰。  
一个简单的`Error-first-callback`转换为`Promise`的例子：  
```javascript
const fs = require('fs')

function readFile (fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, (err, data) => {
      if (err) reject(err)

      resolve(data)
    })
  })
}

readFile('test.log').then(data => {
  console.log('get data')
}, err => {
  console.error(err)
})
```
我们调用函数返回一个`Promise`的实例，在实例化的过程中进行文件的读取，当文件读取的回调触发式，进行`Promise`状态的变更，`resolved`或者`rejected`  
状态的变更我们使用`then`来监听，第一个回调为`resolve`的处理，第二个回调为`reject`的处理。

## async与Promise的关系

`async`函数相当于一个简写的返回`Promise`实例的函数，效果如下：
```javascript
function getNumber () {
  return new Promise((resolve, reject) => {
    resolve(1)
  })
}
// =>
async function getNumber () {
  return 1
}
```
两者在使用上方式上完全一样，都可以在调用`getNumber`函数后使用`then`进行监听返回值。
以及与`async`对应的`await`语法的使用方式：  
```javascript
getNumber().then(data => {
  // got data
})
// =>
let data = await getNumber()
```
`await`的执行会获取表达式后边的`Promise`执行结果，相当于我们调用`then`获取回调结果一样。
*P.S. 在`async`/`await`支持度还不是很高的时候，大家都会选择使用`generator`/`yield`结合着一些类似于`co`的库来实现类似的效果*

## async函数代码执行是同步的，结果返回是异步的

`async`函数总是会返回一个`Promise`的实例 **这点儿很重要**  
所以说调用一个`async`函数时，可以理解为里边的代码都是处于`new Promise`中，所以是同步执行的  
而最后`return`的操作，则相当于在`Promise`中调用`resolve`：  

```javascript
async function getNumber () {
  console.log('call getNumber()')

  return 1
}

getNumber().then(_ => console.log('resolved'))
console.log('done')

// 输出顺序：
// call getNumber()
// done
// resolved
```

## Promise内部的Promise会被消化

也就是说，如果我们有如下的代码：  
```javascript
function getNumber () {
  return new Promise(resolve => {
    resolve(Promise.resolve(1))
  })
}

getNumber().then(data => console.log(data)) // 1
```
如果按照上边说的话，我们在`then`里边获取到的`data`应该是传入`resolve`中的值  ，也就是另一个`Promise`的实例。  
但实际上，我们会直接获得返回值：`1`，也就是说，如果在`Promise`中返回一个`Promise`，实际上程序会帮我们执行这个`Promise`，并在内部的`Promise`状态改变时触发`then`之类的回调。  
一个有意思的事情：   
```javascript
function getNumber () {
  return new Promise(resolve => {
    resolve(Promise.reject(new Error('Test')))
  })
}

getNumber().catch(err => console.error(err)) // Error: Test
```
如果我们在`resolve`中传入了一个`reject`，则我们在外部则可以直接使用`catch`监听到。  
**这种方式经常用于在`async`函数中抛出异常**
如何在`async`函数中抛出异常：  
```javascript
async function getNumber () {
  return Promise.reject(new Error('Test'))
}
try {
  let number = await getNumber()
} catch (e) {
  console.error(e)
}
```

## 一定不要忘了await关键字

如果忘记添加`await`关键字，代码层面并不会报错，但是我们接收到的返回值却是一个`Promise`  
```javascript
let number = getNumber()
console.log(number) // Promise
```
所以在使用时一定要切记`await`关键字  
```javascript
let number = await getNumber()
console.log(number) // 1
```
## 不是所有的地方都需要添加await

在代码的执行过程中，有时候，并不是所有的异步都要添加`await`的。
比如下边的对文件的操作：  
*我们假设`fs`所有的API都被我们转换为了`Promise`版本*  
```javascript
async function writeFile () {
  let fd = await fs.open('test.log')
  fs.write(fd, 'hello')
  fs.write(fd, 'world')
  await fs.close(fd)
}
```
我们通过`await`打开一个文件，然后进行两次文件的写入。  
但是注意了，在两次文件的写入操作前边，我们并没有添加`await`关键字。  
因为这是多余的，我们只需要通知API，我要往这个文件里边写入一行文本，顺序自然会由`fs`来控制  
然后我们在最后使用`await`来关闭这个文件。  
因为如果我们上边在执行写入的过程还没有完成时，`close`的回调是不会触发的，  
也就是说，回调的触发就意味着上边两步的`write`已经执行完成了。

## 合并多个不相干的async函数调用

如果我们现在要获取一个用户的头像和用户的详细信息（而这是两个接口 *虽说一般情况下不太会出现*）   
```javascript
async function getUser () {
  let avatar = await getAvatar()
  let userInfo = await getUserInfo()

  return {
    avatar,
    userInfo
  }
}
```
这样的代码就造成了一个问题，我们获取用户信息的接口并不依赖于头像接口的返回值。  
但是这样的代码却会在获取到头像以后才会去发送获取用户信息的请求。  
所以我们对这种代码可以这样处理：  
```javascript
async function getUser () {
  let [avatar, userInfo] = await Promise.all([getAvatar(), getUserInfo()])

  return {
    avatar,
    userInfo
  }
}
```

这样的修改就会让`getAvatar`与`getUserInfo`内部的代码同时执行，同时发送两个请求，在外层通过包一层`Promise.all`来确保两者都返回结果。  

**让相互没有依赖关系的异步函数同时执行**

## 一些循环中的注意事项

### forEach

当我们调用这样的代码时：  
```javascript
async function getUsersInfo () {
  [1, 2, 3].forEach(async uid => {
    console.log(await getUserInfo(uid))
  })
}

function getuserInfo (uid) {
  return new Promise(resolve => {
    setTimeout(_ => resolve(uid), 1000)
  })
}

await getUsersInfo()
```
这样的执行好像并没有什么问题，我们也会得到`1`、`2`、`3`三条`log`的输出，  
但是当我们在`await getUsersInfo()`下边再添加一条`console.log('done')`的话，就会发现：  
我们会先得到`done`，然后才是三条`uid`的`log`，也就是说，`getUsersInfo`返回结果时，其实内部`Promise`并没有执行完。  
这是因为`forEach`并不会关心回调函数的返回值是什么，它只是运行回调。  

### 不要在普通的for、while循环中使用await

使用普通的`for`、`while`循环会导致程序变为串行：  
```javascript
for (let uid of [1, 2, 3]) {
  let result = await getUserInfo(uid)
}
```
这样的代码运行，会在拿到`uid: 1`的数据后才会去请求`uid: 2`的数据  

----

### 关于这两种问题的解决方案：  

目前最优的就是将其替换为`map`结合着`Promise.all`来实现：  
```javascript
await Promise.all([1, 2, 3].map(async uid => await getUserInfo(uid)))
```
这样的代码实现会同时实例化三个`Promise`，并请求`getUserInfo`

#### P.S. 草案中有一个`await*`，可以省去`Promise.all`
```javascript
await* [1, 2, 3].map(async uid => await getUserInfo(uid))
```

#### P.S. 为什么在使用`Generator`+`co`时没有这个问题

在使用`koa1.x`的时候，我们直接写`yield [].map`是不会出现上述所说的串行问题的  
看过`co`源码的小伙伴应该都明白，里边有这么两个函数（删除了其余不相关的代码）：  
```javascript
function toPromise(obj) {
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  return obj;
}

function arrayToPromise(obj) {
  return Promise.all(obj.map(toPromise, this));
}
```

`co`是帮助我们添加了`Promise.all`的处理的（膜拜TJ大佬）。

## 总结

总结一下关于`async`函数编写的几个小提示：
1. 使用`return Promise.reject()`在`async`函数中抛出异常
2. 让相互之间没有依赖关系的异步函数同时执行
3. 不要在循环的回调中/`for`、`while`循环中使用`await`，用`map`来代替它

## 参考资料

1. [async-function-tips](http://2ality.com/2016/10/async-function-tips.html)
