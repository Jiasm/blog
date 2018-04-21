---
uuid: 38c6d450-43e0-11e8-bdca-5b2c3f44a5f0
title: NPM实用指北
date: 2018-04-19 22:44:53
tags:
  node.js
---

`npm`作为下载`node`附送的大礼包，大家一定不会陌生。
然而关于`npm`，估计大量的只是用到`npm install XXX`以及`npm run XXX`。

其实这里边还有很多有意思的命令&参数。
关于`npm`，大概有两个作用：
1. 能让我们很方便的从网上下载第三方包进行实现功能
2. 能够让我们自己编写包，并上传到网上供其他人下载

<!-- more -->

## 下载相关的操作

下载主要就是围绕着`install`这一个命令来的。
> install 可以简写为 i

### 安装原有的依赖包

当我们处于一个项目下时，执行`npm i`即可安装当前项目所有的依赖包。
包含`dependencies`、`devDependencies`、`optionalDependencies`和`bundleDependencies`中的所有。
如果我们在执行`npm i`时添加`--production`的参数，则表示是线上环境，将会忽略`devDependencies`下的所有依赖。

现在我们有如下的`package.json`文件：
```javascript
{
  "dependencies": {
    "koa": "^2.5.0"
  },
  "devDependencies": {
    "eslint": "^4.19.1"
  }
}
```
如果执行`npm i`，则会安装所有的依赖。
```shell
> npm ls --depth=0
├── eslint@4.19.1
└── koa@2.5.0
```

然后我们再尝试添加`--production`参数，使用`--only=prod[uction]`同样可以实现效果。
```shell
> npm ls --depth=0
└── koa@2.5.0
```
使用`--only=dev[elopment]`则用来仅安装`devDependencies`的依赖。
> --depth=XXX 用来设置显示路径的深度，默认会递归将所有的依赖都打印出来。

### 新增依赖的安装

上边是直接安装项目原有依赖的操作，如果我们要新增一些依赖，这里有一些选项可以了解一下。
如果我们在执行`install`添加`--no-save`、`--save-dev`之类的`flag`时，不会直接写入到`dependencies`中，而是有一些其他的处理。

各种选项：

|flag|description|
|:---|:---|
|`--save-prod`|默认选项 对应`dependencies`|
|`--no-save`|不将依赖写进`package.json`|
|`--save-dev`、`-D`|对应`devDependencies`|
|`--save-optional`、`-O`|对应`optionalDependencies`，在安装时可以通过指定`--no-optional`来忽略该模块下的依赖|
|`--save-bundle`、`-B`|对应`bundleDependencies`，*貌似已经被废弃了-.-*|
|`--save-exact`、`-E`|安装精准的某个版本，在版本号处不会添加`^`之类的标识|
|`--global`、`-g`|全局安装包，一般来说需要管理员权限|
*更多的参数请查阅：[https://docs.npmjs.com/cli/install](https://docs.npmjs.com/cli/install)*

> 在`package.json`中经常能看到依赖的版本号前边有一个`^`或`~`。
> `^`和`~`会导致重新安装依赖的时候，按照规则安装最新版。  
> 比如版本号为`^2.1.0`，则会匹配`>=2.1.0 <3.0.0`的所有包
> 如果版本号为`~2.1.0`，则会匹配`>=2.1.0 <2.2.0`的所有包
> 这两个标识的好处是：一个包进行修复`bug`，只更新了最后一位版本号，所有依赖它的包不需要重新上传自己的`package.json`
> 所以说，涉及到可能产生不兼容后果的更新，请一定要修改前两位版本号。。否则就是坑人了-.-

以及我们可以指定安装包时候的`tag`或者`version`

```shell
npm i koa@next
npm i koa@2.0.0
npm i koa@">=2.0.0 <2.5.0"
```

这里的`next`就是一个`tag` *如果不指定的话，有一个默认的`latest`*。
以及第二条指定安装`2.0.0`版本的`koa`。
最后一条则会在范围规则内选择最新的版本进行安装。

## 上传相关的操作

要上传，肯定就要先进行开发。
所以我们上传的整个流程大概是这样的：
1. `npm init`创建`package.json`
2. 进行开发
3. `npm show <你的包名>`，如果404，那么恭喜你，这个名字还没有被占用。
4. `npm publish`，上传包。

### npm init

其实有很多情况下，我们创建`package.json`只是为了安装依赖，但是执行了`npm init`以后却要确认好多次选填内容。
其实如果你添加了一个参数以后，`npm`就不会让你确认这些选填内容了。
`npm init -f`，`--force`、`-y`和`--yes`都可以实现这个效果。
当然，如果你是要将这个文件夹作为一个`pacakge`发出去，则这些选填内容都是需要的。

### 开发包的过程

#### 如何进行本地debug

在开发过程中，为了本地快速进行调试，可以执行这样的命令：
`npm link <你的包名>`
如果在当前包的文件夹中，可以直接执行`npm link`
> 可以简写为`npm ln`

然后在要调试的项目中执行`npm link <你的包名>`
即可创建一个引用本地的链接。
在调试完毕后，执行`npm unlink`来删除链接。

#### 如何创建命令行可执行模块

我们可以在`package.json`中添加`bin`字段，用来指定一个文件。
```javascript
{
  "bin": {
    "sayhi": "bin/hi"
  }
}
```
文件`./bin/hi`：
```javascript
#!/usr/bin/env node

console.log('hi there')
```
如果用过`-g`进行全局安装，就会注册对应的命令，我们在`terminal`中就可以直接执行了。
**`#!/usr/bin/env node`为必须的，路径可能会变**

### npm show

这个方法貌似没有被写在文档里。。但它确实是存在的。
执行`npm show XXX`会返回这个包对应的信息，也可以直接在后边按照`JSON`的格式来进行取值：
```shell
npm show koa version
npm show koa dist-tags.latest
```

### npm publish

当我们的包开发完毕后，就可以执行`publish`来进行上传了。
```shell
npm publish
```
你同样可以在后边指定一个文件夹路径或者压缩包，但都需要这两者包含`package.json`文件（npm包的信息都在这里）

以及，我们可以在后边拼接`--tag=XXX`来上传一个对应的`tag`，如果不写的话，默认会上传到`latest`下。
写`tag`的好处是，我们可以同时维护多份代码，两者互不影响（但是要小心`publish`的时候一定不要忘记`tag`）
就比如去年的`node.js`稳定版还是6，但是`koa`已经开始使用`7.6+`的`async`/`await`特性，所以他们就发布了`koa@next`，也就是现在的`2.x`，用来支持新的语法。

#### 之后的版本更新

如果我们的包放到线上以后，发现了`bug`，我们需要修复它，因为`npm`的限制，所以每次`publish`必须保证`version`的一致性。
`npm`给我们提供了这样三个命令：
1. `npm version patch`
2. `npm version minor`
3. `npm version major`

三个命令依次会修改`version`的第`3.2.1`位。
`major.minor.patch`
##### patch
`patch`为改动最小的，也就是我们上边提到过的`bug`修复，`^`和`~`都会兼容的版本号。

##### minor
如果是`minor`，则会修改中间的版本号，一般来讲，新功能的增加需要修改这个版本号，因为可能会造成之前的使用方式改变。

##### major
最后一个则是很大的更新才会去修改的版本号，例如我们亲爱的`koa`，在抛弃`Generator`拥抱`async`/`await`就是直接发布了`koa2.x`。

执行这三个命令的先提条件是，你当前仓库是不存在未提交的修改的。
因为`npm`会直接帮你修改`version`并增加一条`commit`记录，如果有未提交的修改，可能会导致版本冲突。
在执行完这些命令（或者手动修改版本号也是没问题的），再执行`npm publish`即可上传更新包了。
> 如果想要自定义这次提交的信息的话，可以这样：
> `npm version patch -m "Upgrade version to %s"`
> `%s`会自动被`npm`替换为更新后的版本号提交上去。

**更新时一定记得加对应的`--tag`，否则默认会推到`@latest`上**

### npm scripts

关于`package.json`中的`scripts`，不知道大家了解多少。
如果你的包是上传到`npm`上的，那么其实有很多`scripts`是类似钩子的存在。

#### publish

当你的包执行了`publish`上传到服务器后，这个脚本会执行。
其实我们可以在这个地方执行`git push`操作来将本次的修改直接推到`GitHub`仓库上，节省了一次不必要的命令键入。
或者如果你这个包同时还上传到`apm`或者之类的同类型仓库，也可以直接在这里进行处理（省去多次繁琐的操作）

#### install

这个脚本会在包被安装后执行。
比如说我们使用`Flowtype`开发了一个包，我们可以直接将源码传到`npm`上，然后在`install`命令中执行编译，去除`flow comments`。
> 一些依赖于`node-gyp`的包都会有`install: node-gyp rebuild`的操作。

#### uninstall

如果你的包会对一些全局的数据造成影响（比如某些包可能会去改写`.bashrc`之类的文件）。
这时你可以在`uninstall`脚本中将那些修改项进行还原（*良心操作*）。

> 更多的`scripts`钩子：[https://docs.npmjs.com/misc/scripts](https://docs.npmjs.com/misc/scripts)

## 小记

最近翻看了一下`npm`的文档，发现了很多之前很少用的命令&参数。
觉得`npm`做的真心很不错，原来的一些重复性的工作，其实可以很轻松的使用`npm`相关的命令来解决。
希望大家不要只拿来进行`npm install`。
最后：`NPM Loves You`。

### 参考资料

[https://docs.npmjs.com/cli/init](https://docs.npmjs.com/cli/init)
[https://docs.npmjs.com/misc/developers](https://docs.npmjs.com/misc/developers)
[https://docs.npmjs.com/cli/version](https://docs.npmjs.com/cli/version)
