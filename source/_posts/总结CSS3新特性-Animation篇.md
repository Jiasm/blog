---
uuid: 95bb2f40-b97a-11e6-8659-63244734908c
title: 总结CSS3新特性(Animation篇)
date: 2015-08-03 17:00
tags: css
---
 
动画(Animation),是CSS3的亮点.//之一

通过animation属性指定@keyframe来完成关键帧动画;
<!-- more -->

### @keyframe用法:　　

```css
@keyframes name {
  0% {
    top: 0;
  }/*0%可用from关键字替代*/  50% {
    top: 10px;
  }

  100% {
    top: 0;
  }/*100%可用to关键字替代*/
}
```

由于是CSS3,所以不出意外的各种前缀:

![Image](http://images0.cnblogs.com/blog2015/731575/201508/031528187517503.png)--图片来自MDN,[CSS中的关键帧](https://developer.mozilla.org/zh-CN/docs/Web/CSS/%40keyframes)

单个帧中可填写多个属性,而且不需要保证一致,如:

```css
@-webkit-keyframes identifier {
  from {
    top: 0;
  }

  50% {
    top: 10px;
    background-color: red;
  }

  to {
    top: 20px;
    color: red;
  }
}/*这是一个完全有效的关键帧定义*/
```

需要注意的有几点:

　　关键帧中有效的属性为[可动画属性](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animated_properties);如出现不可动画属性,会忽略该属性,不影响其余属性的动画,

　　如属性后跟有 !important,则会忽略该属性,

　　某个关键帧如果重复定义,则取后定义的帧,　　

```css
@-webkit-keyframes identifier {
  from {
    top: 0;
  }

  50% {
    top: 10px;
    /*该属性会动画*/
    background-color: red !important;
    /*因为有!important字样,所以该条将被忽略*/
    text-align: center;
    /*由于该属性不为可动画属性,因此也被忽略*/
  }

  to {
    top: 20px;
    color: red;
  }

  100% {
    color: green;
  }/*由于to关键字表示100%,所以该动画只会执行改变颜色为green,而to所对应的属性全部被忽略*/
}

```
帧数范围为0%-100%,不属于这个范围的则被忽略(经实验,关键帧定义可以不按顺序来,可以正确执行,但是可读性不太好);

### Animation用法:

animation-name:设置动画的名称,就是@keyframe后跟的标识;

animation-duration:设置动画花费的时间,//这两个为必填属性,第一个不解释了,第二个必填的原因为默认值是0s,0s是不会产生动画效果的,所以为必填;

```css
#demo {
  animation-name: demo;
  animation-duration: 2s;
}

@keyframe demo {
  from {
    top: 0;
  }

  to {
    top: 20px;
  }
}

```

animation-timing-function:设置动画的速度曲线,默认值为 ease,[可选值](http://www.w3school.com.cn/cssref/pr_animation-timing-function.asp)有数个,可通过cubic-bezier函数来自定义,这里有一些定义好的,可以直接拿来用的函数,[传送阵](http://easings.net/zh-cn);

```css
#demo {
  animation-function: cubic-bezier(0.25,0.1,0.25,1);
  /*自定义的贝塞尔曲线*/
}
```

animation-delay:设置动画开始前的等待时间,默认为0s;

```css
#demo {
  animation-delay: 2s;
  /*动画将于2s后执行*/
}

```

animation-iteration-count:设置动画执行次数,默认为1,使用 infinite 关键字可以使动画无限循环;

```css
#demo {
  animation-iteration-count: infinite;
  /*动画将无限循环,此时animation-fill-mode将无效*/
}
```

animation-direction:设置动画执行完后时候倒序执行,默认为normal,使用 alternate 关键字开启倒序执行

//仅有animation-iteration-count值为大于1次时才会激活,倒序执行消耗时间为animation-duration设置的时间,奇数次数为正序,偶数次数为倒序;

```css
#demo {
  animation-direction: alternate;
  /*激活倒序播放*/
  animation-iteration-count: 2;
  /*此时该属性须大于1,direction才会有效*/
}
```
animation-play-state:设置动画当前状态,默认是 running ,为执行状态,可以设置为 paused 为暂停,

```css
#demo {
  animation-play-state: paused;
  /*默认不触发动画*/
}

#demo:hover {
  animation-play-state: running;
  /*悬浮至该元素才执行动画*/
}
```

animation-fill-mode:设置动画执行完后的状态(复原(none),保持第一帧(backwards)以及保持最后一帧(forwards),还有一个both值 MDN说是同时backwards和forwards,原谅我没有试出它与forwards的区别...,)

　　//设置animation-iteration-count值为infinite时将导致该属性失效;

animation的简写方式对顺序要求特别严格,规格如下:

animation:name duration timing-function delay iteration-count direction play-state fill-mode;

### 使用时需注意:

各种前缀...@keyframe里边如果用到了transform,也是需要加前缀的,如:

```css
@-webkit-keyframe demo {
  from {
    -webkit-transform: rotate(7deg);
  }

  to {
    -webkit-transform: rotate(14deg);
  }
}
```
### 部分参考文档:

[MDN的动画](https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation)

[CSS3中的关键帧](https://developer.mozilla.org/zh-CN/docs/Web/CSS/%40keyframes)

[W3School的Animation属性](http://www.w3school.com.cn/cssref/pr_animation.asp)

[W3School的@Keyframe规则](http://www.w3school.com.cn/cssref/pr_keyframes.asp)
