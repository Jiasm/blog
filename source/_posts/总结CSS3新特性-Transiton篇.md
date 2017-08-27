---
uuid: 968f9640-b97a-11e6-9c2c-e5317ab687e9
title: 总结CSS3新特性(Transiton篇)
date: 2015-07-21 14:06
tags: css
---
 
> **CSS 过渡（transition）**, 是 [CSS3](https://developer.mozilla.org/en-US/docs/CSS/CSS3) 规范的一部分, 用来控制 CSS 属性的变化速率。 可以让属性的变化过程持续一段时间，而不是立即生效。比如，将元素的颜色从白色改为黑色，通常这个改变是立即生效的，使用 transition 后，将按一个曲线速率变化。这个过程可以自定义。
<!-- more -->

Transition是一个简写属性,四个值(单独使用均加transition-前缀)的顺序:

　　property

　　duration

　　timing-function

　　delay

过渡就是在一定时间内完成某属性值的改变,所以,transition-duration一定要设置,因为它默认值为0;

### Transition-Property:

要过渡的属性值,只有被指定的属性才会在过度时产生动画效果,可以填all,all为所有[可动画属性](https://developer.mozilla.org/en-US/docs/CSS/CSS_animated_properties);

```css
#demo {
  width:20px;
  height:20px;
  background-color:#0080FF;
  transition: width 1.5s;
}
#demo:hover {
  width:30px;
  height:30px;
}
```


可以选择多个属性的值;

```css
#demo {
	width: 20px;
	height: 20px;
	background-color: #0080FF;
	transition-property: width , height;
  /*写多个值用逗号分割*/
	transition-duration: 2s;
  /*过渡持续时间可以只写一个,也可分别指定,同样用逗号分割*/
}
```

使用简写时指定多个属性:

```css
#demo {
	width: 20px;
	height: 20px;
	background-color: #0080FF;
	transition: width 2s, height 4s;
  /*两条定义之间用逗号分割,后两个值为选填.*/
}
```

使用子属性时需要注意几点:

```css
#demo {
	transition-property: width , height , top;
	transition-duration: 2s , 3s;
  /*定义时间个数少于属性个数,会再次循环数组*/
}
/*相当于*/
#demo {
	transition-property: width , height , top;
	transition-duration: 2s , 3s , 2s;
}

#demo {
	transition-property: width , height;
	transition-duration: 2s , 3s , 2s;
  /*定义时间个数多于属性个数,多出的值会被截取*/
}
/*相当于*/
#demo {
	transition-property: width , height;
	transition-duration: 2s , 3s;
}
```

### Transition-duration:


设定过渡持续的时间,可以为秒或毫秒,本人理解为过渡就是通过设置的持续时间结合[缓动函数](https://developer.mozilla.org/zh-CN/docs/Web/CSS/transition-timing-function#.E8.AF.AD.E6.B3.95)计算相应的属性值改变的曲线;

比如4秒内宽度从100px过渡到200px,简单的分为4帧(假设) 125px-150px-175px-200px;原理应该与animation的from to 类似;

### Transition-timing-function:

设定过渡动画的曲线,这里是[W3School的示例](http://www.w3school.com.cn/tiy/t.asp?f=css3_transition-timing-function2),里边用到了是几个常用的,浏览器里内置的几种动画曲线,还可以通过cubic-bezier(_n_,_n_,_n_,_n_)来进行定制,n为0-1之间的值;

挺全的一个[缓动函数](http://easings.net/zh-cn)集合,默认不设置时,为ease,慢速开始,然后变快再慢速结束;

### Transition-delay:

设定动画开始前的等待时间(默认为0,无延迟);


本文如有不足或错误,还请指出.共同学习;

部分参考资料:


[MDNCSS过渡](https://developer.mozilla.org/zh-CN/docs/Web/CSS/transition)

[MDN使用CSS过渡](https://developer.mozilla.org/zh-CN/docs/Web/Guide/CSS/Using_CSS_transitions)

   

[W3School_CSS过渡](http://www.w3school.com.cn/css3/css3_transition.asp)

[缓动函数集合](http://easings.net/zh-cn)

 
