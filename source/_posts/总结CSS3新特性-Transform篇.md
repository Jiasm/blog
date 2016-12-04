---
uuid: 976f20d0-b97a-11e6-af16-0f1458ec82ae
title: 总结CSS3新特性(Transform篇)
date: 2015-07-20 17:20
tags: css
---

### 概述:

CSS3新添加的Transform可以改变元素在可视化区域的坐标(这种改变不会引起文档的重排,只有重排),以及形状,还有些3D形变.结合 Animation(这里以后会有个链接的) 能实现酷炫的动画;
<!-- more -->

### 旋转(rotate):

rotate支持一个参数,一个角度值 0-360deg

```css
#demo{
  transform: rotate(180deg);/*实现旋转,左上角的东西会在右下角显示*/
}
```
![](/images/summary-css-new-feature-transforms/screen-shot-1.png)
### 缩放(scale):

scale支持两个参数(x,y),如果没有填y的话,则取x的值;1为正常,&lt;1为缩放,&gt;1为放大;

```css
#demo{
  transform: scale(1.2);/*放大1.2倍*/
  transform: scale(.8);/*缩小为正常的0.8倍*/
}
```
![](/images/summary-css-new-feature-transforms/screen-shot-2.png)

scale提供两个子方法,scaleX,scaleY,用来分别设置x或y的缩放;

### 倾斜(skew):

skew支持两个参数(x,y),参数类型为角度(deg),如果不填y的话,则默认为0(与缩放不同);

```css
#demo{
  transform:skew(45deg);/*文本沿x轴向左倾斜45°*/
  transform:skew(0,45deg);/*文本沿y轴向下倾斜45°*/
}
```
![](/images/summary-css-new-feature-transforms/screen-shot-3.png)

如果仅设x或y,可直接使用两个子方法,skewX与skewY;

### 平移(translate):

translate接收两个参数(x,y)为平移的距离,如不填y值,则默认为0,支持所有CSS内有效的长度单位(使用translate用来移动元素不会触发重排,只有重绘);

```css
#demo{
  transform:translate(20px,5vh);/*向左移动二十像素,向下移动百分之五的视窗高度*/
}
```

同样有两个子方法,translateX,translateY;

做了一个[简单的小例子](http://sandbox.runjs.cn/show/khlxer9k),用了rotate;

### 总结:

用Transform可以做出很多酷炫的事情,(跳过了matrix,matrix3d没有说...)当然了,不要像我这样作死
![](/images/summary-css-new-feature-transforms/screen-shot-4.gif)

相关参考文档:

[MDN的Transform](https://developer.mozilla.org/zh-CN/docs/Web/CSS/transform)

[w3school的Transform](http://www.w3school.com.cn/cssref/pr_transform.asp)

[W3的文档](http://drafts.csswg.org/css-transforms/)

 
