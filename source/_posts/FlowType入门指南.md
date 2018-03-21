---
uuid: ace2c800-2c41-11e8-bd98-e976c0dbf015
title: FlowType简易入门指北
date: 2018-03-20 21:22:01
tags:
  - 工欲善其事，必先利其器
  - JavaScript
---

> 写了一段时间JavaScript了，作为一个弱类型语言，无视类型判断在开发过程中带来了很多的好处，`int`与`float`的转换、`string`与`int`的拼接。都可以直接通过一元运算符得到结果。
> 但同样的，代码量上去了以后，整个项目会变得非常复杂。
> 在开发过程中很难看出一段代码执行后的结果，或者一个函数参数/返回值的结构。
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
如果不写注释的话，用的人很难去知道，这个参数到底是一个`number`类型还是一个`string`类型。

于是，我们就有了fb大佬们创造的[FlowType](https://flowtype.org)，一个静态类型检查工具。
Flow可以在代码运行前对类型进行检查，包括：
  1. 类型错误
  2. 对null的引用
  3. 最坑爹的`undefined is not a function`

## Flow的安装

我们可以通过直接安装`flow`的npm包来应用。
```shell
npm i -D flow-bin
```

然后在`package.json`中添加一行命令：
```json
{
  "scripts": {
    "flow": "flow"
  }
}
```

然后我们在项目根目录创建一个配置文件`.flowconfig`。
`flow-bin`提供一个命令生成一个空文件：
```shell
npm run flow init
```

![](/images/flowtype-usage/flowtype-pic-11.png)

在写完代码后通过执行`npm run flow`即可进行校验。

**P.S.** `Flow`只会检查带有`@flow`注释标记的文件。

## Flow的使用

`Flow`具有两种类型检查方式：
1. 根据变量在代码中的运用来推断变量的类型
2. 通过事先声明好的类型来进行检查

### 通过代码来推断类型

```javascript
// @flow
function maxNum (nums) {
  return Math.max.apply(null, nums)
}

maxNum(true)

function joinStr (arr) {
  return arr.join(' ')
}

joinStr(123)
```
以上代码执行`npm run flow`后，我们就会在终端看到如下报错信息

![](/images/flowtype-usage/flowtype-pic-12.png)

第一处表示`apply`预期第二个参数需要是支持迭代的，而我们传入的一个`boolean`类型变量是不支持的。
第二处则是提示我们`number`类型是没有实现`join`这个方法的。

```javascript
// @flow

function product(num1, num2) {
    return num1 * num2
}

product(1, 2)
```

以上代码的执行是不会出错的，因为两个`number`相加，这个是没有问题的。

以上的所有检测都是由`Flow`判断代码得来的，对我们现有代码的改动是非常小的，基本上就是在文件头部添加一个`@flow`标识就能完成`Flow`的配置。

### 固定类型

当然，完全依赖`Flow`去判断类型，对于一些基础的类型还是很好用的。
但如果遇到一些比较复杂的情况，还是建议直接在代码中添加类型的描述。

一个小例子：

![](/images/flowtype-usage/flowtype-pic-1.png)

就像上边的函数，`+`这个运算符既可以用在`string`也可以用在`number`上，所以在`Flow`自行判断来看，这个参数的类型就是`number | string`，而我们想要限制他为一个`number` 就只能自己添加类型的描述了。
然后我们将`result`的类型改为`string`观察一下:

![](/images/flowtype-usage/flowtype-pic-13.png)

这时我们就能看到抛出的异常，提示`result`的类型与函数`numberAdd`的返回值类型不匹配。
同理，如果我们在调用函数时传入一个`string`,`Flow`也会提示我们，类型不匹配，这极大的避免了因为类型转换带来的`bug`。

这个是最基本的静态类型检查效果，或者我们可以提前定义一些特殊的数据格式。

![](/images/flowtype-usage/flowtype-pic-3.png)

然后我们在`.flowconfig`文件中添加它的引用。（如果没有这个文件请在根目录创建，用来进行一些`Flow`相关的参数配置，官网文档有详细的解说）

![](/images/flowtype-usage/flowtype-pic-4.png)
![](/images/flowtype-usage/flowtype-pic-6.png)

然后我们在一个文件中进行应用，创建一个函数，用来输出我们的`Person`对象的两个属性。

```javascript
/* @flow */

function logPerson(person: Person): void {
    console.log(`
        firstName: ${person.firstName}
        age:       ${person.age}
    `)
}

let person: Person = { // 后边的 : Person 是可选的，因为会应用到我们前边所说的`推断类型`
    firstName: 'Bellic',
    age: 18
}

logPerson(person)
```

如果我们将变量`person`的`age`改为`string`类型，我们会看到如下的错误提示：

![](/images/flowtype-usage/flowtype-pic-14.png)

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

### 对空值的处理

```javascript
// @flow

const fs = require('fs')

function readFile(filePath) {
    let buffer = fs.readFileSync(filePath)
}

readFile()
```
如果我们写了这样的一个函数，用来获取文件对应的数据的，在下边调用时没有传入`filePath`参数，`Flow`会给出我们提示：
![](/images/flowtype-usage/flowtype-pic-15.png)
强制要求我们对空值进行处理。

```javascript
function readFile(filePath) {
    if (!filePath) return ''
    let buffer = fs.readFileSync(filePath)
}
```
这样`Flow`就不会报错了，避免了代码上线后出现与`undefined`/`null`相关的可怕问题。

## 在IDE中的使用

> 每次写完代码，都要去执行一下`npm run flow`，其实也挺烦人的，所以，我们可以直接将`Flow`应用到编辑器上。
> 关于Flow的应用，因为`Atom`编辑器支持的还不太好，所以搞了`VSCode`来测试。
> 我所使用的是ESLint版本的

首先我们需要安装`Flow`对应的`eslint`插件。
```shell
npm install --save-dev eslint eslint-plugin-flowtype
```

安装完插件后，还需要去`VSCode`中安装对应的`Flow`以及`ESLint`插件。

![](/images/flowtype-usage/flowtype-pic-16.png)
![](/images/flowtype-usage/flowtype-pic-17.png)

这些都完成后可能还会发现一些错误提示，类似：`':' can only be used in a .ts file`
这个是`VSCode`默认的一些错误检查，解决这个只需要在IDE的配置文件中添加如下设置即可`"javascript.validate.enable": false`（`command` + `,`）

这是我们就可以在IDE中直接看到`Flow`的类型检查了。
![](/images/flowtype-usage/flowtype-pic-2.png)
![](/images/flowtype-usage/flowtype-pic-7.png)

使用`VSCode`还有一个好处，当你写了一个应用了`Flow`的函数后，在调用函数时，光标悬浮在函数上，可以很直观的看到函数的签名：

![](/images/flowtype-usage/flowtype-pic-9.png)

以及如果我们将前边定义的`Person`结构拿过来，在签名中也是会直接体现出来的

![](/images/flowtype-usage/flowtype-pic-10.png)

## 移除Flow内容

> 因为Flow的语法并不是标准的JavaScript语法，所以我们要在代码最终上线前移除Flow相关的代码（主要是那些固定类型的描述，如果只是添加了`@flow`，直接应用即可）

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
{
  "plugins": [
      "transform-flow-comments"
  ]
}
```
然后在`webpack.config.js`文件中添加：
```javascript
module.exports = {
  plugins: [
      new FlowBabelWebpackPlugin()
  ]
}
```
在`babel`编译`JavaScript`的同时也就会将`Flow`内容进行移除了。

## 参考链接

http://flowtype.org

关于`Flow`，个人感觉是一个挺好玩的东西，而且最重要的是，这个检查器的迁移成本非常低，低到甚至只是添加一个`/* @flow */`就可以使用`Flow`相关的功能了。
对现有代码的破坏几乎可以忽略不计。
只做一件事，且命中痛点，**避免因变量类型造成的程序bug**
