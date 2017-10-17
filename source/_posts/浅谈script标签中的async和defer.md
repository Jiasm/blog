---
uuid: cd1c8ef0-b278-11e7-bdc9-5fe865136825
title: 浅谈script标签中的async和defer
date: 2017-10-16 21:49:16
tags:
 - html
 - crhome
---

> `script`标签用于加载脚本与执行脚本，在前端开发中可以说是非常重要的标签了。
> 直接使用`script`脚本的话，`html`会按照顺序来加载并执行脚本，在脚本加载&执行的过程中，会阻塞后续的`DOM`渲染。  

<!-- more -->

现在大家习惯于在页面中引用各种的第三方脚本，如果第三方服务商出现了一些小问题，比如延迟之类的，就会使得页面白屏。
好在`script`提供了两种方式来解决上述问题，`async`和`defer`，这两个属性使得`script`都不会阻塞`DOM`的渲染。
但既然会存在两个属性，那么就说明，这两个属性之间肯定是有差异的。

## defer

> 如果`script`标签设置了该属性，则浏览器会异步的下载该文件并且不会影响到后续`DOM`的渲染；
> 如果有多个设置了`defer`的`script`标签存在，则会按照顺序执行所有的`script`；
> `defer`脚本会在文档渲染完毕后，`DOMContentLoaded`事件调用前执行。

我们做了一个测试页面，页面中包含了两个`script`标签的加载，给他们都加上`defer`标识。
*P.S. 为了更直观，我们给`script1.js`添加了`1s`的延迟，给`script2.js`添加了`2s`的延迟。*
![image](https://user-images.githubusercontent.com/9568094/31616879-896dbbe0-b253-11e7-9f72-8f259c412a44.png)
下图是页面加载的过程&`script`脚本的输出顺序。
不难看出，虽然`script1`加载用时虽然比`script2`短，但因为`defer`的限制，所以Ta只能等前边的脚本执行完毕后才能执行。
![image](https://user-images.githubusercontent.com/9568094/31616627-d051b918-b252-11e7-848e-0aa60c24ea61.png)
![image](https://user-images.githubusercontent.com/9568094/31617239-558931f0-b254-11e7-844e-309936c48ffa.png)

## async

> `async`的设置，会使得`script`脚本异步的加载并在允许的情况下执行
> `async`的执行，并不会按着`script`在页面中的顺序来执行，而是谁先加载完谁执行。

我们修改测试页面如下：
![image](https://user-images.githubusercontent.com/9568094/31617555-1feaed6c-b255-11e7-8cea-447e99d4e1b3.png)
遂得到了如下的结果，页面加载时长上，并没有什么变化，毕竟都是异步加载的脚本。
但是我们可以看到一个小细节，**`DOMContentLoaded`事件的触发并不受`async`脚本加载的影响**，在脚本加载完之前，就已经触发了`DOMContentLoaded`。
![image](https://user-images.githubusercontent.com/9568094/31617632-4f5b4b78-b255-11e7-8641-7d03a5e027b2.png)
![image](https://user-images.githubusercontent.com/9568094/31617946-3e7b7a16-b256-11e7-9ca4-f66c1f709ba3.png)
![image](https://user-images.githubusercontent.com/9568094/31617686-833da8fa-b255-11e7-8080-d7a2e85b53a2.png)
![image](https://user-images.githubusercontent.com/9568094/31617731-a3864a18-b255-11e7-8283-d48e4f5e30cb.png)

我们接着修改测试页面。加载一个没有延迟的`script`脚本，使得脚本可以即时的加载完毕。
我们要测试一下，如果`async`脚本加载的足够快，是否会在`DOMContentLoaded`之前就执行（**这个实验是基于对`async`的描述“在允许的情况下执行”的论证**）。
同时为了保证测试的稳定性，我们在`script`脚本引入的后边添加了数千个空的`div`节点，用来延长文档的渲染时间。
![image](https://user-images.githubusercontent.com/9568094/31618663-29873404-b258-11e7-8333-b113aa95c0ae.png)
执行结果不出所料，如果给`async`一定的时间，是有可能在`DOMContentLoaded`事件之前就执行的。
![image](https://user-images.githubusercontent.com/9568094/31619033-314a03dc-b259-11e7-862f-17a0317920bb.png)
P.S. 从上图中左上角的火焰图中，我们也能看到，出现了多段的~~蓝色~~（更新：晚上写的时候懵了，紫色的才是渲染，蓝色的是解析）文档渲染。以及下边`Console`的顺序。
说明的确，`async`的执行是加载完成就会去执行，而不像`defer`那样要等待所有的脚本加载完后按照顺序执行。

## 画几张图简要说明

> 网上有了不少这种类似的图，但是基本都是拿一个script就举例的
> 未免太过寒酸，so咱们来一个豪华版，来画一下多个脚本加载时的甘特图
> 就像近年来各大手机厂商，出新机都喜欢来一个X+X plus

拿四个不同的颜色来标明各自代表的含义
![image](https://user-images.githubusercontent.com/9568094/31619989-a874ae42-b25b-11e7-9a80-e0f644f27849.png)


### 普通script

文档解析的过程中，如果遇到`script`脚本，就会停止页面的渲染进行下载（但是并不会影响后续的解析，解析和渲染是两码事儿）。
资源的下载是在解析过程中进行的，虽说`script1`脚本会很快的加载完毕，但是他前边的`script2`并没有加载&执行，所以他只能处于一个挂起的状态，等待`script2`执行完毕后再执行。
当这两个脚本都执行完毕后，才会继续渲染页面。
![image](https://user-images.githubusercontent.com/9568094/31621391-39849b1a-b25f-11e7-9301-641b1bc07155.png)

### defer

文档解析时，遇到设置了`defer`的脚本，就会在后台进行下载，但是并不会阻止文档的渲染，当页面解析&渲染完毕后。
会等到所有的`defer`脚本加载完毕并按照顺序执行，执行完毕后会触发`DOMContentLoaded`事件。
![image](https://user-images.githubusercontent.com/9568094/31621324-046d4a44-b25f-11e7-9d15-fe4d6a5726ae.png)

### async

`async`脚本会在加载完毕后执行。
`async`脚本的加载不计入`DOMContentLoaded`事件统计，也就是说下图两种情况都是有可能发生的

![image](https://user-images.githubusercontent.com/9568094/31621170-b4cc0ef8-b25e-11e7-9980-99feeb9f5042.png)
![image](https://user-images.githubusercontent.com/9568094/31622216-6c37db9c-b261-11e7-8bd3-79e5d4ddd4d0.png)

## 推荐的应用场景

### defer

如果你的脚本代码依赖于页面中的`DOM`元素（文档是否渲染完毕），或者被其他脚本文件依赖。
**例：**
1. 评论框
2. 代码语法高亮
3. `polyfill.js`

### async

如果你的脚本并不关心页面中的`DOM`元素（文档是否渲染完毕），并且也不会产生其他脚本需要的数据。
**例：**
1. 百度统计

如果不太能确定的话，用`defer`总是会比`async`稳定。。。

## 参考资料

1. https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script

测试代码存放处：https://github.com/Jiasm/research-script-tag
`clone`后执行`npm start`即可运行。
调试推荐使用`chrome`无痕模式（这样才不会在`Performance`页签上看到不相关的插件数据）。
