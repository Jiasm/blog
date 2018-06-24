---
uuid: a3ab9f00-768d-11e8-b3fd-09142d923783
title: Web开发生存工具使用指南
date: 2018-06-23 10:32:14
tags:
  - 工欲善其事，必先利其器
---

这里安利两款我认为开发中能够极大的提高生产力的工具，Charles 和 Postman。

_P.S. Charles(查尔斯)。。不要再读查理斯了，金刚狼中被老铁扎心的博士就叫 Charles_

<!-- more -->

## 两者的作用

首先，这两个工具重叠的功能并不多，两者一起使用效果绝对是`1 + 1 > 2`。

### Postman

Postman 主要是用于模拟 http 请求，可以很方便的测试各种`METHOD`的请求。  
进阶用法还可以使用其进行一些自动化测试的操作，详见[使用 postman 进行自动化测试](/2018/04/02/%E4%BD%BF%E7%94%A8postman%E8%BF%9B%E8%A1%8CAPI%E8%87%AA%E5%8A%A8%E5%8C%96%E6%B5%8B%E8%AF%95/)

### Charles

Charles 则属于一款代理工具，设置代理后便可以进行 http 请求的抓包，以及修改一些请求实际的内容来达到调试的目的。  
**主要是支持移动设备，跨设备调试神器**

### 在日常中使用的顺序

一般在开发过程中，首先会通过`Postman`来进行接口的本地调试，验证没有问题以后则会进行代码的部署。  
部署完成后就可以使用移动设备进行查看效果，这时为了验证接口的有效性，我们就会用到`Charles`，设置代理并拿到移动设备访问接口时的请求参数及返回值，进行验证确保生产环境上接口正常。

如果是在生产环境上出现了问题，这时候就可以先拿`Charles`抓包（也就是获取接口的请求信息），在确认接口确实出现问题时，我们现在就有两种途径可以去 debug：

1.  使用`Charles`设置代理，将一个远程服务器地址代理到本地服务进行调试
2.  使用`Postman`模拟当时生产环境的请求（从`Charles`中 copy header、query 之类的数据）

以上的操作都是非常直观的，非常高效的，如果抛开这类工具不用，就靠人肉 debug，不知要额外耗费多少时间了。

## Postman 的安装与使用

Postman 是一款纯免费的工具（当然，一个多人协作的功能是额外收费的），由 Electron 驱动的一款软件。

官方网站：[https://www.getpostman.com/](https://www.getpostman.com/)  
下载地址：[https://www.getpostman.com/apps](https://www.getpostman.com/apps)

此处略过下载&安装的过程。
_P.S. 新版推荐安装独立应用，而不是 Chrome 的插件_

打开应用后的界面大概是这个样子的：  
![](/images/tools-usage/usage-postman-landingpage.png)

首先是右侧的内容主体，这里包含了最基础的几个设置项。  
![](/images/tools-usage/postman-request-input.png)

- 指定请求的 Method
- 设置请求的 URL
- 添加请求时所携带的参数

在上边的这几项都设置完成后，点击 Send 按钮，即完成一个请求的发送了。  
当然，如果在发送请求时想添加一些 Header 信息的话，直接在下边编辑 Header 信息即可，界面类似 Params。
![](/images/tools-usage/postman-header-editor.png)  
上图中右上角可以看到有一个 Cookies 按钮，点击后发现这里保存的是在 Postman 中所有访问的接口所返回的 cookie 信息，可以一键添加到当前请求的 Header 中来。
![](/images/tools-usage/postman-cookie-copy.png)

在请求发送过后，就可以在下边看到请求相应的结果了。
![](/images/tools-usage/postman-response.png)

- Body 表示响应的结果
- Cookies 为服务端返回的 cookie
- Headers 是服务端返回的时所设置的各种头信息（Content-Type、Status 以及 CORS 之类的信息都会在这里）
- Test Results，是测试脚本执行的结果（如果有编写的话，详见之前写过的[使用 postman 进行自动化测试](/2018/04/02/%E4%BD%BF%E7%94%A8postman%E8%BF%9B%E8%A1%8CAPI%E8%87%AA%E5%8A%A8%E5%8C%96%E6%B5%8B%E8%AF%95/)）

再下边一行是返回数据的展示，默认会针对返回值的`Content-Type`进行自动格式化，三个按钮可以切换视图（格式化、原始数据、预览）  
如果访问的 http 请求返回为 html 文件，则预览状态下展现类似浏览器，但是有些遗憾的是，页面中的静态资源引用一定要是绝对路径，不能出现类似这样的使用`<link href="/XXX" />`只能是`<link href="http://XXX" />`  
![](/images/tools-usage/postman-preview.png)

用 Postman 还有一个很喜人的地方，如果你需要和其他人进行接口的联调，先在 Postman 中编写好对应的格式尝试发送请求，如果接口不符合预期的话，可以点击 Send 按钮下边的 code，将该次请求生成各种语言的实现，直接 copy 给对方，让对方帮忙查看问题出在哪里。
![](/images/tools-usage/postman-request-code.png)

最左侧的一栏，Collections，可以理解为是一个类似文件夹的存在，里边会包含多个 Request（也就是上边写的某一个请求）。  
用于分组自动化测试，如果不使用自动化测试的话，单纯的当作一个文件夹来看待也是没有问题的。

## Charles 的安装与使用

这两个工具的安装都比较简单，但是 Charles 在配置上会稍微复杂一些，毕竟要修改一些系统层面上的东西（不然没法抓包了）  
Charles 是一个免费下载，但是使用收费的软件*当然网上大量的..破解方案，详情咨询度老师和谷老师*

官方网站：[https://www.charlesproxy.com/](https://www.charlesproxy.com/)  
下载地址：[https://www.charlesproxy.com/download/latest-release/](https://www.charlesproxy.com/download/latest-release/)

### 安装后的配置环节

可能就是大量的会在证书配置这里卡壳，所以觉得 Charles 好麻烦，不想用；殊不知一次麻烦过后带来的是怎样的好处。

#### 设置代理端口

> 设置路径 Proxy -> Proxy Setting -> Proxies

安装成功以后，首先我们要设置代理所使用的端口号，一般来说都喜欢用`8888`  
这个端口号是用来在远程设备上连接你本机时使用的。  
同一个页面的其他几个选项卡，第一个是用来设置一些忽略的 IP、域名之类的，俗称的白名单。以及针对 MacOS 和 Firefox 的一些特殊选项。

![](/images/tools-usage/charles-setting-proxy-port.png)

#### 设置要代理的路径

> 设置路径 Proxy -> Proxy Setting -> SSL Proxying Settings

然后是设置 Charles 针对那些路径的请求去进行代理相关的操作，是一个可配置的表格。  
图方便的话，可以直接写上*:*，前边是 IP、域名，后边是端口。\*作为通配符可以匹配全部。  
![](/images/tools-usage/charles-setting-ssl-proxy.png)
![](/images/tools-usage/charles-setting-edit-ssl.png)

#### 在本地安装证书

> 设置路径 Help -> SSL Proxying -> Install Charles Root Certificate

如果需要在本地进行一些抓包的操作的话，就需要在本地安装信任证书了  
如果是 Mac，在安装完以后会自动跳转到钥匙串管理界面，右上角搜索 Charles 找到刚刚安装的证书。  
将其所有的权限设置为始终信任即可。  
![](/images/tools-usage/charles-certificate.png)

至此，在电脑端的设置就已经结束了，接下来就是远程设备的设置了，也就是我们平时用的手机之类的。  
首先，我们要保证两个设备处于同一个局域网下，然后设置手机设备上边的代理信息。

> 以 iOS 举例，设置路径为：
> 设置 -> 无线局域网 -> 点击当前连接的 Wi-Fi 右侧的感叹号图标 -> 滑动到底部找到 HTTP 代理，点击进入 -> 设置服务器为电脑端的 IP，端口为我们在上边设置的那个端口即可。

此时，Charles 应该会弹出一个弹框提示有新设备接入，是否允许，点击 Allow 即可。  
![](/images/tools-usage/charles-new-device.png)  
但是，此时还没完，我们还需要安装证书到手机端才能够正常使用。

> 设置路径 Help -> SSL Proxying -> Install Charles Root Certificate on a Mobile Device or Remote Browser

点击后，电脑上会有一个弹框，按照其说明找到弹框中的一个 URL，在手机浏览器中输入即可（目前的版本是 [chls.pro/ssl](chls.pro/ssl)）。  
_P.S. 一定要保证手机是在连着本地代理的情况下去访问者个 URL_  
![](/images/tools-usage/charles-install-certificate.png)  
在 iOS 中会弹框提示你跳转到设置中安装描述文件，直接点击安装即可。
![](/images/tools-usage/setting-1.gif)

One more things，这个证书安装完以后，依然没有完成，我们还需要在 iOS 设备商进一步设置才能够使用。  
此时我们看到的 https 的结果依然是错误的：
![](/images/tools-usage/charles-unknown-https.png)

> 设置路径 设置 -> 通用 -> 关于本机 -> 证书信任设置（在最下边） -> 找到我们刚刚的 Charles，点击 checkbox 完全信任这个证书

![](/images/tools-usage/setting-2-1.png)

现在就完成了在 iOS 上边的设置了，可以愉快的使用 Charles 进行抓包了。
![](/images/tools-usage/charles-known-https.png)

### 实际使用中的一些功能

#### 将网络资源替换为本地文件

在工作中，如果突然有一个页面出现了 bug，而且不能够在本地复现，此时怀疑问题出在 js 文件中。  
可是这个文件是通过 webpack 之类的进行打包的，用 Charles 就可以很好的进行 debug。  
我们可以使用 Map Local 来将某些网络资源替换为本地的资源，就像上边的，我们可以将线上压缩后的 js 文件替换为本地未压缩（或者添加了 debug 逻辑的 js 文件）来进行调试。

> 设置路径 Tools -> Map Local

![](/images/tools-usage/charles-map-local.png)

比如我们将百度的首页替换为一个本地简单的页面。  
此时再通过手机进行访问，得到的就是我们映射在本地的文件了。

![](/images/tools-usage/demo-charles-maplocal.png)
![](/images/tools-usage/charles-map-local-detail.png)

#### 将请求转发到本地服务

上边的是针对一些静态资源文件进行的处理，但如果是一个接口出现了问题呢？  
调用接口出错了，但是并不知道为什么，所以我们可以使用另一个功能，Map Remote，将一些请求转发到本地服务器。  
这样无需去服务器上改代码就能够调试了。

> 设置路径 Tools -> Map Remote

几点注意事项：

1.  某一项为空，则代表匹配全部的
2.  如果是代理到本地服务器，Map to 里边的 protocol 一定要填成 http，不然 https 的请求转发过来也会是 https
3.  如果在服务器中有用到 refer 字段的要注意了，这个 refer 的值会变成你在这里配置的本地接口地址，例如 www.baidu.com 代理到 localhost:8000，实际获得的 refer 为 localhost:8000，为了解决这个问题，你需要勾选下边的 Preserve Host header 来保证 Header 信息不会改变

![](/images/tools-usage/charles-map-remote.png)

#### 修改请求的返回值

我们可以通过配置一些规则来改变某些接口的返回值。  
比如我们将一个 github 的接口中所有的 jiasm 修改为 jarvis。

> 设置路径 Tools -> Rewrite

各种规则都可以配置，示例仅做了 Body 中的替换，其实修改 Header 什么之类的也都可以做到的。

![](/images/tools-usage/charles-rewrite-setting-1.png)  
![](/images/tools-usage/charles-rewrite-setting-2.png)  
![](/images/tools-usage/charles-rewrite-setting-3.png)

这样我们再访问接口时的返回值就会产生变化：
![](/images/tools-usage/charles-rewrite-before.png)  
![](/images/tools-usage/charles-rewrite-after.png)

#### BreakPoints

上边的示例是在 Charles 中配置了一个规则，后续的所有访问都会去执行这一段逻辑。  
但如果仅仅是想修改一次接口的请求，还要去配置这个规则就显得太麻烦了。  
所以 Charles 还提供了另一种方案，BreakPoints，用类似打断点的方式，手动修改某一次请求的数据。

我们在要打断点的请求上右键调出菜单，然后找到 BreakPoints，点击激活。  
![](/images/tools-usage/charles-trigger-breakpoints.png)
下次再访问时就会自动跳转到另一个页面进行设置。  
第一次是修改 Request 的时候，所以我们直接点击 execute 执行。  
等到下次再跳转到这个页面时则表示已经获取到数据了，这时我们再进行修改 Response。
![](/images/tools-usage/charles-edit-breakpoints.png)  
**Rewrite 是早于 BreakPoints 执行的，因为我们可以看到，name 已经被覆盖为了 jarvis**  
修改完成后点击 Execute，这时候设备就接收到了我们修改后的请求了。
![](/images/tools-usage/charles-breakpoints-results.png)

#### 以及一些其他的小功能

1.  模拟弱网环境 Proxy -> Throttle Settings
2.  简单的压测 找到你要压测的请求，右键找到 Repeat Advanced

更多例子请查阅[官方文档](https://www.charlesproxy.com/documentation/tools/)

## 小记

Postman 与 Charles 都是非常有助于提升开发效率的工具。  
Postman 可以模拟请求、进行简易的自动化测试以及性能监控个。  
Charles 可以在本地快速的进行 debug，解决问题（以及也可以做一些性能测试）。  
希望大家能够善用工具，不要将自己的时间浪费到可被工具替代的事情上来。
