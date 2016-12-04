---
uuid: 9072f360-b97a-11e6-a57e-a123f1f8b6ca
title: '学习zpeto.js(对象方法)[6]'
date: 2015/09/01 17:37
tags: js
---

### first:

获取当前对象集合中的第一个dom元素。

```javascript
$("div").first();// 返回第一个div对象（zepto对象）
//相当于
$("div").eq(0);
```

与之对应的是last
<!-- more -->

### last:

获取当前对象集合中的最后一个dom元素。

```javascript
$("div").last();// 返回最后一个div对象（zepto对象）
//相当于
$("div").eq(-1);
```

两方法不接收任何参数。
![](/images/learning-zepto-js-object-sixth/screen-shot-1.png)

个人认为调用isObject方法没什么用，因为zepto对象集合里存放的都是dom元素。//也许是我无知吧- -

被大神点醒了。这样做也许是为了这种场景
![](/images/learning-zepto-js-object-sixth/screen-shot-2.png)

### get:

获取当前对象集合对应下标的某元素，传入参数为一个int下标，如果不传入参数，则将对象转换为一个普通数组并返回；

```javascript
$("div").get(0); 　　　　// 第0个。（dom对象,不是zepto对象）
$("div").get(); 　　　　 //所有div对象组成的一个数组
```

该方法与eq方法的区别在于，eq返回的是zepto对象，而get返回的是dom对象，$().get(0)相当于$()[0]；
![](/images/learning-zepto-js-object-sixth/screen-shot-3.png)

slice就是[].slice();

使用get并且不传入参数的对象前后变化图：
![](/images/learning-zepto-js-object-sixth/screen-shot-4.png)

### has:

传入参数为一个选择器字符串或者一个节点，返回的是对象集合中子节点包含参数的对象。

```javascript
$("div").has("a");// 会返回集合中所有包含a标签的对象
```

上述是传入一个选择器，也可以传入一个node节点作为参数

$("div").has(document.getElementById("link"));//返回集合中有子项为#link的对象

![](/images/learning-zepto-js-object-sixth/screen-shot-5.png)

首先，filter方法会将返回值为true的子项装入一个集合。

在filter方法内，我们通过判断选择器是否为object来进行区分，如果是object，则调用contains方法，判断selector是否属于this。

否则通过当前对象来调用find方法并将selector传入，并调用size方法获取count（filter会自动将返回值转换为bool类型）。

### parent:

获取对象集合所有的直接父节点。可以传入一个选择器，只留下符合选择器的父节点。

```javascript
$("p").parent(); 　　　　　　// 获取所有p标签的父节点
$("p").parent(".ads");  　　// 获取所有p标签的父节点className包含.ads的节点
```
![](/images/learning-zepto-js-object-sixth/screen-shot-6.png)

pluck方法返回一个数组，参数是一个字符串，为属性名，返回的值是调用对象所对应的属性的值；

然后传入uniq方法，方法做了一个去重处理；

最外层的方法filtered，如果第二个参数selector不为空，则通过第一个参数调用filter方法并将第二个参数传入filter方法，否则直接返回第一个参数。

### parents:

获取所有对象的所有父节点。直至html标签结束。可以传入一个参数，作为选择器筛选；

参数只能是一个选择器字符串；

返回的集合不会出现重复的元素；

如果想取出元素的直接父节点，使用parent；

如果想取出第一个符合筛选条件的父节点，使用closest。

```javascript
$("p").parents(); 　　   　　// 获取所有p标签的所有父节点
$("p").parents(".ads"); 　　// 获取所有p标签的所有父节点className包含ads的节点
```

//使用parents如果不传入参数，则始终会包含一个body以及html元素；
![](/images/learning-zepto-js-object-sixth/screen-shot-7.png)

方法首先声明一个数组用于存放dom元素，将this赋值给nodes变量；

使用一个while循环，条件为nodes.length > 0；

在循环内部，通过$.map给nodes进行赋值，map方法内部将node赋值为node的父节点，

然后判断，如果节点不是document并且该节点不存在于ancestors数组中，则将节点push至数组，并返回node。

所以说循环停止的条件就是node节点为document时。

最后调用filtered方法并返回。

### siblings:

获取对象所有的兄弟节点。参数可以是一个选择器字符串，如传入参数则根据选择器过滤。

```javascript
$("p").siblings(); 　　　　　// 获取所有p标签的同级标签
$("p").siblings(".ad"); 　　// 所有的p标签的同级的className包含ad的元素
```

通过siblings获取到的dom元素会重复。
![](/images/learning-zepto-js-object-sixth/screen-shot-8.png)

方法内部用到了一个children方法。
![](/images/learning-zepto-js-object-sixth/screen-shot-9.png)

方法内部取出元素的父节点并传入children方法，返回元素的父节点的子节点，相当于自己的所有兄弟节点以及自身。

通过该返回集合call一下filter方法。

并将除了自身以外的所有节点返回。

最后通过filtered方法进行筛选，返回；

注意，siblings获取的元素会重复，会重复，会重复（重说三）；
![](/images/learning-zepto-js-object-sixth/screen-shot-10.png)
![](/images/learning-zepto-js-object-sixth/screen-shot-11.png)

就像这样，script标签出现了两次；

ok，先说到这里了。写写博客练习一下语言表达能力，感觉自己能理解了，还是说不好，纠结ing...

 
