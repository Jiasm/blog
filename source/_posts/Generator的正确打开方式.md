---
uuid: 8ef40710-582d-11e8-ad45-11152b6d83f2
title: Generator的正确打开方式
date: 2018-05-15 18:48:52
tags:
  - javascript
---

> 前两年大量的在写`Generator`+`co`，用它来写一些类似同步的代码  
> 但实际上，`Generator`并不是被造出来干这个使的，不然也就不会有后来的`async`、`await`了  
> `Generator`是一个可以被暂停的函数，并且何时恢复，由调用方决定  
> 希望本文可以帮助你理解`Generator`究竟是什么，以及怎么用  

<!-- more -->

放一张图来表示我对`Generator`的理解：
![](/images/understanding-generators/banner.jpeg)
*一个咖啡机，虽说我并不喝咖啡，可惜找不到造王老吉的机器-.-*

我所理解的~~Generator~~咖啡机大概就是这么的一个样子的：

1. 首先，我们往机器里边放一些咖啡豆
2. 等我们想喝咖啡的时候，就可以按开关(`gen.next()`)，机器开始磨咖啡豆、煮咖啡、接下来就得到咖啡了
3. 等接满了一杯咖啡后，阀门就会自动关闭(`yield`)
4. 如果你一开始往机器里边放的咖啡豆很多的话，此时，机器里边还是会有一些剩余的，下次再想喝还可以继续按开关，执行（磨豆、煮咖啡、接咖啡）这一套操作

拿`Generator`将上述咖啡机实现一下：
```javascript
function * coffeeMachineGenerator (beans) {
  do {
    yield cookCoffee()
  } while (--beans)

  // 煮咖啡
  function cookCoffee () {
    console.log('cooking')

    return 'Here you are'
  }
}

// 往咖啡机放咖啡豆
let coffeeMachine = coffeeMachineGenerator(10)

// 我想喝咖啡了
coffeeMachine.next()

// 我在3秒后还会喝咖啡
setTimeout(() => {
  coffeeMachine.next()
}, 3 * 1e3)
```

代码运行后，我们首先会得到一条`cooking`的`log`，  
然后在`3s`后会再次得到一条`log`。  

这就解释了`Generator`是什么：  
一个可以暂停的迭代器  
调用`next`来获取数据（*我们自己来决定是否何时煮咖啡*）  
在遇到`yield`以后函数的执行就会停止（*接满了一杯，阀门关闭*）  
我们来决定何时运行剩余的代码`next`（*什么时候想喝了再去煮*）  

**这是`Generator`中最重要的特性，我们只有在真正需要的时候才获取下一个值，而不是一次性获取所有的值**

## Generator的语法

声明`Generator`函数有很多种途径，最重要的一点就是，在`function`关键字后添加一个`*`

```javascript
function * generator () {}
function* generator () {}
function *generator () {}

let generator = function * () {}
let generator = function*  () {}
let generator = function  *() {}

// 错误的示例
let generator = *() => {}
let generator = ()* => {}
let generator = (*) => {}
```

或者，因为是一个函数，也可以作为一个对象的属性来存在：  
```javascript
class MyClass {
  * generator() {}
  *generator2() {}
}

const obj = {
  *generator() {}
  * generator() {}
}
```

### generator的初始化与复用

一个`Generator`函数通过调用两次方法，将会生成两个完全独立的`状态机`  
所以，保存当前的`Generator`对象很重要：

```javascript
function * generator (name = 'unknown') {
  yield `Your name: ${name}`
}

const gen1 = generator()
const gen2 = generator('Niko Bellic')

gen1.next() // { value: Your name: unknown    , done: false}
gen2.next() // { value: Your name: Niko Bellic, done: false}
```

### Method: next()

最常用的`next()`方法，无论何时调用它，都会得到下一次输出的返回对象（在代码执行完后的调用将会始终返回`{value: undefined, done: true}`）。  

`next`总会返回一个对象，包含两个属性值：  
`value`：`yield`关键字后边表达式的值  
`done` ：如果已经没有`yield`关键字了，则会返回`true` .

```javascript
function * generator () {
  yield 5
  return 6
}

const gen = generator()

console.log(gen.next()) // {value: 5, done: false}
console.log(gen.next()) // {value: 6, done: true}
console.log(gen.next()) // {value: undefined, done: true}
console.log(gen.next()) // {value: undefined, done: true} -- 后续再调用也都会是这个结果
```

### 作为迭代器使用

`Generator`函数是一个可迭代的，所以，我们可以直接通过`for of`来使用它。
```javascript
function * generator () {
  yield 1
  yield 2
  return 3
}

for (let item of generator()) {
  item
}

// 1
// 2
```
*`return`不参与迭代*  
*迭代会执行所有的`yield`，也就是说，在迭代后的`Generator`对象将不会再返回任何有效的值*

### Method: return()

我们可以在迭代器对象上直接调用`return()`，来终止后续的代码执行。  
在`return`后的所有`next()`调用都将返回`{value: undefined, done: true}`

```javascript
function * generator () {
  yield 1
  yield 2
  yield 3
}

const gen = generator()

gen.return()     // {value: undefined, done: true}
gen.return('hi') // {value: "hi", done: true}
gen.next()       // {value: undefined, done: true}
```

### Method: throw()

在调用`throw()`后同样会终止所有的`yield`执行，同时会抛出一个异常，需要通过`try-catch`来接收：

```javascript
function * generator () {
  yield 1
  yield 2
  yield 3
}

const gen = generator()

gen.throw('error text') // Error: error text
gen.next()              // {value: undefined, done: true}
```

## Yield的语法

`yield`的语法有点像`return`，但是，`return`是在函数调用结束后返回结果的  
并且在调用`return`之后不会执行其他任何的操作

```javascript
function method (a) {
  let b = 5
  return a + b
  // 下边的两句代码永远不会执行
  b = 6
  return a * b
}

method(6) // 11
method(6) // 11
```

### 而yield的表现则不一样

```javascript
function * yieldMethod(a) {
  let b = 5
  yield a + b
  // 在执行第二次`next`时，下边两行则会执行
  b = 6
  return a * b
}

const gen = yieldMethod(6)
gen.next().value // 11
gen.next().value // 36
```

### yield*

`yield*`用来将一个`Generator`放到另一个`Generator`函数中执行。  
有点像`[...]`的功能：

```javascript
function * gen1 () {
  yield 2
  yield 3
}

function * gen2 () {
  yield 1
  yield * gen1()
  yield 4
}

let gen = gen2()

gen.next().value // 1
gen.next().value // 2
gen.next().value // 3
gen.next().value // 4
```

### yield的返回值

`yield`是可以接收返回值的，返回值可以在后续的代码被使用  
*一个诡异的写法*
```javascript
function * generator (num) {
  return yield yield num
}

let gen = generator(1)

console.log(gen.next())  // {value: 1, done: false}
console.log(gen.next(2)) // {value: 2, done: false}
console.log(gen.next(3)) // {value: 3, done: true }
```

我们在调用第一次`next`时候，代码执行到了`yield num`，此时返回`num`  
然后我们再调用`next(2)`，代码执行的是`yield (yield num)`，而其中返回的值就是我们在`next`中传入的参数了，作为`yield num`的返回值存在。  
以及最后的`next(3)`，执行的是这部分代码`return (yield (yield num))`，第二次`yield`表达式的返回值。  

## 一些实际的使用场景

上边的所有示例都是建立在已知次数的`Generator`函数上的，但如果你需要一个未知次数的`Generator`，仅需要创建一个无限循环就够了。  

### 一个简单的随机数生成

比如我们将实现一个随机数的获取：
```javascript
function * randomGenerator (...randoms) {
  let len = randoms.length
  while (true) {
    yield randoms[Math.floor(Math.random() * len)]
  }
}

const randomeGen = randomGenerator(1, 2, 3, 4)

randomeGen.next().value // 返回一个随机数
```

### 代替一些递归的操作

那个最著名的*斐波那契数*，基本上都会选择使用递归来实现  
但是再结合着`Generator`以后，就可以使用一个无限循环来实现了：

```javascript
function * fibonacci(seed1, seed2) {
  while (true) {
    yield (() => {
      seed2 = seed2 + seed1;
      seed1 = seed2 - seed1;
      return seed2;
    })();
  }
}

const fib = fibonacci(0, 1);
fib.next(); // {value: 1, done: false}
fib.next(); // {value: 2, done: false}
fib.next(); // {value: 3, done: false}
fib.next(); // {value: 5, done: false}
fib.next(); // {value: 8, done: false}
```

## 与async/await的结合

> 再次重申，我个人不认为async/await是Generator的语法糖。。  

如果是写前端的童鞋，基本上都会遇到处理分页加载数据的时候  
如果结合着`Generator`+`async`、`await`，我们可以这样实现：

```javascript
async function * loadDataGenerator (url) {
  let page = 1

  while (true) {
    page = (yield await ajax(url, {
      data: page
    })) || ++page
  }
}

// 使用setTimeout模拟异步请求
function ajax (url, { data: page }) {
  return new Promise((resolve) => {
    setTimeout(_ => {
      console.log(`get page: ${page}`);
      resolve()
    }, 1000)
  })
}

let loadData = loadDataGenerator('get-data-url')

await loadData.next()
await loadData.next()

// force load page 1
await loadData.next(1)
await loadData.next()

// get page: 1
// get page: 2
// get page: 1
// get page: 2
```

这样我们可以在简单的几行代码中实现一个分页控制函数了。  
如果想要从加载特定的页码，直接将`page`传入`next`即可。

## 小记

`Generator`还有更多的使用方式，（实现异步流程控制、按需进行数据读取）
个人认为，`Generator`的优势在于代码的惰性执行，`Generator`所实现的事情，我们不使用它也可以做到，只是使用`Generator`后，能够让代码的可读性变得更好、流程变得更清晰、更专注于逻辑的实现。

> 如果有什么不懂的地方 or 文章中一些的错误，欢迎指出

## 参考资料

1. [Javascript (ES6) Generators — Part I: Understanding Generators](https://medium.com/@hidace/javascript-es6-generators-part-i-understanding-generators-93dea22bf1b)
2. [What are JavaScript Generators and how to use them](https://codeburst.io/what-are-javascript-generators-and-how-to-use-them-c6f2713fd12e)

[文章示例代码](https://github.com/Jiasm/notebook/tree/master/blog-storage/how-to-use-generator)
