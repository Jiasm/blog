---
uuid: 38c6d450-43e0-11e8-bdca-5b2c3f44a5f0
title: NPM实用指北
date: 2018-04-19 22:44:53
tags:
  node.js
---

`npm`作为下载`node`附送的大礼包，大家一定不会陌生。
然而关于`npm`，估计大量的只是用到`npm install XXX`以及`npm run XXX`。

其实这里边还有很多有意思的命令。
关于`npm`，大概有两个作用：
1. 能让我们很方便的从网上下载第三方包进行实现功能
2. 能够让我们自己编写包，并上传到网上供其他人下载

<!-- more -->

## 下载相关的操作

下载主要就是围绕着`install`这一个命令来的。
> install 可以简写为 i

当我们处于一个项目下时，执行`npm i`即可安装当前项目所有的依赖包。
包含`dependencies`、`devDependencies`、`optionalDependencies`和`optionalDependencies`中的所有。

当然，我们也可以只安装部分依赖。
如果我们在执行`install`添加`--save-save-prod`或`--save-dev`的`flag`时，则只会安装对应环境下的依赖。
> --save 对应 dependencies
> --save-dev 对应 devDependencies
