---
uuid: 991aeb80-19a4-11e9-ab96-39034b5ef7f1
title: Node程序debug小记
date: 2019-01-17 01:37:14
tags:
  - javascript
  - node.js
---

有时候，所见并不是所得，有些包，你需要去翻他的源码才知道为什么会这样。  

<!-- more -->

## 背景

今天调试一个程序，用到了一个很久之前的NPM包，名为[formstream](https://www.npmjs.com/package/formstream)，用来将`form`表单数据转换为流的形式进行接口调用时的数据传递。  

这是一个几年前的项目，所以使用的是`Generator`+`co`实现的异步流程。  

其中有这样一个功能，从某处获取一些图片`URL`，并将`URL`以及一些其他的常规参数组装到一起，调用另外的一个服务，将数据发送过去。  

大致是这样的代码：

```javascript
const co         = require('co')
const moment     = require('moment')
const urllib     = require('urllib')
const Formstream = require('formstream')

function * main () {
  const imageUrlList = [
    'img1',
    'img2',
    'img3',
  ]

  // 实例化 form 表单对象
  const form = new Formstream()

  // 常规参数
  form.field('timestamp', moment().unix())

  // 将图片 URL 拼接到 form 表单中
  imageUrlList.forEach(imgUrl => {
    form.field('image', imgUrl)
  })

  const options = {
    method: 'POST',
    // 生成对应的 headers 参数
    headers: form.headers(),
    // 告诉 urllib，我们通过流的方式进行传递数据，并指定流对象
    stream: form
  }

  // 发送请求
  const result = yield urllib.request(url, options)

  // 输出结果
  console.log(result)
}

co(main)
```

也算是一个比较清晰的逻辑，这样的代码也正常运行了一段时间。  

如果没有什么意外，这段代码可能还会在这里安静的躺很多年。  
但是，现实总是残酷的，因为一些不可抗拒因素，必须要去调整这个逻辑。  
之前调用接口传递的是图片`URL`地址，现在要改为直接上传二进制数据。  

所以需求很简单，就是将之前的`URL`下载，拿到`buffer`，然后将`buffer`传到`formstream`实例中即可。  
大致是这样的操作：

```diff
-  imageUrlList.forEach(imgUrl => {
-    form.field('image', imgUrl)
-  })

+  let imageUrlResults = yield Promise.all(imageUrlList.map(imgUrl => 
+    urllib.request(imgUrl)
+  ))
+  
+  imageUrlResults = imageUrlResults.filter(img => img && img.status === 200).map(img => img.data)
+
+  imageUrlResults.forEach(imgBuffer => {
+    form.buffer('image', imgBuffer)
+  })
```

下载图片 -> 过滤空数据 -> 拼接到`form`中去，代码看起来毫无问题。  

不过在执行的时候，却出现了一个令人头大的问题。  
最终调用`yield urllib.request(url, options)`的时候，提示接口超时了，起初还以为是网络问题，于是多执行了几次，发现还是这样，开始意识到，应该是刚才的代码改动引发的`bug`。  

## 开始 debug

### 定位引发 bug 的代码

我习惯的调试方式，是先用最原始的方式，__眼__，看有哪些代码修改。  
因为代码都有版本控制，所以大多数编辑器都可以很直观的看到有什么代码修改，即使编辑器中无法看到，也可以在命令行中通过`git diff`来查看修改。  

这次的改动就是新增的一个批量下载逻辑，以及`URL`改为`Buffer`。  
先用最简单粗暴的方式来确认是这些代码影响的，__注释掉新增的代码，还原老代码__。  
结果果然是可以正常执行了，那么我们就可以断定`bug`就是由这些代码所导致的。  

### 逐步还原错误代码

上边那个方式只是一个`rollback`，帮助确定了大致的范围。  
接下来就是要缩小错误代码的范围。  
一般代码改动大的时候，会有多个函数的声明，那么就按照顺序逐个解开注释，来查看运行的效果。  
这次因为是比较小的逻辑调整，所以直接在一个函数中实现。  
那么很简单的，在保证程序正常运行的前提下，我们就按照代码语句一行行的释放。  

很幸运，在第一行代码的注释被打开后就复现了`bug`，也就是那一行`yield Promsie.all(XXX)`。  
但是这个语句实际上也可以继续进行拆分，为了排除是`urllib`的问题，我将该行代码换为一个最基础的`Promise`对象：`yield Promise.resolve(1)`。  
结果令我很吃惊，这么一个简单的`Promise`执行也会导致下边的请求超时。  

当前的部分代码状态：

```javascript
const form = new Formstream()

form.field('timestamp', moment().unix())

yield Promise.resolve(1)

const options = {
 method: 'POST',
 headers: form.headers(),
 stream: form
}

// 超时
const result = yield urllib.request(url, options)
```

再缩小了范围以后，进一步进行排查。  
目前所剩下的代码已经不错了，唯一可能会导致请求超时的情况，可能就是发请求时的那些`options`参数了。  
所以将`options`中的`headers`和`stream`都注释掉，再次执行程序后，果然可以正常访问接口（虽说会提示出错，因为必选的参数没有传递）。  

那么目前我们可以得到一个结论：`formstream`实例+`Promise`调用会导致这个问题。  

### 冷静、忏悔

接下来要做的就是深呼吸，冷静，让心率恢复平稳再进行下一步的工作。  
在我得到上边的结论之后，第一时间是崩溃的，因为导致这个`bug`的环境还是有些复杂的，涉及到了三个第三方包，`co`、`formstream`和`urllib`。  
而直观的去看代码，自己写的逻辑其实是很少的，所以难免会在心中开始抱怨，觉得是第三方包在搞我。  
但这时候要切记「程序员修炼之道」中的一句话：
> "Select" Isn't Broken  
> “Select” 没有问题  

所以一定要在内心告诉自己：“你所用的包都是经过了N久时间的洗礼，一定是一个很稳健的包，这个`bug`一定是你的问题”。  

### 分析问题

当我们达成这个共识以后，就要开始进行问题的分析了。  
首先你要了解你所使用的这几个包的作用是什么，如果能知道他们是怎么实现的那就更好了。  

对于`co`，就是一个利用`yield`语法特性将`Promise`转换为更直观的写法罢了，没有什么额外的逻辑。  
而`urllib`也会在每次调用`request`时创建一个新的`client`（刚开始有想过会不会是因为多次调用`urllib`导致的，不过用简单的`Promise.resolve`代替之后，这个念头也打消了）  

那么矛头就指向了`formstream`，现在要进一步的了解它，不过通过官方文档进行查阅，并不能得到太多的有效信息。  

### 源码阅读

> [源码地址](https://github.com/node-modules/formstream/blob/master/lib/formstream.js)

所以为了解决问题，我们需要去阅读它的源码，从你在代码中调用的那些 API 入手：

1. [构造函数](https://github.com/node-modules/formstream/blob/master/lib/formstream.js#L38)
2. [field](https://github.com/node-modules/formstream/blob/master/lib/formstream.js#L133)
3. [headers](https://github.com/node-modules/formstream/blob/master/lib/formstream.js#L88)

构造函数营养并不多，就是一些简单的属性定义，并且看到了它继承自`Stream`，这也是为什么能够在`urllib`的`options`中直接填写它的原因，因为是一个`Stream`的子类。  

```javascript
util.inherits(FormStream, Stream);
```

然后就要看`field`函数的实现了。  

```javascript
FormStream.prototype.field = function (name, value) {
  if (!Buffer.isBuffer(value)) {
    // field(String, Number)
    // https://github.com/qiniu/nodejs-sdk/issues/123
    if (typeof value === 'number') {
      value = String(value);
    }
    value = new Buffer(value);
  }
  return this.buffer(name, value);
};
```

从代码的实现看，`field`也只是一个`Buffer`的封装处理，最终还是调用了`.buffer`函数。  
那么我们就顺藤摸瓜，继续查看[buffer](https://github.com/node-modules/formstream/blob/master/lib/formstream.js#L181)函数的实现。  

```javascript
FormStream.prototype.buffer = function (name, buffer, filename, mimeType) {
  if (filename && !mimeType) {
    mimeType = mime.lookup(filename);
  }

  var disposition = { name: name };
  if (filename) {
    disposition.filename = filename;
  }

  var leading = this._leading(disposition, mimeType);

  this._buffers.push([leading, buffer]);

  // plus buffer length to total content-length
  this._contentLength += leading.length;
  this._contentLength += buffer.length;
  this._contentLength += NEW_LINE_BUFFER.length;

  process.nextTick(this.resume.bind(this));

  return this;
};
```

代码不算少，不过大多都不是这次需要关心的，大致的逻辑就是将`Buffer`拼接到数组中去暂存，在最后结尾的地方，发现了这样的一句代码：`process.nextTick(this.resume.bind(this))`。  
顿时眼前一亮，重点的是那个`process.nextTick`，大家应该都知道，这个是在`Node`中实现微任务的其中一个方式，而另一种实现微任务的方式，就是用`Promise`。  

### 修改代码验证猜想

拿到这样的结果以后，我觉得仿佛找到了突破口，于是尝试性的将前边的代码改为这样：

```javascript
const form = new Formstream()

form.field('timestamp', moment().unix())

yield Promise.resolve(1)

const options = {
 method: 'POST',
 headers: form.headers(),
 stream: form
}

process.nextTick(() => {
  urllib.request(url, options)
})
```

__发现，果然超时了。__  

从这里就能大致推断出问题的原因了。  
因为看代码可以很清晰的看出，`field`函数在调用后，会注册一个微任务，而我们使用的`yield`或者`process.nextTick`也会注册一个微任务，但是`field`的先注册，所以它的一定会先执行。  
那么很显而易见，问题就出现在这个`resume`函数中，因为`resume`的执行早于`urllib.request`，所以导致其超时。  
这时候也可以同步的想一下造成`request`超时的情况会是什么。  
只有一种可能性是比较高的，因为我们使用的是`stream`，而这个流的读取是需要事件来触发的，`stream.on('data')`、`stream.on('end')`，那么超时很有可能是因为程序没有正确接收到`stream`的事件导致的。  

当然了，「程序员修炼之道」还讲过：  
> Don't Assume it - Prove It  
> 不要假定，要证明

所以为了证实猜测，需要继续阅读`formstream`的源码，查看`resume`函数究竟做了什么。  
`resume`函数是一个很简单的一次性函数，在第一次被触发时调用`drain`函数。

```javascript
FormStream.prototype.resume = function () {
  this.paused = false;

  if (!this._draining) {
    this._draining = true;
    this.drain();
  }

  return this;
};
```

那么继续查看`drain`函数做的是什么事情。  
因为上述使用的是`field`，而非`stream`，所以在获取`item`的时候，肯定为空，那么这就意味着会继续调用`_emitEnd`函数。  
而`_emitEnd`函数只有简单的两行代码`emit('data')`和`emit('end')`。

```javascript
FormStream.prototype.drain = function () {
  console.log('start drain')
  this._emitBuffers();

  var item = this._streams.shift();
  if (item) {
    this._emitStream(item);
  } else {
    this._emitEnd();
  }

  return this;
};

FormStream.prototype._emitEnd = function () {
  this.emit('data', this._endData);
  this.emit('end');
};
```

看到这两行代码，终于可以证实了我们的猜想，因为`stream`是一个流，接收流的数据需要通过事件传递，而`emit`就是触发事件所使用的函数。  
这也就意味着，`resume`函数的执行，就代表着`stream`发送数据的动作，在发送完毕数据后，会执行`end`，也就是关闭流的操作。  

### 得出结论

到了这里，终于可以得出完整的结论：

`formstream`在调用`field`之类的函数后会注册一个微任务  
微任务执行时会使用流开始发送数据，数据发送完毕后关闭流  
因为在调用`urllib`之前还注册了一个微任务，导致`urllib.request`实际上是在这个微任务内部执行的  
也就是说在`request`执行的时候，流已经关闭了，一直拿不到数据，所以就抛出异常，提示接口超时。  

那么根据以上的结论，现在就知道该如何修改对应的代码。  
在调用`field`方法之前进行下载图片资源，保证`formstream.field`与`urllib.request`之间的代码都是同步的。  

```javascript
let imageUrlResults = yield Promise.all(imageUrlList.map(imgUrl => 
  urllib.request(imgUrl)
))

const form = new Formstream()

form.field('timestamp', moment().unix())

imageUrlResults = imageUrlResults.filter(img => img && img.status === 200).map(img => img.data)
imageUrlResults.forEach(imgBuffer => {
  form.buffer('image', imgBuffer)
})

const options = {
 method: 'POST',
 headers: form.headers(),
 stream: form
}

yield urllib.request(url, options)
```

## 小结

这并不是一个有各种高大上名字、方法论的一个调试方式。  
不过我个人觉得，它是一个非常有效的方式，而且是一个收获会非常大的调试方式。  
因为在调试的过程中，你会去认真的了解你所使用的工具究竟是如何实现的，他们是否真的就像文档中所描述的那样运行。  

关于上边这点，顺便吐槽一下这个包：[thenify-all](https://www.npmjs.com/package/thenify-all)。  
是一个不错的包，用来将普通的`Error-first-callback`函数转换为`thenalbe`函数，但是在涉及到`callback`会接收多个返回值的时候，该包会将所有的返回值拼接为一个数组并放入`resolve`中。  
实际上这是很令人困惑的一点，因为根据`callback`返回参数的数量来区别编写代码。  
而且`thenable`约定的规则就是返回`callback`中的除了`error`以外的第一个参数。  

但是这个在文档中并没有体现，而是简单的使用`readFile`来举例，很容易对使用者产生误导。  
一个最近的例子，就是我使用`util.promisify`来替换掉`thenify-all`的时候，发现之前的`mysql.query`调用莫名其妙的报错了。  

```javascript
// 之前的写法
const [res] = await mysqlClient.query(`SELECT XXX`)

// 现在的写法
const res = await mysqlClient.query(`SELECT XXX`)
```

这是因为在[mysql](https://github.com/mysqljs/mysql#introduction)文档中明确定义了，`SELECT`语句之类的会传递两个参数，第一个是查询的结果集，而第二个是字段的描述信息。  
所以`thenify-all`就将两个参数拼接为了数组进行`resolve`，而在切换到了官方的实现后，就造成了使用数组解构拿到的只是结果集中的第一条数据。  

最后，再简单的总结一下套路，希望能够帮到其他人：

1. 屏蔽异常代码，确定稳定复现（还原修改）
2. 逐步释放，缩小范围（一行行的删除注释）
3. 确定问题，利用基础`demo`来屏蔽噪音（类似前边的`yield Promise.resolve(1)`操作）
4. 分析原因，看文档，啃源码（了解这些代码为什么会出错）
5. 通过简单的实验来验证猜想（这时候你就能知道怎样才能避免类似的错误）