---
uuid: 86247600-5d0b-11e8-8b9f-356531165eba
title: 拿Proxy可以做哪些有意思的事儿
date: 2018-05-21 23:27:51
tags:
  - javascript
---

> Proxy是ES6中提供的新的API，可以用来定义对象各种基本操作的自定义行为（我觉得可以理解为一个针对各种属性的钩子）  
> 拿它可以做很多有意思的事情，在我们需要对一些对象的行为进行控制时将变得非常有效。  

<!-- more -->

首先是`Proxy`的语法  
创建一个`Proxy`的实例需要传入两个`Object`  
1. `target`  要被代理的对象
2. `handlers`对该代理对象的各种操作行为处理

```javascript
let proxy = new Proxy(target, handlers)

let target = {}
let proxy = new Proxy(target, {}) // do nothing

proxy.a = 123

console.log(target.a) // 123
```

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
getOwnPropertyDescriptor|获取一个自有属性 *（不会去原型链查找）* 的属性描述
