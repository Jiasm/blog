---
uuid: 931a6cb0-b97a-11e6-8577-9502afb180f1
title: 总结CSS3新特性(媒体查询篇)
date: 2015-07-16 16:58
tags: css
---

CSS3的媒体查询是对CSS2[媒体类型](http://www.w3.org/TR/REC-CSS2/media.html)的扩展,完善;

CSS2的媒体类型仅仅定义了一些设备的关键字,CSS3的媒体查询进一步扩展了如width,height,color等具有取值范围的属性;

media query 与 media type 的区别在于: media query是一个值或一个范围的值,而media type仅仅是设备的匹配(所以media type 是一个单词,而media query 后边需要跟着一个数值,两者可以混合使用);

media可用于link标签属性 [media]
<!-- more -->

```html
<link rel="stylesheet"type="text/css"href="../css/print.css"media="print and (max-width : 600px)"/>
```

以及css文件内,下边代码均是使用css内media;

介绍一下可用的运算符&常用的media type以及media query:

### 运算符:

#### and:

and运算符用于符号两边规则均满足条件则匹配

```css
@media screen and (max-width: 600px){/*匹配宽度小于600px的电脑屏幕*/}
```
#### not:

not运算符用于取非,所有不满足该规则的均匹配

```css
@media not print{/*匹配除了打印机以外的所有设备*/}
```

使用not时请注意,如果不加括号,也许会产生一些奇怪的现象,例:

```css
@media not all and (max-width: 500px){}
/*等价于*/
@media not (all and (max-width: 500px)){}
/*而不是*/
@media(not all) and (max-width: 500px){}
```

所以,如果要使用not,还是显式的添加括号比较明确点

#### ,(逗号):

相当于 or 用于两边有一条满足则匹配

```css
@media screen , (min-width: 800px){
  /*匹配电脑屏幕或者宽度大于800px的设备*/
}
```

### Media Type(只说几个常用的,其余会给出链接):

#### All:

all是默认值,匹配所有设备;

```css
@media all{
  /* 可以过滤不支持media的浏览器 */
}
```

#### Screen:

匹配电脑屏幕;

#### Print:

匹配打印机(打印预览时也会匹配)[本人简历专门为print做了一套样式~]

常用的一般就这三个type,其余Media Type 有兴趣的可以看下 [W3School的说明](http://www.w3school.com.cn/html5/att_a_media.asp)或[W3的文档](http://www.w3.org/TR/REC-CSS2/media.html)

### Media Query(也是说一些常用的): //需要注意的是,Media Query必须要加括号,一个括号是一个query

#### max-width(max-height):

```css
@media (max-width: 600px){
  /*匹配界面宽度小于600px的设备*/
}
```

#### min-width(min-height):

```css
@media (min-width: 400px){
  /*匹配界面宽度大于400px的设备*/
}
```

#### max-device-width(max-device-height):

```css
@media (max-device-width: 800px){
  /*匹配设备(不是界面)宽度小于800px的设备*/
}
```

#### min-device-width(min-device-height):

```css
@media (min-device-width: 600px){
  /*匹配设备(不是界面)宽度大于600px的设备*/
}
```

做移动开发时用device-width/device-height,比较好一点吧,因为有些手机浏览器默认会对页面进行一些缩放,所以按照设备宽高来进行匹配会更接近开发时所期望的效果;

给出全部的Media Query属性值的链接 [W3的文档](http://www.w3.org/TR/2012/REC-css3-mediaqueries-20120619/) 也可以看看MDN的,有志愿者汉化了 [MDN Media Query 文档](https://developer.mozilla.org/zh-CN/docs/Web/Guide/CSS/Media_queries)

media是可以嵌套的:

```css
@media not print{
  /*通用样式*/
  @media (max-width:600px){
    /*此条匹配宽度小于600px的非打印机设备*/
  }
  @media (min-width:600px){
    /*此条匹配宽度大于600px的非打印机设备*/
  }
}
```

这样省去了将 not print 写两遍的冗余.这样写也是有一定好处的,因为有些浏览器也许只支持Media Type 而不支持 Media Query- -(不要问我为什么知道,栽过坑)

Media Query(仅指上边那几个)的值的单位可以是 px em rem (%/vh/vw/vmin/vmax什么的没有试...感觉应该没什么用吧...);

Media Query是响应式页面的核心,其实说响应式页面就是在不同分辨率下显示不同的效果;

编写响应式页面CSS时分为从小到大和从大到小(尺寸);

本人弱弱的推荐从小尺寸开始写的 Media Query 使用 max-系列,大尺寸的反之;

本文哪里有错误及不足还请大家指出;
