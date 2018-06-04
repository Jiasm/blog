---
uuid: 82562a30-6672-11e8-86f5-ffae14b06dea
title: Flex入坑指南
date: 2018-06-03 19:37:43
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

下边的所有例子基本都是基于以上DOM结构来做的。  

## 基本语法

现在我们已经有一个可以用来写`flex`布局的`html`结构。  
接下来就是一个最基础的`flex`布局的实现：  

```html
<style>
  .container {
    display: flex;
    height: 50px;

    color: #fff;
    border: 1px solid #03a9f4;
  }

  .item {
    flex: 1;

    text-align: center;
    background: #03a9f4;
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

关于`flex`，最重要的就是要记住他有两条轴线（主轴、交叉轴），绝大部分属性都是依赖于轴线的方向。  
![](https://mdn.mozillademos.org/files/12998/flexbox.png)  
> 图片来自[MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Flexible_Box_Layout/Using_CSS_flexible_boxes)  

因为`flex`布局分为了容器和内容两块，各自有各自的属性，所以就先从容器类的说起。  

## 容器相关的flex属性

实现上边的需求，是依赖于很多默认属性值。  
比如，为什么我们的子元素会横向的进行分割空间，而不是竖向的，这里就用到了一个属性的默认值：  

### flex-direction

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

### flex-wrap

该属性用于定义当子元素沿着主轴超出容器范围后，应该按照怎样的规则进行排列。  
该属性只有简单的三个取值：

1. `wrap` 超出主轴范围后换行显示，换行方向按照交叉轴的方向来（*默认情况下就是折行到下一行*）
2. `wrap-reverse` 超出主轴范围后换行显示，但是方向是交叉轴的反向（*也就是默认情况下第一行会出现在最下边*）
3. `nowrap` 即使超出容器也不会进行换行，而是尝试压缩内部flex元素的宽度（*在下边的子元素相关的属性会讲到*）

三种取值的示例：
![](https://os4ty6tab.qnssl.com/test/atom-editor/g0no.png)

### flex-flow

`flex-flow`是一个简写的属性，适用于上边提到的`flex-direction`和`flex-wrap`  

语法：
```css
selector {
  flex-flow: <flex-direction> <flex-wrap>;
}
```

###  justify-content

这个会定义我们的子元素如何沿着主轴进行排列，因为我们上边是直接填充满了父元素，不太能看出效果。  
所以我们对代码进行如下修改：  
```html
<style media="screen">
  .container {
    display: flex;
    width: 400px;

    color: #fff;
    border: 1px solid #03a9f4;
  }

  .item {
    /* flex: 1; */
    width: 100px;

    text-align: center;
    background: #03a9f4;
  }
</style>
<div class="container">
  <div class="item">Item 1</div>
  <div class="item">Item 2</div>
  <div class="item">Item 3</div>
</div>
```
将所有的子元素都改为固定的宽度，也就是说，如果父元素有剩余空间的话，就会空在那里。  
`justify-content`的默认取值为`normal`，也可以认为就是`start`了，也就是根据主轴的方向(`flex-direction`)堆在起始处。  

几个常用的取值：
1. `center` 必然首选的是`center`，能够完美的实现沿主轴居中  
2. `flex-start` 沿着主轴从行首开始排列
3. `flex-end` 沿着主轴从行末开始排列

以及几个不太常用的取值：
1. `space-between` 将剩余空间在子元素中间进行平分，保证沿主轴两侧不会留有空白。  
2. `space-around` 将剩余空间均匀的分布在所有的子元素沿主轴方向的两侧，也就是说，主轴两侧也会有空白，但是必然是中间空白的`1/2`大小。  
3. `space-evenly` 将剩余空间在所有元素之间平均分配，主轴两侧的空白面积也会与中间的面积相等。  

六种效果的示例：  
![](https://os4ty6tab.qnssl.com/test/atom-editor/6dn.png)

#### Warning

有一点需要注意，`justify-content`的取值都是依照`flex-direction`所定义的主轴方向来展示的。  
也就是说，`center`在默认情况下用于水平居中，在`flex-direction: column-*`时，则是作为垂直居中来展示的。  

### align-content

同样的，`align-content`也是用来控制元素在交叉轴上的排列顺序，但是既然会出现两个属性（`align-items`和`align-content`），势必两者之间会有一些区别。  

因为`align-content`只能作用于多行情况下的`flex`布局，所以取值会更接近额旋转后的`justify-content`，同样的可以使用`space-between`之类的属性值。  

因为取值基本类似，所以不再重复上边`justify-content`所列的表格，直接上效果：  
![](https://os4ty6tab.qnssl.com/test/atom-editor/bafa.png)

### align-items

`align-items`与上边的`justify-content`类似，也适用于定义子元素的排列方式。  
不同的是，`align-items`作用于交叉轴（也就是默认`flex-direction: row`情况下的从上到下的那根轴线）  
目测平时用到的最多的地方就是水平居中吧（*我现在懒的：只要有图标、表单 & 文字 的单行混合，都会选择`align-items: center`来实现:)*）

常用的取值：

1. `center` 常用来做垂直(*交叉轴*)居中
2. `flex-start` 沿着交叉轴的起始位置排列  
3. `flex-end` 与`flex-start`方向相反  
4. `stretch` 将元素撑满容器的交叉轴宽度（*在默认情况下，这里指容器的高度，但是如果单纯的说这条轴线，我觉得宽度更合适一些*）  
5. `baseline` 将元素按照文本内容的基线进行排列

以上取值的示例：  
![](https://os4ty6tab.qnssl.com/test/atom-editor/l6ri.png)

#### align-content与align-items的异同

两者的相同点在于，都是设置元素在交叉轴上的排列顺序。  
而区别在于以下两点：
1. `align-content`只能应用于多行的情况下
2. `align-content`会将所有的元素认为是一个整体并进行相应的处理、而`align-items`则会按照每一行进行处理：  
![](https://os4ty6tab.qnssl.com/test/atom-editor/cvld.png)

### place-content

`place-content`可以认为是`justify-content`和`align-content`的简写了（*事实上就是*）

语法为：
```css
selector {
  place-content: <align-content> <justify-content>;
}
```

*P.S. 如果单行(元素)想要实现居中还是老老实实的使用`align-items`+`justify-content`吧 :)*

## 子元素的属性们

有关容器的所有属性都已经列在了上边，下边的一些则是在容器内元素设置的属性。

### flex-grow

`flex-grow`用来控制某个子元素在需要沿主轴填充时所占的比例，取值为正数（浮点数也可以的）。  

```css
selector {
  flex-grow: 1;
  flex-grow: 1.5;
}
```

举例说明：  
如果一个容器中有三个元素，容器剩余宽度为100px，三个元素需要进行填充它。  
如果其中一个元素设置了`flex-grow: 2`，而其他的设置为`1`(*默认不设置的话，不会去填充剩余宽度*)  
则会出现这么一个情况，第一个元素占用`50px`，而其他两个元素各占用`25px`。  

![](https://os4ty6tab.qnssl.com/test/atom-editor/tcd0.png)

#### Warning

这里需要注意的一点是，`flex-grow`定义的是对于剩余宽度的利用。  
元素自身占用的空间不被计算在内，为了验证上边的观点，我们进行一个小实验。  
给每一个元素设置一个`padding-left: 20px`，保证元素自身占用`20px`的位置，然后分别设置`flex-grow`来查看最后元素的宽度是多少。  

```css
.container {
  display: flex;
  width: 160px;
  height: 20px;
  align-items: stretch;
}

.item {
  flex-grow: 1;
  padding-left: 20px;
}

.item:first-of-type {
  flex-grow: 2;
}
```

![](https://os4ty6tab.qnssl.com/test/atom-editor/4fc7.png)
![](https://os4ty6tab.qnssl.com/test/atom-editor/3jm1.png)

我们给容器设置了宽度为`160px`（为了方便的减去`padding-left`计算）。  
最后得到的结果，设置了`flex-grow: 2`的元素宽度为`70px`，而设置`flex-grow: 1`的元素宽度为`45px`。  
在减去了自身的`20px`以后，`50 / 25 === 2 // true`。  

### flex-shrink

`flex-shrink`可以认为是与`flex-grow`相反的一个设置，取值同样是正数。  
用来设置当容器宽度小于所有子元素所占用宽度时的缩放比例。  
比如说，如果我们的容器宽为`100px`，三个元素均为`40px`，则会出现容器无法完全展示所有子元素的问题。  
所以默认的`flex`会对子元素进行缩放，各个元素要缩放多少，则是根据`flex-shrink`的配置来得到的（*默认为1，所有元素平均分摊*）  
就像上边的例子，如果我们还是三个元素，第一个设置了`flex-shrink: 2`，则最终得到的结果，第一个元素宽度为`30px`，其余两个元素的宽度为`35px`。

```css
.container {
  display: flex;
  width: 100px;
  height: 20px;
  align-items: stretch;
}

.item {
  width: 40px;
  /* flex-shrink: 1; it's default value */
  font-size: 0;
  background: #03a9f4;
}

.item:first-of-type {
  flex-shrink: 2;
}
```

![](https://os4ty6tab.qnssl.com/test/atom-editor/1s06.png)
![](https://os4ty6tab.qnssl.com/test/atom-editor/8rro.png)

### flex-basis

这个属性用来设置元素在`flex`容器中所占据的宽度（默认主轴方向），这个属性主要是用来让`flex`来计算容器是否还有剩余面积的。  
默认取值为`auto`，则意味着继承`width`（`direction: column`时是`height`）的值。
一般来讲很少会去设置这个值。

### flex

`flex`则是上边三个属性的简写，语法如下：
```css
selector {
  flex: <flex-grow> <flex-shrink> <flex-basis>;
}
```

一般来讲如果要写简写的话，第三个会选择设置为`auto`，也就是获取元素的`width`。  

### align-self

效果如同其名字，针对某一个元素设置类似`align-items`的效果。  
取值与`align-items`一致，比如我们可以针对性的实现这样的效果：  
```css
.center :first-child {
  align-self: stretch;
}

.flex-start :first-child {
  align-self: flex-end;
}

.flex-end :first-child {
  align-self: flex-start;
}

.stretch :first-child {
  align-self: center;
}
```
![](https://os4ty6tab.qnssl.com/test/atom-editor/83evalign-self-example-1)

### order

以及最后这里还有一个`order`属性，可以设置在展示上的元素顺序。  
取值为一个任意整数。  

默认的取值为`1`，如果我们想要后边的元素提前显示，可以设置如下属性：
```css
.item:last-of-type {
  order: -1;
}
```
![](https://os4ty6tab.qnssl.com/test/atom-editor/92r4.png)

*P.S. 这个顺序的改变只是显示上的，不会真正的改变html的结构，比如，你依然不能通过`.item:last-of-type ~ .item`来获取它在视觉上后边的兄弟元素*  
*当order重复时，按照之前的顺序排列大小*

## 总结

`flex`相关的属性如何拆分以后，并不算太多。  
脑海中有主轴和交叉轴的概念之后，应该会变得清晰一些。  
关于上述所有属性的一个简单总结：

### 容器相关

属性名|作用
:--|:--
`flex-direction`|用来设置主轴的方向，最基础的属性，默认从左到右，此属性一改，下列所有的属性都要跟着改，真可谓牵一发而动全身
`flex-wrap`|设置元素超出容器后的换行规则，默认不换行
`justify-content`|设置沿主轴的排列规则
`align-content`|设置沿交叉轴的排列规则
`align-items`|以行（默认`direction`情况下）为单位，设置沿交叉轴的排列规则

### 元素相关

属性名|作用
:--|:--
`flex-grow`|当容器大于所有元素时，按什么比例将剩余空间分配给元素
`flex-shrink`|当容器小于所有元素时，元素按照什么比例来缩小自己
`flex-basis`|很少用的属性，设置在容器中的宽(高)
`align-self`|针对某些元素单独设置`align-items`相关的效果
`order`|设置元素在显示上的顺序


### 简写

属性名|作用
:--|:--
`flex-flow`|`flex-direction`与`flex-wrap`的简写
`place-content`|`justify-content`与`align-content`的简写
`flex`|`flex-grow`、`flex-shrink`与`flex-basis`的简写

以及文中所有的示例代码都在这里 [code here](https://github.com/jiasm/notebook/tree/master/html/flex)。  

### 参考资料

1. [How Flexbox works ](https://medium.freecodecamp.org/an-animated-guide-to-flexbox-d280cf6afc35)*(此文中的一些gif图真心赞)*
2. [Understanding Flexbox: Everything you need to know](https://medium.freecodecamp.org/understanding-flexbox-everything-you-need-to-know-b4013d4dc9af)
3. [Learn CSS Flexbox in 5 Minutes](https://medium.freecodecamp.org/learn-css-flexbox-in-5-minutes-b941f0affc34)

*P.S. 先立一个flag，后续还会出一篇各种flex的真实场景应用，毕竟，纸上谈兵没有意义*
