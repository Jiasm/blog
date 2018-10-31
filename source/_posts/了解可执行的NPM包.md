---
uuid: eb8d4ca0-d8e0-11e8-8d2c-232ee9f7a7bf
title: 了解可执行的NPM包
date: 2018-10-26 13:35:17
tags:
  - node.js
  - npm
---

`NPM`是`Node.js`的包管理工具，随着`Node.js`的出现，以及前端开发开始使用`gulp`、`webpack`、`rollup`以及其他各种优秀的编译打包工具（大多数采用`Node.js`来实现），大家都开始接触到一些`Node.js`，发现了使用`NPM`来管理一些第三方模块会很方便。  
大家搬砖的模式也是从之前的去插件官网下载`XXX.min.js`改为了`npm install XXX`，然后在项目中`require`或者`import`。  

<!-- more -->

当然，`NPM`上边不仅仅存在一些用来打包、引用的第三方模块，还有很多优秀的工具（包括部分打包工具），他们与上边提到的模块的区别在于，使用`npm install XXX`以后，是可以直接运行的。  

## 常见的那些包

可以回想一下，`webpack`官网中是否有过这样的字样：

```bash
> npm install webpack -g

> webpack
```

> 当然，现在是不推荐使用全局安装模式的，具体原因会在下边提到  

以及非全局的安装使用步骤：  

```bash
> npm install webpack
```

然后编辑你的`package.json`文件：  

```diff
{
  "scripts": {
+    "webpack": "webpack"
  }
}
```

再使用`npm run`就可以调用了：

```bash
> npm run webpack
```

> 以上非全局的方案是比较推荐的做法  

不过还可以顺带一提的是在`NPM 5.x`更新的一个新的工具，叫做`npx`，_并不打算细说它，但它确实是一个很方便的小工具，在`webpack`官网中也提到了简单的使用方法_  

就像上边所提到的修改`package.json`，添加`scripts`然后再执行的方式，可以很简单的使用`npx webpack`来完成相同的效果，不必再去修改额外的文件。_（当然，`npx`可以做更多的事情，在这里先认为它是`./node_modules/webpack/bin/webpack.js`的简写就好了）_  

包括其他常用的一些，像`n`、`create-react-app`、`vue-cli`这些工具，都会直接提供一个命令让你可以进行操作。

## 自己造一个简易的工具

最近面试的时候，有同学的回答让人哭笑不得：  

Q：你们前端开发完成后是怎样打包的呢？  
A：`npm run build`。  

[黑人问号脸.png]。经过再三确认后，该同学表示并没有研究过具体是什么，只知道执行完这个命令以后就可以了。  
我本以为这仅仅是网上的一个段子，但没想到真的被我碰到了。_也不知道是好事儿还是坏事儿。。_  

从我个人的角度考虑，还是建议了解下你所使用的工具。_至少看下`scripts`里边究竟写的是什么咯 :)_  
_P.S. `npm scripts`中不仅仅可以执行`NPM`模块，普通的`shell`命令都是支持的_  

### 创建工程

首先的第一步，就是你需要有一个文件夹来存放你的`NPM`包，因为是一个简单的示例，所以不会真实的进行上传，会使用`npm ln`来代替`npm publish` + `npm install`。  

随便创建一个文件夹即可，文件夹的名字也并不会产生太大的影响。  
然后需要创建一个`package.json`文件，可以通过`npm init`来快速的生成，我个人更喜欢添加`-y`标识来跳过一些非必填的字段。  

```bash
> mkdir test-util
> cd test-util
> npm init -y
```

### 创建执行文件

因为我们这个模块就是用来执行使用的，所以有没有入口文件实际上是没有必要的，我们仅仅需要创建对应的执行文件即可，需要注意的一点是：__与普通的`JS`文件区别在于头部一定要写上`#!/usr/bin/env node`__  

```javascript
#!/usr/bin/env node

// index.js
console.log('first util')
```

### 注册执行命令

然后就是修改`package.json`来告诉`NPM`我们的执行文件在哪：  

```diff
{
+  "bin": "./index.js"
}
```

在只有一个`bin`，且要注册的命令与`package.json`中的`name`字段相同时，则可以写成上边那种形式，如果要注册多个可执行命令，那么就可以写成一个`k/v`结构的参数：  

```json
{
  "bin": {
    "command1": "./command1.js",
    "command2": "./command2.js"
  }
}
```

> 调用时就是 command1 | command2

### 模拟执行

接下来我们去找另一个文件夹模拟安装`NPM`模块，再执行`npm ln`就可以了，再执行对应的命令以后你应该会看到上边的`log`输出了：  

```bash
> cd .. && mkdir fake-repo && cd fake-repo
> npm ln ../test-util

> test-util       # global
first util
> npx test-util   # local
first util
```

这样一个最简易的可执行包就创建完成了。  

> npm ln 为 npm link 的简写  
> npm ln <模块路径> 相当于 cd <模块路径> && npm ln + npm ln <模块名>  
> 要注意是 __模块名__，而非文件夹名， __模块名__ 为`package.json`中所填写的`name`字段  

### global 与 local 的区别

因为`npm link`执行的[特性](https://docs.npmjs.com/cli/link#description)，会将`global`+`local`的依赖都进行安装，所以在使用上不太好体现出两者的差异，所以我们决定将代码直接拷贝到`node_modules`下：  

```bash
> npm unlink --no-save test-util      # 仅移除 local 的依赖
> cp -R ../test-util ./node_modules/
> npm rebuild
```

__因为绕过了`NPM`的安装步骤，一定要记得`npm rebuild`来让`NPM`知道我们的包注册了`bin`__  

这时候我们修改脚本文件，在脚本中添加当前执行目录的输出

```diff
#!/usr/bin/env node

- console.log('first util')
+ console.log(process.execPath) // 返回JS文件上层文件夹的完整路径
```

这时再次执行两种命令，就可以看到区别了。  

之所以要提到`global`与`local`，是因为在开发的过程中可能会不经意的在这里踩坑。  
比如说我们在开发`Node`项目时，经常会用到`nodemon`来帮助在开发期间监听文件变化并自动重启。  
为了使用方便，很可能会将预定的一个启动命令放到`npm scripts`中去，类似这样的：  

```json
{
  "script": {
    "start": "nodemon ./server.js"
  }
}
```  

#### 两者混用会带来的问题

这样的项目在你本地使用是完全没有问题的，但是如果有其他的同事需要运行你的这个项目，在第一步执行`npm start`时就会出异常，因为他本地可能并没有安装`nodemon`。  

以及这样的做法很可能会导致一些其它包引用的问题。  
比如说，`webpack`实际上是支持多种语言编写`config`配置文件的，就拿`TypeScript`举例吧，最近也一直在用这个。  

```bash
> webpack --config webpack.config.ts
```

> 这样的命令是完全有效的，webpack 会使用 ts 的解释器去执行对应的配置文件  

因为`webpack`不仅仅支持这一种解释器，有很多种，类似`CoffeeScript`也是支持的。  
所以`webpack`肯定不能够将各种语言的解释器依赖都放到自身的依赖模块中去，而是会根据传入`config`的文件后缀名来动态的判断应该添加哪些解释器，这些在`webpack`的源码中很容易找到：  

1. [获取配置文件后缀](https://github.com/webpack/webpack-cli/blob/master/bin/convert-argv.js#L88)
2. [获取对应的解释器并引入模块注册](https://github.com/webpack/webpack-cli/blob/master/bin/convert-argv.js#L140)

根据`webpack`动态获取解释器的模块[interpret](https://www.npmjs.com/package/interpret)来看，`.ts`类型的文件会引入这些模块：`['ts-node/register', 'typescript-node/register', 'typescript-register', 'typescript-require']`，但是在`webpack`的依赖中你是找不到这些的。  

在源码中也可以看到，`webpack`在执行`config`之前动态的引入了这些解释器模块。  

这里也可以稍微提一下`Node`中引入全局模块的一些事儿，我们都知道，通过`npm install`安装的模块，都可以通过`require('XXX')`来直接引用，如果一些第三方模块需要引入某些其他的模块，那么这个模块也需要存在于它所处目录下的`node_modules`文件夹中才能够正确的引入。  

首先有一点大家应该都知道的，目前版本的`NPM`，不会再有黑洞那样深的`node_modules`了，而是会将依赖平铺放在`node_modules`文件夹下。比如说你引入的模块`A`，`A`的内部引用了模块`B`，那么你也可以直接引用模块`B`，因为`A`和`B`都存在于`node_modules`下。  

还是拿我们刚才做的那个小工具来实验，我们在`fake-repo`中添加`express`的依赖，然后在`test-util`中添加`koa`的依赖，并在`test-util/index.js`中`require`上述的两个模块。  

你会发现，`npx test-util`运行正确，而`test-util`却直接报错了，提示`express`不存在。

我们可以通过`NPM`的一个命令来解释这个原因：  

```bash
> npm root
<current>/node_modules
> npm root -g
<global>/node_modules
```

这样输出两个路径应该就能看的比较明白了，`koa`模块是没有问题的，因为都是存在于这些路径下的`node_modules`，而`express`则只存在于`<current>/node_modules/test-util/node_modules`下，全局调用下，`require`是找不到`express`的。  

```bash
# global 下的结构
.
├── /usr/local/lib/node_modules   # npm root 的位置
│   ├── koa
│   └── test-util                 # 执行脚本所处的位置
└── <workspace>                   # 本地的项目
    ├── node_modules
    │   └── express
    └── .

# local 下的结构
└── <workspace>                   # 本地的项目
    ├── node_modules              # npm root 的位置
    │   ├── koa
    │   ├── test-util             # 执行脚本所处的位置
    │   └── express
    └── .
```

所以这也从侧面说明了为什么`webpack`可以直接在自己的文件中引用并不存在于自己模块下的依赖。  

因为`webpack`认为如果你要使用`TypeScript`，那么一定会有对应的依赖，这个模块就是与`webpack`同级的依赖，也就是说`webpack`可以放心的进行`require`，大致这样的结构：  

```bash
├── node_modules    # npm root 的位置
│   ├── webpack
│   └── typescript
└── .               # 在这里执行脚本
```

以及一个相反的栗子🌰，如果有些依赖在`global`下安装了，但是没有在`local`下进行安装，也许会出现这样的情况，命令直接调用的话，完全没有问题，但是放到`npm scripts`中，或者使用`npx`来进行调用，则发现提示模块不存在各种balabala的异常。  
_P.S. 在`webpack`中，如果模块不存在，并不会给你报错，而是默认按照`JS`的方式进行解析，所以可能会遇到提示语法错误，这时候不用想了，一定是缺少依赖_  

__也可以说`npx`是个好东西，尽量使用`npx`的方式来调用，能少踩一些`global`、`local`的坑__  

## 最终的上线

当然了，真实的开发完一个工具以后，就需要进行提交到`NPM`上了，这个也是一个很简单的步骤，`npm publish`即可，会自动获取`package.json`中的`name`作为包名（重复了会报错）。  

## 小结

总结了一下关于`NPM`可执行的包相关的一些东东，希望能够帮大家简单的理解这是个什么，以及`global`和`local`下一些可能会遇到的问题，希望能够让大家绕过这些坑。  
如文中有误还请指出，`NPM`工具相关的问题也欢迎来讨论。  

### 参考资料

- [npm-bin](https://docs.npmjs.com/cli/bin)
- [webpack-cli](https://github.com/webpack/webpack-cli/blob/master/bin/cli.js)