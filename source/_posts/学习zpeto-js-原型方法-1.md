---
uuid: 91527df0-b97a-11e6-8bab-73a75d1c2eee
title: '学习zpeto.js(原型方法)[1]'
date: 2015-08-10 17:24
tags: js
---
 
新的一周,新的开始,今天来学习一下zepto里边的原型方法,就是通过$.进行调用的方法,也是可以通过$.fn进行扩展的方法:
<!-- more -->

### $.camelCase():

方法接收一个字符串,将连字符格式的字符串转为驼峰格式的字符串:

```javascript
$.camelCase("login-name"); // ->loginName
$.camelCase("loginName"); // ->不作处理
```
![](/images/learning-zepto-js-prototype-first/screen-shot-1.png)

(本人发现zepto中的原型方法都是通过将匿名函数赋值给变量的方式来进行声明的,而直接使用function声明的函数在外部是获取不到的)解释的不详细，是因为原型方法都有一个原型的引用，而那些普通函数没有做这个引用，好区分而已

通过一个正则匹配连字符及后边的一个字符(如果有的话);

### $.contains():

方法接受两个参数,均为Dom节点类型,检查第一个参数是否包含第二个参数;

```javascript
$.contains(document.getElementsByTagName("html")[0],document.getElementsByTagName("body")[0])// 返回true

$.contains(document.getElementsByTagName("body")[0],document.getElementsByTagName("html")[0])// 返回false

$.contains(document.getElementsByTagName("body")[0],document.getElementsByTagName("body")[0])// 返回false
```
![](/images/learning-zepto-js-prototype-first/screen-shot-1.png)

高性能JavaScript里边曾经提到过这种写法,一个方法需要做兼容处理时,写成这样会比较节省资源,而不是在方法内部判断并执行,因为用户在使用的过程中不可能更换浏览器(原话忘记了,差不多就是这意思.);

如果存在contains方法,这个就不多做解释了,浏览器内置了处理方法,包含为true,其余为false,

如果不存在,那么就需要自己去做一个方法来实现同样的功能(这应该就是兼容的意义所在吧)

只有一个问题,如果将两个参数位置颠倒或两个参数相等,则函数会循环至html元素才会停止(虽说这种情况会很少出现);

### $.each():

方法用于循环数组或json,传入两个参数,第一个是要循环的对象,第二个是回调函数(每次循环都会执行一次迭代),zepto会通过当前循环对象执行回调并传入两个参数,第一个是数组中的下标或者json中的key,第二个参数为当前对象的值,回调中可以返回一个bool值,如果返回false,则会终止当前循环并返回当前对象(第一个参数);

```javascript
$.each([123], function (index, item){
　　console.log(this+ "|" + index + "|" + item); //123|0|123
});

$.each({name: 'niko',age: 18}, function (key, value){
　　console.log(this + "|" + key + "|" + value); //niko|name|niko
});

$.each([123, 233], function () {
　　if(this===233) return false; //有效值仅仅为false,其余均忽视
});
```
//回调函数中的命名是无所谓的,a|b都是可以的,但是合理的命名能让其他看到这段代码的同学明白你要做的事情;

![](/images/learning-zepto-js-prototype-first/screen-shot-3.png)
likeArray函数就不贴了,判断传入参数的length属性是否为number,所以说,像一些nodeList之类的也是可以放心使用$.each而不用担心方法会走for-in循环,如果数组顺序对逻辑的执行没有影响还是推荐自己写一个for循环或while循环,如下:

```javascript
var array =[1,2];
for(var length = array.length - 1; length >= 0; length--){
  //do..  
}
var length = array.length;
while (length--) {
  //do...  
}
```

//递减的性能要比递增的性能好点(说话不说那么绝对,不留下一个喷点- -)

### $.extend():

该方法用来继承,也是扩展插件所需的方法,方法有效执行须接收两个以上的参数,第一个参数为目标对象,第二个以后的为来源,来源会覆盖目标的原有属性,默认为浅复制,如果想要深度复制,则将第一个参数设为true,然后是目标对象.来源...

```javascript
var target = {};
$.extend(traget, {
  name: 'niko'
}); //浅复制

$.extend(true, target, {
  name: 'niko'
}); //深度复制()
```

![](/images/learning-zepto-js-prototype-first/screen-shot-4.png)
方法的执行过程为先将除了第一个参数以外所有的参数取出作为来源值(默认认为是浅复制),然后判断target是否为boolean类型的值,如果是,则将deep变量赋值为target,并将target赋值为来源值数组中的第一个([].shift(),将数组中第一个元素从数组中删除并返回);接下来循环来源值,调用extend方法;

extend方法接收三个参数,第一个为目标对象,第二个为来源值,第三个是标识是否深度复制的.

方法将会枚举来源值,并判断是否为深度复制以及值是否为一个Object对象或数组,如果是的话,将会新创建一个Object或数组,然后递归调用extend方法,脱离引用关系(注:自定义对象将不会脱离引用关系);

否则就执行普通的复制;

```javascript
var target1 = {};
var target2 = {};
target1.quote = {
　name: "name",
　array: [1, 2, 3]
};
target2.quote = {
　name: "name",
　array: [1,2,3]
};
var copy = {};
var copy_deep = {};
$.extend(copy, target1);
$.extend(true, copy_deep, target2);
copy.quote.name = "change";
copy_deep.quote.name = "change";
copy.quote.array.push(4);
copy_deep.quote.array.push(4);
console.log(target1.quote);
console.log(target2.quote);
```
该方法返回值接收不接收是无所谓的- -方法返回目标对象的原因是为了链式操作,经过extend以后直接使用即可.

### $.fn:

这个不是一个方法,而是一个对象,指向Zepto对象的prototype,所以说,使用$.extend来使$.fn继承某些方法,进行扩展插件.

```javascript
$.fn.alert = function () {　　
  alert(this.html());//this指向调用该方法的Zepto对象
}
$("<span>hello</span>").alert();//-->hello /*这种是直接给key赋值,如果有多个,须结合$.extend使用*/
$.extend($.fn, {
  alert: function () {
    alert(this.html());//this指向调用该方法的Zepto对象
　},
  confirm : function () {
    confirm(this.html());//this指向调用该方法的Zepto对象  
　}
});
```
PS:为了配合链式操作,扩展的方法最好将this返回;

因为是个对象,所以就不贴码了.

今天先写这么点儿,快下班了.收工.每天自学一点.
