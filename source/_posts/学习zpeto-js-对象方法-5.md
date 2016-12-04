---
uuid: 8f9823c0-b97a-11e6-ba82-a99f24610643
title: '学习zpeto.js(对象方法)[5]'
date: 2015-08-28 18:14
tags: js
---
### clone:

该方法不接收任何参数,会返回对象中的所有元素集合,但不会对象绑定的事件.

```javascript
var $temp =$("div").clone();//并不接收任何参数.
```

方法的实现就是循环调用方法对象.然后将所有的dom元素克隆并返回
![](/images/learning-zepto-js-object-fifth/screen-shot-1.png)

而且使用的深度克隆,就是说,会将节点下方的子节点统统克隆过来.
<!-- more -->

### closest:

方法接收1-2个参数,第一个为selector(选择器),第二个为context(上下文);

方法会从调用节点开始,逐级向上匹配.

如果只传入selector,则会返回第一个匹配的元素.如同时传入了context,则只会寻找context的子节点.

(通俗来说就是如果能被匹配的元素不属于context,那么将会直接返回false)

selector参数也可以传入一个zepto对象.或一个dom集合.

而返回的元素则会属于传入的selector对象中的一个.

context的有效值为一个dom元素.

注意:返回值是与调用对象中的第一个元素有关的.
![](/images/learning-zepto-js-object-fifth/screen-shot-2.png)
所以说返回值也只会是包含一个节点元素的zepto对象或是一个空对象[没有找到匹配的元素])

```html
<!DOCTYPE html>
<html>
  <head>
    <title>hello world</title>
    <meta charset="utf-8">
    <script type="text/javascript" src="js/zepto.js"></script>
    <style type="text/css">
      body *{
        color: #000;
      }
      </style>
    </head>
    <body>
      <ul id="one" class="level-1">
        <li class="item-i">I</li>
        <li id="ii" class="item-ii">II
        <ul class="level-2">
          <li class="item-a">A</li>
          <li class="item-b">B
            <ul class="level-3">
              <li class="item-1">1</li>
              <li class="item-2">2</li>
              <li class="item-3">3</li>
            </ul>
          </li>
          <li class="item-c">C</li>
        </ul>
      </li>
      <li class="item-iii">III</li>
    </ul>
    <script type="text/javascript">
      $(".level-3").closest(".item-b").css("color","red");//匹配距离对象最近的.item-b元素
      $(".level-3").closest(".item-ii").css("color","blue");//匹配距离对象最近的.item-ii元素
      $(".level-3").closest("#one",$("#ii")[0]).css("background-color","green");//匹配距离对象最近的#one元素,并且匹配元素必须属于#ii元素内部
      $(".level-3").closest($("ul")).css("background-color","yellow");//匹配距离对象最近的属于$("ul")中其中一个的元素
    </script>
  </body>
</html>
```
![](/images/learning-zepto-js-object-fifth/screen-shot-3.png)

方法首先取出当前dom对象作为基点并赋值给node.collection默认的为false.如果传入的selector参数为一个object,则认为选择器是一个zepto对象,或者是一个dom对象(集合),并将转换为zepto对象的值赋给collection;

下边是循环,循环判断的条件为node存在,并且collection中不存在node(selector为object的情况下)或者node不匹配selector选择器(selector为string的情况下)

循环内部,如果node不等于context(上下文)并且node不为document对象,就将node的父节点赋值给node(直到node满足匹配条件或者循环值文档对象).否则直接赋值false,然后循环终止,返回false;

最终返回一个zepto对象,空的或者包含一个元素的zepto对象;

### contents:

contents用来获取zepto所有对象的子节点（包括文本，注释），或者zepto某对象为一个iframe时，则获取该iframe的document对象引用；

直接使用zepto对象调用即可；

```javascript
$("#temp").contents();// 如果temp为一个iframe对象，则返回它的contentDocument引用，否则返回该dom对象的所有child节点
```
![](/images/learning-zepto-js-object-fifth/screen-shot-4.png)

首先是遍历zepto对象，然后返回每个对象的子节点或者document对象。contentDocument为iframe对象的属性，与contentWindow性质一样；

### empty:

用来清空zepto对象的所有innerHTML值（dom内容，相当于移除所有子节点）。

```javascript
$("#temp").empty();//该方法将清除#temp的innerHTML
```
![](/images/learning-zepto-js-object-fifth/screen-shot-5.png)

代码也只是简单的遍历并给innerHTML赋值而已。

题外话：map方法与each方法的区别。两者回调函数的参数，是一样的。两者的区别在于结束循环的方式。each返回false结束循环，而map （我还真没发现返回null或undefined能停止它）；

### eq:

通过index来取出一个对象，如果为-1，则取出最后一个。

与get方法的区别是，get返回一个dom对象，eq返回一个zepto对象。

```javascript
$("#test").eq(0);
$($("#test").get(0));
$($("#test").[0]);//此三条效果一样。
```

### find:

find方法通过传入的一个参数来筛选出zepto对象符合条件的子节点集合并返回。

```javascript
$('#myform').find('input, select');
$('input, select', $('#myform'));//这两条的结果是一样的。
```
![](/images/learning-zepto-js-object-fifth/screen-shot-6.png)
首先判断是否传入选择器，如果没有则直接返回一个空的zepto对象；

如果选择器为一个对象，则将对象转换为zepto对象，然后通过filter筛选出一些匹配的节点，并存入result集合；

如果调用find方法的对象为一个单一的对象，则直接用过qsa方法（前几篇说过qsa方法），将选择器作为一个选择器，并将对象作为上下文传入；

否则循环zepto对象重复上边那一条；

（find方法可能说的不太细。如果有什么，还请大家一起交流）
