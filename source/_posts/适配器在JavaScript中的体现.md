---
uuid: 4492f470-bb41-11e8-9792-c7582ddcf0d2
title: 适配器在JavaScript中的体现
date: 2018-09-19 13:49:23
tags:
  - javascript
  - node.js
---

适配器设计模式在JavaScript中非常有用，在处理跨浏览器兼容问题、整合多个第三方SDK的调用，都可以看到它的身影。  
其实在日常开发中，很多时候会不经意间写出符合某种设计模式的代码，毕竟设计模式就是老前辈们总结提炼出来的一些能够帮助提升开发效率的一些模版，源于日常的开发中。  
而`适配器`其实在`JavaScript`中应该是比较常见的一种了。  

<!-- more -->

在维基百科中，关于适配器模式的定义为：  
> 在软件工程中，适配器模式是一种软件设计模式，允许从另一个接口使用现有类的接口。它通常用于使现有的类与其他类一起工作，而无需修改其源代码。  

## 生活中的例子

在生活中最常见的就是电源插头的适配器了，世界各国的插座标准各不相同，如果需要根据各国的标准购买对应的电源插头那未免太过于浪费钱财，如果说自己带着插座，把人家墙敲碎，重新接线，也肯定是不现实的。  
所以就会有插头的适配器，用来将某种插头转换成另一种插头，在插座和你的电源之间做中转的这个东西，就是适配器。  

![](/images/pattern-adapter/sockets.jpg)  

## 在代码中的体现

而转向到编程中，我个人是这样理解的：

> 将那些你不愿意看见的脏代码藏起来，你就可以说这是一个适配器  

### 接入多个第三方SDK

举个日常开发中的例子，我们在做一个微信公众号开发，里边用到了微信的支付模块，经过长时间的联调，终于跑通了整个流程，正当你准备开心的打包上线代码的时候，得到了一个新需求：  
__我们需要接入支付宝公众号的SDK，也要有支付的流程__  

为了复用代码，我们可能会在脚本中写下这样的逻辑：
```javascript
if (platform === 'wechat') {
  wx.pay(config)
} else if (platform === 'alipay') {
  alipay.pay(config)
}

// 做一些后续的逻辑处理
```

但是一般来说，各厂的SDK所提供的接口调用方式都会多多少少有些区别，~~虽说有些时候文档可能用的是同一份，致敬友商。~~  

所以针对上述的代码可能是这样的：
```javascript
// 并不是真实的参数配置，仅仅举例使用
const config = {
  price: 10,
  goodsId: 1
}

// 还有可能返回值的处理方式也不相同
if (platform === 'wechat') {
  config.appId = 'XXX'
  config.secretKey = 'XXX'
  wx.pay(config).then((err, data) => {
    if (err) // error

    // success
  })
} else if (platform === 'alipay') {
  config.token = 'XXX'
  alipay.pay(config, data => {
    // success
  }, err => {
    // error
  })
}
```

就目前来说，代码接口还算是清晰，只要我们写好注释，这也不是一个太糟糕的代码。  
但是生活总是充满了意外，我们又接到了需求需要添加QQ的SDK、美团的SDK、小米的SDK，或者某些银行的SDK。  

此时你的代码可能是这样的：
```javascript
switch (platform) {
  case 'wechat':
    // 微信的处理逻辑
  break
  case 'QQ':
    // QQ的处理逻辑
  break
  case 'alipay':
    // 支付宝的处理逻辑
  break
  case 'meituan':
    // 美团的处理逻辑
  break
  case 'xiaomi':
    // 小米的处理逻辑
  break
}
```

这已经不是一些注释能够弥补的问题了，这样的代码会变得越来越难维护，各种SDK千奇百怪的调用方式，如果其他人也要做类似的需求，还需要重新写一遍这样的代码，那肯定是很浪费资源的一件事儿。  

所以为了保证我们业务逻辑的清晰，同时也为了避免后人重复的踩这个坑，我们会将它进行拆分出来作为一个公共的函数来存在：  
找到其中某一个SDK的调用方式或者一个我们约定好的规则作为基准。  
我们来告诉调用方，你要怎么怎么做，你能怎样获取返回数据，然后我们在函数内部进行这些各种肮脏的判断：
```javascript
function pay ({
  price,
  goodsId
}) {
  return new Promise((resolve, reject) => {
    const config = {}

    switch (platform) {
      case 'wechat':
        // 微信的处理逻辑
        config.price = price
        config.goodsId = goodsId
        config.appId = 'XXX'
        config.secretKey = 'XXX'
        wx.pay(config).then((err, data) => {
          if (err) return reject(err)

          resolve(data)
        })
      break
      case 'QQ':
        // QQ的处理逻辑
        config.price = price * 100
        config.gid = goodsId
        config.appId = 'XXX'
        config.secretKey = 'XXX'
        config.success = resolve
        config.error = reject
        qq.pay(config)
      break
      case 'alipay':
        // 支付宝的处理逻辑
        config.payment = price
        config.id = goodsId
        config.token = 'XXX'
        alipay.pay(config, resolve, reject)
      break
    }
  })
}
```

这样无论我们在什么环境下，只要我们的适配器支持，就可以按照我们约定好的通用规则进行调用，而具体执行的是什么SDK，则是适配器需要关心的事情：
```javascript
// run anywhere
await pay({
  price: 10,
  goodsId: 1
})
```

对于SDK提供方，仅仅需要知道自己所需要的一些参数，然后按照自己的方式进行数据返回。  
对于SDK调用房，仅仅需要我们约定好的通用的参数，以及按照约定的方式进行监听回调处理。  

整合多个第三方SDK的任务就交由适配器来做，然后我们将适配器的代码压缩，混淆，放在一个看不见的角落里去，这样的代码逻辑就会变得很清晰了 :)。  

适配器大致就是这样的作用，有一点一定要明确，适配器不是银弹，__那些繁琐的代码始终是存在的，只不过你在写业务的时候看不到它罢了__，眼不见心不烦。  

### 一些其他的例子

个人觉得，`jQuery`中就有很多适配器的例子，包括最基础的`$('selector').on`，这个不就是一个很明显的适配器模式么？  

一步步的进行降级，并且抹平了一些浏览器之间的差异，让我们可以通过简单的`on`来进行在主流浏览器中进行事件监听：
```javascript
// 一个简单的伪代码示例
function on (target, event, callback) {
  if (target.addEventListener) {
    // 标准的监听事件方式
    target.addEventListener(event, callback)
  } else if (target.attachEvent) {
    // IE低版本的监听方式
    target.attachEvent(event, callback)
  } else {
    // 一些低版本的浏览器监听事件方式
    target[`on${event}`] = callback
  }
}
```

或者在Node中的这样的例子更是常见，因为早年是没有`Promise`的，所以大多数的异步由`callback`来完成，且有一个约定好的规则，`Error-first callback`：  
```javascript
const fs = require('fs')

fs.readFile('test.txt', (err, data) => {
  if (err) // 处理异常

  // 处理正确结果
})
```
而我们的新功能都采用了`async/await`的方式来进行，当我们需要复用一些老项目中的功能时，直接去修改老项目的代码肯定是不可行的。  
这样的兼容处理需要调用方来做，所以为了让逻辑代码看起来不是太混乱，我们可能会将这样的回调转换为`Promise`的版本方便我们进行调用：  
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

await readFile('test.txt')
```  

因为前边也提到了，这种`Error-first callback`是一个约定好的形式，所以我们可以很轻松的实现一个通用的适配器：
```javascript
function promisify(func) {
  return (...args) => new Promise((resolve, reject) => {
    func(...args, (err, data) => {
      if (err) reject(err)

      resolve(data)
    })
  })
}
```

然后在使用前进行对应的转换就可以用我们预期的方式来执行代码：
```javascript
const fs = require('fs')

const readFile = promisify(fs.readFile)

await readFile('test.txt')
```

> 在Node8中，官方已经实现了类似这样的工具函数：[util.promisify](https://nodejs.org/dist/latest-v8.x/docs/api/util.html#util_util_promisify_original)  

## 小结

个人观点：所有的设计模式都不是凭空想象出来的，肯定是在开发的过程中，总结提炼出的一些高效的方法，这也就意味着，可能你并不需要在刚开始的时候就去生啃这些各种命名高大上的设计模式。  
因为书中所说的场景可能并不全面，也可能针对某些语言，会存在更好的解决办法，所以生搬硬套可能并不会写出有灵魂的代码 :)  

> 纸上得来终觉浅，绝知此事要躬行。 ———— 《冬夜读书示子聿》，陆游
