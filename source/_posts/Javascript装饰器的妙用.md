---
uuid: dc72eeb0-80f6-11e8-96f3-b9ed9cb7a1c1
title: Javascript装饰器的妙用
date: 2018-07-08 17:58:38
tags:
  - javascript
---

最近新开了一个Node项目，采用TypeScript来开发，在数据库及路由管理方面用了不少的装饰器，发觉这的确是一个好东西。  
装饰器是一个还处于草案中的特性，目前木有直接支持该语法的环境，但是可以通过 babel 之类的进行转换为旧语法来实现效果，所以在TypeScript中，可以放心的使用`@Decorator`。  

<!-- more -->

## 什么是装饰器

装饰器是对类、函数、属性之类的一种装饰，可以针对其添加一些额外的行为。  
通俗的理解可以认为就是在原有代码外层包装了一层处理逻辑。  
个人认为装饰器是一种解决方案，而并非是狭义的`@Decorator`，后者仅仅是一个语法糖罢了。  

装饰器在身边的例子随处可见，一个简单的例子，水龙头上边的起泡器就是一个装饰器，在装上以后就会把空气混入水流中，掺杂很多泡泡在水里。  
但是起泡器安装与否对水龙头本身并没有什么影响，即使拆掉起泡器，也会照样工作，水龙头的作用在于阀门的控制，至于水中掺不掺杂气泡则不是水龙头需要关心的。  

所以，对于装饰器，可以简单地理解为是非侵入式的行为修改。  

## 为什么要用装饰器

可能有些时候，我们会对传入参数的类型判断、对返回值的排序、过滤，对函数添加节流、防抖或其他的功能性代码，基于多个类的继承，各种各样的与函数逻辑本身无关的、重复性的代码。  

### 函数中的作用

可以想像一下，我们有一个工具类，提供了一个获取数据的函数：
```javascript
class Model1 {
  getData() {
    // 此处省略获取数据的逻辑
    return [{
      id: 1,
      name: 'Niko'
    }, {
      id: 2,
      name: 'Bellic'
    }]
  }
}

console.log(new Model1().getData())     // [ { id: 1, name: 'Niko'}, { id: 2, name: 'Bellic' } ]
console.log(Model1.prototype.getData()) // [ { id: 1, name: 'Niko'}, { id: 2, name: 'Bellic' } ]
```

现在我们想要添加一个功能，记录该函数执行的耗时。  
因为这个函数被很多人使用，在调用方添加耗时统计逻辑是不可取的，所以我们要在`Model1`中进行修改：  

```javascript
class Model1 {
  getData() {
+   let start = new Date().valueOf()
+   try {
      // 此处省略获取数据的逻辑
      return [{
        id: 1,
        name: 'Niko'
      }, {
        id: 2,
        name: 'Bellic'
      }]
+   } finally {
+     let end = new Date().valueOf()
+     console.log(`start: ${start} end: ${end} consume: ${end - start}`)
+   }
  }
}

// start: XXX end: XXX consume: XXX
console.log(new Model1().getData())     // [ { id: 1, name: 'Niko'}, { id: 2, name: 'Bellic' } ]
// start: XXX end: XXX consume: XXX
console.log(Model1.prototype.getData()) // [ { id: 1, name: 'Niko'}, { id: 2, name: 'Bellic' } ]
```

这样在调用方法后我们就可以在控制台看到耗时的输出了。  
但是这样直接修改原函数代码有以下几个问题：  
1. 统计耗时的相关代码与函数本身逻辑并无一点关系，影响到了对原函数本身的理解，对函数结构造成了破坏性的修改
2. 如果后期还有更多类似的函数需要添加统计耗时的代码，在每个函数中都添加这样的代码显然是低效的，维护成本太高

所以，为了让统计耗时的逻辑变得更加灵活，我们将创建一个新的工具函数，用来包装需要设置统计耗时的函数。  
通过将`Class`与目标函数的`name`传递到函数中，实现了通用的耗时统计：

```javascript
function wrap(Model, key) {
  // 获取Class对应的原型
  let target = Model.prototype

  // 获取函数对应的描述符
  let descriptor = Object.getOwnPropertyDescriptor(target, key)

  // 生成新的函数，添加耗时统计逻辑
  let log = function (...arg) {
    let start = new Date().valueOf()
    try {
      return descriptor.value.apply(this, arg) // 调用之前的函数
    } finally {
      let end = new Date().valueOf()
      console.log(`start: ${start} end: ${end} consume: ${end - start}`)
    }
  }

  // 将修改后的函数重新定义到原型链上
  Object.defineProperty(target, key, {
    ...descriptor,
    value: log      // 覆盖描述符重的value
  })
}

wrap(Model1, 'getData')
wrap(Model2, 'getData')

// start: XXX end: XXX consume: XXX
console.log(new Model1().getData())     // [ { id: 1, name: 'Niko'}, { id: 2, name: 'Bellic' } ]
// start: XXX end: XXX consume: XXX
console.log(Model2.prototype.getData()) // [ { id: 1, name: 'Niko'}, { id: 2, name: 'Bellic' } ]
```

接下来，我们想控制其中一个`Model`的函数不可被其他人修改覆盖，所以要添加一些新的逻辑：  

```javascript
function wrap(Model, key) {
  // 获取Class对应的原型
  let target = Model.prototype

  // 获取函数对应的描述符
  let descriptor = Object.getOwnPropertyDescriptor(target, key)

  Object.defineProperty(target, key, {
    ...descriptor,
    writable: false      // 设置属性不可被修改
  })
}

wrap(Model1, 'getData')

Model1.prototype.getData = 1 // 无效
```

可以看出，两个`wrap`函数中有不少重复的地方，而修改程序行为的逻辑，实际上依赖的是`Object.defineProperty`中传递的三个参数。  
所以，我们针对`wrap`在进行一次修改，将其变为一个通用类的转换：  

```javascript
function wrap(decorator) {
  return function (Model, key) {
    let target = Model.prototype
    let dscriptor = Object.getOwnPropertyDescriptor(target, key)

    decorator(target, key, descriptor)
  }
}

let log = function (target, key, descriptor) {
  // 将修改后的函数重新定义到原型链上
  Object.defineProperty(target, key, {
    ...descriptor,
    value: function (...arg) {
      let start = new Date().valueOf()
      try {
        return descriptor.value.apply(this, arg) // 调用之前的函数
      } finally {
        let end = new Date().valueOf()
        console.log(`start: ${start} end: ${end} consume: ${end - start}`)
      }
    }
  })
}

let seal = function (target, key, descriptor) {
  Object.defineProperty(target, key, {
    ...descriptor,
    writable: false
  })
}

// 参数的转换处理
log = wrap(log)
seal = warp(seal)

// 添加耗时统计
log(Model1, 'getData')
log(Model2, 'getData')

// 设置属性不可被修改
seal(Model1, 'getData')
```

到了这一步以后，我们就可以称`log`和`seal`为装饰器了，可以很方便的让我们对一些函数添加行为。  
而拆分出来的这些功能可以用于未来可能会有需要的地方，而不用重新开发一遍相同的逻辑。 

### Class 中的作用

就像上边提到了，现阶段在JS中继承多个`Class`是一件头疼的事情，没有直接的语法能够继承多个 Class。
```javascript
class A { say () { return 1 } }
class B { hi () { return 2 } }
class C extends A, B {}        // Error
class C extends A extends B {} // Error

// 这样才是可以的
class C {}
for (let key of Object.getOwnPropertyNames(A.prototype)) {
  if (key === 'constructor') continue
  Object.defineProperty(C.prototype, key, Object.getOwnPropertyDescriptor(A.prototype, key))
}
for (let key of Object.getOwnPropertyNames(B.prototype)) {
  if (key === 'constructor') continue
  Object.defineProperty(C.prototype, key, Object.getOwnPropertyDescriptor(B.prototype, key))
}

let c = new C()
console.log(c.say(), c.hi()) // 1, 2
```

所以，在`React`中就有了一个`mixin`的概念，用来将多个`Class`的功能复制到一个新的`Class`上。  
大致思路就是上边列出来的，但是这个`mixin`是`React`中内置的一个操作，我们可以将其转换为更接近装饰器的实现。  
在不修改原`Class`的情况下，将其他`Class`的属性复制过来：  

```javascript
function mixin(constructor) {
  return function (...args) {
    for (let arg of args) {
      for (let key of Object.getOwnPropertyNames(arg.prototype)) {
        if (key === 'constructor') continue // 跳过构造函数
        Object.defineProperty(constructor.prototype, key, Object.getOwnPropertyDescriptor(arg.prototype, key))
      }
    }
  }
}

mixin(C)(A, B)

let c = new C()
console.log(c.say(), c.hi()) // 1, 2
```

以上，就是装饰器在函数、`Class`上的实现方法（至少目前是的），但是草案中还有一颗特别甜的语法糖，也就是`@Decorator`了。  
能够帮你省去很多繁琐的步骤来用上装饰器。

## @Decorator的使用方法

草案中的装饰器、或者可以说是TS实现的装饰器，将上边的两种进一步地封装，将其拆分成为更细的装饰器应用，目前支持以下几处使用：  

1. Class
2. 函数
3. get set访问器
4. 实例属性、静态函数及属性
5. 函数参数

@Decorator的语法规定比较简单，就是通过`@`符号后边跟一个装饰器函数的引用：  

```javascript
@tag
class A { 
  @method
  hi () {}
}

function tag(constructor) {
  console.log(constructor === A) // true
}

function method(target) {
  console.log(target.constructor === A, target === A.prototype) // true, true
}
```

函数`tag`与`method`会在`class A`定义的时候执行。  

### @Decorator 在 Class 中的使用

该装饰器会在class定义前调用，如果函数有返回值，则会认为是一个新的构造函数来替代之前的构造函数。  

函数接收一个参数：
1. constructor 之前的构造函数

我们可以针对原有的构造函数进行一些改造:

#### 新增一些属性

如果想要新增一些属性之类的，有两种方案可以选择：
1. 创建一个新的`class`继承自原有`class`，并添加属性
2. 针对当前`class`进行修改

后者的适用范围更窄一些，更接近mixin的处理方式。  

```javascript
@name
class Person {
  sayHi() {
    console.log(`My name is: ${this.name}`)
  }
}

// 创建一个继承自Person的匿名类
// 直接返回并替换原有的构造函数
function name(constructor) {
  return class extends constructor {
    name = 'Niko'
  }
}

new Person().sayHi()
```

#### 修改原有属性的描述符

```javascript
@seal
class Person {
  sayHi() {}
}

function seal(constructor) {
  let descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, 'sayHi')
  Object.defineProperty(constructor.prototype, 'sayHi', {
    ...descriptor,
    writable: false
  })
}

Person.prototype.sayHi = 1 // 无效
```

#### 使用闭包来增强装饰器的功能

> 在TS文档中被称为装饰器工厂  

因为`@`符号后边跟的是一个函数的引用，所以对于mixin的实现，我们可以很轻易的使用闭包来实现：

```javascript
class A { say() { return 1 } }
class B { hi() { return 2 } }

@mixin(A, B)
class C { }

function mixin(...args) {
  // 调用函数返回装饰器实际应用的函数
  return function(constructor) {
    for (let arg of args) {
      for (let key of Object.getOwnPropertyNames(arg.prototype)) {
        if (key === 'constructor') continue // 跳过构造函数
        Object.defineProperty(constructor.prototype, key, Object.getOwnPropertyDescriptor(arg.prototype, key))
      }
    }
  }
}

let c = new C()
console.log(c.say(), c.hi()) // 1, 2
```

#### 多个装饰器的应用

装饰器是可以同时应用多个的（不然也就失去了最初的意义）。  
用法如下：  
```javascript
@decorator1
@decorator2
class { }
```

执行的顺序为`decorator2` -> `decorator1`，离`class`定义最近的先执行。  
可以想像成函数嵌套的形式：  
```javascript
decorator1(decorator2(class {}))
```

### @Decorator 在 Class 成员中的使用

类成员上的 @Decorator 应该是应用最为广泛的一处了，函数，属性，`get`、`set`访问器，这几处都可以认为是类成员。  
在TS文档中被分为了`Method Decorator`、`Accessor Decorator`和`Property Decorator`，实际上如出一辙。  

关于这类装饰器，会接收如下三个参数：
1. 如果装饰器挂载于静态成员上，则会返回构造函数，如果挂载于实例成员上则会返回类的原型
2. 装饰器挂载的成员名称
3. 成员的描述符，也就是`Object.getOwnPropertyDescriptor`的返回值

> `Property Decorator`不会返回第三个参数，但是可以自己手动获取  
> 前提是静态成员，而非实例成员，因为装饰器都是运行在类创建时，而实例成员是在实例化一个类的时候才会执行的，所以没有办法获取对应的descriptor

#### 静态成员与实例成员在返回值上的区别

可以稍微明确一下，静态成员与实例成员的区别：

```javascript
class Model {
  // 实例成员
  method1 () {}
  method2 = () => {}

  // 静态成员
  static method3 () {}
  static method4 = () => {}
}
```

`method1`和`method2`是实例成员，`method1`存在于`prototype`之上，而`method2`只在实例化对象以后才有。  
作为静态成员的`method3`和`method4`，两者的区别在于是否可枚举描述符的设置，所以可以简单地认为，上述代码转换为ES5版本后是这样子的：

```javascript
function Model () {
  // 成员仅在实例化时赋值
  this.method2 = function () {}
}

// 成员被定义在原型链上
Object.defineProperty(Model.prototype, 'method1', {
  value: function () {}, 
  writable: true, 
  enumerable: false,  // 设置不可被枚举
  configurable: true
})

// 成员被定义在构造函数上，且是默认的可被枚举
Model.method4 = function () {}

// 成员被定义在构造函数上
Object.defineProperty(Model, 'method3', {
  value: function () {}, 
  writable: true, 
  enumerable: false,  // 设置不可被枚举
  configurable: true
})
```

可以看出，只有`method2`是在实例化时才赋值的，一个不存在的属性是不会有`descriptor`的，所以这就是为什么TS在针对`Property Decorator`不传递第三个参数的原因，至于为什么静态成员也没有传递`descriptor`，目前没有找到合理的解释，但是如果明确的要使用，是可以手动获取的。  

就像上述的示例，我们针对四个成员都添加了装饰器以后，`method1`和`method2`第一个参数就是`Model.prototype`，而`method3`和`method4`的第一个参数就是`Model`。  
```javascript
class Model {
  // 实例成员
  @instance
  method1 () {}
  @instance
  method2 = () => {}

  // 静态成员
  @static
  static method3 () {}
  @static
  static method4 = () => {}
}

function instance(target) {
  console.log(target.constructor === Model)
}

function static(target) {
  console.log(target === Model)
}
```

### 函数，访问器，和属性装饰器三者之间的区别

#### 函数

首先是函数，函数装饰器的返回值会默认作为属性的`value`描述符存在，如果返回值为`undefined`则会忽略，使用之前的`descriptor`引用作为函数的描述符。  
所以针对我们最开始的统计耗时的逻辑可以这么来做：  

```javascript
class Model {
  @log1
  getData1() {}
  @log2
  getData2() {}
}

// 方案一，返回新的value描述符
function log1(tag, name, descriptor) {
  return {
    ...descriptor,
    value(...args) {
      let start = new Date().valueOf()
      try {
        return descriptor.value.apply(this, args)
      } finally {
        let end = new Date().valueOf()
        console.log(`start: ${start} end: ${end} consume: ${end - start}`)
      }
    }
  }
}

// 方案二、修改现有描述符
function log2(tag, name, descriptor) {
  let func = descriptor.value // 先获取之前的函数

  // 修改对应的value
  descriptor.value = function (...args) {
    let start = new Date().valueOf()
    try {
      return func.apply(this, args)
    } finally {
      let end = new Date().valueOf()
      console.log(`start: ${start} end: ${end} consume: ${end - start}`)
    }
  }
}
```

#### 访问器

访问器就是添加有`get`、`set`前缀的函数，用于控制属性的赋值及取值操作，在使用上与函数没有什么区别，甚至在返回值的处理上也没有什么区别。  
只不过我们需要按照规定设置对应的`get`或者`set`描述符罢了：  
```javascript
class Modal {
  _name = 'Niko'

  @prefix
  get name() { return this._name }
}

function prefix(target, name, descriptor) {
  return {
    ...descriptor,
    get () {
      return `wrap_${this._name}`
    }
  }
}

console.log(new Modal().name) // wrap_Niko
```

#### 属性

对于属性的装饰器，是没有返回`descriptor`的，并且装饰器函数的返回值也会被忽略掉，如果我们想要修改某一个静态属性，则需要自己获取`descriptor`：  

```javascript
class Modal {
  @prefix
  static name1 = 'Niko'
}

function prefix(target, name) {
  let descriptor = Object.getOwnPropertyDescriptor(target, name)

  Object.defineProperty(target, name, {
    ...descriptor,
    value: `wrap_${descriptor.value}`
  })
}

console.log(Modal.name1) // wrap_Niko
```

对于一个实例的属性，则没有直接修改的方案，不过我们可以结合着一些其他装饰器来曲线救国。  

比如，我们有一个类，会传入姓名和年龄作为初始化的参数，然后我们要针对这两个参数设置对应的格式校验：
```javascript
const validateConf = {} // 存储校验信息

@validator
class Person {
  @validate('string')
  name
  @validate('number')
  age

  constructor(name, age) {
    this.name = name
    this.age = age
  }
}

function validator(constructor) {
  return class extends constructor {
    constructor(...args) {
      super(...args)

      // 遍历所有的校验信息进行验证
      for (let [key, type] of Object.entries(validateConf)) {
        if (typeof this[key] !== type) throw new Error(`${key} must be ${type}`)
      }
    }
  }
}

function validate(type) {
  return function (target, name, descriptor) {
    // 向全局对象中传入要校验的属性名及类型
    validateConf[name] = type
  }
}

new Person('Niko', '18')  // throw new error: [age must be number]
```
首先，在类上边添加装饰器`@validator`，然后在需要校验的两个参数上添加`@validate`装饰器，两个装饰器用来向一个全局对象传入信息，来记录哪些属性是需要进行校验的。  
然后在`validator`中继承原有的类对象，并在实例化之后遍历刚才设置的所有校验信息进行验证，如果发现有类型错误的，直接抛出异常。  
这个类型验证的操作对于原`Class`来说几乎是无感知的。

### 函数参数装饰器

最后，还有一个用于函数参数的装饰器，这个装饰器也是像实例属性一样的，没有办法单独使用，毕竟函数是在运行时调用的，而无论是何种装饰器，都是在声明类时（可以认为是伪编译期）调用的。  

函数参数装饰器会接收三个参数：
1. 类似上述的操作，类的原型或者类的构造函数
2. 参数所处的函数名称
3. 参数在函数中形参中的位置（函数签名中的第几个参数）

一个简单的示例，我们可以结合着函数装饰器来完成对函数参数的类型转换：
```javascript
const parseConf = {}
class Modal {
  @parseFunc
  addOne(@parse('number') num) {
    return num + 1
  }
}

// 在函数调用前执行格式化操作
function parseFunc (target, name, descriptor) {
  return {
    ...descriptor,
    value (...arg) {
      // 获取格式化配置
      for (let [index, type] of parseConf) {
        switch (type) {
          case 'number':  arg[index] = Number(arg[index])             break
          case 'string':  arg[index] = String(arg[index])             break
          case 'boolean': arg[index] = String(arg[index]) === 'true'  break
        }

        return descriptor.value.apply(this, arg)
      }
    }
  }
}

// 向全局对象中添加对应的格式化信息
function parse(type) {
  return function (target, name, index) {
    parseConf[index] = type
  }
}

console.log(new Modal().addOne('10')) // 11
```

## 使用装饰器实现一个有趣的Koa封装

比如在写Node接口时，可能是用的`koa`或者`express`，一般来说可能要处理很多的请求参数，有来自`headers`的，有来自`body`的，甚至有来自`query`、`cookie`的。  
所以很有可能在`router`的开头数行都是这样的操作：  
```javascript
router.get('/', async (ctx, next) => {
  let id = ctx.query.id
  let uid = ctx.cookies.get('uid')
  let device = ctx.header['device']
})
```

以及如果我们有大量的接口，可能就会有大量的`router.get`、`router.post`。  
以及如果要针对模块进行分类，可能还会有大量的`new Router`的操作。  

这些代码都是与业务逻辑本身无关的，所以我们应该尽可能的简化这些代码的占比，而使用装饰器就能够帮助我们达到这个目的。  

### 装饰器的准备

```javascript
// 首先，我们要创建几个用来存储信息的全局List
export const routerList      = []
export const controllerList  = []
export const parseList       = []
export const paramList       = []

// 虽说我们要有一个能够创建Router实例的装饰器
// 但是并不会直接去创建，而是在装饰器执行的时候进行一次注册
export function Router(basename = '') {
  return (constrcutor) => {
    routerList.push({
      constrcutor,
      basename
    })
  }
}

// 然后我们在创建对应的Get Post请求监听的装饰器
// 同样的，我们并不打算去修改他的任何属性，只是为了获取函数的引用
export function Method(type) {
  return (path) => (target, name, descriptor) => {
    controllerList.push({
      target,
      type,
      path,
      method: name,
      controller: descriptor.value
    })
  }
}

// 接下来我们还需要用来格式化参数的装饰器
export function Parse(type) {
  return (target, name, index) => {
    parseList.push({
      target,
      type,
      method: name,
      index
    })
  }
}

// 以及最后我们要处理的各种参数的获取
export function Param(position) {
  return (key) => (target, name, index) => {
    paramList.push({
      target,
      key,
      position,
      method: name,
      index
    })
  }
}

export const Body   = Param('body')
export const Header = Param('header')
export const Cookie = Param('cookie')
export const Query  = Param('query')
export const Get    = Method('get')
export const Post   = Method('post')
```

### Koa服务的处理

上边是创建了所有需要用到的装饰器，但是也仅仅是把我们所需要的各种信息存了起来，而怎么利用这些装饰器则是下一步需要做的事情了：
```javascript
const routers = []

// 遍历所有添加了装饰器的Class，并创建对应的Router对象
routerList.forEach(item => {
  let { basename, constrcutor } = item
  let router = new Router({
    prefix: basename
  })

  controllerList
    .filter(i => i.target === constrcutor.prototype)
    .forEach(controller => {
      router[controller.type](controller.path, async (ctx, next) => {
        let args = []
        // 获取当前函数对应的参数获取
        paramList
          .filter( param => param.target === constrcutor.prototype && param.method === controller.method )
          .map(param => {
            let { index, key } = param
            switch (param.position) {
              case 'body':    args[index] = ctx.request.body[key] break
              case 'header':  args[index] = ctx.headers[key]      break
              case 'cookie':  args[index] = ctx.cookies.get(key)  break
              case 'query':   args[index] = ctx.query[key]        break
            }
          })

        // 获取当前函数对应的参数格式化
        parseList
          .filter( parse => parse.target === constrcutor.prototype && parse.method === controller.method )
          .map(parse => {
            let { index } = parse
            switch (parse.type) {
              case 'number':  args[index] = Number(args[index])             break
              case 'string':  args[index] = String(args[index])             break
              case 'boolean': args[index] = String(args[index]) === 'true'  break
            }
          })

        // 调用实际的函数，处理业务逻辑
        let results = controller.controller(...args)

        ctx.body = results
      })
    })

  routers.push(router.routes())
})

const app = new Koa()

app.use(bodyParse())
app.use(compose(routers))

app.listen(12306, () => console.log('server run as http://127.0.0.1:12306'))
```

上边的代码就已经搭建出来了一个Koa的封装，以及包含了对各种装饰器的处理，接下来就是这些装饰器的实际应用了：

```javascript
import { Router, Get, Query, Parse } from "../decorators"

@Router('')
export default class {
  @Get('/')
  index (@Parse('number') @Query('id') id: number) {
    return {
      code: 200,
      id,
      type: typeof id
    }
  }

  @Post('/detail')
  detail (
    @Parse('number') @Query('id') id: number, 
    @Parse('number') @Body('age') age: number
  ) {
    return {
      code: 200,
      age: age + 1
    }
  }
}
```

很轻易的就实现了一个`router`的创建，路径、method的处理，包括各种参数的获取，类型转换。  
将各种非业务逻辑相关的代码统统交由装饰器来做，而函数本身只负责处理自身逻辑即可。  
这里有完整的代码：[GitHub](https://github.com/Jiasm/notebook/tree/master/labs/demo/typescript/koa-decorators)。安装依赖后`npm start`即可看到效果。  

这样开发带来的好处就是，让代码可读性变得更高，在函数中更专注的做自己应该做的事情。  
而且装饰器本身如果名字起的足够好的好，也是在一定程度上可以当作文档注释来看待了（Java中有个类似的玩意儿叫做注解）。  

## 总结

合理利用装饰器可以极大的提高开发效率，对一些非逻辑相关的代码进行封装提炼能够帮助我们快速完成重复性的工作，节省时间。  
但是糖再好吃，也不要吃太多，容易坏牙齿的，同样的滥用装饰器也会使代码本身逻辑变得扑朔迷离，如果确定一段代码不会在其他地方用到，或者一个函数的核心逻辑就是这些代码，那么就没有必要将它取出来作为一个装饰器来存在。  

### 参考资料

1. [typescript | decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
2. [koa示例的原版，简化代码便于举例](https://github.com/typestack/routing-controllers)

