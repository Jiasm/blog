---
uuid: 82562a30-6672-11e8-86f5-ffae14b06dea
title: Flex入坑指南
date: 2018-06-02 22:37:43
tags:
  - css
---

弹性布局`flex`是一个几年前的CSS属性了，说它解放了一部分生产力不为过。*至少解放了不少CSS布局相关的面试题 :)*  
之前网上流行的各种*XX布局*，什么`postion: absolute`+`margin`，`float`+`padding`，各种都可以使用`flex`来取代之。  
早两年在使用的时候，还是会担心有兼容性问题的，某些手机在使用了`auto-prefixer`以后依然会出现不兼容的问题。  
好在现在已经是2018年了，不必再担心那些老旧的设备，希望这篇文章能帮你加深对`flex`的认识。

<!-- more -->

## 准备工作

首先，`flex`被称为一个弹性盒模型，也有称弹性布局的。  
总之，盒子也好、布局也罢，我们总是需要有一个容器`Container`的：  

```html
<div class="container"></div>
```

以及如果单纯的只是一个容器的话，是没有任何意义的。  
所以我们还需要有一些内容：  

```html
<div class="contianer">
  <div class="item"></div>
  <div class="item"></div>
</div>
```

## 基本语法

现在我们已经有一个可以用来写`flex`布局的`html`结构。  
接下来就是一个最基础的`flex`布局的实现：  

```html
<style>
  .container {
    display: flex;
  }

  .item {
    flex: 1;
  }
</style>
<div class="contianer">
  <div class="item"></div>
  <div class="item"></div>
</div>
```

我们在容器上使用`display: flex`来告诉浏览器，这是一个`flex`布局的开始。  
然后给所有的`item`添加一个`flex: 1`的属性，来表明，我们这里边的元素都是`flex`布局中的内容，  
我们会沿着**主轴**来**平分**所有的区域，就这样，我们已经实现了一个多列等宽布局。  

## flex属性

因为`flex`布局分为了容器和内容两块，各自有各自的属性，所以就先从容器类的说起。  

### 容器相关的flex属性

当然了，能这么轻易的实现上边的需求，是依赖于很多默认属性值。  
比如，为什么我们的子元素会横向的进行分割空间，而不是竖向的，这里就用到了一个属性的默认值：  

#### flex-direction

`flex-direction`用于定义`flex`布局中的主轴方向。  
默认取值为`row`，是横向的，表示从左到右，也就是说我们的所有子元素会按照从左到右的顺序进行排列。  
我们可以通过设置值为`column`来改变主轴的方向，将其修改为从上到下。（改变`flex-direction`的值会影响到一些相关的属性，会在下边说到）  

`flex-direction`共有四个有效值可选：
1. `row` 默认值，从左到右
2. `row-reverse` 从右到左
3. `column` 从上到下
4. `column-reverse` 从下到上

*P.S. 在React-Native中默认的主轴方向为`column`*

所以说`flex-direction`的作用就是：**定义容器中元素的排列方向**  

####  justify-content

这个会定义我们的子元素如何沿着主轴进行排列，因为我们上边是直接填充满了父元素，所以不太能看出效果。  
所以我们对代码进行如下修改：  
```html
<style media="screen">
  .container {
    display: flex;
  }

  .item {
    width: 100px;
  }
</style>
<div class="container">
  <div class="item">Item 1</div>
  <div class="item">Item 2</div>
</div>
```
将所有的子元素都改为固定的宽度，也就是说，如果父元素有剩余空间的话，就会空在那里。  
`justify-content`的默认取值为`normal`，也可以认为就是`start`了。。也就是根据主轴的方向(`flex-direction`)堆在起点处。  

几个常用的取值：
1. `center` 必然首选的是`center`，能够完美的实现沿主轴居中，可以认为是`left: 50%`+`transform: translateX(-50%)`的实现。  
2. `flex-start` 沿着主轴从行首开始排列
3. `flex-end` 沿着主轴从行末开始排列

以及几个不太常用的取值：
1. `space-between` 将剩余空间在子元素中间进行平分，保证沿主轴两侧不会留有空白。  
2. `space-around` 将剩余空间均匀的分布在所有的子元素沿主轴方向的两侧，也就是说，主轴两侧也会有空白，但是必然是中间空白的`1/2`大小。  
3. `space-evenly` 将剩余空间在所有元素之间平均分配，主轴两侧的空白面积也会与中间的面积相等。  

三种效果的示例：  
![](https://os4ty6tab.qnssl.com/test/atom-editor/knki.png)

##### Warning

有一点需要注意，`justify-content`的取值都是依照`flex-direction`所定义的主轴方向来展示的。  
也就是说，`center`在默认情况下用于水平居中，在`flex-direction: column-*`时，则是作为垂直居中来展示的。  

#### align-content

#### flex-wrap

#### flex-flow

#### place-content

### 子元素的属性们

#### flex

#### flex-grow

#### flex-shrink

#### flex-basis

#### align-items

#### align-selfs

#### order
