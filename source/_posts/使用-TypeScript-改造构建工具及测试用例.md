---
uuid: 7d7fa840-ad05-11e8-bede-4b0c836d1e42
title: 使用 TypeScript 改造构建工具及测试用例
date: 2018-09-03 11:06:12
tags:
  - javascript
  - typescript
---

最近的一段时间一直在搞`TypeScript`，一个巨硬出品、赋予`JavaScript`语言静态类型和编译的语言。  
第一个完全使用`TypeScript`重构的纯`Node.js`项目已经上线并稳定运行了。  
第二个前后端的项目目前也在重构中，关于前端基于`webpack`的`TypeScript`套路之前也有提到过：[TypeScript在react项目中的实践](2018/08/26/TypeScript在react项目中的实践)。  

但是这些做完以后也总感觉缺了点儿什么 _（没有尽兴）_：

<!-- more -->

![](/images/typescript-usage/old-project-screenshot.png)  
是的，依然有五分之一的`JavaScript`代码存在于项目中，作为一个`TypeScript`的示例项目，表现的很不纯粹。  
所以有没有可能将这些`JavaScript`代码也换成`TypeScript`呢？  
答案肯定是有的，首先需要分析这些代码都是什么：  

- `Webpack`打包时的配置文件
- 一些简单的测试用例（使用的mocha和chai） 

知道了是哪些地方还在使用`JavaScript`，这件事儿就变得很好解决了，从构建工具（`Webpack`）开始，逐个击破，将这些全部替换为`TypeScript`。  

## Webpack 的 TypeScript 实现版本

在这`8102`年，很幸福，`Webpack`官方已经支持了`TypeScript`编写配置文件，[文档地址](https://webpack.js.org/configuration/configuration-languages/)。  
_除了`TypeScript`以外还支持`JSX`和`CoffeeScript`的解释器，在这就忽略它们的存在了_  

### 依赖的安装

首先是要安装`TypeScript`相关的一套各种依赖，包括解释器及该语言的核心模块：

```bash
npm install -D typescript ts-node
```

`typescript`为这个语言的核心模块，`ts-node`用于直接执行`.ts`文件，而不需要像`tsc`那样会编译输出`.js`文件。

```bash
ts-node helloworld.ts
```

因为要在`TypeScript`环境下使用`Webpack`相关的东东，所以要安装对应的`types`。  
也就是`Webpack`所对应的那些`*.d.ts`，用来告诉`TypeScript`这是个什么对象，提供什么方法。  

```bash
npm i -D @types/webpack
```

_一些常用的`pLugin`都会有对应的`@types`文件，可以简单的通过`npm info @types/XXX`来检查是否存在_  

如果是一些小众的`plugin`，则可能需要自己创建对应的`d.ts`文件，例如我们一直在用的`qiniu-webpack-plugin`，这个就没有对应的`@types`包的，所以就自己创建一个空文件来告诉`TypeScript`这是个啥：

```typescript
declare module 'qiniu-webpack-plugin' // 就一个简单的定义即可

// 如果还有其他的包，直接放到同一个文件就行了
// 文件名也没有要求，保证是 d.ts 结尾即可
```

_放置的位置没有什么限制，随便丢，一般建议放到`types`文件夹下_  

最后就是`.ts`文件在执行时的一些配置文件设置。   
用来执行`Webpack`的`.ts`文件对`tsconfig.json`有一些小小的要求。  
`compilerOptions`下的`target`选项必须是`es5`，这个代表着输出的格式。  
以及`module`要求选择`commonjs`。

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es5",
    "esModuleInterop": true
  }
}
```

但一般来讲，执行`Webpack`的同级目录都已经存在了`tsconfig.json`，用于实际的前端代码编译，很可能两个配置文件的参数并不一样。  
如果因为要使用`Webpack`去修改真正的代码配置参数肯定是不可取的。  
所以我们就会用到这么一个包，用来改变`ts-node`执行时所依赖的配置文件：[tsconfig-paths](https://www.npmjs.com/package/tsconfig-paths)  

在`Readme`中发现了这样的说法：`If process.env.TS_NODE_PROJECT is set it will be used to resolved tsconfig.json`。  
在`Webpack`的文档中同样也提到了这句，所以这是一个兼容的方法，在命令运行时指定一个路径，在不影响原有配置的情况下创建一个供`Webpack`打包时使用的配置。  

1. 将上述的配置文件改名为其它名称，`Webpack`文档示例中为`tsconfig-for-webpack-config.json`，这里就直接沿用了
2. 然后添加`npm script`如下

```json
{
  "scripts": {
    "build": "TS_NODE_PROJECT=tsconfig-for-webpack-config.json webpack --config configs.ts"
  }
}
```

### 文件的编写

关于配置文件，从`JavaScript`切换到`TypeScript`实际上并不会有太大的改动，因为`Webpack`的配置文件大多都是写死的文本/常量。  
很多类型都是自动生成的，基本可以不用手动指定，一个简单的示例：  

```typescript
import { Configuration } from 'webpack'

const config: Configuration = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
}

export default config
```

`Configuration`是一个`Webpack`定义的接口（`interface`），用来规范一个对象的行为。  
在`VS Code`下按住`Command` + 单击可以直接跳转到具体的`webpack.d.ts`定义文件那里，可以看到详细的定义信息。  
![](/images/typescript-usage/webpack-declare.png)  
各种常用的规则都写在了这里，使用`TypeScript`的一个好处就是，当要实现一个功能时你不再需要去网站上查询应该要配置什么，可以直接翻看`d.ts`的定义。  
如果注释写得足够完善，基本可以当成文档来用了，而且在`VS Code`编辑器中还有动态的提示，以及一些错误的纠正，比如上述的`NODE_ENV`的获取，如果直接写`process.env.NODE_ENV || 'development'`是会抛出一个异常的，因为从`d.ts`中可以看到，关于`mode`只有三个有效值`production`、`developemnt`和`none`，而`process.env.NODE_ENV`显然只是一个字符串类型的变量。  
![](/images/typescript-usage/warning-tips.png)  
所以我们需要使用三元运算符保证传入的参数一定是我们想要的。  

以及在编写的过程中，如果有一些自定义的`plugin`之类的，可能在使用的过程中会抛异常提示说某个对象不是有效的`Plugin`对象，一个很简单的方法，在对应的`plugin`后边添加一个`as webpack.Plugin`即可。  

__在这里`TypeScript`所做的只是静态的检查，并不会对实际的代码执行造成任何影响，就算类型因为强行`as`而改变，也只是编译期的修改，在实际执行的`JavaScript`代码中还是弱类型的__   


在完成了上述的操作后，再执行`npm run XXX`就可以直接运行`TypeScript`版本的`Webpack`配置咯。  

### 探索期间的一件趣事

因为我的项目根目录已经安装了`ts-node`，而前端项目是作为其中的一个文件夹存在的，所以就没有再次进行安装。  
这就带来了一个令人吐血的问题。  

首先全部流程走完以后，我直接在命令行中输入`TS_NODE_PROJECT=XXX.json NODE_ENV=dev webpack --config ./webpack/dev.ts`  
完美运行，然后将这行命令放到了`npm scripts`中：
```json
{
  "scripts": {
    "start": "TS_NODE_PROJECT=XXX.json NODE_ENV=dev webpack --config ./webpack/dev.ts"
  }
}
```

再次运行`npm start`，发现竟然出错了-.-，提示我说`import`语法不能被识别，这个很显然就是没有应用我们在`ts_NODE_PROJECT`中指定的`config`文件。  
刚开始并不知道问题出在哪，因为这个在命令行中直接执行并没有任何问题。  
期间曾经怀疑是否是环境变量没有被正确设置，还使用了`cross-env`这个插件，甚至将命令写到了一个`sh`文件中进行执行。  
然而问题依然存在，后来在一个群中跟小伙伴们聊起了这个问题，有人提出，__你是不是全局安装了`ts-node`__。  
检查以后发现，果然是的，在命令行执行时使用的是全局的`ts-node`，但是在`npm scripts`中使用的是本地的`ts-node`。  
在命令行环境执行时还以为是会自动寻找父文件夹`node_modules`下边的依赖，其实是使用的全局包。  
乖乖的在`client-src`文件夹下也安装了`ts-node`就解决了这个问题。  
_全局依赖害人。。_  

## 测试用例的改造

前边的`Webpack`改为`TypeScript`大多数原因是因为强迫症所致。  
但是测试用例的`TypeScript`改造则是一个能极大提高效率的操作。  

### 为什么要在测试用例中使用 TypeScript

测试用例使用`chai`来编写，_（之前的`Postman`也是用的`chai`的语法）_  
`chai`提供了一系列的语义化链式调用来实现断言。  
在之前的分享中也提到过，这么多的命令你并不需要完全记住，只知道一个`expect(XXX).to.equal(true)`就够了。  

但是这样的通篇`to.equal(true)`是巨丑无比的，而如果使用那些语义化的链式调用，在不熟练的情况下很容易就会得到：  
```bash
Error: XXX.XXX is not a function
```

因为这确实有一个门槛问题，必须要写很多才能记住调用规则，各种`not`、`includes`的操作。  
但是接入了`TypeScript`以后，这些问题都迎刃而解了。  
也是前边提到的，所有的`TypeScript`模块都有其对应的`.d.ts`文件，用来告诉我们这个模块是做什么的，提供了什么可以使用。  
也就是说在测试用例编写时，我们可以通过动态提示来快速的书写断言，而不需要结合着文档去进行“翻译”。  

![](/images/typescript-usage/chai-tips.png)  
![](/images/typescript-usage/chai-warning.png)  

### 使用方式

如果是之前有写过`mocha`和`chai`的童鞋，基本上修改文件后缀+安装对应的`@types`即可。  
可以直接跳到这里来：[开始编写测试脚本](#开始编写测试脚本)  
但是如果对测试用例感兴趣，但是并没有使用过的童鞋，可以看下边的一个基本步骤。

### 安装依赖

1. `TypeScript`相关的安装，`npm i -D typescript ts-node`
2. `Mocha`、`chai`相关的安装，`npm i -D mocha chai @types/mocha @types/chai`
3. 如果需要涉及到一些API的请求，可以额外安装`chai-http`，`npm i -D chai-http @types/chai-http`

环境的依赖就已经完成了，如果额外的使用一些其他的插件，记得安装对应的`@types`文件即可。  
_如果有使用ESLint之类的插件，可能会提示`modules`必须存在于`dependencies`而非`devDependencies`_  
这是ESLint的`import/no-extraneous-dependencies`规则导致的，针对这个，我们目前的方案是添加一些例外：
```yaml
import/no-extraneous-dependencies:
  - 2
  - devDependencies:
    - "**/*.test.js"
    - "**/*.spec.js"
    - "**/webpack*"
    - "**/webpack/*"
```

针对这些目录下的文件/文件夹不进行校验。_是的，webpack的使用也会遇到这个问题_  

### 开始编写测试脚本

如果是对原有的测试脚本进行修改，无外乎修改后缀、添加一些必要的类型声明，不会对逻辑造成任何修改。  

#### 一个简单的示例

```typescript
// number-comma.ts
export default (num: number | string) => String(num).replace(/\B(?=(\d{3})+$)/g, ',')

// number-comma.spec.ts
import chai from 'chai'
import numberComma from './number-comma'

const { expect } = chai

// 测试项
describe('number-comma', () => {
  // 子项目1
  it('`1234567` should transform to `1,234,567`', done => {
    expect(numberComma(1234567)).to.equal('1,234,567')
    done()
  })

  // 子项目2
  it('`123` should never transform', done => {
    const num = 123
    expect(numberComma(num)).to.equal(String(num))
    done()
  })
})
```

__如果全局没有安装`mocha`，记得将命令写到`npm script`中，或者通过下述方式执行__  

```bash
./node_modules/mocha/bin/mocha -r ts-node/register test/number-comma.spec.ts

# 如果直接这样写，会抛出异常提示 mocha 不是命令
mocha -r ts-node/register test/number-comma.spec.ts
```

`mocha`有一点儿比较好的是提供了`-r`命令来让你手动指定执行测试用例脚本所使用的解释器，这里直接设置为`ts-node`的路径`ts-node/register`，然后就可以在后边直接跟一个文件名（或者是一些通配符）。  

目前我们在项目中批量执行测试用例的命令如下：
```json
{
  "scripts": {
    "test": "mocha -r ts-node/register test/**/*.spec.ts"
  }
}
```

_`npm test`可以直接调用，而不需要添加`run`命令符，类似的还有`start`、`build`等等_  

一键执行以后就可以得到我们想要的结果了，再也不用担心一些代码的改动会影响到其他模块的逻辑了 __（前提是认真写测试用例）__  

![](/images/typescript-usage/mocha-results.png)  

## 小结

做完上边两步的操作以后，我们的项目就实现了100%的`TypeScript`化，在任何地方享受静态编译语法所带来的好处。  
附上更新后的代码含量截图：

![](/images/typescript-usage/new-project-screenshot.png)  

最近针对`TypeScript`做了很多事情，从`Node.js`、`React`以及这次的`Webpack`与`Mocha+Chai`。  
`TypeScript`因为其存在一个编译的过程，极大的降低了代码出bug的可能性，提高程序的稳定度。  
全面切换到`TypeScript`更是能够降低在两种语法之间互相切换时所带来的不必要的消耗，祝大家搬砖愉快。  

### 之前关于 TypeScript 的笔记

- [TypeScript在node项目中的实践](2018/07/21/TypeScript在node项目中的实践)
- [TypeScript在react项目中的实践](2018/08/26/TypeScript在react项目中的实践)

### 一个完整的 TypeScript 示例

[typescript-example](https://github.com/jiasm/typescript-example)

欢迎各位来讨论关于`TypeScript`使用上的一些问题，针对稳重的感觉不足之处也欢迎指出。  

### 参考资料

- [ts-node](https://www.npmjs.com/package/ts-node)
- [configuration-languages | webpack](https://webpack.js.org/configuration/configuration-languages/)
- [mochajs](https://mochajs.org/#getting-started)
- [chaijs](http://www.chaijs.com/api/bdd/)