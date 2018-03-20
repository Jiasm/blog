---
uuid: ace2c800-2c41-11e8-bd98-e976c0dbf015
title: FlowType简易入门指北
date: 2018-03-20 21:22:01
tags:
  - 工欲善其事，必先利其器
  - JavaScript
---

> 写了几年JavaScript了，作为一个弱类型语言，无视类型判断在开发过程中带来了很多的好处，`int`与`float`的转换、`string`与`int`的拼接。都可以直接通过一元运算符得到结果。
> 但同样的，代码量上去了以后，整个项目会变得非常复杂。
> 在编辑器中很难看出一段代码执行后的结果，或者一个函数参数/返回值的结构。
> 有很多bug是在运行时才发现的。
> 比如一些常见的坑：
```javascript
$input.value + 1 // 如果input的值为 `2` 我们得到的结果却是 `21`
```
以及在多人合作开发时，我们可能会提出一些公共的函数供其他人调用，例如：
```javascript
function numberAddComma (num) {
  return num // 添加千分位
}
```
如果不写注释的话，用的人很难去知道，你这个参数到底是一个`Number`类型还是一个`String`类型。
> 于是，我们就有了fb大佬们创造的[FlowType](https://flowtype.org)，一个静态类型检查工具。
> Flow可以在代码运行前对类型错误进行检查，包括：
  1. 类型错误
  2. 对null的引用
  3. 最坑爹的`undefined is not a function`

## Flow的安装

> 关于Flow的应用，因为`Atom`编辑器支持的还不太好，所以搞了`VSCode`来测试。
> 我所使用的是ESLint版本的

首先我们需要安装`Flow`对应的`eslin`插件。
```shell
npm install --save-dev eslint eslint-plugin-flowtype
```

安装完成后，我们就可以在要进行检查的js文件中，添加`Flow`的注释，用来标识告诉检查器，我们这个文件应用了`flowtype`

```javascript
/* @flow */
// @flow

// 在文件头部添加上边任意一个即可
```

## Flow的使用

一个小例子：

![](/images/flowtype-usage/flowtype-pic-1.png)

然后我们将`result`的类型改为`string`观察一下:

![](/images/flowtype-usage/flowtype-pic-2.png)

这时我们就能看到IDE给我们抛出的异常，提示`result`的类型与函数`numberAdd`的返回值类型不匹配。
同理，如果我们在调用函数时传入一个`string`,IDE也会提示我们，类型不匹配，这极大的避免了因为类型转换带来的`bug`。

这个是最基本的静态类型检查效果，或者我们可以提前定义一些特殊的数据格式。

![](/images/flowtype-usage/flowtype-pic-3.png)

然后我们在`.flowconfig`文件中添加它的引用。（如果没有这个文件请在根目录创建，用来进行一些`Flow`相关的参数配置，官网文档有详细的解说）

![](/images/flowtype-usage/flowtype-pic-4.png)
![](/images/flowtype-usage/flowtype-pic-6.png)

然后我们在一个文件中进行应用，创建一个函数，用来输出我们的`Person`对象的两个属性。

![](/images/flowtype-usage/flowtype-pic-5.png)

如果我们将传入函数的参数删掉其中的一个`key`，我们会看到IDE抛出了如下的错误提示：

![](/images/flowtype-usage/flowtype-pic-7.png)

其实，如果我们的参数类型是一个`Object`，如果调用函数传入的是一个符合规则的`Object`，即使不在变量的后边添加类型，也是可以兼容通过的。

![](/images/flowtype-usage/flowtype-pic-8.png)

当然，关于类型，并不是只限定的只有一种类型，你可以在后边添加多个类型，例如：
```javascript
// @flow
function getResult (num: string | number): number {
  console.log(num)

  return 1234
}

let result1 = getResult(1)
let result2 = getResult('2')
let result3 = getResult(true) // error
```

使用`VSCode`还有一个好处，当你写了一个应用了`Flow`的函数后，在调用函数时，光标悬浮在函数上，可以很直观的看到函数的签名：

![](/images/flowtype-usage/flowtype-pic-9.png)

以及如果我们将前边定义的`Person`结构拿过来，在签名中也是会直接体现出来的

![](/images/flowtype-usage/flowtype-pic-10.png)

## 移除Flow内容

> 因为Flow的语法并不是标准的JavaScript语法，所以我们要在代码最终上线前移除Flow相关的代码

### flow-remove-types

这个程序会将你所有标有`@flow`的内容进行移除。。然后将移除后的代码生成后指定的目录下
```shell
npm i -g flow-remove-types
flow-remove-types src/ --out-dir dist/
# src 源文件地址
# dist 生成后的地址
```

### babel+webpack

安装一个`webpack`插件
```shell
npm i -D flow-babel-webpack-plugin
```

然后我们修改 `.babelrc`文件，添加如下配置：
```json
"plugins": [
    "transform-flow-comments"
]
```
然后在`webpack.config.js`文件中添加：
```javascript
module.exports = {
  plugins: [
      new FlowBabelWebpackPlugin()
  ]
}
```
我们在执行`webpack`后，就会移除对应的`Flow`内容了。

## 参考链接

http://flowtype.org

关于`Flow`，个人感觉是一个挺好玩的东西，尤其是在使用`React` or `Vue`的时候，因为本身就有用到`webpack`进行打包，所以添加一个`Flow`对代码的改动并不大。
只做一件事儿，而且命中痛点，**避免因变量类型造成的程序bug**
