---
uuid: 94c33ab0-b97a-11e6-bf72-f9ea175bd9fc
title: 总结CSS3新特性(颜色篇)
date: 2015-07-14 15:56
tags: css
---
### 颜色:
 
CSS3新增加了hsl(), hsla(), rgb(),rgba()四个函数来创建color值;

#### hsl():

hsl函数:h(色调),s(饱和度),l(亮度);

色调:为0-360之间的数值[经实验,可以为小数];

饱和度与亮度:均为百分比;
<!-- more -->

下图截自[http://www.w3.org/wiki/CSS/Properties/color/HSL](http://www.w3.org/wiki/CSS/Properties/color/HSL)
![](/images/summary-css-new-feature-colors/screen-shot-1.png)
当亮度为100%时为白色,当亮度为0%为黑色;

饱和度100%以及亮度50%时生成的颜色均为[web安全色](http://www.bootcss.com/p/websafecolors/)

#### rgb():

rgb函数:r(red),g(green),b(blue)[计算机三原色];

值可以为0-255任意整数或百分比;

如超出范围,取最近的有效值:

```css
em{color:rgb(300,0,0)}/* clipped to rgb(255,0,0) */
em{color:rgb(255,-10,0)}/* clipped to rgb(255,0,0) */
em{color:rgb(110%, 0%, 0%)}/* clipped to rgb(100%,0%,0%) */
```

下图截自[http://www.w3.org/wiki/CSS/Properties/color/RGB](http://www.w3.org/wiki/CSS/Properties/color/RGB)
![](/images/summary-css-new-feature-colors/screen-shot-2.png)
有一点需要注意,百分比与数值不能同时出现在一个rgb函数中;

#### rgba()与hsla():

这两位与上边两位的区别在于后边的a(alpha)透明度;

透明度为0-1之间的数值,0为全透明,1为全不透明,利用透明度可以做出很多好看的效果

[一个简单的例子](http://sandbox.runjs.cn/show/kwnceyon)(当然了- -这个例子不算好看)

   

上例中用到了一个类似于变量的单词(currentColor[大小写不区分])

currentColor可用于所有设置颜色属性的地方.

取值为当前元素的color属性值,如果没有,寻找父级,一直到根元素,如果都没有设置的话,不要担心,还有浏览器代理的默认颜色.

w3官方有一个简短的解释,如果元素color属性值为currentColor的话,则视为 'color:inherit';

比较实用的一个地方就是,设置元素边框颜色,颜色(color),等等属性时,只需设置颜色(color);后续更改时也只需修改一处,子元素也可直接继承使用currentColor,但需要确保子元素没有显示声明color属性值;

还有用到了两个长度单位(vw,vh)取值范围[0-100]

100vw为屏幕宽度;

100vh为屏幕高度;

还存在两个值,vmax与xmin,分别是取出宽高最大或最小值;

vw与vh可参与[calc()](http://www.cnblogs.com/jiasm/p/4633603.html)的计算;

顺便介绍下 opacity:

opacity用来设置元素的透明度:(取值为0-1)
![](/images/summary-css-new-feature-colors/screen-shot-3.png)
IE8可用替代的
```css
filter:Alpha(opacity=50)/*0-100*/
```

来实现透明度;

颜色基本上就这些了,如有错误或补充还请指出(无视transparent...)

[参考资料](http://www.w3.org/wiki/CSS3/Color)
