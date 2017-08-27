---
uuid: 92369c60-b97a-11e6-87c7-89637d2d5ed6
title: '学习zpeto.js(原型方法)[2]'
date: 2015-08-11 17:14
tags: js
---
 
接着昨天的来,继续说原型方法,[昨天的传送阵](http://www.cnblogs.com/jiasm/p/4718610.html)(昨天出了点小意外,博文经过WP手机的UC浏览器进行编辑后标签就露出来了- -,现已修复);

### $.grep():

作用与Array.filter类似(其实就是调用的filter方法- -)

通过传入两个参数,第一个为类数组的对象,第二个为用来执行判断的函数;
<!-- more -->

```javascript
var array =[1,2,3,4,5];
var even = $.grep(array, function (value) {
  return value % 2 === 0;
});
console.log(even); // --> [2,4]
```

函数可以接收到三个传递来的参数,上边只接收了一个,第二个是当前item在array中的下标,从0开始- -,第三个是array本身;
![](/images/learning-zepto-js-prototype-second/screen-shot-1.png)

//filter的值为 [].filter

### $.inArray():

接收两到三个参数,第一个是item(中文不知道该如何形容,子项?就是),第二个是一个数组对象,第三个是可选的开始下标,该方法用来检查第一个参数是否存在与自身.返回值是一个下标,从0开始的.

如果没有找到,就会返回-1;

```javascript
$.inArray("aaa", ["aaa", "bbb", "ccc"]);// -->0
$.inArray("aaa", ["aaa", "bbb", "ccc", "ccc", "aaa"], 3) // -->4
```

inArray方法也是直接调用了Array的idnexOf方法,这些都是ES5的新方法,在zepto里边是没有做兼容处理的,只是简单的call方法,毕竟是为了移动端而生的;
![](/images/learning-zepto-js-prototype-second/screen-shot-2.png)

//jQuery1.x的版本是做了兼容的处理,2.x以后也是直接调用的indexOf方法.

### $.isArray():

该方法只接收一个参数,一个对象,用来判断该对象是否为Array,返回一个boolean值,

```javascript
$.isArray([]);// --> true
```

该方法是做了一个兼容处理的,如果Array存在isArray方法,则直接调用,否则赋值为自定义的一个函数:
![](/images/learning-zepto-js-prototype-second/screen-shot-3.png)

### $.isFunction():

方法只接收一个参数,一个对象,判断是否为function对象,别看这方法只是用来检查参数是否为function,里边衍生出的几个变量和方法还是挺有意思的.

用法如下:

```javascript
function test1 (){}
var test2 = function () {};
console.log($.isFunction(test1)); // -->true
console.log($.isFunction(test2)); // -->true
```
贴上几块代码:
![](/images/learning-zepto-js-prototype-second/screen-shot-4.png)
![](/images/learning-zepto-js-prototype-second/screen-shot-5.png)
![](/images/learning-zepto-js-prototype-second/screen-shot-6.png)

首先在isFunction函数内部调用了type函数,type函数返回一个字符串,

type函数通过一个三元运算符来判断是否为空,然后调用对象的toString方法,返回一个类似[object Array]这种格式的字符串,

再放入一个Mapping中,就是class2type(class to type),在zepto自执行函数中通过each函数将一个数组,就是第三张图那一串类型,循环放入class2type对象中,

现在回到第一张图,这样的调用应该能清楚了吧.

放一张class2type的内容截图
![](/images/learning-zepto-js-prototype-second/screen-shot-7.png)

### $.isPlainObject():

该方法判断传入对象是否为一个纯洁粹的对象,就是一个通过"{}"或者 new Object 来创建的对象.

```javascript
$.isPlainObject({}); // ..> true
$.isPlainObject(new Object()); // --> true
$.isPlainObject(1); // --> false
```

zepto不认为window对象是一个纯粹的Object,但是通过typeof来看的话,window确实是一个object- -,所以在代码中添加了对window对象的处理
![](/images/learning-zepto-js-prototype-second/screen-shot-8.png)

首先判断传入参数为一个对象,并且不是一个window对象,getPrototypeOf方法返回参数的构造方法的prototype.有兴趣的可以移步[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/GetPrototypeOf)

### $.map():

该函数返回一个数组,传入两个参数,第一个是要遍历的对象,可以使一个类数组,也可以是一个对象,第二个参数是一个回调函数,在回调函数返回的值,会被存入集合并通过$.map来返回,返回的是一个数组;

```javascript
$.map({
  name: 'niko',
  age: 18
}, function (value, key) {
  if (key === 'age')
    return value;
}) // --> [18]
$.map([1,2,3,4], function (item, index) {
  return item * 2;
}) // --> [2,4,6,8]
```
![](/images/learning-zepto-js-prototype-second/screen-shot-9.png)
方法逻辑不算复杂,在最后返回时,调用的函数用来将传入的类数组对象转换为一个数组,代码如下:
![](/images/learning-zepto-js-prototype-second/screen-shot-10.png)

剩下两个 $.trim,以及$.parseJSON,这两个就不说了,因为都属于原生函数的别名而已.

今天先说到了这里,zepto里边的原型方法出了ajax模块的就都已经说完了- -,读源码真的是最快的学习方式.
