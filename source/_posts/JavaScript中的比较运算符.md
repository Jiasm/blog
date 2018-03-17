---
uuid: 5957c0e0-29db-11e8-87c1-d1f395e30166
title: JavaScript中的比较运算符
date: 2018-03-17 20:04:30
tags:
  - JavaScript
  - 随笔记
---

> JavaScript中的比较运算符粗略的可以分为两种：
> 1. 相等运算符（==、===、!==）这些
> 2. 关系运算符（>、<、>=）
> 在平时开发中，基本不会太关注这两者的差异，我们几乎总是可以获取到我们想要的结果-。-

前几天在群里一个小伙伴问了个问题：
```javascript
console.log(null > 0) // => false
console.log(null < 0) // => false
console.log(null == 0) // => false

console.log(null >= 0) // => ?
```

最后一个`null >= 0`的结果为true。
刚看到这个代码的时候，下意识地会认为结果应该也是`false`，毕竟上边标明了三种情况都为`false`。
然而这个就露出了**相等运算符**和**关系运算符**两者执行的差异。

在相等运算符中，如果是非严格相等，则会尝试将两边的值转换为相同类型进行比较。
在关系运算符中，会尝试将运算符两边的值转换为`Number`再进行比较。

所以在执行`null >= 0`的时候`null`被转换为`Number`随后值就变为了`0`，所以第四个运算符实际的执行为`0 >= 0`。

觉得这个题挺有意思的，所以就去翻了下文档，看看这几个比较运算符在执行的时候都做了些什么。

## 相等运算符

相等运算符有四个，`==`、`!=`、`===`、`!==`，前两个会对运算符两边的表达式进行类型转换，试图转换为相同的类型。

### `==`与`!=`

执行时会先检查两者类型是否一致，如一致则相当于调用`===`、`!==`
随后判断两者是否都为`null`或`undefined`,如果均为这两个值，则会直接返回`true`

接下来就会进行一些类型转换，绝大多数情况是会转换为`Number`，但是主要转换类型的依赖还是在于运算符左侧表达式的类型。

如果一边类型为`String`另一边类型为`Number`，则会将`String`转换为`Number`对两者进行比较。
如果其中一个为`Boolean`，则会将该表达式转换为`Number`

上边的是一些比较常规的类型转换，但是如果都不满足上边的条件，后续还会有其他的转换。
如果其中一个为`Object`，另一个类型为`Number`、`String`或者是`Symbol`中的任意一个。
则会获取`Object`的原始值，然后对两者进行比较。

![ToPrimitive转换表格](/images/comparison-operators/pic-1.png)

然后表格中对`Object`类型又有一些额外的处理

![Object类型的额外处理](/images/comparison-operators/pic-2.png)
![针对==运算的Object类型的额外处理](/images/comparison-operators/pic-3.png)

在最后我们可以看到，会针对`Object`类型的变量进行调用`valueOf`与`toString`
而两个函数调用的顺序取决于上边一些判断的过程，目前还木有找到会先执行`toString`的例子。。。（因为原始类型无法直接添加`toString`和`valueOf`事件的代理）

我们可以用`Object.assign`来实现某个对象的`toString`和`valueOf`方法来观察执行的过程。
![valueOf的实现](/images/comparison-operators/pic-4.png)

如果`valueOf`返回值还是`Object`的话，则会继续调用`toString`

![toString的实现](/images/comparison-operators/pic-5.png)

如果两个函数都返回`Object`，这时就会抛出一个类型异常的错误

![Throw-TypeError](/images/comparison-operators/pic-6.png)

### `===`与`!==`

相较`==`，`===`的逻辑就很清晰了，因为没有了不同类型之间的转换，就是拿到两个表达式进行比较即可。

首先就是获取两侧表达式的类型，如果不同则返回`false`，相同则进行后续的比较。

关于`Number`类型步骤的描述，有一点我很是疑惑，就是关于`+0 === -0`，因为一元正负运算符的优先级肯定是高于`===`的，不知为何会写在这里-.-
![Throw-TypeError](/images/comparison-operators/pic-7.png)

## 关系运算符

关系运算符的执行过程，是尽可能的将两边的表达式转换为`Number`进行比较。（也确实，其他类型木有什么可比性的）

运算符刚开始会尝试将两侧表达式转换为原始值，并且在转换的过程中会优先选择转换为`Number`类型。

转换完成后，如果两边表达式都为`String`，则会先判断一侧表达式是否包含另一侧。
例如：
```javascript
'abc' > 'ab' // abc 包含 ab 所以 abc 比 ab 大，结果为true
```
如果两者不为包含关系，则会从第一个字符开始获取对应的`Unicode`编码，来进行比大小，如果大小相同，则顺移至下一位。
![check-Unicode](/images/comparison-operators/pic-8.png)

其余情况下，则会将两侧表达式直接转换为`Number`求值。
```javascript
Number(true)
Number({})
Number(undefined)
Number(null)
// ...
```
当任意一个结果为`NaN`时，运算符的结果都为`false`（而且文档中给出的，返回值为`undefined`，并不是`false`。。。）

然后针对`<`、`>`、`<=`、`>=`进行各自的判断。

所以到最后就解释了，为什么那个问题的`null >= 0`为`true`。
因为关系运算符是会将值转换为`Number`来进行比较的。
而相等运算符只在极少数的情况下会将值转换为`Number`来进行比较（例如：一个为`Number`另一个为`String`）

## 参考文档

http://www.ecma-international.org/ecma-262/6.0/ECMA-262.pdf
