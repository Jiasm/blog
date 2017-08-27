---
uuid: cd734610-f5ad-11e6-8494-53e907e74ea6
title: React-native踩坑小记
date: 2017-02-18 15:42:30
tags:
---
 
> 最近开始研究ReactNative咯，大概一两周了吧已经，略略说一下遇到的一些坑爹问题  
> 问题一般都出在`android`上。。。最近看GitHub issues最多的一句就是。  
> everything is ok on iOS...  

<!-- more -->
目前我们所做的一个页面，组件嵌套大致如下图：

![](/images/react-native-guide/image-react-native-touch-event.png)

tab切换的在最外层，每一个tab页签对应一个`listview`，同时在`listview`中还嵌套了一个轮播图`swiper`

### 开发过程中遇到了如下几个问题（`android`环境下）：

1.  `swiper`插件无法显示；
2.  `listview`没有弹性边界，无法实现线上的下拉刷新效果；
3.  `swiper`插件和tab-view插件手势冲突；

### 如何填平这几个坑：

#### 1.  swiper插件无法显示：

因为`android`下，`scrollview`与`listview`组件嵌套后会导致`scrollview`内容无法被渲染，所以无法显示。
所以我们将`swiper`挪到了`listview`的header中。（因为`header`被下拉刷新的组件所使用，所以我们重写了插件部分代码，将`swiper`塞了进去）

#### 2.  listview没有弹性边界，无法实现线上的下拉刷新效果：

因为`android`本身就没有滚动到边界还能继续滚动的策略。。这里使用一些`java`补丁代码(列表插件所提供)，来实现弹性边界-。-

#### 3.  swiper插件和tab-view插件手势冲突

因为最外层tab和`swiper`，都用到了滑动切换的特性，然而这个需求在`android`上边实现。。会导致直接滑动外层tab，而不是`swiper`。。。

于是我们开始研究`android`的触摸事件到底是怎么个执行法。
大致是一个先捕获，再冒泡的过程：
1. 最外层组件触发回调，询问是否捕获事件，并阻止事件继续传递。 返回`ture`则是表明捕获事件，事件结束， 返回`false`则事件继续向下询问。
2. 等到捕获阶段全部走完以后，最内层的组件会触发回调，询问是否作为此次触摸操作的事件执行者（消费者），返回`true`则表明对此次事件负责，返回`false`事件则继续向外层冒泡。

##### 在React-native中，View组件有如下几个常用事件：

<small>*争权的几个事件（通过返回值来确定这次操作应该由谁来响应）*</small>
`onStartShouldSetResponder`  
`onMoveShouldSetResponder`  
`onStartShouldSetResponderCapture`  
`onMoveShouldSetResponderCapture`  

##### 触发顺序为（以Start为例）：
1.  外层 `onStartShouldSetResponderCapture` (如果返回true 跳到第4步)
2.  内层 `onStartShouldSetResponderCapture`
3.  内层 `onStartShouldSetResponder` (如果返回true 终止)
4.  外层 `onStartShouldSetResponder`

由于Swiper组件中的广告图涉及到跳转打开网页之类的操作，所以我们引入了`Touch*`组件。
`Touch*` 组件有两个事件是这里我们需要用到的：`onPressIn`和`onPressOut`
这两个事件会在手指按下和抬起时触发；
所以我们需要做的就是在这两个事件中触发锁定和解锁外层`scrollview`的可滚动性。
我们这里使用了`setNativeProps`方法进行锁定`scrollview`。
`setNativeProps`不会触发重绘，直接改变React对象的props值。（为了时效性，等待render的重绘就太慢了。。虽说有的时候手快了，还是会拦截不到事件-.- 然而当我下载了我司客户端后发现有时也会存在这个问题我就坦然了，233333333）
一个简单的阻止外层`scrollview`滑动的[栗子](https://github.com/Jiasm/code-tips/blob/master/React-Native/android-fixs/scrollview-inside-scrollview.js)

### 所使用插件的链接：

1. [当下最好用的列表插件，可高度自定义的上拉刷新和下拉加载样式](https://github.com/react-native-component/react-native-smart-pull-to-refresh-listview)  
2. [支持触摸滑动切换的tab页签，头部可自定义](https://github.com/skv-headless/react-native-scrollable-tab-view)  
3. [目前支持度最高的一个Swiper插件](https://github.com/leecade/react-native-swiper)  

### 结束语：
目前研究ReactNative所遇到的坑就这么几个咯，所幸能够解决这种问题（其实已经耽误了很久了）。
这个页面用到了三个插件。。有两个源码都被针对`android`进行修改（淡淡的忧伤）
