---
uuid: 1ac3c7c0-cdf5-11e8-ba69-0f9030cfda7c
title: 如何编写 Typescript 声明文件
date: 2018-10-12 16:02:03
tags:
  - javascript
  - typescript
---

使用`TypeScript`已经有了一段时间，这的确是一个好东西，虽说在使用的过程中也发现了一些`bug`，不过都是些小问题，所以整体体验还是很不错的。  

`TypeScript`之所以叫`Type`，和它的强类型是分不开的，这也是区别于`JavaScript`最关键的一点，类型的声明可以直接写在代码中，也可以单独写一个用来表示类型的描述文件`*.d.ts`。  

<!-- more -->

## 常用方式

首先在`d.ts`中是不会存在有一些简单的基本类型定义的（因为这些都是写在表达式、变量后边的，在这里定义没有任何意义），声明文件中定义的往往都是一些复杂结构的类型。  

大部分语法都与写在普通`ts`文件中的语法一致，也是`export`后边跟上要导出的成员。  

最简单的就是使用`type`关键字来定义：  

```typescript
type A = {                 // 定义复杂结构
  b: number
  c: string
}

type Func = () => number   // 定义函数

type Key = number | string // 多个类型
```

### 组合类型

以及在`TypeScript`中有着很轻松的方式针对`type`进行复用，比如我们有一个`Animal`类型，以及一个`Dog`类型，可以使用`&`来进行复用。  

_P.S> `&`符号可以拼接多个_  

```typescript
type Animal = {
  weight: number
  height: number
}

type Dog = Animal & {
  leg: number
}
```

### 动态的 JSON 类型指定

如果我们有一个`JSON`结构，而它的`key`是动态的，那么我们肯定不能将所有的`key`都写在代码中，我们只需要简单的指定一个通配符即可：  

```typescript
type info = {
  [k: string]: string | number // 可以指定多个类型
}

const infos: info = {
  a: 1,
  b: '2',
  c: true, // error 类型不匹配
}
```

以及在新的版本中更推荐使用内置函数`Record`来实现：  

```typescript
const infos: Record<number, string | number> = {
  a: 1,
  b: '2',
  c: true, // error
}
```

### 获取变量的类型

假如我们有一个JSON对象，里边包含了`name`、`age`两个属性，我们可以通过一些`TypeScript`内置的工具函数来实现一些有意思的事情。  

通过`keyof`与`typeof`组合可以得到我们想要的结果：  

```typescript
const obj = {
  name: 'Niko',
  age: 18
}

// 如果是这样的取值，只能写在代码中，不能写在 d.ts 文件中，因为声明文件里边不能存在实际有效的代码
type keys = keyof typeof obj

let a: keys = 'name' // pass
let b: keys = 'age'  // pass

let c: keys = 'test' // error
```

而如果我们想要将一个类型不统一的`JSON`修改为统一类型的`JSON`也可以使用这种方式：  

```typescript
const obj = {
  name: 'Niko',
  age: 18,
  birthday: new Date()
}

const infos: Record<keyof typeof obj, string> = {
  name: '',
  age: '',
  birthday: 123, // 出错，提示类型不匹配
  test: '', // 提示不是`info`的已知类型
}
```

### 获取函数的返回值类型

又比如说我们有一个函数，函数会返回一个`JSON`，而我们需要这个`JSON`来作为类型。  

那么可以通过`ReturnType<>`来实现：  

```typescript
function func () {
  return {
    name: 'Niko',
    age: 18
  }
}

type results = ReturnType<typeof func>

// 或者也可以拼接 keyof 获取所有的 key
type resultKeys = keyof ReturnType<typeof func>

// 亦或者可以放在`Object`中作为动态的`key`存在
type infoJson = Record<keyof ReturnType<typeof func>, string>
```

### 在代码中声明函数和`class`类型

因为我们知道函数和`class`在创建的时候是都有实际的代码的（函数体、构造函数）。  
但是我们是写在`d.ts`声明文件中的，这只是一个针对类型的约束，所以肯定是不会存在真实的代码的，但是如果在普通的`ts`文件中这么写会出错的，所以针对这类情况，我们需要使用`declare`关键字，表示我们这里就是用来定义一个类型的，而非是一个对象、函数：  

```typescript
class Personal {
  name: string
  // ^ 出错了，提示`name`必须显式的进行初始化
}

function getName (personal: Personal): name
// ^ 出错了，提示函数缺失实现
```

以下为正确的使用方式：  
```diff
-declare class Personal {
+declare class Personal {
  name: string
}

-function getName (personal: Personal): name
+declare function getName (personal: Personal): name
```

**当然了，一般情况下是不建议这么定义`class`的，应该使用`interface`来代替它，这样的`class`应该仅存在于针对非`TS`模块的描述，如果是自己开发的模块，那么本身结构就具有声明类型的特性。**  

## 函数重载

这个概念是在一些强类型语言中才有的，依托于`TypeScript`，这也算是一门强类型语言了，所以就会有需要用到这种声明的地方。  

例如我们有一个`add`函数，它可以接收`string`类型的参数进行拼接，也可以接收`number`类型的参数进行相加。  

__需要注意的是，只有在做第三方插件的函数重载定义时能够放到`d.ts`文件中，其他环境下建议将函数的定义与实现放在一起（虽说配置`paths`也能够实现分开处理，但是那样就失去了对函数创建时的约束）__  

```typescript
// index.ts

// 上边是声明
function add (arg1: string, arg2: string): string
function add (arg1: number, arg2: number): number
// 因为我们在下边有具体函数的实现，所以这里并不需要添加 declare 关键字

// 下边是实现
function add (arg1: string | number, arg2: string | number) {
  // 在实现上我们要注意严格判断两个参数的类型是否相等，而不能简单的写一个 arg1 + arg2
  if (typeof arg1 === 'string' && typeof arg2 === 'string') {
    return arg1 + arg2
  } else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
    return arg1 + arg2
  }
}
```

__`TypeScript` 中的函数重载也只是多个函数的声明，具体的逻辑还需要自己去写，他并不会真的将你的多个重名 function 的函数体进行合并__  

### 多个函数的顺序问题

想象一下，如果我们有一个函数，传入`Date`类型的参数，返回其`unix`时间戳，如果传入`Object`，则将对象的具体类型进行`toString`输出，其余情况则直接返回，这样的一个函数应该怎么写？  

_仅做示例演示，一般正常人不会写出这样的函数..._

```typescript
function build (arg: any) {
  if (arg instanceof Date) {
    return arg.valueOf()
  } else if (typeof arg === 'object') {
    return Object.prototype.toString.call(arg)
  } else {
    return arg
  }
}
```

但是这样的函数重载在声明的顺序上就很有讲究了，一定要将精确性高的放在前边：  

```typescript
// 这样是一个错误的示例，因为无论怎样调用，返回值都会是`any`类型
function build(arg: any): any
function build(arg: Object): string
function build(arg: Date): number
```

因为`TypeScript`在查找到一个函数重载的声明以后就会停止不会继续查找，`any`是一个最模糊的范围，而`Object`又是包含`Date`的，所以我们应该按照顺序从小到大进行排列：  

```typescript
function build(arg: Date): number
function build(arg: Object): string
function build(arg: any): any

// 这样在使用的时候才能得到正确的类型提示
const res1 = build(new Date()) // number
const res2 = build(() => { })  // string
const res3 = build(true)       // any
```

### 一些不需要函数重载的场景

函数重载的意义在于能够让你知道传入不同的参数得到不同的结果，如果传入的参数不同，但是得到的结果（__类型__）却相同，那么这里就不要使用函数重载（没有意义）。  

__如果函数的返回值类型相同，那么就不需要使用函数重载__  

```typescript
function func (a: number): number
function func (a: number, b: number): number

// 像这样的是参数个数的区别，我们可以使用可选参数来代替函数重载的定义
function func (a: number, b?: number): number
// 注意第二个参数在类型前边多了一个`?`

// 亦或是一些参数类型的区别导致的
function func (a: number): number
function func (a: string): number

// 这时我们应该使用联合类型来代替函数重载
function func (a: number | string): number
```

## Interface

`interface`是在`TypeScript`中独有的，在`JavaScript`并没有`interface`一说。  
_因为`interface`只是用来规定实现它的`class`对应的行为，没有任何实质的代码，对于脚本语言来说这是一个无效的操作_  

在语法上与`class`并没有什么太大的区别，但是在`interface`中只能够进行成员属性的声明，例如`function`只能够写具体接收的参数以及返回值的类型，并不能够在`interface`中编写具体的函数体，同样的，针对成员属性也不能够直接在`interface`中进行赋值：  
```typescript
// 这是一个错误的示例
interface PersonalIntl {
  name: string = 'Niko'

  sayHi (): string {
    return this.name
  }
}

// 在 interface 中只能存在类型声明
interface PersonalIntl {
  name: string

  sayHi (): string
}
```

其实在一些情况下使用`interface`与普通的`type`定义也没有什么区别。  
比如我们要导出一个存在`name`和`age`两个属性的对象：  

```typescript
// types/personal.d.ts
export interface PersonalIntl {
  name: string
  age:  number
}

// index.d.ts
import { PersonalIntl } from './types/personal'

const personal: PersonalIntl = {
  name: 'Niko',
  age:  18,
}
```

如果将`interface`换成`type`定义也是完全没问题的：  

```typescript
// types/personal.d.ts
export type PersonalIntl = {
  name: string
  age:  number
}
```  

这样的定义在基于上边的使用是完全没有问题的，但是这样也仅仅适用于`Object`字面量的声明，没有办法很好的约束`class`模式下的使用，所以我们采用`interface`来约束`class`的实现：  

```typescript
import { PersonalIntl } from './types/personal'

class Personal implements PersonalIntl {
  constructor(public name: string, public age: number) { }

  // 上边的简写与下述代码效果一致

  public name: string
  public age: number

  constructor (name: string, age: number) {
    this.name = name
    this.age = age
  }
}

const personal = new Personal('niko', 18)
```

### 关于函数成员声明的一些疑惑

首先，在接口中有两种方式可以定义一个函数，一个被定义在实例上，一个被定义在原型链上。  
两种声明方式如下：  

```typescript
interface PersonalIntl {
  func1 (): any      // 实例属性

  func2: () => any   // 原型链属性
}
```

但是我们在实现这两个属性时其实是可以互相转换的，并没有强要求必须使用哪种方式：  

```typescript
class Personal implements PersonalIntl {
  func1 () {
    console.log(this)
  }

  func2 = () => {
    console.log(this)
  }
}
```

其实这两者在编译后的`JavaScript`代码中是有区别的，并不清楚这是一个`bug`还是设计就是如此，类似这样的结构：  
```javascript
var Personal = /** @class */ (function () {
    function Personal() {
        var _this = this;
        this.func2 = function () {
            console.log(_this);
        };
    }
    Personal.prototype.func1 = function () {
        console.log(this);
    };
    return Personal;
}());
```

所以在使用的时候还是建议最好按照`interface`定义的方式来创建，避免一些可能存在的奇奇怪怪的问题。  

### 接口声明的自动合并

因为`interface`是`TypeScript`特有的，所以也会有一些有意思的特性，比如相同命名的`interface`会被自动合并：  

```typescript
interface PersonalIntl {
  name: string
}

interface PersonalIntl {
  age: number
}

class Personal implements PersonalIntl {
  name = 'Niko'
  age = 18
}
```

### 不要在 interface 中使用函数重载

在`interface`中使用函数重载，你会得到一个错误的结果，还是拿上边的`build`函数来说，如果在`interface`中声明，然后在`class`中实现，那么无论怎样调用，返回值的类型都会认为是`any`。  

所以正确的做法是在`class`中声明重载，在`class`中实现，`interface`中最多只定义一个`any`，而非三个重载。  

```typescript
class Util implements UtilIntl {
  build(arg: Date): number
  build(arg: Object): string
  build(arg: any): any

  build(arg: any) {
    if (arg instanceof Date) {
      return arg.valueOf()
    } else if (typeof arg === 'object') {
      return Object.prototype.toString.call(arg)
    } else {
      return arg
    }
  }
}
```

## 小结

有关`TypeScript`声明类型声明相关的目前就总结了这些比较常用的，欢迎小伙伴们进行补充。  

_在之前的版本中有存在`module`和`namespace`的定义，但是目前来看，好像更推荐使用 ES-Modules 版本的 `import`/`export`来实现类似的功能，而非自定义的语法，所以就略过了这两个关键字相关的描述_  

官方文档中有针对如何编写声明文件的模版，可以参考：[传送阵](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)  

### 参考资料

- [keyof](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html#keyof-and-lookup-types)
- [Record](https://www.typescriptlang.org/docs/handbook/advanced-types.html#mapped-types)
- [ReturnType 及其他的内置函数](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#predefined-conditional-types)