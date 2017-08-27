---
uuid: 8eb139c0-7dc8-11e7-af2c-134eac7c3914
title: Chrome设置断点的各种姿势
date: 2017-08-10 20:36:39
tags:
  - 工欲善其事，必先利其器
  - Chrome
---
 
> 最近在翻看Chrome devtools的文档，刚看到了关于断点调试这里，感觉发现了新大陆-。-
> 本文记录一下如何在Chrome上设置断点，以及可以设置哪些断点，并不涉及具体调试相关的操作。

<!-- more -->

### 在JavaScript代码中设置断点

> 刚工作时被leader安利了Chrome浏览器，那时一说到调试，就知道这一个操作
> 以为在行号上单击一下就是打断点，就是会调试了:)

当然这也是最最基本的打断点的方式了，当然了，相较于 *调试全靠alert* 已经高端很多了。  
首先需要打开`Devtools`切换到`Source`页签，然后在左侧`file navigation`中找到我们要设置断点的文件并打开。  
在打开的页面上单击对应的行号即可设置断点。
同时也可以通过在行号上右键点击`Add breakpoint`来设置断点。  
当断点触发时，整个页面会处于暂停状态，并会切换到Source页签断点处方便调试，直到终止该断点调试后页面才会继续运行。
设置断点的行号上会显示一个蓝色的矩形来告诉你这里有一个断点。

*P.S. 当一个表达式跨行时，添加的断点会默认下移到该表达式结束后的一行*

![](/images/how-to-add-breakpoints/screenshot-1.png)

### 在JavaScript代码中设置条件断点

> 当知道了如何在行号上单击来添加断点，已经能满足最最最基本的调试了。

但如果遇到一些特殊情况，断点添加起来不是那么的舒服的时候要肿么办呢？  
比如说我写了一个循环，该循环会执行`10`次，可是我发现程序在第`8`次执行时的结果并不是我想要的。**（不禁回想起刚工作时，有类似的问题，我当时的处理方式就是一手托腮，另一只手放在F8键上，狂按数十下后正襟危坐，开始调试）**  
显然，`Chrome`已经帮我们想到了这种场景，我们可以通过添加一些条件断点来避免一些无意义的断点。

我们可以通过右键行号，选择`Add conditional breakpoint`来添加一个带有条件的断点。

![](/images/how-to-add-breakpoints/screenshot-2.png)

这是我们会看到界面上多出了一个输入框，并提示我们将在XXX行设置一个只会满足下列表达式的时候才会暂停的断点-.-

![](/images/how-to-add-breakpoints/screenshot-3.png)

结合上边的场景，我们就在输入框中键入如下表达式，当循环计数器`count`全等于`8`时，会暂停页面并进入调试。
回车确认后我们就得到了一个金黄色的矩形来标识。

![](/images/how-to-add-breakpoints/screenshot-4.png)

### 删除或禁用JavaScript断点

删除断点的方式，选择菜单栏中的`Remove breakpoint`。
禁用断点的方式，选择菜单栏中的`Disable breakpoint` 或者直接在设置了断点的行号上单击即可。

或者我们也可以通过`debugger`模块来统一管理所有的断点。
点击断点对应的复选框可以禁用断点，右键选择`Remove breakpoint`也可删除断点。

以及一些对断点的其他操作也可以通过右键菜单来实现，禁用激活所有的断点之类的。

![](/images/how-to-add-breakpoints/screenshot-5.png)

### 在DOM元素上设置断点

> 断点不仅仅可以设置在JS代码上，还可以在DOM元素上设置断点
> 刚刚看到时我都惊呆了，没想到竟然还有这种操作。

![](/images/how-to-add-breakpoints/screenshot-6.png)

我们可以设置三种断点
- `subtree modifications`子节点内容的的修改删除新增（子节点的属性修改不会触发，当前节点的修改不会触发）
- `attribute modifications`当前节点的属性修改删除新增
- `node removal`当前节点被移除

我们需要切换到`Elements`页签，在想要添加断点的DOM节点上右键点击，在最下边的`Break on`菜单项可以找到这三个选项

![](/images/how-to-add-breakpoints/screenshot-6.png)

当我们的脚本触发了DOM的修改时，`devtools`会直接跳转到`Source`页签并定位到修改DOM的那行代码上

![](/images/how-to-add-breakpoints/screenshot-8.png)

同时我们还可以通过`debugger`模块来管理所有的DOM断点，
可以看到所有的DOM断点，以及他们所监听的类型，
也可以进行一键删除之类的操作。

![](/images/how-to-add-breakpoints/screenshot-7.png)

### XHR请求的断点

我们可以通过`debugger`下的`XHR Breakpoints`来管理`XHR`请求相关的断点。
点击➕新增一个断点，我们可以选择输入一个链接地址，当一个`XHR`请求的链接与所输入的值匹配时，便会中断进程进入断点。

![](/images/how-to-add-breakpoints/screenshot-9.png)

或者我们可以选择直接回车，监听所有的`XHR`请求

![](/images/how-to-add-breakpoints/screenshot-10.png)

*P.S.如果想要监听`XHR`请求的某个状态，可以参考下文*

### 各种事件的断点

> 用了这个再也不用担心多人开发时找不到事件处理的代码写在哪里了。

这里边可以监听的事件挺全的。。就是勾选复选框即可，当触发某个事件时，便会跳转到对应的代码中去。
截图展开部分就是`XHR`请求周期的各种状态事件

![](/images/how-to-add-breakpoints/screenshot-11.png)

### 异常断点

当代码出现异常时，我们会在`Console`页签看到错误提醒，并可以通过后边的锚点找到对应的文件以及定位到出错的代码行。

![](/images/how-to-add-breakpoints/screenshot-12.png)

但是这时代码已经抛出了异常，我们可以通过设置异常断点，在抛出异常前进入断点进行调试。
点击`debugger`上边的的这个小图标，就可以设置在程序抛出异常时进入断点。（灰色为禁用-.-悬浮icon会有提示）

![](/images/how-to-add-breakpoints/screenshot-13.png)
![](/images/how-to-add-breakpoints/screenshot-14.png)

### 小记

只想说，`Chrome`真的很强大。
平时能用到`Chrome Devtools`的功能也是少之又少。
仅仅一个打断点就能搞出这么多花来，很期待接下来能够在文档中发现什么。
