---
uuid: 8ce4eaa0-b97a-11e6-9515-bd235f05ebbe
title: '学习zpeto.js(对象方法)[2]'
date: 2015-08-13 17:11
tags: js
---

今天来说下zepto那一套dom操作方法,

```javascript
['prepend', 'append', 'prependTo', 'appendTo', 'before', 'after', 'insertBefore', 'insertAfter']
```
按着从内到外,从主到从,从前到后的顺序来说这八个方法.

这些方法的参数可以是一个dom节点,也可是是一个html片段,或者Zepto对象;
<!-- more -->

### prepend():

将参数插入对象内部的头部;
![](/images/learning-zepto-js-object-second/screen-shot-1.png)

### append():

将参数插入对象内部的尾部;
![](/images/learning-zepto-js-object-second/screen-shot-2.png)

### prependTo():

将对象插入到参数内部的头部(可以理解为将prepend的参数变为调用方法的对象,将对象变为方法的参数);
![](/images/learning-zepto-js-object-second/screen-shot-3.png)

### appendTo():

将对象插入到参数内部的尾部;
![](/images/learning-zepto-js-object-second/screen-shot-4.png)

以上四个全都是元素内部的插入,接下来的四个全部是元素外部插入的.

### before():

将参数插入到对象的前边;
![](/images/learning-zepto-js-object-second/screen-shot-5.png)

### after():

将参数插入到对象的后边;
![](/images/learning-zepto-js-object-second/screen-shot-6.png)

### insertBefore():

将对象插入到参数的前边;
![](/images/learning-zepto-js-object-second/screen-shot-7.png)

### insertAfter():

将对象插入到参数的后边;
![](/images/learning-zepto-js-object-second/screen-shot-8.png)

之所以将这八个方法放在一块说,是因为这八个方法是通过循环动态生成的.首先要先会用,才可以去试着了解内部结构.了解完了以后,你会发现,你会很熟练的使用它;
![](/images/learning-zepto-js-object-second/screen-shot-9.png)
![](/images/learning-zepto-js-object-second/screen-shot-10.png)

上边那个数组是储存的几个操作的名称,下边的forEach循环是在zepto自执行函数中执行的,就是说,在构件zepto原型的是否就创建了这几个方法;

forEach方法回调返回的参数,第一个是值,第二个是值的下标;

map方法回调返回的参数同上,在方法内部第一个参数名使用了_(下划线),表示在该函数中并未使用到,但必须要占位(某群某大神就是这么干的),注意数组中存储的,

只有四个值(四个将参数插入至对象中的方法名[就叫它主动方法吧,原创名字,可以随意使用,不受任何版权约束]),还有数组的顺序也是很重要(根据数组顺序决定插入的位置);

inside变量存储了该方法是否为内部插入的bool值,这也是为什么上边说数组的顺序很重要;

跳过map方法中的处理,不多做解释,因为这个是转换参数为DOm节点的;

在方法返回时执行的each方法,

方法首先会判断该方法是否为对象内部的操作,如果是,将parent变量赋值为当前对象,如果不是,就说明是对象外部操作,就将parent赋值为对象的parentNode;

然后根据方法名字在操作集合中的下标来判断去什么dom节点,

把八个操作带进去,因为这八个方法最后使用的都是insertBefore方法,

顺便说一下原生的insertBefore方法使用方式.

首先调用该方法的为要被插入的对象,接收两个参数,第一个是要插入的对象,第二个是要插谁的前边;
![](/images/learning-zepto-js-object-second/screen-shot-11.png)

```javascript
售票处.insertBefore(李四,张三);
```

思考一下为什么要这么做.

### after

首先after是第一个,after是外部的操作,而且是插入到当前调用的对象的后边,

要想使用insertBefore来实现插入到某对象的后边,我们需要三个对象,一个是当前对象,还有要插入的对象,以及当前对象的容器,也就是他的parent;

在进入方法时,我们通过inside变量获取到了该方法是否为内部插入,然后通过inside变量来给对象的容器赋值(自身或者parent);

在这里,三个所需的变量我们就都拿到了.

after执行的是插入到当前对象后,所以说

我们通过下标取出after操作执行所需的dom元素,对象的nextSibling,就是对象的后一个元素.插入到对象.nextSibling前边就相当于插入到对象的后边,

(就是说,超过了第二名,你就是第二名,绕不过来的自行撞墙);

parent(容器).insertBefore(要插入的对象,当前对象的后一个节点);一个dom树中同一个dom节点不会出现两次,就是说,移动对象属于剪切操作,而不是复制操作,

这也是为什么方法内不会进行判断调用方法的对象是否为多个,如果是多个,则需要将对象进行copy;

### prepend

第二个是prepend,prepend是内部插入,将参数插入到对象内部最前边,与append相反(append插入到内部的尾部);

由于是内部操作,所以parent我们会取自身.然后再判断下标得到是prepend.然后我们取出用来确定位置的dom元素,就是对象的第一个子节点,插入到该节点前,就是取代了该节点成为firstChild(干掉熊猫,我就是国宝);

调用方式就是:

parent(这里是对象自身).insertBefore(要插入的对象,当前对象的第一个子节点);

### before

before,插入到对象前(外部操作),这个就没什么好解释的了.insertBefore本来就是干这个使得.

### append

append,插入到对象内尾部,
![](/images/learning-zepto-js-object-second/screen-shot-12.png)
其实,区分这几个方法的核心就在这里,如果执行insertBefore方法,第二个参数为null,则会直接将第一个元素插入到容器的最后,相当于原生的appendChild方法.

关于下边那四个方法,就不做多解释了.
![](/images/learning-zepto-js-object-second/screen-shot-13.png)

只是简单的将对象以及参数掉了个(个儿);

如果让我来实现这八个方法,我也许会写一个switch,更好点了也许会动态判断内部外部插入,里边会使用appendChild等等一系列方法,但绝对不会想到这种写法,所以说,读源码真心的学习最快的途径.

今天先写到这里,八个dom插入方法,自己也消化一下.里边也许说的还有点不太详细,如果有什么不明白的,欢迎留言,大家一起探讨.

//明日面试,求祝福
