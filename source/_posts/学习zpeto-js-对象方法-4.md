---
uuid: 8ea4c310-b97a-11e6-88f3-1765d959b4f5
title: '学习zpeto.js(对象方法)[4]'
date: 2015-08-19 17:15
tags: js
---

今天说说那一套获取元素集合的一些方法:

```javascript
["children", "clone", "closest", "contents", "empty", "eq", "filter", "find", "first", "get", "has", "last", "not", "parent", "parents", "siblings"]
```

### children:

获取对象的所有匹配的直接子元素.

参数为可选的一个选择器.如果不填则是所有子节点,否则为匹配的所有子节点;

```javascript
$("#demo").children();//-->所有的子节点
$("#demo").children("li");//-->所有的li子节点
```
<!-- more -->

返回的是一个zepto对象,里边存储的是匹配的子节点的集合.
![](/images/learning-zepto-js-object-fourth/screen-shot-1.png)
![](/images/learning-zepto-js-object-fourth/screen-shot-2.png)

上边那个过滤方法用的地方比较多,所以给它放在上边;

children方法调用的filtered传入的是两个参数,第一个是一个集合,将所有对象的所有的子节点取出,并放入一个集合;children方法内部调用的children方法不是自身,而是另有一个children方法;↓
![](/images/learning-zepto-js-object-fourth/screen-shot-3.png)

我们调用的是对象方法,而对象方法调用的那个就是一个普通的内部私有函数- -(望理解它们之间的区别);

返回的是做一个兼容处理的获取子元素的实现,如果节点存在children属性就直接取出,不存在的话,就循环childNodes并将nodeType为1的元素筛选出来;

在filtered方法中,第二个参数就是children方法可选的那个选择器,而filtered方法又会牵扯到下边要说的两个方法,这里先把代码贴上

filter与not的作用相反.

从源码来看,能发现一个children的隐藏功能,这是api里边没说的.而我们的确能用的

也就是说,我们可以在children参数中传入一个function,function有一个实参,就是下标.

```javascript
var temp =$("li").children(function (index) {
  return (index % 2 === 0);
})
```

返回的是一个boolean值.为true则放入集合;

### filter:

filter方法接收一个参数,可以为选择器,也可以为一个function,function返回true则视为匹配.

```javascript
$(".item").filter(".nav");// 相当于
$(".item.nav");$(".item").filter(function (index) {
  return index % 2 === 0;//函数内部 this指向集合中的当前元素
}); //将集合中偶数位的元素取出并放入一个集合
```

直接说实现,省得上边那一大串children白说了.
![](/images/learning-zepto-js-object-fourth/screen-shot-4.png)

首先进入方法判断传入选择器是否为一个function类型,如果是,则执行this.not(this.not(function));看起来可能有点乱.但结果是对的.

not方法与filter相反,先简单的说它的作用.下边再介绍它

内层not参数为一个function,not方法内部会执行该function,并将所有不满足的元素返回,

外层not方法的参数就是内层not的返回值,也就是所有不满足的元素的集合,然后再经过筛选,取出所有不存在于参数集合中的元素.

也就变相的取出了所有满足条件的元素;

### not:

not方法用法与filter相同,返回值相反.

用法直接pass.
![](/images/learning-zepto-js-object-fourth/screen-shot-5.png)

首先函数内部判断传入选择器类型,如果是个functin,妥妥的循环对象并执行它.

否则就判断选择器类型是否为字符串,如果是,则调用filter方法.

如果不是一个字符串,就判断是否是一个类数组,并且对象的item是一个方法,(是的,变相的判断为一个zepto对象.)

其余的情况,直接通过参数构建一个zepto对象.

以上操作均为给excludes变量赋值;

在最后,通过循环对象.将对象中不存在于excludes变量中的所有元素取出.并构件为一个zepto对象.

也就是说,not方法传入的参数类型是可以比filter更丰富一些的.

可以传入一个zepto对象,或者一个dom标签数组.一个html片段.等等......

当然最后返回的对象决不会存在于not的参数中.

//indexOf就是数组的原生方法
