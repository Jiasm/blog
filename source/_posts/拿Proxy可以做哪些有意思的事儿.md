---
uuid: 86247600-5d0b-11e8-8b9f-356531165eba
title: 拿Proxy可以做哪些有意思的事儿
date: 2018-05-21 23:27:51
tags:
  - javascript
---

>

<!-- more -->

## Proxy是什么

首先，我们要清楚，`Proxy`是什么意思，这个单词翻译过来，就是 **代理**。  
可以理解为，有一个很火的明星，开通了一个微博账号，这个账号非常活跃，但可能并不是真的由本人在维护的。  
而是在背后有一个其他人 or 团队来运营，我们就可以称他们为代理人，因为他们发表的微博就代表了明星本人的意思。  
*P.S. 强行举例子，因为本人不追星，只是猜测可能会有这样的运营团队*

这个代入到`JavaScript`当中来，就可以理解为对`对象`或者`函数`的操作。

## JavaScript中的Proxy

Proxy是ES6中提供的新的API，可以用来定义对象各种基本操作的自定义行为  
*（在文档中被称为`traps`，我觉得可以理解为一个针对各种属性`get`、`set`的钩子）*  
拿它可以做很多有意思的事情，在我们需要对一些对象的行为进行控制时将变得非常有效。  

## Proxy的语法

创建一个`Proxy`的实例需要传入两个参数  
1. `target`  要被代理的对象，可以是一个`object`或者`function`  
2. `handlers`对该代理对象的各种操作行为处理  

```javascript
let target = {}
let handlers = {} // do nothing
let proxy = new Proxy(target, handlers)

proxy.a = 123

console.log(target.a) // 123
```
在第二个参数为空对象的情况下，基本可以理解为是对第一个参数做的一次浅拷贝  
*（Proxy必须是浅拷贝，如果是深拷贝则会失去了代理的意义）*  

## Traps(各种行为的代理)

就像上边的示例代码一样，如果没有定义对应的`trap`，则不会起任何作用，相当于直接操作了`target`。  
当我们写了某个`trap`以后，在做对应的动作时，就会触发我们的回调函数，由我们来控制被代理对象的行为。  

最常用的两个`trap`应该就是`get`和`set`了。  
早年`JavaScript`有着在定义对象时针对某个属性进行设置`getter`、`setter`：  
```javascript
let obj = {
  _age: 18,
  get age ()  {
    return `I'm ${this._age} years old`
  },
  set age (val) {
    this._age = Number(val)
  }
}

console.log(obj.age) // I'm 18 years old
obj.age = 19
console.log(obj.age) // I'm 19 years old
```
就像这段代码描述的一样，我们设置了一个属性`_age`，然后又设置了一个`get age`和`set age`。  
然后我们可以直接调用`obj.age`来获取一个返回值，也可以对其进行赋值。  
这么做有几个缺点：
1. 针对每一个要代理的属性都要编写对应的`getter`、`setter`。  
2. 必须还要存在一个存储真实值的`key`*（如果我们直接在`getter`里边调用`this.age`则会出现堆栈溢出的情况，因为无论何时调用`this.age`进行取值都会触发`getter`）*。  

`Proxy`很好的解决了这两个问题：
```javascript
let target = { age: 18, name: 'Niko Bellic' }
let handlers = {
  get (target, property) {
    return `${property}: ${target[property]}`
  },
  set (target, property, value) {
    target[property] = value
  }
}
let proxy = new Proxy(target, handlers)

proxy.age = 19
console.log(target.age, proxy.age)   // 19,          age : 19
console.log(target.name, proxy.name) // Niko Bellic, name: Niko Bellic
```
我们通过创建`get`、`set`两个`trap`来统一管理所有的操作，可以看到，在修改`proxy`的同时，`target`的内容也被修改，而且我们对`proxy`的行为进行了一些特殊的处理。  
而且我们无需额外的用一个`key`来存储真实的值，因为我们在`trap`内部操作的是`target`对象，而不是`proxy`对象。

这里列出了`handlers`所有可以拦截的行为 *(被称为traps)*：  

traps|description
:-:|:-:
get|获取某个`key`值
set|设置某个`key`值
deleteProperty|删除一个`property`
apply|函数调用，仅在代理对象为`function`时有效
construct|函数通过实例化调用，仅在代理对象为`function`时有效
has|使用`in`操作符判断某个`key`是否存在
ownKeys|获取目标对象所有的`key`
defineProperty|定义一个新的`property`
isExtensible|判断对象是否可扩展，`Object.isExtensible`的代理
getPrototypeOf|获取原型对象
setPrototypeOf|设置原型对象
preventExtensions|在设置对象为不可扩展
getOwnPropertyDescriptor|获取一个自有属性 *（不会去原型链查找）* 的属性描述

## 使用Proxy来解决调用时undefined的问题

在一些层级比较深的对象属性获取中，如何处理`undefined`一直是一个痛苦的过程，如果我们用`Proxy`可以很好的兼容这种情况。
```javascript
(() => {
  let target = {}
  let handlers = {
    get: (target, property) => {
      target[property] = (property in target) ? target[property] : {}
      if (typeof target[property] === 'object') {
        return new Proxy(target[property], handlers)
      }
      return target[property]
    }
  }
  let proxy = new Proxy(target, handlers)
  console.log('z' in proxy.x.y) // false (其实这一步已经针对`target`创建了一个x.y的属性)
  proxy.x.y.z = 'hello'
  console.log('z' in proxy.x.y) // true
  console.log(target.x.y.z)     // hello
})()
```
我们代理了`get`，并在里边进行逻辑处理，如果我们要进行`get`的值来自一个不存在的`key`，则我们会在`target`中创建对应个这个`key`，然后返回一个针对这个`key`的代理对象。  
这样就能够保证我们的取值操作一定不会抛出`can not get xxx from undefined`  
但是这会有一个小缺点，就是如果你确实要判断这个`key`是否存在只能够通过`in`操作符来判断，而不能够直接通过`get`来判断。  


## 为什么要使用Proxy

## 怎么使用Proxy

## 如何做一些有意思的事情

<!--
## Proxy都能做什么

这里列出了`handlers`所有可以拦截的行为 *(被称为traps)*：  

traps|description
:-:|:-:
get|获取某个`key`值
set|设置某个`key`值
deleteProperty|删除一个`property`
apply|函数调用，仅在代理对象为`function`时有效
construct|函数通过实例化调用，仅在代理对象为`function`时有效
has|使用`in`操作符判断某个`key`是否存在
ownKeys|获取目标对象所有的`key`
defineProperty|定义一个新的`property`
isExtensible|判断对象是否可扩展，`Object.isExtensible`的代理
getPrototypeOf|获取原型对象
setPrototypeOf|设置原型对象
preventExtensions|在设置对象为不可扩展
getOwnPropertyDescriptor|获取一个自有属性 *（不会去原型链查找）* 的属性描述 -->
