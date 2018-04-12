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

成品插件下载地址：[https://atom.io/packages/atom-image-uploader](https://atom.io/packages/atom-image-uploader)

<!-- more -->

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
我们在触发`Paste`操作时，从`clipboard`中获取，如果剪切板中是图片的话，我们就将它上传并显示到编辑器中。
所以，接下来我们要做的就是：

1. 进行上传图片的操作
2. 将上传后的图片显示到编辑器中

### 上传图片

上传图片我们选择的是七牛，我们选择七牛来作为图床使用，因为他家提供了10GB的免费存储，灰常适合自己这样的笔记型博客。
但是用他家SDK时发现一个问题。。我将二进制数据转换为`ReadStream`后上传的资源损坏了-.-目前还没有找到原因。
所以我们做了曲线救国的方式。
将剪切板中的数据转换为`Buffer`然后暂存到本地，通过本地文件的方式来进行上传七牛。
在操作完成后我们再将临时文件移除。
```javascript
try {
  let buffer = clipboard.readImage().toPng()
  let tempFilePath = 'XXX'
  fs.writeFileSync(tempFilePath, Buffer.from(buffer))
} catch (e) {
  // catch error
} finally {
  fs.unlink(tempFilePath) // 因为我们并不依赖于删除成功的回调，所以直接空调用异步方法即可
}
```

### 将上传后的资源显示到编辑器中

因为考虑到上传可能会受到网络影响，从而上传时间不可预估。
所以我们会先在文件中显示一部分占位文字。
通过全局的`atom`对象可以拿到当前活跃的窗口：
```javascript
let editor = atom.workspace.getActiveTextEditor()
```

为了避免同时上传多张图片时出现问题，我们将临时文件名作为填充的一部分。
```javascript
editor.insertText(`![](${placeHolderText})`, editor)
```
然后在上传成功后，我们将对应的填充字符替换为上传后的URL就可以了。
```javascript
editor.scan(new RegExp(placeHolderText), tools => tools.replace(url))
```

`scan`方法接收一个正则对象和回调函数。
我们将前边用到的占位文本作为正则对象，然后在回调将其替换为上传后的`url`。
至此，我们的代码已经编写完了，剩下的就是一些交互上的优化。

完成后的效果图：
![](https://i.github-camo.com/9f326d047cc2560bcbc6114c5634edff8bed528e/68747470733a2f2f6f73347479367461622e716e73736c2e636f6d2f63626c7565642f7374617469632f64656d6f2e316361696f367439356675656f622e676966)

以及，最后：我们要进行`Package`的上传。

### 上传开发完的Package

首先我们需要保证`package.json`中存在如下几个参数：
1. `name`
2. `description`
3. `repository`

我们可以先使用如下命令来检查包名是否冲突。
```shell
apm show 你的包名
```

如果没有冲突，我们就可以直接执行以下命令进行上传了。
```shell
apm publish 你的包名
```

后续的代码修改，只需在该包的目录下执行：
```shell
apm publish
```

一些可选的参数：
1. `major`，增加版本号的第一位`1.0.0` -> `2.0.0`
2. `minor`，增加版本号的第二位`0.1.0` -> `0.2.0`
3. `patch`，增加版本号的第三位`0.0.1` -> `0.0.2`

通过`apm help`可以获取到更多的帮助信息。

以上，就是开发一个`Atom`插件的完整流程咯。

## 参考资料

[hacking-atom](https://flight-manual.atom.io/hacking-atom/)
[electron-doc](https://electronjs.org/docs)
