---
uuid: 9672f5b0-8af0-11e7-ab65-ff167b677dac
title: '项目结构——JavaScript版本的2048实现[0]'
date: 2017-08-27 14:25:57
tags: javascript
---

> 最近在看一本书[《HTML5 Canvas开发详解》](https://book.douban.com/subject/26184170/) 看到了一定程度，打算找一个项目练练手
> 遂想到了前几年玩过的一个游戏`2048` 于是开始了尝试实现一个[JavaScript版2048](jiasm.org/2048/)

<!-- more -->

## 项目结构

项目地址：https://github.com/jiasm/2048
LiveDemo: http://jiasm.org/2048

```
.
├── LICENSE
├── README.md
├── dist
│   ├── bundle.js
│   └── main.js.map
├── index.html
├── package.json
├── src
│   ├── Base.js
│   ├── Config.js
│   ├── Utils.js
│   ├── Game.js
│   ├── GameController.js
│   ├── GameRender.js
│   └── index.js
└── webpack.config.js
```

使用`webpack`进行打包，因为有用到了`babel`，所以整体语法采用ES6、ES7写法 *（写起来无比的舒心）*。
*因为该`GitHub`项目设置了`Git Pages` 所以`dist`文件夹就保留在项目中了，没有删除。*

文件夹`src`里边就是所有的代码了。

### Base

一个聊胜于无的基类。。就是让类拥有一个通过`.init`就可以实现实例化对象的功能

```javascript

export default class Base {
  static init (...arg) {
    return new this(...arg)
  }
}

```

### Config

该文件里边存储了一些配置参数，比如默认的矩阵数量、`2048`中各个方块显示的文本&颜色之类的。
方便拿走即用。。修改一个配置文件即可得到你想要的`2048`

### Utils

里边提供了一个`log`方法以及一个增强版的`logMatrix`

- `log`方法只在`window.debug === true`时生效。
- `logMatrix`方法接收一个二维数据，会将数组中的数据格式化后展示出来，方便调试。

### Game

> 该游戏的核心类，生成渲染所需要的二维数据矩阵
> 提供如下几个方法

#### start

初始化一个游戏实例
生成矩阵数据

#### canMove

返回一个`Boolean`值，来确定是否可以继续移动

#### move

将当前矩阵按照传入函数的`direction`来进行移动，并在移动后会随机塞入一个新的`item`

### GameRender

> 用来将矩阵数据渲染到`Canvas`中（由于`Game`实例返回的是一个二维数组，`GameRender`就可以非常灵活的使用了，你也可以选择使用`DOM`来渲染，只不过我本意是要练练`Canvas`，所以选择了这个方案，后期在添加一些动画时差点搞死自己。。。）

该类只提供一个API，那就是`render`，将二维数组渲染至`Canvas`（具体的实现，以后再谈）。

### GameController

> 用来控制与用户的交互

该类是作为一个控制器来存在的。
监听了键盘&触摸的一些事件，并调用`Game`获取数据，遂即调用`GameRender`来进行渲染。

### index

`index`作为应用的入口文件`entries`
只做了两件事：
1. 对界面进行响应式处理。放大`Canvas`为一个正方形
2. 实例化一个`GameController`

## 小记

整体的项目结构就是这些。
开发时间貌似是用了四个晚上，周一到周四，9点-1点。。
这一套做下来，目前是遇到了两个坑：
1. 矩阵合并&移动的逻辑
2. 动画的实现

## 一些还未完成的

1. 本地缓存矩阵数据，防止页面刷新后只能重新开始
2. 积分的统计
