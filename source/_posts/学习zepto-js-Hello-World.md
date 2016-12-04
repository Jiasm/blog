---
uuid: 8b1dbf30-b97a-11e6-ac0b-47a7072af775
title: 学习zepto.js(Hello World)
date: 2015-08-07 21:39
tags: js
---

Zepto是一个轻量级的针对现代高级浏览器的JavaScript库， 它与jquery有着类似的api。 如果你会用jquery，那么你也会用zepto。

昨天听说了zepto.js,正好最近也比较闲,所以就学习一下这个著名DOM操作库,由于本人刚接触这个,但又不想单纯的说如何使用,所以本人会按照API顺序来说明方法如何使用并试着将对于源码的理解写上来;
<!-- more -->

### $():

　　与jQuery的$()几乎一样,但zepto的选择器是直接使用的原生querySelectorAll(),所以,一些jQuery自定义的选择器是不支持的,但可以添加selector.js模块来添加10个(是的,我查了)常用的伪类选择器;

　　$()选择器有五种用法:

　　$(选择器,[可选的上下文环境,默认document])

```javascript
$("#id");/*document.getElementById("id")*/
$("#id time");/*document.querySelectorAll("#id time")*/
$("#id", $("head"));/*如果$('head')只有一个元素,那么就按head[0].querySelectorAll("#id")来取,否则循环$('head')取,返回的都是Zepto对象,可以传入DOM对象*/
$("<span>hello world</span>");/*将会创建一个span标签,*/
$("<span>",{
  text: 'hello',
  id:'span-ele',
  css: {
    color: 'red'
  }
})/*创建一个id为span-ele,显示值为hello,红色的span标签*//*以上为作为选择器的使用方法*/
$(function(){
  //do...用过jQuery的应该都知道,这是绑定的DOMContentLoaded 事件
})
```

　　当$变量已经存在时,如引用了jQuery,那么zepto的全局对象将不会指向$,但始终指向window.Zepto
![](/images/learning-zepto-js-hello-world/screen-shot-1.png)

　　接下来瞅瞅内部代码是如何实现的;
![](/images/learning-zepto-js-hello-world/screen-shot-2.png)

zepto函数最终返回的是一个$符号,$()的调用方式说明了$对象是一个function,所以找到了下图中的代码
![](/images/learning-zepto-js-hello-world/screen-shot-3.png)

$函数返回了上图中的zepto.init()函数的执行结果,接收了两个参数,第一个是选择器(selector),第二个是上下文(context),

　　如果调用时selector为空,则直接返回一个Zepto对象,

　　如果selector为字符串,先去除两端空格,然后判断selector是否为包含html标签的字符串,

　　　　如果是则通过fragment方法生成一个dom对象并返回,

　　当验证selector为dom选择器时,进一步判断context是否为空,

　　　　不为空时将上下文包装为zepto对象后执行find方法,//这里包装上下文的作用在于,传入的上下文也许是一个dom对象,也许是一个zepto对象,而调用.find方法去执行的目的是为了兼容有些zepto对象数组下有多个对象,其实find里边也是循环调用qsa(zepto封装的query方法,下边都会说)

　　　　为空时就直接通过document调用query方法了.

　　当验证selector为一个Function对象时，就会将该方法绑定至DOMContentLoaded事件，

　　zepto.isZ函数用来验证是否为Zepto对象，如果是就直接返回，不做处理，

　　其余的情况，基本上属于将基本类型包装为zepto对象的操作了。但有一点令我不理解的地方是，为何在最后又添加了这么一段重复的逻辑，还希望有知道的同学告诉在下。
![](/images/learning-zepto-js-hello-world/screen-shot-4.png)

最后返回的一个变量经过Zepto的构造函数摇身一变为Zepto对象。

接下来说一下$构造器中用到的一些其他函数;

　　像通过zepto对象调用的方法，都是可以在其他地方通过$（Zepto）.zepto[方法名]调用的， 如 $.zepto.qsa();

　　而通过$.fn定义的，定制插件也是通过$.fn来完成的，细看代码会发现这一句
![](/images/learning-zepto-js-hello-world/screen-shot-5.png)

通过$.fn[方法名]定义的为原型的方法；

通过$[方法名]定义的为类方法；

### fragment（）：

该方法用来生成一个dom节点并返回
![](/images/learning-zepto-js-hello-world/screen-shot-6.png)

该方法接收最多三个参数，

　　第一个为html值，可以只是一个标签，如（“<span>”）、或一个html片段，如（“<span>hello</span>”）；

　　第二个为一个标识符，用来确定标签类型，该变量主要用于对表格类元素进行一些特殊的处理，用于生成节点的一个临时父节点（下边会说的）；

　　第三个是一些属性值，是一个json结构的，但要注意为驼峰命名法，因为zepto的精简，所以不想jQuery那样的宽容。

首先，方法内部判断html是否为一个标签：

　　如果是，直接生成该标签；

　　如果不是，则通过replace方法将自关闭的标签转换为普通标签，tagExpanderRE正则对象内容如下
![](/images/learning-zepto-js-hello-world/screen-shot-7.png)

　　然后判断name变量是否为空，如果为空，通过正则取出标签尖括号内的值。fragmentRE内容如下：
![](/images/learning-zepto-js-hello-world/screen-shot-8.png)

　　接下来在数组containers中循环查找看该标签是否为表格类的标签，如果不是就给一个【\*】，【\*】的临时父容器为div。

　　containers是一个数组，数组中存放的为数个createElement方法：
![](/images/learning-zepto-js-hello-world/screen-shot-9.png)

　　可以看到这基本上是为了表格而做的- -（本人猜测是因为如果直接将div的innerHTML值赋值为”<tr></tr>“的话会在外侧自动生成tbody，table等标签的。懒得试了，应该是的。。。）；

　　然后就是创建临时父容器，将html变量直接塞进去。

　　接下来是一个令我凌乱的方法调用。。。（为何人家就是这么叼？？？）

　　通过$.each循环父容器的所有子节点，然后remove该节点，而dom.removeChild（）会返回该节点。（卧槽- -）$.each()方法又会返回一个数组，所以间接的就创建了dom节点。（真心感觉读源码涨姿势）；

　　判断properties是否为一个简单的Object，方法如下：
![](/images/learning-zepto-js-hello-world/screen-shot-10.png)

　　然后遍历该object，将属性放入dom元素中，那个判断就不多做解释了，因为有一些属性被zepto做成方法了，所以直接调用该方法就可以了，这也是为什么调用$("",{text:'显示的值'}),可以通过text设置显示的值，需要做一些样式处理则可以这样写

```javascript
$("",{
  css: {
    color: 'red',
    backgroundColor: 'blue'
  }
})/*因为style会有多个，所以css的值必须为一个json*/
```

　　完成以后就可以返回该dom元素了。

### qsa（）：

　　跳过find方法- -以后再说。。。；

　　qsa（querySelectorAll的缩写）；
![](/images/learning-zepto-js-hello-world/screen-shot-11.png)

　　![Image](http://images0.cnblogs.com/blog2015/731575/201508/072116295342206.png)

　　方法接收两个参数，上下文，选择器；

　　$()方法中如果不传入上下文的话，默认是这样调用的

zepto.qsa(document,selector)

　　默认将document作为上下文传入；

　　作为一个看美剧十句话能听懂三句的人，表示一眼就能看出maybeID,maybeClass变量的含义- -；

　　关于simpleSelectorRE这个正则就不贴截图了，就是个判断字符串中间是否有空格的。就是说看是不是不包含子选择器的；

　　上边几个变量都是用来判断的，下边是一大串的三元运算符，看着挺晕的，但是听我解释完，肯定会明白的（说不定就更晕了）；

　　首先是

　　　　确定上下文对象支持getElementById方法，该选择器不包含子选择器并且选择器开头是个#号，这说明人家要的是个ID：XXX的标签

　　　　　　如果满足这种情况，就调用getElementById并将返回结果放入一个数组，这也是为什么获得jQuery对象就算是通过ID选择器也会返回一个length为1的数组的原因，如果没有获取到该元素，则返回一个空数组；

　　　　如果不满足该条件，则判断上下文是否为一个标签节点，文档对象节点或一个文档片段节点。如果不是这三个，说明他也不会支持下边的一些选择器方法了。直接返回空数组（任性~）；

　　　　　　但如果满足条件了，继续进行判断，选择器为不包含子选择器的（get√），并且不是通过ID选择的（get√），而且支持getElementsByClassName的（get√），好了 继续判断。。。

　　　　　　　　mabeyClass（也许是个类选择器），那么咱们就通过getElementsByClass来取它；

　　　　　　　　maybeNot（没有这个变量的），那么就通过getElementByTagName来取；（的确只有这两种了）

　　　　　　然后这里是不满足条件的处理

　　　　　　　　直接通过上下文调用querySelectorAll（）方法，这个是支持子选择器的。（但是jQuery不是这么写的，至少不全是，因为jQuery还有一些自己的伪类，zepto是没有的）；

　　关于那个slice.call()只是为了将里边返回的dom对象放在一个数组里罢了。

　　先写那么点吧，快十点了，有点略困；

　　我是昨天听说，今天才开始接触它，如果有哪里写的不对，还请指出来。谢谢！

　　　　
