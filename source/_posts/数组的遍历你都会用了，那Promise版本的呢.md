---
uuid: 6d32e140-4898-11e8-8c86-e715c1f87b28
title: 数组的遍历你都会用了，那Promise版本的呢
date: 2018-04-25 22:53:33
tags:
  - JavaScript
  - ES7
---

> 这里指的遍历方法包括：`map`、`reduce`、`reduceRight`、`forEach`、`filter`、`some`、`every`
> 因为最近要进行了一些数据汇总，`node`版本已经是8.11.1了，所以直接写了个`async/await`的脚本。
> 但是在对数组进行一些遍历操作时，发现有些遍历方法对`Promise`的反馈并不是我们想要的结果。

当然，有些严格来讲并不能算是遍历，比如说`some`，`every`这些的。
但确实，这些都会根据我们数组的元素来进行多次的调用传入的回调。

这些方法都是比较常见的，但是当你的回调函数是一个`Promise`时，一切都变了。

## 前言

`async/await`为`Promise`的语法糖
文中会直接使用`async/await`替换`Promise`
```javascript
let result = await func()
// => 等价于
func().then(result => {
  // code here
})

// ======

async function func () {
  return 1  
}
// => 等价与
function func () {
  return new Promise(resolve => resolve(1))
}
```

## map

`map`可以说是对`Promise`最友好的一个函数了。
我们都知道，`map`接收两个参数：
1. 对每项元素执行的回调，回调结果的返回值将作为该数组中相应下标的元素
2. 一个可选的回调函数`this`指向的参数

```javascript
[1, 2, 3].map(item => item ** 2) // 对数组元素进行求平方
// > [1, 4, 9]
```
上边是一个普通的`map`执行，但是当我们的一些计算操作变为异步的：

```javascript
[1, 2, 3].map(async item => item ** 2) // 对数组元素进行求平方
// > [Promise, Promise, Promise]
```

这时候，我们获取到的返回值其实就是一个由`Promise`函数组成的数组了。

所以为什么上边说`map`函数为最友好的，因为我们知道，`Promise`有一个函数为`Promise.all`
会将一个由`Promise`组成的数组依次执行，并返回一个`Promise`对象，该对象的结果为数组产生的结果集。
```javascript
await Promise.all([1, 2, 3].map(async item => item ** 2))
// > [1, 4, 9]
```

*首先使用`Promise.all`对数组进行包装，然后用`await`获取结果。*

## reduce/reduceRight

`reduce`的函数签名想必大家也很熟悉了，接收两个参数：
1. 对每一项元素执行的回调函数，返回值将被累加到下次函数调用中，回调函数的签名：
  1. `accumulator`累加的值
  2. `currentValue`当前正在的元素
  3. `array`调用`reduce`的数组
2. 可选的初始化的值，将作为`accumulator`的初始值

```javascript
[1, 2, 3].reduce((accumulator, item) => accumulator + item, 0) // 进行加和
// > 6
```
这个代码也是没毛病的，同样如果我们加和的操作也是个异步的：
```javascript
[1, 2, 3].reduce(async (accumulator, item) => accumulator + item, 0) // 进行加和
// > Promise {<resolved>: "[object Promise]3"}
```
这个结果返回的就会很诡异了，我们在回看上边的`reduce`的函数签名
> 对每一项元素执行的回调函数，返回值将被累加到下次函数调用中

然后我们再来看代码，`async (accumulator, item) => accumulator += item`
这个在最开始也提到了，是`Pormise`的语法糖，为了看得更清晰，我们可以这样写：
```javascript
(accumulator, item) => new Promise(resolve =>
  resolve(accumulator += item)
)
```
也就是说，我们`reduce`的回调函数返回值其实就是一个`Promise`对象
然后我们对`Promise`对象进行`+=`操作，得到那样怪异的返回值也就很合情合理了。

当然，`reduce`的调整也是很轻松的：
```javascript
await [1, 2, 3].reduce(async (accumulator, item) => await accumulator + item, 0)
// > 6
```

我们对`accumulator`调用`await`，然后再与当前`item`进行加和，在最后我们的`reduce`返回值也一定是一个`Promise`，所以我们在最外边也添加`await`的字样
也就是说我们每次`reduce`都会返回一个新的`Promise`对象，在对象内部都会获取上次`Promise`的结果。
我们调用`reduce`实际上得到的是类似这样的一个`Promise`对象：
```javascript
new Promise(resolve => {
  let item = 3
  new Promise(resolve => {
      let item = 2
      new Promise(resolve => {
        let item = 1
        Promise.resolve(0).then(result => resolve(item + result))
      }).then(result => resolve(item + result))
  }).then(result => resolve(item + result))
})
```

### reduceRight

这个就没什么好说的了。。跟`reduce`只是执行顺序相反而已

## forEach

`forEach`，这个应该是用得最多的遍历方法了，对应的函数签名：
1. `callback`，对每一个元素进行调用的函数
  1. `currentValue`，当前元素
  2. `index`，当前元素下标
  3. `array`，调用`forEach`的数组引用
2. `thisArg`，一个可选的回调函数`this`指向

我们有如下的操作：
```javascript
// 获取数组元素求平方后的值
[1, 2, 3].forEach(item => {
  console.log(item ** 2)
})
// > 1
// > 4
// > 9
```

普通版本我们是可以直接这么输出的，但是如果遇到了`Promise`

```javascript
// 获取数组元素求平方后的值
[1, 2, 3].forEach(async item => {
  console.log(item ** 2)
})
// > nothing
```

`forEach`并不关心回调函数的返回值，所以`forEach`只是执行了三个会返回`Promise`的函数
所以如果我们想要得到想要的效果，只能够自己进行增强对象属性了：
```javascript
Array.prototype.forEachSync = async function (callback, thisArg) {
  for (let [index, item] of Object.entries(this)) {
    await callback(item, index, this)
  }
}

await [1, 2, 3].forEachSync(async item => {
  console.log(item ** 2)
})

// > 1
// > 4
// > 9
```
*`await`会忽略非`Promise`值，`await 0`、`await undefined`与普通代码无异*

## filter

`filter`作为一个筛选数组用的函数，同样具有遍历的功能：
函数签名同`forEach`，但是`callback`返回值为`true`的元素将被放到`filter`函数返回值中去。

我们要进行一个奇数的筛选，所以我们这么写：
```javascript
[1, 2, 3].filter(item => item % 2 !== 0)
// > [1, 3]
```

然后我们改为`Promise`版本：
```javascript
[1, 2, 3].filter(async item => item % 2 !== 0)
// > [1, 2, 3]
```
这会导致我们的筛选功能失效，因为`filter`的返回值匹配不是完全相等的匹配，只要是返回值能转换为`true`，就会被认定为通过筛选。
`Promise`对象必然是`true`的，所以筛选失效。
所以我们的处理方式与上边的`forEach`类似，同样需要自己进行对象增强
但我们这里直接选择一个取巧的方式：
```javascript
Array.prototype.filterSync = async function (callback, thisArg) {
  let filterResult = await Promise.all(this.map(callback))
  // > [true, false, true]

  return this.filter((_, index) => filterResult[index])
}

await [1, 2, 3].filterSync(item => item % 2 !== 0)
```

我们可以直接在内部调用`map`方法，因为我们知道`map`会将所有的返回值返回为一个新的数组。
这也就意味着，我们`map`可以拿到我们对所有`item`进行筛选的结果，`true`或者`false`。
接下来对原数组每一项进行返回对应下标的结果即可。

## some

`some`作为一个用来检测数组是否满足一些条件的函数存在，同样是可以用作遍历的
函数签名同`forEach`，有区别的是当任一`callback`返回值匹配为`true`则会直接返回`true`，如果所有的`callback`匹配均为`false`，则返回`false`

我们要判断数组中是否有元素等于`2`：
```javascript
[1, 2, 3].some(item => item === 2)
// > true
```

然后我们将它改为`Promise`

```javascript
[1, 2, 3].some(async item => item === 2)
// > true
```
这个函数依然会返回`true`，但是却不是我们想要的，因为这个是`async`返回的`Promise`对象被认定为`true`。

所以，我们要进行如下处理：
```javascript
Array.prototype.someSync = async function (callback, thisArg) {
  for (let [index, item] of Object.entries(this)) {
    if (await callback(item, index, this)) return true
  }

  return false
}
await [1, 2, 3].someSync(async item => item === 2)
// > true
```
因为`some`在匹配到第一个`true`之后就会终止遍历，所以我们在这里边使用`forEach`的话是在性能上的一种浪费。
同样是利用了`await`会忽略普通表达式的优势，在内部使用`for-of`来实现我们的需求

## every

以及我们最后的一个`every`
函数签名同样与`forEach`一样，
但是`callback`的处理还是有一些区别的：
其实换一种角度考虑，`every`就是一个反向的`some`
`some`会在获取到第一个`true`时终止
而`every`会在获取到第一个`false`时终止，如果所有元素均为`true`，则返回`true`

我们要判定数组中元素是否全部大于3
```javascript
[1, 2, 3].every(item => item > 3)
// > false
```
很显然，一个都没有匹配到的，而且回调函数在执行到第一次时就已经终止了，不会继续执行下去。
我们改为`Promise`版本：
```javascript
[1, 2, 3].every(async => item > 3)
// > true
```
这个必然是`true`，因为我们判断的是`Promise`对象
所以我们拿上边的`someSync`实现稍微修改一下：
```javascript
Array.prototype.everySync = async function (callback, thisArg) {
  for (let [index, item] of Object.entries(this)) {
    if (!await callback(item, index, this)) return false
  }

  return true
}
await [1, 2, 3].everySync(async item => item === 2)
// > true
```
当匹配到任意一个`false`时，直接返回`false`，终止遍历。

## 后记

关于数组的这几个遍历方法。
因为`map`和`reduce`的特性，所以是在使用`async`时改动最小的函数。
*`reduce`的结果很像一个洋葱模型*
但对于其他的遍历函数来说，目前来看就需要自己来实现了。

四个`*Sync`函数的实现：[https://github.com/Jiasm/notebook/tree/master/array-sync](https://github.com/Jiasm/notebook/tree/master/array-sync)

### 参考资料

[Array - JavaScript | MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array)
