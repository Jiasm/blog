---
uuid: 8c070dc0-b97a-11e6-90f9-bfb0abbec78c
title: '学习zpeto.js(对象方法)[1]'
date: 2015-08-12 15:44
tags: js
---
 
zepto也是使用的链式操作,链式操作:函数返回调用函数的对象.

但并不是所有的对象方法都可以进行链式操作,举几个例子:.size(),.html()|.text()//不传参数的情况下;

若非特殊说明,下边介绍的方法都会返回zepto对象;
<!-- more -->

### add():

支持一到二个参数,第一个为选择器,与$()的规则相同,甚至是,第一个参数传进去一个function,它也会正确执行(后果自负- -),所以说,正确的使用方式是传入选择器,dom对象,或者一段html,这都是可以的,如果有多个,请用数组括起来,

```javascript
var temp = $(["li","span","div"]).add(["p","p"]).size();// --> size为4,因为会对返回的集合进行去重处理
```

第二个参数是匹配的上下文,默认不传就按着document来.
![](/images/learning-zepto-js-object-first/screen-shot-1.png)
![](/images/learning-zepto-js-object-first/screen-shot-2.png)
![](/images/learning-zepto-js-object-first/screen-shot-3.png)

add函数本身无任何亮点- -,将两个参数原封不动的传入$()然后返回一个Zepto对象,执行concat函数,该函数会将所有参数添加至调用函数对象的末尾,

toArray方法会调用get方法,当get方法执行时而没有传入参数,会将该对象所有的匹配元素以数组的形式返回;

uniq方法是一个数组去重的方法,返回的还是一个数组,然后回到add方法再次通过$()构造一个zepto对象并返回;

### addClass():

该方法接收一个参数,可以直接传入一个字符串作为类名,如有多个,使用空格分开.

```javascript
$("p").addClass("content title");// --> content title
```

还有一种调用方式是传入一个函数,函数可以接收到两个参数,第一个是当前循环到的下标,第二个是当前对象之前的className.

```javascript
$('p1','p2','p3').addClass(function (index, oldClass) {
  return 'dynamic' + index;
});
// p1 --> dynamic0
// p2 --> dynamic1
// p3 --> dynamic2
```

函数必须返回一个字符串,否则会运行异常.
![](/images/learning-zepto-js-object-first/screen-shot-4.png)

通过each方法循环遍历对象,each方法会返回一个zepto对象.首先会判断元素是否存在className属性,

通过className方法获取到当前元素的所有className信息的字符串;![](/images/learning-zepto-js-object-first/screen-shot-5.png)

className方法用来取信息或者存入信息都是可以的,就像.css()方法一样,有一个参数就是get,有两个参数就是set;

(关于这个svg的属性...本人才疏学浅,没有接触过...)

无视掉那个svg相关的东西来说,该方法就是获取到传入的第一个参数的className属性,如果第二个参数不存在,则返回node的className信息,如果存在值,就将值赋给node的className属性;

再回到addClass方法的each循环中,变量cls拿到了该元素的className,
![](/images/learning-zepto-js-object-first/screen-shot-6.png)

该方法判断第二个参数是否为function,如果是,就通过上下文(context)来执行,并传入两个参数,idx(下标),payload(在addClass里边,这个值为元素之前的className)

通过funcArg取到要增加的className,我们的newName变量拿到了要add的className.然后将newName以空格分割(\s表示空格,\s+表示连续的一个及一个以上的空格),split分割返回一个数组,

然后调用forEach方法,这里注意forEach方法传入了第二个参数,第二个参数的用途是设置forEach中this的指向.详情可以看MDN [Array.prototype.forEach()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)

在循环内部,我们使用hasClass函数来判断该元素是否存在这个类,如果不存在,则将该className装入数组;
![](/images/learning-zepto-js-object-first/screen-shot-7.png)

Array对象的一系列循环方法第二个参数貌似都是设置函数内部this指向的(没有资料可以证明我说的话,用之前查文档,错了别找我- -)

classRE函数是一个使用缓存的动态生成正则对象的函数
![](/images/learning-zepto-js-object-first/screen-shot-8.png)

className方法上边已经提过了,只传入一个参数表示get,所以hasClass的作用就是判断该元素className中是否存在我们要插入的这个值.

正则对象调用的test()方法会返回一个bool值,匹配成功为true,匹配失败为false;

最后在addClass方法中,调用className传入两个参数,第一个是元素对象,第二个是原有class加上className集合转换的字符串.

### removeClass():

//没有按照API的顺序来,直接把class操作的这一套装说完它- -

removeClass函数只有一个可选的参数,可以为一个字符串(要移除的className),或者是一个function,用法同addClass,函数也必须要返回一个字符串

```javascript
$('<p class="test test2 test3"></p>').removeClass("test test3");
// --> <p class="test2"></p>/*<li>list item 1</li><li>list item 2</li><li>list item 3</li>*/
$('li').addClass("test");
$('li').removeClass(function (index, oldClass){
  return index % 2 === 0 ? "test" : "";
})// --> [li, li.test, li]
//或者可以不填参数,直接调用,直接调用会清除对象的所有className
$('<p class="test test2 test3">').removeClass();// --> <p></p>
```

removeClass相对于addClass简单点;
![](/images/learning-zepto-js-object-first/screen-shot-9.png)

大体相同,唯有在forEach循环中,addClass是给集合push值,而removeClass是从一个字符串中replace掉值;

### toggleClass():

方法使用与前两个类似,只不过多了第二个参数,第二个参数为true时,执行addClass,第二个参数为false时,执行removeClass(感觉用处不算太大额...)
![](/images/learning-zepto-js-object-first/screen-shot-10.png)

直接贴代码.如果第二个参数没有传,就按照有了删,没了填的方案来走,如果第二个参数有值,(有种走后门既视感),则不执行hasClass方法,直接通过when变量的值来决定使用什么方法.

关于class的几个方法算是说完了.个人认为,这是用的比较多的一套方法了.比如结合交互时做一个动画效果,在CSS无法实现的情况下,就可以将animation写到一个class中,触发某个事件时给元素add该class,就可以完成动画了.

今天就先说到这,本来想把后边的append也看了呢- -仔细一研究,码量有点足...另开一篇吧.

 
