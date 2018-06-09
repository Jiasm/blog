---
uuid: 30d78680-6baf-11e8-98d8-7f0203e7f955
title: 原生ES-Module在浏览器中的尝试
date: 2018-06-09 19:34:41
tags:
---

> 其实浏览器原生模块相关的支持也已经出了一两年了（我第一次知道这个事情实在2016年下半年的时候）  
> 可以抛开`webpack`直接使用`import`之类的语法  
> 但因为算是一个比较新的东西，所以现在基本只能自己闹着玩 :p  
> 但这并不能成为不去了解它的借口，还是要体验一下的。  

<!-- more -->

首先是各大浏览器从何时开始支持`module`的：  

- Safari 10.1
- Chrome 61
- Firefox 54 (有可能需要你在`about:config`页面设置启用`dom.moduleScripts.enabled`)
- Edge 16

> 数据来自[https://jakearchibald.com/2017/es-modules-in-browsers/](https://jakearchibald.com/2017/es-modules-in-browsers/)

## 使用方式

首先在使用上，唯一的区别就是需要在`script`标签上添加一个`type="module"`的属性来表示这个文件是作为`module`的方式来运行的。  
```html
<script type="module">
  import message from './message.js'

  console.log(message) // hello world
</script>
```
然后在对应的`module`文件中就是经常会在`webpack`中用到的那样。  
语法上并没有什么区别（*本来`webpack`也就是为了让你提前用上新的语法:)* ）

*message.js*  
```js
export default 'hello world'
```

### 优雅降级

这里有一个类似于`noscript`标签的存在。  
可以在`script`标签上添加`nomodule`属性来实现一个回退方案。  
```html
<script type="module">
  import module from './module.js'
</script>
<script nomodule>
  alert('your browsers can not supports es modules! please upgrade it.')
</script>
```
> `nomodule`的处理方案是这样的：
> 支持`type="module"`的浏览器会忽略包含`nomodule`属性的`script`脚本执行。  
> 而不支持`type="module"`的浏览器则会忽略`type="module"`脚本的执行。  
> 这是因为浏览器默认只解析`type="text/javascript"`的脚本，而如果不填写`type`属性则默认为`text/javascript`。  
> 也就是说在浏览器不支持`module`的情况下，`nomodule`对应的脚本文件就会被执行。  

## 一些要注意的细节

但毕竟是浏览器原生提供的，在使用方法上与`webpack`的版本肯定还是会有一些区别的。  
*(至少一个是运行时解析的、一个是本地编译)*  

### 有效的module路径定义

因为是在浏览器端的实现，不会像在`node`中，有全局`module`一说（全局对象都在`window`里了）。  
所以说，`from 'XXX'`这个路径的定义会与之前你所熟悉的稍微有些出入。  

```javascript
// 被支持的几种路径写法

import module from 'http://XXX/module.js'
import module from '/XXX/module.js'
import module from './XXX/module.js'
import module from '../XXX/module.js'

// 不被支持的写法
import module from 'XXX'
import module from 'XXX/module.js'
```

在`webpack`打包的文件中，引用全局包是通过`import module from 'XXX'`来实现的。  
这个实际是一个简写，`webpack`会根据这个路径去`node_modules`中找到对应的`module`并引入进来。  
但是原生支持的`module`是不存在`node_modules`一说的。  
所以，在使用原生`module`的时候一定要切记，`from`后边的路径一定要是一个有效的`URL`，以及一定不能省略文件后缀（*是的，即使是远端文件也是可以使用的，而不像`webpack`需要将本地文件打包到一起*）。  

### module的文件默认为defer

这是`script`的另一个属性，用来将文件标识为不会阻塞页面渲染的文件，并且会在页面加载完成后按照文档的顺序进行执行。  

```html
<script type="module" src="./defer/module.js"></script>
<script src="./defer/simple.js"></script>
<script defer src="./defer/defer.js"></script>
```

为了测试上边的观点，在页面中引入了这样三个`JS`文件，三个文件都会输出一个字符串，在`Console`面板上看到的顺序是这样的：

![](https://os4ty6tab.qnssl.com/test/atom-editor/918j.png)  

#### 行内script也会默认添加defer特性

因为在普通的脚本中，`defer`关键字是只指针对脚本文件的，如果是`inline-script`，添加属性是不生效的。  
但是在`type="module"`的情况下，不管是文件还是行内脚本，都会具有`defer`的特性。  

### 可以对module类型的脚本添加async属性

`async`可以作用于所有的`module`类型的脚本，无论是行内还是文件形式的。  
但是添加了`async`关键字以后并不意味着浏览器在解析到这个脚本文件时就会执行，而是会等到这段脚本所依赖的所有`module`加载完毕后再执行。  
*import的约定，必须在一段代码内的起始位置进行声明，且不能够在函数内部进行*  

也就是说下边的`log`输出顺序完全取决于`module.js`加载的时长。  
```html
<script async type="module" >
  import * from './module.js'
  console.log('module')
</script>
<script async src="./defer/async.js"></script>
```

### 一个module只会加载一次

这个`module`是否唯一的定义是资源对应的完整路径是否一致。  
如果当前页面路径为`https://www.baidu.com/a/b/c.html`，则文件中的`/module.js`、`../../module.js`与`https://www.baidu.com/module.js`都会被认为是同一个`module`。  
但是像这个例子中的`module1.js`与`module1.js?a=1`就被认定为两个`module`，所以这个代码执行的结果就是会加载两次`module1.js`。  
```html
<script type="module" src="https://blog.jiasm.org/module-usage/example/modules/module1.js"></script>
<script type="module" src="/examples/modules/module1.js"></script>
<script type="module" src="./modules/module1.js"></script>
<script type="module" src="./modules/module1.js?a=1"></script>
<script type="module">
  import * as module1 from './modules/module1.js'
</script>
```

> [在线Demo](https://blog.jiasm.org/module-usage/example/import-once)

## import和export在使用的一些小提示

不管是浏览器原生提供的版本，亦或者`webpack`打包的版本。  
`import`和`export`基本上还是共通的，语法上基本没有什么差别。  

下边列出了一些可能会帮到你更好的去使用`modules`的一些技巧。

### export的重命名

在导出某些模块时，也是可以像`import`时使用`as`关键字来重命名你要导出的某个值。

```javascript
// info.js
let name = 'Niko'
let age = 18

export {
  name as firstName,
  age
}

// import
import {firstName, age} from './info.js'
```

*Tips: export的调用不像node中的module.exports = {}*  
可以进行多次调用，而且不会覆盖（key重名除外）。
```javascript
export { name as firstName }
export { age }
```
这样的写法两个key都会被导出。

### export导出的属性均为可读的

也就是说`export`导出的属性是不能够修改的，如果试图修改则会得到一个异常。  
但是，类似`const`的效果，如果某一个导出的值是引用类型的，对象或者数组之类的。  
你可以操作该对象的一些属性，例如对数组进行`push`之类的操作。  
```javascript
export {
  firstName: 'Niko',
  packs: [1, 2]
}
```

```javascript
import * as results from './export-editable.js'

results.firstName = 'Bellic' // error

results.packs.push(3)        // success
```
*这样的修改会导致其他引用该模块都会受到影响，因为使用的是一个地址。*  

### export在代码中的顺序并不影响最终导出的结果

```javascript
export const name = 'Niko'
export let age = 18

age = 20
```
*const 或者 let 对于 调用方来说没有任何区别*  
```javascript
import {name, age} from './module'

console.log(name, age) // Niko 20
```

### import获取default模块的几种姿势

获取`default`有以下几种方式都可以实现：
```javascript
import defaultItem from './import/module.js'
import { default as defaultItem2 } from './import/module.js'
import _, { default as defaultItem3 } from './import/module.js'

console.log(defaultItem === defaultItem2) // true
console.log(defaultItem === defaultItem3) // true
```
默认的规则是第一个为`default`对应的别名，但如果第一个参数是一个解构的话，就会被解析为针对所有导出项的一个匹配了。  
*P.S. 同时存在两个参数表示第一个为default，第二个为全部模块*  

导出全部的语法如下：
```javascript
import * as allThings from './iport/module.js'
```

### 类似index的export文件编写

如果你碰到了类似这样的需求，在某些地方会用到十个`module`，如果每次都`import`十个，肯定是一种浪费，视觉上也会给人一个不好的感觉。  
所以你可能会写一个类似`index.js`的文件，在这个文件中将其引入到一块，然后使用时`import index`即可。  
一般来说可能会这么写：
```javascript
import module1 from './module1.js'
import module2 from './module2.js'

export default {
  module1,
  module2
}
```

将所有的`module`引入，并导出为一个`Object`，这样确实在使用时已经很方便了。  
但是这个索引文件依然是很丑陋，所以可以用下面的语法来实现类似的功能：  
```javascript
export {default as module1} from './module1.js'
export {default as module2} from './module2.js'
```

然后在调用时修改为如下格式即可：
```javascript
import * as modules from './index.js'
```

> [在线Demo](https://blog.jiasm.org/module-usage/example/import-index)

## 小记

想到了最近爆红的`deno`，其中有一条特性也是提到了，没有`node_modules`，依赖的第三方库直接通过网络请求的方式来获取。  
然后浏览器中原生提供的`module`也是类似的实现，都是朝着更灵活的方向在走。  
祝愿抛弃`webpack`来进行开发的那一天早日到来 :)

## 参考资料

1. [es modules in browsers](https://jakearchibald.com/2017/es-modules-in-browsers/)
2. [es6 modules in depth](https://ponyfoo.com/articles/es6-modules-in-depth)
3. [export - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)
4. [import - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)

文中示例代码的GitHub仓库：[传送阵](https://github.com/jiasm/module-usage)
