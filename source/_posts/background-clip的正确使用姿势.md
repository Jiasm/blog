---
uuid: 1079c310-a4c4-11e7-928e-7d9b11812f27
title: background-clip的正确使用姿势
date: 2017-09-29 11:12:45
tags:
  - CSS
  - webkit
---

> 前几天遇到一个问题：问如何通过背景色来显示相反的文本颜色。  
> 如果通过JS的话，可以灰常轻松的解决这个问题，但是纯用`CSS`的话也不是不可能的。  
> 这就需要用到今天的主角`background-clip`了。

<!-- more -->

## background-clip是个啥

`background-clip`可以用来控制背景图片／颜色的填充范围。  
我们知道，默认的`background`会填充盒模型的`content`+`padding`+`border`区域内。*（可以将`border`颜色设为透明进行观察）*
![image](https://user-images.githubusercontent.com/9568094/31004045-4c15cd4e-a4b8-11e7-9345-51e60433d81a.png)  
![image](https://user-images.githubusercontent.com/9568094/31004440-08d589d2-a4ba-11e7-882d-2b7ec06d2b2f.png)  

现在，我们可以通过设置`background-clip`来控制背景填充的范围。

## background-clip的有效属性值

### border-box

设置填充范围到`border`，这个也是默认的选项。  
图中的`border`应为浅灰色，因为后边有蓝色的背景色，所以导致`border`颜色变成了深蓝色。
![image](https://user-images.githubusercontent.com/9568094/31004753-5dbef9c8-a4bb-11e7-8cc7-3782c35520b1.png)

### padding-box

设置填充范围到`padding`，也就是说，`border`将不会有`background`的填充。
![image](https://user-images.githubusercontent.com/9568094/31004783-84850ba6-a4bb-11e7-9d1e-2cd16bb9c017.png)

### content-box

仅填充`content`区域。。
![image](https://user-images.githubusercontent.com/9568094/31004815-98d8afcc-a4bb-11e7-9d1a-9c1ada0367f3.png)

### text

最后一个属性值，目前`webkit`上还没有标准版的实现，只能通过`-webkit-background-clip`来使用。  
想要看到效果，我们需要将字体颜色设为透明 or 半透明。  
效果如下：
![image](https://user-images.githubusercontent.com/9568094/31004960-43a69964-a4bc-11e7-801a-ef21d797c43f.png)

来一个四种效果的对比图：
![image](https://user-images.githubusercontent.com/9568094/31005151-18023d58-a4bd-11e7-95d7-f6d9b60cf166.png)
*[截图来自MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/background-clip)*

## 回到之前的问题

最开始我们说过的那个问题，如何根据背景色来显示反色文本。  
实现方式如下：
1. `background-color: inherit`来继承父元素的属性值。
2. `background-clip: text`来确保背景色只会填充到文字区域
3. `color: transparent`来将文本颜色设为透明
4. `filter: invert(100%)`来实现反色滤镜

<iframe height='265' scrolling='no' title='aLWWeR' src='http://codepen.io/Jiasm/embed/aLWWeR/?height=265&theme-id=0&default-tab=css,result&embed-version=2' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'>See the Pen <a href='https://codepen.io/Jiasm/pen/aLWWeR/'>aLWWeR</a> by 贾顺名 (<a href='https://codepen.io/Jiasm'>@Jiasm</a>) on <a href='https://codepen.io'>CodePen</a>.
</iframe>

## 做更多的事

通过`background-clip: text`可以做很多有意思的事儿，比如说渐变色的文字。
结合着`animation`甚至可以实现动态的渐变色字体。
> P.S. [Animate.css](https://daneden.github.io/animate.css/)首页的标题效果就是通过这个方式来实现的。  

<iframe height='265' scrolling='no' title='GMoXaM' src='http://codepen.io/Jiasm/embed/GMoXaM/?height=265&theme-id=0&default-tab=css,result&embed-version=2' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'>See the Pen <a href='https://codepen.io/Jiasm/pen/GMoXaM/'>GMoXaM</a> by 贾顺名 (<a href='https://codepen.io/Jiasm'>@Jiasm</a>) on <a href='https://codepen.io'>CodePen</a>.
</iframe>
