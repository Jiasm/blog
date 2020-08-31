---
uuid: 73f01e40-e769-11ea-a947-c51f99c22afa
title: PM2源码分析
date: 2020-08-29 00:57:49
tags:
---

> 近期有需求需要了解 PM2 一些功能的实现方式，所以趁势看了一下 PM2 的源码，也算是用了这么多年的 PM2，第一次进入内部进行一些探索。  
> PM2 是一个 基于 node.js 的进程管理工具，本身 node.js 是一个单进程的语言，但是 PM2 可以实现多进程的运行及管理（当然还是基于 node 的 API），还提供程序系统信息的展示，包括 内存、CPU 等数据。

<!-- more -->

## PM2 的核心功能概览

> [源码位置](https://github.com/Unitech/pm2)  
> [官方网站](https://pm2.keymetrics.io/)  

PM2 的功能、插件非常的丰富，但比较核心的功能其实不多：

1. 多进程管理
2. 系统信息监控
3. 日志管理

其他的一些功能就都是基于 PM2 之上的辅助功能了。  

### 项目结构

PM2 的项目结构算是比较简洁的了，主要的源码都在 `lib` 目录下， `God` 目录为核心功能多进程管理的实现，以及 `API` 目录则是提供了各种能力，包括 日志管理、面板查看系统信息以及各种辅助功能，最后就是 `Sysinfo` 目录下关于如何采集系统信息的实现了。  

```bash
# 删除了多个不相干的文件、文件夹
lib
├── API     # 日志管理、GUI 等辅助功能
├── God     # 多进程管理逻辑实现位置
└── Sysinfo # 系统信息采集
```

几个比较关键的文件作用：

- Daemon.js 
  - 守护进程的主要逻辑实现，包括 rpc server，以及各种守护进程的能力
- God.js
  - 业务进程的包裹层，负责与守护进程建立连接，以及注入一些操作，我们编写的代码最终是由这里执行的
- Client.js
  - 执行 PM2 命令的主要逻辑实现，包括与守护进程建立 rpc 连接，以及各种请求守护进程的操作
- API.js
  - 各种功能性的实现，包括启动、关闭项目、展示列表、展示系统信息等操作，会调用 Client 的各种函数
- binaries/CLI.js
  - 执行 pm2 命令时候触发的入口文件

### 守护进程与 Client 进程通讯方式

看源码后会知道，PM2 与 Client 进程（也就是我们 `pm2 start XXX` 时对应的进程），是通过 RPC 进行通讯的，这样就能保证所有的 Client 进程可以与守护进程进行通讯，上报一些信息，以及从守护进程层面执行一些操作。  

### PM2 启动程序的方式

PM2 并不是简单的使用 node XXX 来启动我们的程序，就像前边所提到了守护进程与 Client 进程的通讯方式，Client 进程会将启动业务进程所需要的配置，通过 rpc 传递给守护进程，由守护进程去启动程序。  
这样，在 PM2 start 命令执行完成以后业务进程也在后台运行起来了，然后等到我们后续想再针对业务进程进行一些操作的时候，就可以通过列表查看对应的 pid、name 来进行对应的操作，同样是通过 Client 触发 rpc 请求到守护进程，实现逻辑。  

当然，我们其实很少会有单独启动守护进程的操作，守护进程的启动其实被写在了 Client 启动的逻辑中，在 Client 启动的时候会检查是否有存活的守护进程，如果没有的话，会尝试启动一个新的守护进程用于后续的使用。  
具体方式就是通过 `spawn` + `detached: true` 来实现的，创建一个单独的进程，这样即便是我们的 Client 作为父进程退出了，守护进程依然是可以独立运行在后台的。  

P.S. 在使用 PM2 的时候应该有时也会看到有些这样的输出，这个其实就是 Client 运行时监测到守护进程还没有启动，主动启动了守护进程：  

```bash
> [PM2] Spawning PM2 daemon with pm2_home=/Users/jiashunming/.pm2
> [PM2] PM2 Successfully daemonized
```

![](/images/pm2-startup-flow.png)

## 多进程管理

一般使用 PM2 实现多进程管理主要的目的是为了能够让我们的 node 程序可以运行在多核 CPU 上，比如四核机器，我们就希望能够存在四个进程在运行，以便更高效的支持服务。  
在进程管理上，PM2 提供了一个大家经常会用到的参数： `exec_mode`，它的取值只有两个，`cluster`和`fork`，`fork` 是一个比较常规的模式，相当于就是执行了多次的 `node XXX.js`。  
但是这样去运行 node 程序就会有一个问题，如果是一个 HTTP 服务的话，很容易就会出现端口冲突的问题：

```javascript
const http = require('http')

http.createServer(() => {}).listen(8000)
```

比如我们有这样的一个 PM2 配置文件，那么执行的时候你就会发现，报错了，提示端口冲突：

```javascript
module.exports = {
  apps: [
    {
      // 设置启动实例个数
      "instances": 2,
      // 设置运行模式
      "exec_mode": "fork",
      // 入口文件
      "script": "./test-create-server.js"
    }
  ]
}
```

这是因为在 PM2 的实现中， fork 模式下就是简单的通过 spawn 执行入口文件罢了。  
> 实现位置：[lib/God/ForkMode.js](https://github.com/Unitech/pm2/blob/master/lib/God/ForkMode.js)

而当我们把 `exec_mode` 改为 `cluster` 之后，你会发现程序可以正常运行了，并不会出现端口占用的错误。  
这是因为 PM2 使用了 node 官方提供的 [cluster](https://nodejs.org/dist/latest-v12.x/docs/api/cluster.html) 模块来运行程序。  

cluster 是一个 master-slave 模型的运行方式（_最近 ms 这个说法貌似变得不政治正确了。。_），首先需要有一个 master 进程来负责创建一些工作进程，或者叫做 worker 吧。  
然后在 worker 进程中执行 createServer 监听对应的端口号即可。  

```javascript
const http = require('http')
const cluster = require('cluster')

if (cluster.isMaster) {
  let limit = 2
  while (limit--) {
    cluster.fork()
  }
} else {
  http.createServer((req, res) => {
    res.write(String(process.pid))
    res.end()
  }).listen(8000)
}
```

详情可以参考 node.js 中 TCP 模块关于 listen 的实现：[lib/net.js](https://github.com/nodejs/node/blob/master/lib/net.js#L1335)  
在内部实现逻辑大致为， master 进程负责监听端口号，并通过 round_robin 算法来进行请求的分发，master 进程与 worker 进程之间会通过基于 EventEmitter 的消息进行通讯。  

> 具体的逻辑实现都在这里 [lib/internal/cluster](https://github.com/nodejs/node/tree/master/lib/internal/cluster) 因为是 node 的逻辑，并不是 PM2 的逻辑，所以就不太多说了。  

然后回到 PM2 关于 cluster 的实现，其实是设置了 N 多的默认参数，然后添加了一些与进程之间的 ipc 通讯逻辑，在进程启动成功、出现异常等特殊情况时，进行对应的操作。  
因为前边也提到了，PM2 是由守护进程维护管理所有的业务进程的，所以守护进程会维护与所有服务的连接。  
`process` 对象是继承自 `EventEmitter` 的，所以我们只是监听了一些特定的事件，包括 `uncaughtException`、`unhandledRejection` 等。  
在进程重启的实现方式中，就是由子进程监听到异常事件，向守护进程发送异常日志的信息，然后发送 `disconnect` 表示进程即将退出，最后触发自身的 `exit` 函数终止掉进程。  
同时守护进程在接收到消息以后，也会重新创建新的进程，从而完成了进程自动重启的逻辑。  

实现业务进程的主要逻辑在 [lib/ProcessContainer](https://github.com/Unitech/pm2/blob/master/lib/ProcessContainer.js) 中，它是我们实际代码执行的载体。  

## 系统信息监控

系统信息监控这块，在看源码之前以为是用什么 addon 来做的，或者是某些黑科技。  
但是真的循着源码看下去，发现了就是用了 [pidusage](https://www.npmjs.com/package/pidusage) 这个包来做的- -  
只关心 unix 系统的话，内部实际上就是`ps -p XXX`这么一个简单的命令。  

至于在使用 `pm2 monit`、`pm2 ls --watch` 命令时，实际上就是定时器在循环调用上述的获取系统信息方法了。

> 具体实现逻辑：
> [getMonitorData](https://github.com/Unitech/pm2/blob/master/lib/God/ActionMethods.js#L40)
> [dashboard](https://github.com/Unitech/pm2/blob/master/lib/API/Extra.js#L671)  
> [list](https://github.com/Unitech/pm2/blob/master/lib/API.js#L597)

后边就是如何使用基于终端的 UI 库展现数据的逻辑了。  

## 日志管理

日志在 PM2 中的实现分了两块。  
一个是业务进程的日志、还有一个是 PM2 守护进程自身的日志。  

守护进程的日志实现方式是通过 hack 了 `console` 相关 API 实现的，在原有的输出逻辑基础上添加了一个基于 [axon](https://www.npmjs.com/package/axon) 的消息传递，是一个 pub/sub 模型的，主要是用于 Client 获得日志，例如 `pm2 attach`、`pm2 dashboard` 等命令。  
业务进程的日志实现方式则是通过覆盖了 `process.stdout`、`process.stderr` 对象上的方法（`console` API 基于它实现），在接收到日志以后会写入文件，同时调用 `process.send` 将日志进行转发，而守护进程监听对应的数据，也会使用上述守护进程创建的 socket 服务将日志数据进行转发，这样业务进程与守护进程就有了统一的可以获取的位置，通过 Client 就可以建立 socket 连接来实现日志的输出了。  

> hack console 的位置：[lib/Utility.js](https://github.com/Unitech/pm2/blob/master/lib/Utility.js#L97)
> hack stdout/stderr write 的位置：[lib/Utility.js](https://github.com/Unitech/pm2/blob/master/lib/Utility.js#L131)
> 创建文件可写流用于子进程写入文件：[lib/Utility.js](https://github.com/Unitech/pm2/blob/master/lib/Utility.js#L131)
> 子进程接收到输出后写入文件并发送消息到守护进程：[lib/ProcessContainer.js](https://github.com/Unitech/pm2/blob/master/lib/ProcessContainer.js#L212)
> 守护进程监听子进程消息并转发：[lib/God/ClusterMode.js](https://github.com/Unitech/pm2/blob/master/lib/God/ClusterMode.js#L59)
> 守护进程将事件通过 socket 广播：[lib/Daemon.js](https://github.com/Unitech/pm2/blob/master/lib/Daemon.js#L437)
> Client 读取并展示日志：[lib/API/Extra.js](https://github.com/Unitech/pm2/blob/master/lib/API/Extra.js#L671)

![](/images/pm2-log-flow.jpg)  

_查看日志的流程中有一个小细节，就是业务日志， PM2 会先去读取文件最后的几行进行展示，然后才是依据 socket 服务返回的数据进行刷新终端展示数据。_  

## 后记

PM2 比较核心的也就是这几块了，因为通过 Client 可以与守护进程进行交互，而守护进程与业务进程之间也存在着联系，可以执行一些操作。  
所以我们就可以很方便的对业务进程进行管理，剩下的逻辑基本就是基于这之上的一些辅助功能，以及还有就是 UI 展示上的逻辑处理了。  

PM2 是一个纯 JavaScript 编写的工具，在第一次看的时候还是会觉得略显复杂，到处绕来绕去的比较晕，我推荐的一个阅读源码的方式是，通过找一些入口文件来下手，可以采用 调试 or 加日志的方式，一步步的来看代码的执行顺序。  
最终就会有一个较为清晰的概念。  