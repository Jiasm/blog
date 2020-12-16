---
uuid: b416ad00-3ec0-11eb-950c-ad6351fa8ffb
title: 'ioredis源码阅读[0]'
date: 2020-12-15 18:31:34
tags:
---

> 最近因为工作需要，要去搞一个 Node.js 端的 `Redis Client` 组件出来，暂时选择通过 `ioredis` 来作为 fork 对象。  
> 因为之前有遇到过 `Redis` 在使用 twemproxy 时会一直出现无法连接服务器的问题，详情见 issues：[https://github.com/luin/ioredis/issues/573](https://github.com/luin/ioredis/issues/573)  
> 所以会修改源码修改这一问题，不过在修改完成之后跑单元测试发现，事情没有那么简单，并不只是 info -> ping 这样，所以只好去熟悉源码，然后针对性地调整一下逻辑。

<!--more-->

## ioredis 项目结构

从项目中看，源码都在 `lib` 文件夹下，是一个纯粹的 TS 项目。  
`lib` 目录下的文件主要是一些通用能力的提供，比如 `command`、`pipeline`以及数据的传输等。  

```bash
.
├── DataHandler.ts                    # 数据处理
├── ScanStream.ts
├── SubscriptionSet.ts
├── autoPipelining.ts
├── cluster                           # Redis Cluster 模式的实现
│   ├── ClusterOptions.ts
│   ├── ClusterSubscriber.ts
│   ├── ConnectionPool.ts
│   ├── DelayQueue.ts
│   ├── index.ts
│   └── util.ts
├── command.ts                        # 命令的具体实现
├── commander.ts                      # command 的调度方
├── connectors                        # 网络连接相关
│   ├── AbstractConnector.ts
│   ├── SentinelConnector
│   ├── StandaloneConnector.ts
│   └── index.ts
├── errors                            # 异常信息相关
│   ├── ClusterAllFailedError.ts
│   ├── MaxRetriesPerRequestError.ts
│   └── index.ts
├── index.ts                          # 入口文件
├── pipeline.ts                       # 管道逻辑
├── promiseContainer.ts               # Promise 的一个封装
├── Redis                             # `Redis 实例的实现`
│   ├── RedisOptions.ts
│   ├── event_handler.ts
│   └── index.ts
├── script.ts
├── transaction.ts
├── types.ts
└── utils                             # 一些工具函数的实现
    ├── debug.ts
    ├── index.ts
    └── lodash.ts
```

而下分的两个文件夹，`redis` 与 `cluster` 都是具体的 `redis` `client` 实现，`cluster` 是对应的 `cluster` 集群化实现。  
所以在看 `README` 的时候我们会发现有两种实例可以使用，[https://www.npmjs.com/package/ioredis](https://www.npmjs.com/package/ioredis)

```javascript
new Redis
new Redis.Cluster
```

我们先从最普通的 `Redis` 开始看，本篇笔记主要是针对 `Redis`，结合着 README 一步步捋逻辑。

```javascript
const `Redis` = require("ioredis");
const `Redis` = `new Redis`();

redis.set("foo", "bar");
redis.get("foo", function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log(result);
  }
});
```

最基础的使用顺序，首先实例化一个 `Redis` 对象，然后调用 `Redis` 对应的命令，如果对 `Redis` 命令不熟悉可以看一下这个网站：[https://redis.io/commands#](https://redis.io/commands#)

入口代码位于 redis/index.ts，虽说 `ioredis` 用了 TS，但是构造函数的实现依然使用的是很古老的 ES5 方式，分别继承了 `EventEmitter` 和 `Commander` 两个类，第一个是 `events` 的，第二个则是 `ioredis` 自己提供的一个类，就在 `commander.ts` 文件中实现。

## Redis 实例化

`Redis` 主要做的事情就是：
- 建立并维护与 `Redis Server` 的网络连接
- 健康检查
- 维护队列在异常情况下保证请求不丢，可重试

看回到 `Redis` 会看到针对 this.connector 的一个赋值，抛开自定义的 `Connector` 与 `Sentinels` 只看最后一项最普通的 `StandaloneConnector`，这里就是用来建立与 `Redis Server` 的连接的。  
翻看 `lib/connectors/StandaloneConnector.ts` 的文件会发现，最终调用的是 `net.createConnection`，这个其实也能和咱们在上边提到的 `RESP` 所对应上，就是用的最基本的 `Redis` 通讯协议来完成操作的。

各项参数初始化完毕后，则会调用 `connect` 来与 `Redis Server` 建立真正的连接。

`net` 模块的 `createConnection` 只能建立网络连接，并不能保证是我们预期的 `Redis` 服务。  
通过 `connect` 拿到的 `stream` 对象其实就是 `socket client`：[https://github.com/luin/ioredis/blob/master/lib/redis/index.ts#L321](https://github.com/luin/ioredis/blob/master/lib/redis/index.ts#L321)  
在 `connect` 方法中主要就是去建立与 `Redis Server` 的链接，在建立连接以后，我们会调用 `event_handler.connectHandler`方法。  
这里主要做了两件事：

1. 去尝试 check `Redis Server` 的状态，也就是我们最开始提到的遇到的那个坑了，我们可以通过 `Redis.prototype._readyCheck` 方法看到具体的实现， `ioredis` 采用 `info` 命令作为探针，但是这个在 `twemproxy` 集群模式下就会产生一些问题，因为该模式会禁用一些命令，其中就包括 `info`，那么这就会导致 `Redis Client` 始终认为服务是不可用的。  
2. 添加了针对 `socket client` 的 `data` 事件监听，这里是用于后续接受返回数据的，主要逻辑在 `DataHandler.ts`，后边会提到。

> readyCheck 的逻辑存在于 redis/index.ts 和 redis/event_handler.ts 文件中  

```javascript
Redis.prototype._readyCheck = function (callback) {
  const _this = this;
  this.info(function (err, res) {
    if (err) {
      return callback(err);
    }
    if (typeof res !== "string") {
      return callback(null, res);
    }

    const info: { [key: string]: any } = {};

    const lines = res.split("\r\n");
    for (let i = 0; i < lines.length; ++i) {
      const [fieldName, ...fieldValueParts] = lines[i].split(":");
      const fieldValue = fieldValueParts.join(":");
      if (fieldValue) {
        info[fieldName] = fieldValue;
      }
    }

    if (!info.loading || info.loading === "0") {
      callback(null, info);
    } else {
      const loadingEtaMs = (info.loading_eta_seconds || 1) * 1000;
      const retryTime =
        _this.options.maxLoadingRetryTime &&
        _this.options.maxLoadingRetryTime < loadingEtaMs
          ? _this.options.maxLoadingRetryTime
          : loadingEtaMs;
      debug("Redis server still loading, trying again in " + retryTime + "ms");
      setTimeout(function () {
        _this._readyCheck(callback);
      }, retryTime);
    }
  });
};
```

在检测 `Redis` 可用以后则会触发 `callback`，该 `callback` 还会去检查 `offlineQueue` 是否有值，可以理解为是 `Redis` 可用之前调用命令的那些记录， `ioredis` 并不会直接报错告诉你说连接未建立，而是暂存在自己的一个队列中，等到可用后按照顺序发出去。  
`Redis` 在实例化的过程中主要也就是做了这些事情，接下来我们就要看 `Redis` 命令发出以后，具体执行的逻辑了。

## Commander

Commander 的作用就是实现了各种 `Redis Client` 的命令，通过 [https://www.npmjs.com/package/redis-commands](https://www.npmjs.com/package/redis-commands) 遍历得到的。  
同时会针对 `Client` 的 `Ready` 状态进行处理，在 `Ready` 之前会做一些暂存命令之类的操作。  
比较像是一个抽象类，因为 `Redis` 和 `Redis Cluster` 都会继承并覆盖一些 API 来完成工作。

```javascript
commands.forEach(function (commandName) {
  Commander.prototype[commandName] = generateFunction(commandName, "utf8");
  Commander.prototype[commandName + "Buffer"] = generateFunction(
    commandName,
    null
  );
});

function generateFunction(_encoding: string);
function generateFunction(_commandName: string | void, _encoding: string);
function generateFunction(_commandName?: string, _encoding?: string) {
  if (typeof _encoding === "undefined") {
    _encoding = _commandName;
    _commandName = null;
  }

  return function (...args) {
    const commandName = _commandName || args.shift();
    let callback = args[args.length - 1];

    if (typeof callback === "function") {
      args.pop();
    } else {
      callback = undefined;
    }

    const options = {
      errorStack: this.options.showFriendlyErrorStack
        ? new Error().stack
        : undefined,
      keyPrefix: this.options.keyPrefix,
      replyEncoding: _encoding,
    };

    if (this.options.dropBufferSupport && !_encoding) {
      return asCallback(
        PromiseContainer.get().reject(new Error(DROP_BUFFER_SUPPORT_ERROR)),
        callback
      );
    }

    // No auto pipeline, use regular command sending
    if (!shouldUseAutoPipelining(this, commandName)) {
      return this.sendCommand(
        new Command(commandName, args, options, callback)
      );
    }

    // Create a new pipeline and make sure it's scheduled
    return executeWithAutoPipelining(this, commandName, args, callback);
  };
}
```

在实现所有命令的同时还实现了一批 `Buffer` 后缀的 API，他们主要的区别我们可以通过 `generateFunction` 函数的实现来看到，被传入到了 `Command` 实例中。  
而 `Command` 对象则是具体的命令实现，所以我们还需要先去看一下 Command。

## Command

`Command` 负责的事情，主要是参数的处理、返回值的处理，生成命令传输的实际值以及 `callback` 的触发。

### 实例化

在 `Command` 的实例化过程中，除去一些属性的赋值，还调用了一个 `initPromise` 方法，在内部生成了一个 `Promise` 对象。  
其中有两处比较重要的处理，一个是关于参数的转换，还有一个是返回值的处理。

```javascript
private initPromise() {
  const Promise = getPromise();
  const promise = new Promise((resolve, reject) => {
    if (!this.transformed) {
      this.transformed = true;
      const transformer = Command._transformer.argument[this.name];
      if (transformer) {
        this.args = transformer(this.args);
      }
      this.stringifyArguments();
    }

    this.resolve = this._convertValue(resolve);
    if (this.errorStack) {
      this.reject = (err) => {
        reject(optimizeErrorStack(err, this.errorStack, __dirname));
      };
    } else {
      this.reject = reject;
    }
  });

  this.promise = asCallback(promise, this.callback);
}
```

### 参数、返回值特殊处理

如果检索 `Command.ts` 文件，会发现 `Command._transformer.argument` 通过 `setArgumentTransformer` 方法进行设置。  
然后再观察代码中有用到 `setArgumentTransformer` 的是少数几个 `hset` 命令，以及 `mset` 命令。

```javascript
Command.setArgumentTransformer("hmset", function (args) {
  if (args.length === 2) {
    if (typeof Map !== "undefined" && args[1] instanceof Map) {
      return [args[0]].concat(convertMapToArray(args[1]));
    }
    if (typeof args[1] === "object" && args[1] !== null) {
      return [args[0]].concat(convertObjectToArray(args[1]));
    }
  }
  return args;
});
```

如果大家使用过 `Redis` 的 `hash set` 操作，应该都会知道，操作多个键值的方式是通过追加参数完成的：

```bash
> HMSET key field value [field value ...]
```

这样在 JS 中使用也需要将一个数组传递进去，由用户自己维护数组的 key value，这样一个顺序的操作方式，必然是没有写 JS 习惯的 `Object` 传参要舒服的，所以 `ioredis` 提供一个参数转换的逻辑，用来将 `Object` 转换为一维数组：

```javascript
export function convertObjectToArray(obj) {
  const result = [];
  const keys = Object.keys(obj);

  for (let i = 0, l = keys.length; i < l; i++) {
    result.push(keys[i], obj[keys[i]]);
  }
  return result;
}

export function convertMapToArray<K, V>(map: Map<K, V>): Array<K | V> {
  const result = [];
  let pos = 0;
  map.forEach(function (value, key) {
    result[pos] = key;
    result[pos + 1] = value;
    pos += 2;
  });
  return result;
}
```

如果仔细看 `Command._transformer` 会发现还有一个 `reply` 属性值，这里的逻辑主要在 `_convertValue` 中有所体现，大致就是在接收到返回值以后，会先调用我们传入的自定义函数用来处理返回值。  
目前翻代码用到的唯一一处是 `hgetall` 的处理逻辑，`hmget` 与 `hgetall` 在 `Redis` 中都是返回一个数组的数据，而 `ioredis` 将数组按照 kv 的格式拼接为一个 `Object` 方便用户操作。

```javascript
Command.setReplyTransformer("hgetall", function (result) {
  if (Array.isArray(result)) {
    const obj = {};
    for (let i = 0; i < result.length; i += 2) {
      obj[result[i]] = result[i + 1];
    }
    return obj;
  }
  return result;
});
```

### 设置 `key` 前缀

如果看 `Command` 实例化的过程中，还会发现有 `_iterateKeys` 这样的一个函数调用，该函数具有两个作用：

1. 提取参数中所有的 key
2. 可选的将 key 添加一个前缀（prefix）

函数内部使用了 `redis-commands` 的两个 API， `exists` 和 `getKeyIndexes`，用来获取参数数组中所有的 key 的下标。  
因为这个函数做了两件事，所以在第一次看到构造函数的用法时，再看函数具体的实现，会对最后返回的 `this.keys` 很疑惑，但是当看到 `Command` 还提供了一个 `getKeys` API 就能够明白是怎样的逻辑了。  

如果设置了 `keyPrefix` ，则会触发 `_iterateKeys` 用来调整 key 名，并存储到 keys 中用于返回值。  
当调用 `getKeys` 时，如果没有设置 `keyPrefix` ，则会用默认的空处理函数来执行同样的逻辑，就是获取所有的 key，然后返回出去；如果之前已经设置过 keyPrefix 那么就会直接返回 this.keys 不再重复执行逻辑。

![](/images/redis-code-read/get-keys-flow.png)

```javascript
// 构造函数内逻辑
if (options.keyPrefix) {
  this._iterateKeys((key) => options.keyPrefix + key);
}

// 另一处调用的位置
public getKeys(): Array<string | Buffer> {
  return this._iterateKeys();
}

private _iterateKeys(
  transform: Function = (key) => key
): Array<string | Buffer> {
  if (typeof this.keys === "undefined") {
    this.keys = [];
    if (commands.exists(this.name)) {
      const keyIndexes = commands.getKeyIndexes(this.name, this.args);
      for (const index of keyIndexes) {
        this.args[index] = transform(this.args[index]);
        this.keys.push(this.args[index] as string | Buffer);
      }
    }
  }
  return this.keys;
}
```

### 发送命令数据的生成

大家使用 `Redis` 应该更多的是通过代码中的 `Client` 调用各种命令来做，偶尔会通过 redis-cli 直接命令行操作。  
但其实 `Redis` 使用了一个叫做 `RESP` (REdis Serialization Protocol) 的协议来进行传输。  
如果本机有 `Redis` 的话，我们在本地可以很简单的进行演示。  

```bash
> echo -e '*1\r\n$4\r\nPING\r\n' | nc 127.0.0.1 6379
+PONG
```

我们会得到一个 `+PONG` 字符串。这样的一个交互其实才是绝大多数 `Client` 与 `Redis Server` 交互时所使用的格式。  

> P.S. `RESP` 有提供人类可读的版本进行交互，但是性能相对要低一些。

举例说明如果我们要执行一个 set 和一个 get 应该怎样去写这个命令：

```bash
# 开头代表注释

# SET hello world
# 参数个数
*3
# 该行命令值的长度（set 命令）
$3
# 命令对应的值（set 命令）
SET
# 该行命令值的长度（具体的 key: hello）
$5
# 命令对应的值（具体的 key: hello）
hello
# 该行命令值的长度（value 的长度）
$5
# 命令对应的值（value 本体）
world

# GET hello
# 参数个数
*2
# 该行命令值的长度（get 命令）
$3
# 命令对应的值（get 命令）
GET
# 该行命令值的长度（具体的 key: hello）
$5
# 命令对应的值（具体的 key: hello）
hello
```

`set` 的返回值没什么意外，就是一个 `+OK`，而 `get` 的返回值则有两行，第一行 `$5` 表示返回值的长度，第二行才是真正的返回值 `world`。  
所以如果去看 `Command` 的 toWritable 函数就是实现了这样的逻辑，因为比较长所以就不贴了：[https://github.com/luin/ioredis/blob/master/lib/command.ts#L269](https://github.com/luin/ioredis/blob/master/lib/command.ts#L269)  

`Command` 主要实现的就是这些逻辑，我们在 `Commander` 的视线中可以看到所有命令调用的末尾都会执行 `this.sendCommand`， 具体的调度就是在 `Redis`、`Redis Cluster` 等具体的实现中做的了。所以我们可以回到 `Redis` 去看下实现逻辑。  

## Redis 发送命令

`sendCommand` 的实现中，会进行 `Redis` 状态的检查，如果是 `wait` 或者 `end` 之类的，会进行对应的处理。  
然后我们会去检查当前是否是一个可以发送命令的状态：  

```javascript
let writable =
    this.status === "ready" ||
    (!stream &&
      this.status === "connect" &&
      commands.exists(command.name) &&
      commands.hasFlag(command.name, "loading"));
  if (!this.stream) {
    writable = false;
  } else if (!this.stream.writable) {
    writable = false;
  } else if (this.stream._writableState && this.stream._writableState.ended) {
    writable = false;
  }
```

代码还算比较清晰，这里也要提到一点，我们在处理 `info` 命令的问题是，使用 `ping` 命令来代替 `info`，最初就卡在了这里，后续 debug 发现， `ping` 命令并不具备 `loading` 这一 `flag` 特性，所以 `ping` 命令都被放到了 `offlineQueue` 中，针对这一情况，我们将 `ping` 添加一个额外的判断逻辑，确保 `write` 的值为真。  

接下来如果 `write` 为真，那么我们就会使用 `stream` 也就是前边建立的 socket 连接来发送我们真实的命令了，这时候就是调用的 `write` 并将 `Command#toWritable` 的返回值作为数据传进去，也就是之前提到的基于 `RESP` 格式的序列化。  
同时会将一些信息放到 `commandQueue` 中，它和 `offlineQueue` 都是同一个类型的实例，后边会提到具体的作用。  

```javascript
this.commandQueue.push({
  command: command,  // Command 实例
  stream: stream,    // socket client（其实并没有地方会用到它，不知道为什么要传过去）
  select: this.condition.select, // 这个也是没有被用到
});
```

> 另一个开源的模块， denque: https://www.npmjs.com/package/denque

如果 `write` 为假，那么命令就会被放到 `offlineQueue` 中。

结束逻辑后会把 `command.promise` 进行返回，我们在 `Command` 实例化过程中可以看到，其实是实例化了一个 `Promise` 对象，并把 `resolve` 与 `reject` 做了一次引用，后边在数据返回时会用到。  
当我们命令已经发送完毕后，那么下一步就是等数据返回了，这里就要说到前边在介绍 `React` 实例化后 `connect` 所调用的 `DataHandler` 实例所做的事情了。  

## DataHandler

`DataHandler` 是一个比较另类的类的写法，因为使用时就直接 `new` 了但并没有接收返回值。  
在构造函数中，就做了两件事，一个是实例化了一个 `RedisParser` 对象，另一个就是监听了 `redis.stream.on('data')` 事件，也就是我们在实例化 `Redis` 时传递过来的 `socket client`，在 `data` 事件触发时调用 `RedisParser.execute` 来完成解析。  
`RedisParser` 是另一个开源模块了，有兴趣的小伙伴可以看这里：[https://www.npmjs.com/package/redis-parser](https://www.npmjs.com/package/redis-parser)  
目前可以认为在调用 `execute` 方法后会调用实例化时传入的 `return Reply` 就可以了，这是一个解析后的 `response`，我们会拿到这个 `response` 之后会从 `commandQueue` 中依次取出之前传入的对象。  
取出的方式是按照队列的方式来取的，通过 `shift`，每次取出队列中的第一个元素。  
然后调用元素中 `command` 属性的 `resolve` 方法，也就是我们在调用各种 Redis 命令时传入的 `callback` 了。  

这里需要补充一些 `Redis` 相关的知识，我们从整个逻辑链路可以看到，大致是这样的：

1. 用户执行命令
2. `Redis` 实例化 `Command` 并放入队列
3. 接收到数据响应后解析数据，并获取队列中第一个元素，调用对应的 `callback`

同时间可能会有很多 `Redis` 请求被发出去，但是再接收到数据后并不需要去判断这次响应对应的是哪一个 `command`，因为 `Redis` 本身也是一个[单进程的工作模式](https://topic.alibabacloud.com/a/why-redis-is-single-threaded-and-why-is-redis-so-fast_1_47_30266528.html)，命令的处理也会按照接收数据的先后顺序来处理，因为本身 `ioredis` 用的也是同一个 socket 连接，所以也不会存在说命令发送到远端的先后顺序会发生变化。  
所以我们就可以很放心的通过最简单的方式， `push` + `shift` 来处理数据了。  
> 这也是为什么一些大 key 的操作会导致整个 Redis 服务响应变慢了。（在不做分片之类的处理情况下）  

## 小结

到此为止，普通模式下的 `Redis Client` 整体逻辑我们已经梳理完了，从创建到发送命令到接收返回值。  
后边会针对 `Redis Cluster` 再输出一篇笔记，一起来看一下在 `Cluster` 模式下又会有什么不一样的处理逻辑。  

## 参考资料

- [ioredis](https://www.npmjs.com/package/ioredis)
- [redis commands](https://redis.io/commands)
- [Node.js | net](https://nodejs.org/api/net.html)
- [Why Redis is single-threaded and why is Redis so fast!](https://topic.alibabacloud.com/a/why-redis-is-single-threaded-and-why-is-redis-so-fast_1_47_30266528.html)
- [Redis is single-threaded, then how does it do concurrent I/O?](https://stackoverflow.com/questions/10489298/redis-is-single-threaded-then-how-does-it-do-concurrent-i-o)
