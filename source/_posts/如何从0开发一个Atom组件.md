---
uuid: 402d15c0-3caf-11e8-a173-bd12ba135ae1
title: 如何从0开发一个Atom组件
date: 2018-04-10 19:06:42
tags:
---

> 最近用Atom写博客比较多，然后发现一个很严重的问题。。
> 没有一个我想要的上传图片的方式，比如某乎上边就可以直接copy/paste文件，然后进行上传。
> 然而在Atom上没有找到类似的插件，最接近的一个，也还是需要手动选择文件，然后进行上传。
> 这个操作流程太繁琐，索性自己写一个插件用好了。

## 规划

首先，我们确定了需求，要通过可以直接`copy`文件，然后在Atom中`paste`即可完成上传的操作。
确定了以后，我们就要开始搬砖了。

## 插件开发

因为`Atom`是一个`Electron`应用：[https://electronjs.org](https://electronjs.org)

是使用`JavaScript`来开发的桌面应用，所以对于一个前端来说，简直是太美好了。
我们先去翻看`Atom`的官方文档，查看关于创建插件相关的操作：
首先我们在`Atom`中打开命令面板，然后输入`Generate Package`
![](https://os4ty6tab.qnssl.com/test/atom-editor/rf2.png)
按下回车后，将会弹出一个对话框，在框中输入要建立的包名即可完成一个`Package`的创建。
![](https://os4ty6tab.qnssl.com/test/atom-editor/sba1.png)
`Atom`会生成一套默认文件，并打开一个新的窗口。

## 项目结构

生成的插件目录如下：
```shell
.
├── keymaps
│   └── first-package.json
├── lib
│   ├── first-package-view.js
│   └── first-package.js
├── menus
│   └── first-package.json
├── package.json
├── spec
│   ├── first-package-spec.js
│   └── first-package-view-spec.js
└── styles
    └── first-package.less
```

### keymaps

这里可以配置要监听的快捷键，我们可以设置一些自定义快捷键来触发一些我们插件的行为。
```json
{
  "atom-workspace": {
    "ctrl-alt-o": "first-package:toggle"
  }
}
```

我们可以添加各种自定义的快捷键在这里。
`Value`的定义为：`包名:触发的事件名`
需要注意的是：
这里配置的快捷键还有一个作用域的概念。也就是`JSON`外边的那个`key`。
`atom-workspace`表示在`Atom`中生效
`atom-text-editor`表示只在文本编辑器范围内生效。
![](https://os4ty6tab.qnssl.com/test/atom-editor/ip8k.png)
[Atom官方文档](https://flight-manual.atom.io/behind-atom/sections/keymaps-in-depth/)

### lib

这里就是存放插件主要代码的地方了。
默认会生成两个文件：
1. `package.js`
2. `package.view.js`

默认插件生成的主入口文件指向这里。
![](https://os4ty6tab.qnssl.com/test/atom-editor/gd.png)

入口文件的表现方式为一个`JSON`对象，可以实现如下几个函数：
1. `activate`: 当`Package`被激活时会执行该方法，函数的签名表示会接受一个`state`参数，该参数是通过`serialize`方法传递过来的（如果有实现它的话）
2. `deactivate`: 当`Package`失效时会出发的方法，这两个方法可以理解为`React`中的`componentWillMount`和`componentWillUnmount`
3. `serialize`: 也就是上边说到的那个方法，可以返回一个`JSON`对象供下次激活后使用
4. 自定义快捷键对应的事件名: 每次`Package`被触发对应快捷键时都会执行的方法

### menus

这里存放的是在应用菜单和编辑区域菜单栏的配置文件
```json
{
  "context-menu": {
    "atom-text-editor": [
      {
        "label": "Toggle first-package",
        "command": "first-package:toggle"
      }
    ]
  },
  "menu": [
    {
      "label": "Packages",
      "submenu": [
        {
          "label": "first-package",
          "submenu": [
            {
              "label": "Toggle",
              "command": "first-package:toggle"
            }
          ]
        }
      ]
    }
  ]
}
```
`context-menu`对应的元素会在对应的区域内右键触发时显示。
`menu`则是出现在`Atom`主菜单栏上：
![](https://os4ty6tab.qnssl.com/test/atom-editor/8opc.png)
同样的，`context-menu`会区分两个环境，`text-editor`和`workspace`。

### spec

这里存放的是一些测试用例，创建`Package`会生成一些默认的断言。
*写测试确实是一个好习惯。*

### styles

如果`Package`有很多`View`要展示的话，可以在这里编写，默认使用的是`Less`语法。
由于我们只做一个`C/V`的操作，不会涉及到界面，所以`styles`直接就删掉了。

## 开始搬砖

大致结构已经了解了，我们就可以开始搬砖了。
因为是一个`Electron`应用，所以我们直接在`Atom`中按下`alt + command + i`，呼出我们熟悉的控制台界面。
![](https://os4ty6tab.qnssl.com/test/atom-editor/f7qn.png)

`Atom`是不会把`Electron`的各种文档重新写一遍的，所以我们现在控制台里边试一下我们的猜测是否正确。
一些想要的东西是否存在。
![](https://os4ty6tab.qnssl.com/test/atom-editor/4qjt.png)
经过验证确定了，`Electron`的`clipboard`对象可以直接在`Atom`中使用，这就很开心了。
```javascript
require('electron').clipboard.readImage().toPng()
```
这样我们就拿到剪切板中的图片数据了，一个二进制的数组对象。

然后我们要做的就是：
1. 设置自定义快捷键
2. 引入上传图片的工具



### 上传

我们选择七牛来作为图床使用，因为他家提供了10GB的免费存储，灰常适合自己这样的笔记型博客。
