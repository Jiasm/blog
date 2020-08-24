---
uuid: 0e55bf60-d326-11ea-b45e-0f84134592b0
title: 如何写一个简单的node.js c++扩展
date: 2020-08-07 23:04:59
tags:
    - javascript
    - cpp
---

> node 是由 c++ 编写的，核心的 node 模块也都是由 c++ 代码来实现，所以同样 node 也开放了让使用者编写 c++ 扩展来实现一些操作的窗口。  
> 如果大家对于 require 函数的描述还有印象的话，就会记得如果不写文件后缀，它是有一个特定的匹配规则的：

```bash
LOAD_AS_FILE(X)
1. If X is a file, load X as its file extension format. STOP
2. If X.js is a file, load X.js as JavaScript text. STOP
3. If X.json is a file, parse X.json to a JavaScript Object. STOP
4. If X.node is a file, load X.node as binary addon. STOP
```

可以看到，最后会匹配一个 `.node`，而后边的描述也表示该后缀的文件为一个二进制的资源。  
而这个 `.node` 文件一般就会是我们所编译好的 c++ 扩展了。  

## 为什么要写 c++ 扩展

可以简单理解为，如果想基于 node 写一些代码，做一些事情，那么有这么几种选择：

1. 写一段 JS 代码，然后 require 执行
2. 写一段 c++ 代码，编译后 require 执行
3. 打开 node 源码，把你想要的代码写进去，然后重新编译

日常的开发其实只用第一项就够了，我们用自己熟悉的语言，写一段熟悉的代码，然后发布在 NPM 之类的平台上，其他有相同需求的人就可以下载我们上传的包，然后在TA的项目中使用。  
但有的时候可能纯粹写 JS 满足不了我们的需求，也许是工期赶不上，也许是执行效率不让人满意，也有可能是语言限制。  
所以我们会采用直接编写一些 c++ 代码，来创建一个 c++ 扩展让 node 来加载并执行。  
况且如果已经有了 c++ 版本的轮子，我们通过扩展的方式来调用执行而不是自己从头实现一套，也是避免重复造轮子的方法。  

一个简单的例子，如果大家接触过 webpack 并且用过 sass 的话，那么在安装的过程中很可能会遇到各种各样的报错问题，也许会看到 gyp 的关键字，其实原因就是 sass 内部有使用一些 c++ 扩展来辅助完成一些操作，而 gyp 就是用来编译 c++ 扩展的一种工具。  

![node sass 源码分布](/images/node-sass-code-distribution.png)  

[https://github.com/sass/node-sass](https://github.com/sass/node-sass)

当然，上边也提到了还有第三种操作方法，我们可以直接魔改 node 源码，但是如果你只是想要写一些原生 JS 实现起来没有那么美好的模块，那么是没有必要去魔改源码的，毕竟改完了以后还要编译，如果其他人需要用你的逻辑，还需要安装你所编译好的特殊版本。
这样的操作时很不易于传播的，大家不会想使用 sass 就需要安装一个 sass 版本的 node 吧。  
_就像为了看星战还要专门下载一个优酷- -。_  

简单总结一下，写 c++ 的扩展大概有这么几个好处：

1. 可以复用 node 的模块管理机制
2. 有比 JS 更高效的执行效率
3. 有更多的 c++ 版本的轮子可以拿来用

## 怎么去写一个简单的扩展

node 从问世到现在已经走过了 11 年，通过早期的资料、博客等各种信息渠道可以看到之前开发一个 c++ 扩展并不是很容易，但经过了这么些年迭代，各种大佬们的努力，我们再去编写一个 c++ 扩展已经是比较轻松的事情了。  
这里直入正题，放出今天比较关键的一个工具：[node-addon-api module](https://github.com/nodejs/node-addon-api)  
以及这里是官方提供的各种简单 demo 来让大家熟悉这是一个什么样的工具： [node-addon-examples](https://github.com/nodejs/node-addon-examples)  

需要注意的一点是， demo 目录下会分为三个子目录，在 readme 中也有写，分别是三种不同的 c++ 扩展的写法（基于不同的工具）。  
我们本次介绍的是在 `node-addon-api` 目录下的，算是三种里边最为易用的一种了。  

首先是我们比较熟悉的 `package.json` 文件，我们需要依赖两个组件来完成开发，分别是 [bindings](https://www.npmjs.com/package/bindings) 和 [node-addon-api](https://www.npmjs.com/package/node-addon-api)。  

然后我们还需要简单了解一下 gyp 的用法，因为编译一个 c++ 扩展需要用到它。
就像 helloworld 示例中的 binding.gyp 文件示例：

```javascript
{
  "targets": [
    {
      // 导出的文件名
      "target_name": "hello",
      // 编译标识的定义 禁用异常机制（注意感叹号表示排除过滤）
      "cflags!": [ "-fno-exceptions" ],
      // c++ 编译标识的定义 禁用异常机制（注意感叹号表示排除过滤，也就是 c++ 编译器会去除该标识）
      "cflags_cc!": [ "-fno-exceptions" ],
      // 源码入口文件
      "sources": [ "hello.cc" ],
      // 源码包含的目录
      "include_dirs": [
        // 这里表示一段 shell 的运行，用来获取 node-addon-api 的一些参数，有兴趣的老铁可以自行 node -p "require('node-addon-api').include" 来看效果
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      // 环境变量的定义
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    }
  ]
}
```

gyp 的语法挺多的，这次并不是单独针对 gyp 的一次记录，所以就不过多的介绍。

### 从最简单的数字相加来实现

然后我们来实现一个简单的创建一个函数，让两个参数相加，并返回结果。  

> 源码位置：https://github.com/Jiasm/node-addon-example/tree/master/add  

我们需要这样的一个 binding.gyp 文件：

```javascript
{
  "targets": [
    {
      "target_name": "add",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [ "add.cc" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    }
  ]
}
```

然后我们在项目根目录创建 package.json 文件，并安装 [bindings](https://www.npmjs.com/package/bindings) 和 [node-addon-api](https://www.npmjs.com/package/node-addon-api) 两个依赖。

接下来就是去编写我们的 c++ 代码了：

```c++
#include <napi.h>

// 定义 Add 函数
Napi::Value Add(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // 接收第一个参数
  double arg0 = info[0].As<Napi::Number>().DoubleValue();
  // 接收第二个参数
  double arg1 = info[1].As<Napi::Number>().DoubleValue();
  // 将两个参数相加并返回
  Napi::Number num = Napi::Number::New(env, arg0 + arg1);

  return num;
}

// 入口函数，用于注册我们的函数、对象等等
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // 将一个名为 add 的函数挂载到 exports 上
  exports.Set(Napi::String::New(env, "add"), Napi::Function::New(env, Add));
  return exports;
}

// 固定的宏使用
NODE_API_MODULE(addon, Init)
```

在 c++ 代码完成以后就是需要用到 `node-gyp` 的时候了，建议全局安装 `node-gyp`，避免一个项目中出现多个 node_modules 目录的时候使用 `npx` 会出现一些不可预料的问题：

```bash
> npm i -g node-gyp
# 生成构建文件
> node-gyp configure
# 构建
> node-gyp build
```

这时候你会发现项目目录下已经生成了一个名为 add.node 的文件，就是我们在 binding.gyp 里边的 target_name 所设置的值了。  
最后我们就是要写一段 JS 代码来调用所生成的 .node 文件了：

```javascript
const { add } = require('bindings')('add.node')

console.log(add(1, 2))     // 3
console.log(add(0.1, 0.2)) // 熟悉的 0.3XXXXX
```

### 实现一个函数柯里化

接下来我们来整点好玩的，实现一个前端的高频考题，如何实现一个函数柯里化，定义如下：

```javascript
add(1)(2)(3) // => 6
add(1, 2, 3) // => 6
```

> 源码位置：https://github.com/Jiasm/node-addon-example/tree/master/curry-add  

我们会用到的一些技术点：

- 如何在 c++ 函数中返回一个函数供 JS 调用
- 如何让返回值既支持函数调用又支持取值操作
- 如何处理非固定数量的参数（其实这个很简单了，从上边也能看出来，本身就是一个数组）

不再赘述 binding.gyp 与 package.json 的配置，我们直接上 c++ 代码：

```c++
#include <napi.h>

// 用来覆盖 valueOf 实现的函数
Napi::Value GetValue(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // 获取我们在创建 valueOf 函数的时候传入的 result
  double* storageData = reinterpret_cast<double*>(info.Data());

  // 避免空指针情况
  if (storageData == NULL) {
    return Napi::Number::New(env, 0);
  } else {
    return Napi::Number::New(env, *storageData);
  }

}

Napi::Function CurryAdd(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // 获取我们下边在创建 curryAdd 函数的时候传入的 result
  double* storageData = reinterpret_cast<double*>(info.Data());

  double* result = new double;

  // 遍历传入的所有参数
  long len, index;
  for (len = info.Length(), index = 0; index < len; index++) {
    double arg = info[index].As<Napi::Number>().DoubleValue();

    *result += arg;
  }

  // 用于多次的计算
  if (storageData != NULL) {
    *result += *storageData;
  }

  // 创建一个新的函数用于函数的返回值
  Napi::Function fn = Napi::Function::New(env, CurryAdd, "curryAdd", result);

  // 篡改 valueOf 方法，用于输出结果
  fn.Set("valueOf", Napi::Function::New(env, GetValue, "valueOf", result));

  return fn;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  Napi::Function fn = Napi::Function::New(env, CurryAdd, "curryAdd");

  exports.Set(Napi::String::New(env, "curryAdd"), fn);

  return exports;
}

NODE_API_MODULE(curryadd, Init)
```

编译完成以后，再写一段简单的 JS 代码来调用验证结果即可：

```javascript
const { curryAdd } = require('bindings')('curry-add');

const fn = curryAdd(1, 2, 3);
const fn2 = fn(4);

console.log(fn.valueOf())     // => 6
console.log(fn2.valueOf())    // => 10
console.log(fn2(5).valueOf()) // => 15
```

然后可以讲一下上边列出来的三个技术点是如何解决的：

- 如何在 c++ 函数中返回一个函数供 JS 调用
  - 通过 `Napi::Function::New` 创建新的函数，并将计算结果存入函数可以获取到的地方供下次使用
- 如何让返回值既支持函数调用又支持取值操作
  - 通过 `fn.Set` 篡改 `valueOf` 函数并返回结果
- 如何处理非固定数量的参数（其实这个很简单了，从上边也能看出来，本身就是一个数组）
  - 通过拿到 `info` 的 `Length` 来遍历获取

## 与 JS 进行对比

当然，就例如柯里化之类的函数，拿JS来实现的话会非常简单，配合 reduce 函数基本上五行以内就可以写出来。  
那我们折腾这么多究竟是为了什么呢？  
这就要回到开头所说的优势了： __执行效率__  

### 采用冒泡排序来对比

为了证明效率的差异，我们选择用一个排序算法来验证，采用了最简单易懂的冒泡排序来做，首先是 JS 版本的：

> 源码位置：https://github.com/Jiasm/node-addon-example/tree/master/bubble  

```javascript
function bubble (arr) {
  for (let i = 0, len = arr.length; i < len; i++) {
    for (let j = i + 1; j < len; j++) {
      if (arr[i] < arr[j]) {
        [arr[i], arr[j]] = [arr[j], arr[i]]
      }
    }
  }

  return arr
}

bubble([7, 2, 1, 5, 3, 4])
```

然后是我们的 c++ 版本，因为是一个 JS 的扩展，所以会涉及到数据类型转换的问题，大致代码如下：

```c++
#include <napi.h>

void bubbleSort(double* arr, int len) {
  double temp;
  int i, j;
  for (i = 0; i < len; i++) {
    for (j = i + 1; j < len; j++) {
      if (*(arr + i) < *(arr + j)) {
        temp = *(arr + i);
        *(arr + i) = *(arr + j);
        *(arr + j) = temp;
      }
    }
  }
}

Napi::Value Add(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Napi::Array array = info[0].As<Napi::Array>();


  int len = array.Length(), i;

  // 返回值
  Napi::Array arr = Napi::Array::New(env, len);

  double* list = new double[len];

  // 将 Array 转换为 c++ 可方便使用的 double 数组
  for (i = 0; i < len; i++) {
    Napi::Value i_v = array[i];

    list[i] = i_v.ToNumber().DoubleValue();
  }

  // 执行排序
  bubbleSort(list, len);

  // 将 double 数组转换为要传递给 JS 的数据类型
  for (i = 0; i < len; i++) {
    arr[i] = Napi::Number::New(env, list[i]);
  }

  return arr;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "bubble"), Napi::Function::New(env, Add));
  return exports;
}

NODE_API_MODULE(bubble, Init)
```

然后我们通过一个随机生成的数组来对比耗时：

```javascript
const { bubble } = require('bindings')('bubble.node')

const arr = Array.from(new Array(1e3), () => Math.random() * 1e6 | 0)

console.time('c++')
const a = bubble(arr)
console.timeEnd('c++')

function bubbleJS (arr) {
  for (let i = 0, len = arr.length; i < len; i++) {
    for (let j = i + 1; j < len; j++) {
      if (arr[i] < arr[j]) {
        [arr[i], arr[j]] = [arr[j], arr[i]]
      }
    }
  }

  return arr
}

console.time('js')
bubbleJS(arr)
console.timeEnd('js')
```

在 `1,000` 数据量的时候耗时差距大概在 `6` 倍左右，在 `10,000` 数据量的时候耗时差距大概在 `3` 倍左右。  
也是简单的证实了在相同算法情况下 c++ 效率确实是会比 JS 高一些。  

当然了，也通过上边的 bubble sort 可以来证实另一个观点： __有更多的 c++ 版本的轮子可以拿来用__  
就比如上边的 `bubbleSort` 函数，可能就是一个其他的加密算法实现、SDK 封装，如果没有 node 版本，而我们要使用就需要参考它的逻辑重新实现一遍，但如果采用 c++ 扩展的方式，完全可以基于原有的 c++ 函数进行一次简单的封装就拥有了一个 node 版本的 函数/SDK。  

## 后记

上边的一些内容就是如何使用 `node-addon-api` 来快速开发一个 c++ 扩展，以及如何使用 `node-gyp` 进行编译，还有最后的如何使用 JS 调用 c++ 扩展。  
在开发 node 程序的过程中，如果能够适当的利用 c++ 的能力是会对项目有很大的帮助的，在一些比较关键的地方，亦或者 node 弱项的地方，使用更锋利的 c++ 来帮助我们解决问题。  
_不要让编程语言限制了你的想象力_  

### 参考资料

- [node-gyp](https://www.npmjs.com/package/node-gyp#how-to-use)
- [node-addon-api | Addon](https://github.com/nodejs/node-addon-api/blob/master/doc/addon.md)
- [node-addon-api | CallbackInfo](https://github.com/nodejs/node-addon-api/blob/master/doc/callbackinfo.md)
- [node-addon-api | Function](https://github.com/nodejs/node-addon-api/blob/master/doc/function.md)
- [node-addon-api | Object](https://github.com/nodejs/node-addon-api/blob/master/doc/object.md)
- [node-addon-api | Array](https://github.com/nodejs/node-addon-api/blob/master/doc/basic_types.md#array)
- [node-addon-api | Number](https://github.com/nodejs/node-addon-api/blob/master/doc/number.md)
