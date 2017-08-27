---
uuid: 8dc93020-b97a-11e6-bc5c-43642a86b907
title: '学习zpeto.js(对象方法)[3]'
date: 2015-08-18 16:54
tags: js
---
 
继续说zepto里attributes的相关操作.

attr,removeAttr,prop这三个方法.
<!-- more -->

### attr():

三种用途

#### get:

返回值为一个string字符串

```javascript
$("<span id="special"></span>").attr("id"); //--> "special"
```

注意:只能返回对象中第一个节点的属性值

#### set:

返回值为一个zepto对象

```javascript
$("<span>").attr("id","special"); //--> [<span id="special"></span>]
```

第二个参数也可以传入一个function,有两个参数可以使用

1:index,zepto对象dom元素数组的下标

2:value,该对象对应属性的值

```javascript
$("<div id='demo1'></div>").attr("id", function(index, value) {    
  console.log(index, value);// --> 0 demo1
});
```

上边那段代码如果执行了.那么该zepto对象的id属性值就会被清除,因为该函数没有返回字符串用来设置值.

或者也可以直接传入一个json串来修改多个属性.

```javascript
$("<span>").attr({    
  id:'special',    
  name:'special'
});
```

#### remove:

返回值也是一个zepto对象,作用相当于调用removeAttr()

$("<span id="special"></span>").attr("id",null);//--> [<span></span>]

需注意的只能传入null才能触发remove效果.

传入function与json都可以,只要是返回值或者值为null,都会触发remove;

### removeAttr:

removeAttr相当于(功能)是attr的一部分.但是代码实现是分开的.这个函数应用场景比较单一,所以省去了很多判断.但最终都是调用的function getAttribute(){};

只接收一个参数,就是name

返回值是一个zepto对象.

```javascript
$("<span id="special"></span>").removeAttr("id");//--> [<span></span>]
```

移除多个属性请用空格分开

### prop:

prop用来设置或取出dom元素的属性值.功能相当于 (prop = attr - removeAttr);

prop用法与attr相同.只不过没有remove功能.两者的区别在这里

读取或设置dom元素的属性值。它在读取属性值的情况下优先于 [attr](http://www.css88.com/doc/zeptojs/#attr)，因为这些属性值会因为用户的交互发生改变，如checked 和 selected。

那是zepto.js中文api中所说的.本人认为,在判断有关交互的属性时,应优先使用prop,比如checked和selected;
![](/images/learning-zepto-js-object-third/screen-shot-1.png)
![](/images/learning-zepto-js-object-third/screen-shot-2.png)

之所以为出现差异,是因为两者底层实现的区别.
![](/images/learning-zepto-js-object-third/screen-shot-3.png)

prop采用的是上边那种,而attr是两种都用到了;

getAttribute()方法只能取出存在于标签中的属性"<div id name></div>" // 只能取出id与name.隐式的属性是取不出来的,比如style
![](/images/learning-zepto-js-object-third/screen-shot-4.png)
![](/images/learning-zepto-js-object-third/screen-shot-5.png)

来说说实现吧.

#### attr

attr返回的那个三元运算符嵌套写的有点虎...待我细细说来;

--首先判断name参数是否为字符串,并且只有一个实参.这样来讲就是get功能.

----如果this.length不存在.则说明不是一个zepto对象(理论上),如果数组中第一个对象的nodeType值不为1,则说明不是节点对象.直接返回undefined

----否则就从调用该节点的getAttribute方法,并赋值给result变量. name in this[0] 这个表达式返回一个bool值.同时将result使用!来转换为bool值.如果没有通过getAttribute方法取出来值,并且该属性存在于节点,

------通过节点直接取值.

------否则直接返回getAttribute的返回值.

--剩下来的就是set与remove功能的实现,这两个是支持多对象的操作.返回值均为调用者本身(调用者调用了each循环,循环所有节点对象).

----如果对象不是一个节点对象,则直接跳过本次循环;

----如果name为一个object,就是说我们一次性更改多个属性值.这时就循环object对象,来调用setAttribute方法

----剩下的条件就是给单个属性赋值,之前说过那个funcArg方法,判断第二个参数是否为function类型,如果是则通过当前节点为作用域执行方法,否则直接返回第二个参数.

关于是否进行set还是remove,这些是在setAttribute方法中做的处理.一个简单的三元运算符;

#### removeAttr

参数只有一个,name,就是要移除的属性的名称,

大体执行过程为,循环调用方法的对象,并将传入的name按空格分割为数组并执行forEach循环,forEach循环传入第二个参数为循环内部this的指向.然后在内部调用setAttribute方法.只传入两个参数,则执行removeAttribute方法;

#### prop

参数为两个.第一个固定为属性的名称,第二个可以为一个function,一个字符串.同样,如果不传第二个参数则认为是get,否则是set.

执行过程与attr的类似,但是attr赋值是通过setAttribute()方法,取值是getAttribute()与对象属性取值的结合.而prop完全操作的是对象的属性;

再来点吧.说说data方法与val方法.都是操作dom属性的.一气儿说完它;

### data:

方法接受两个参数,第一个是name,第二个为值,如果不填第二个则执行取值,否则为赋值

用法与attr类似,但是会将传入的name值加上"data-"的前缀,并且会将驼峰命名转换为全小写连字符的格式;

取值时也不需要加"data-"前缀.

就是说,

```javascript
$("").data("id");//取的是 data-id属性的值
$("").data("userName","scott");//给data-user-name属性赋值
```

第二个参数也可以是一个function;

actually,data方法内部调用的就是attr方法
![](/images/learning-zepto-js-object-third/screen-shot-6.png)

deserializeValue是一个反序列化函数,如果有其他地方需要,不妨将该方法copy出去;

![](/images/learning-zepto-js-object-third/screen-shot-7.png)

### val:

方法接收一个参数,如果不填,则视为取value值,否则为设置value值.

```javascript
$("").val();// getter
$("").val("");// setter
```

参数可以是一个字符串,function;function接收的参数为(index[对象的下标],value[对象之前的值]),function需返回一个字符串;

![](/images/learning-zepto-js-object-third/screen-shot-8.png)

方法本身无亮点,但是返回值有三种;

一:

　　返回一个字符串,作为get值时返回;

二:

　　返回一个字符串数组,作为get值时返回;

三:

　　返回对象本身,作为set值时返回;

之所以会存在第二种情况,那是因为select(下拉选项)是可以多选的.而开启多选的属性开关名字叫multiple;

当下拉选项开启多选时,直接通过value属性只会取到第一个值,其余的取不到.所以在代码中就做了处理;

取出对象所有的option子节点.通过filter方法返回被选中的节点集合,并调用pluck方法


![](/images/learning-zepto-js-object-third/screen-shot-9.png)一个来自prototype.js大表哥中的方法;

传入一个属性名,将调用者集合中所有的该属性的值作为一个数组返回;

其余的没什么了.

如果有什么疑惑的地方还请留言问我.大家共同学习;

或者[我的扣扣](tencent://QQInterLive/?Cmd=2&Uin=812788037)
