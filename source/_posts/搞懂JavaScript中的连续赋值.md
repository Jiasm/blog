---
uuid: 637a5e40-af5e-11e7-95d4-835df3d7c1a3
title: 搞懂JavaScript中的连续赋值
date: 2017-10-12 23:02:38
tags: javascript
---

> 前段时间老是被一道题刷屏，一个关于连续赋值的坑。  
> 遂留下一个笔记，以后再碰到有人问这个题，直接丢过去链接。。

<!-- more -->

题目代码：
```javascript
let a = { n: 1 }
let b = a

a.x = a = { n: 2 }

console.log(a.x) // => undefined
console.log(b.x) // => { n: 2 }
```

> 首先解释一下连续赋值的意思：
> 表达式`variable = 1`，这个为赋值语句。
> 当我们要给多个变量进行赋值时，有一个简单的写法。
> `variable1 = variable2 = 1`，这个我们就称之为连续赋值。

再来说上边的那道题，我一次看到这个题的时候，答案也是错了，后来翻阅资料，结合着调试，也算是整明白了-.-

前两行的声明变量并赋值，使得`a`和`b`都指向了同一个地址（`{ n: 1 }`在内存中的位置）

**为了理解连续赋值的运行原理，我们需要结合着ECMAScript的文档来解释一下`=`赋值的执行过程**

![image](https://user-images.githubusercontent.com/9568094/31504078-11b998b8-af37-11e7-8787-a91d4663f2d3.png)

图中出现了一个关键字**LeftHandSideExpression**（我们简称为`LHS`）
MDN对该关键字的解释为`“Left values are the destination of an assignment.”`，翻译过来大概就是：`LHS`是用来分配赋值操作结果存放的位置（*也就是`=`右边的这坨东西要放到哪*）。

在执行一个赋值操作时，我们首先要取出`=`左侧的变量，用来确定这次赋值操作最终结果的存放位置。
然后运算`=`右侧的表达式来获取最终的结果，并将结果存放入对应的位置，也就是前边取出的变量所对应的位置。

再来说**连续赋值**，其实就是多次的赋值操作。

我们从代码的第一行开始，画图，一个图一个图的来说：

1. `let a = { n: 1 }`声明了一个变量`a`，并且创建了一个`Object`：`{ n: 1 }`，并将该`Object`在内存中的地址赋值到变量`a`中，这时就能通过`a`来获取到`{ n: 1}`：*引用类型的值是只存放地址的，而不是直接存放原始值（`{} !== {}`）*
![image](https://user-images.githubusercontent.com/9568094/31505886-87161b0a-af3b-11e7-8cfe-64a73f04f709.png)
2. `let b = a`声明一个变量`b`，并且将`a`赋值给`b`，这时，`a`和`b`都指向了`{ n: 1 }`：
![image](https://user-images.githubusercontent.com/9568094/31505989-ce332744-af3b-11e7-8350-2559471a4da5.png)
3. 执行表达式（`a.x = a = { n: 2 }`），取出`a.x`的位置，由于`a`的值为`{ n: 1 }`，所以取属性`x`为`undefined`，遂在内存中开辟一块新的空间作为`({ n: 1}).x`的位置：
![image](https://user-images.githubusercontent.com/9568094/31506231-785d989e-af3c-11e7-9216-5a4de5315af3.png)
4. 执行剩余表达式（`a = { n: 2 }`），取出`a`的位置，因为`a`是一个已声明的变量，所以该步骤并不会有什么改变；
5. 执行剩余表达式（`{ n: 2 }`），为`{ n: 2 }`在内存中开辟一块空间存放数据：
![image](https://user-images.githubusercontent.com/9568094/31506483-25350d2c-af3d-11e7-88c1-a353f202d18a.png)
6. 将`{ n: 2 }`赋值到第`4`步取出的`a`对应的位置：
![image](https://user-images.githubusercontent.com/9568094/31506554-55b02d38-af3d-11e7-8c19-58b129f7eaa2.png)
7. 将`{ n: 2}`赋值到第`3`步取出的`a.x`对应的位置：
![image](https://user-images.githubusercontent.com/9568094/31506793-20c90c9c-af3e-11e7-8b31-b7f605f2f501.png)

这时我们就完成了整个赋值步骤：
- 变量`a`指向`{ n: 2 }`
- 变量`b`指向`{ n: 1, x: { n: 2} }`
- 也就是说`a === b.x`

## 小记
该代码坑就在于：赋值运算会在运算`=`右侧前就取出了要赋值的位置，而不是获得结果后再去取出赋值位置的。
*先取位置，后赋值*
**所以说，看文档很重要 很重要 很重要**

## 参考资料

- [ECMAScript: Simple Assignment ( = )](http://www.ecma-international.org/ecma-262/5.1/#sec-11.13.1)
- [MDN: Expressions and operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators#Left-hand-side_expressions)
