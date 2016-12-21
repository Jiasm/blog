---
uuid: c0515f30-c6b4-11e6-b953-a17ab9df4636
title: 如何使用CSS绘制一个响应式的矩形
date: 2016-12-20 21:03:50
tags: css3
---

## 背景：
最近因为需要用到绘制类似九宫格的需求，所以研究了一下响应式矩形的实现方案。

有如下几种方案：
1. 使用js来设置元素的高度
2. 使用vw单位 `div {width: 50vw; height: 50vw;}`
3. 使用伪元素设置padding的方式来实现正方形（也就是本次使用的方式）
<!-- more -->

## 实现一个正方形

```sass
.square
  position: relative
  width: 100%

  &::before
    content: ''
    display: block
    padding-top: 100%
```
```html
<div class="square"></div>
```

我们的做法就是使用伪元素的`padding-top: 100%`来撑开元素本身。

因为`pading-top`与`padding-bottom`的[百分比取值来自于元素的宽度](https://www.w3.org/TR/css3-box/#namepadding-top)，所以，设置值为`100%`就实现了我们想要的功能。

## 实现更多的功能

想要实现更多比例的形状，其实就是修改`::before`中的`pading-top`或者`padding-bottom`的值即可。

```sass
// 16: 9
.square::before
  padding-top: (9 / 16 * 100%)

// 4: 3
.square::before
  padding-top: (3 / 4 * 100%)

// 1: 2
.square::before
  padding-top: 200%
```

当然，上边的实现都只是一个简单的矩形，如果你的矩形里边还要有一些内容的话，需要给元素添加以下几个属性：

```sass
.content
  position: absolute
  top: 0
  right: 0
  bottom: 0
  left: 0
```

```html
<div class="square">
  <div class="content">
    Awesome
  </div>
</div>
```

要注意的有以下几点：
1. IE7-不支持
2. 元素不要设置`height`以及`overflow: hidden`

## 参考资料

[w3-padding](https://www.w3.org/TR/css3-box/#namepadding-top)
