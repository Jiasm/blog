---
uuid: ccf79160-b3fb-11e8-bcda-095644449e63
title: 使用TS+Sequelize实现更简洁的CRUD
date: 2018-09-10 11:44:29
tags:
  - javascript
  - typescript
---

如果是经常使用Node来做服务端开发的童鞋，肯定不可避免的会操作数据库，做一些增删改查（`CRUD`，`Create Read Update Delete`）的操作，如果是一些简单的操作，类似定时脚本什么的，可能就直接生写SQL语句来实现功能了，而如果是在一些大型项目中，数十张、上百张的表，之间还会有一些（一对多，多对多）的映射关系，那么引入一个`ORM`（`Object Relational Mapping`）工具来帮助我们与数据库打交道就可以减轻一部分不必要的工作量，`Sequelize`就是其中比较受欢迎的一个。

<!-- more -->

## CRUD原始版 手动拼接SQL

先来举例说明一下直接拼接`SQL`语句这样比较“底层”的操作方式：

```sql
CREATE TABLE animal (
  id INT AUTO_INCREMENT,
  name VARCHAR(14) NOT NULL,
  weight INT NOT NULL, 
  PRIMARY KEY (`id`)
);
```

创建这样的一张表，三个字段，自增ID、`name`以及`weight`。  
如果使用`mysql`这个包来直接操作数据库大概是这样的：
```javascript
const connection = mysql.createConnection({})
const tableName = 'animal'

connection.connect()

// 我们假设已经支持了Promise

// 查询
const [results] = await connection.query(`
  SELECT 
    id,
    name,
    weight
  FROM ${tableName}
`)

// 新增
const name = 'Niko'
const weight = 70
await connection.query(`
  INSERT INTO ${tableName} (name, weight)
  VALUES ('${name}', ${weight})
`)
// 或者通过传入一个Object的方式也可以做到
await connection.query(`INSERT INTO ${tableName} SET ?`, {
  name,
  weight
})

connection.end()
```

看起来也还算是比较清晰，但是这样带来的问题就是，开发人员需要对表结构足够的了解。  
如果表中有十几个字段，对于开发人员来说这会是很大的记忆成本，你需要知道某个字段是什么类型，拼接`SQL`时还要注意插入时的顺序及类型，`WHERE`条件对应的查询参数类型，如果修改某个字段的类型，还要去处理对应的传参。  
这样的项目尤其是在进行交接的时候更是一件恐怖的事情，新人又需要从头学习这些表结构。  
_以及还有一个问题，如果有哪天需要更换数据库了，放弃了`MySQL`，那么所有的`SQL`语句都要进行修改（因为各个数据库的方言可能有区别）_  

## CRUD进阶版 Sequelize的使用

关于记忆这件事情，机器肯定会比人脑更靠谱儿，所以就有了`ORM`，这里就用到了在`Node`中比较流行的`Sequelize`。  

### ORM是干嘛的

首先可能需要解释下`ORM`是做什么使的，可以简单地理解为，使用面向对象的方式，通过操作对象来实现与数据库之前的交流，完成`CRUD`的动作。  
开发者并不需要关心数据库的类型，也不需要关心实际的表结构，而是根据当前编程语言中对象的结构与数据库中表、字段进行映射。  

就好比针对上边的`animal`表进行操作，不再需要在代码中去拼接`SQL`语句，而是直接调用类似`Animal.create`，`Animal.find`就可以完成对应的动作。  

### Sequelize的使用方式

首先我们要先下载`Sequelize`的依赖：  
```bash
npm i sequelize
npm i mysql2    # 以及对应的我们需要的数据库驱动
```

然后在程序中创建一个`Sequelize`的实例：
```javascript
const Sequelize = require('Sequelize')
const sequelize = new Sequelize('mysql://root:jarvis@127.0.0.1:3306/ts_test')
//                             dialect://username:password@host:port/db_name

// 针对上述的表，我们需要先建立对应的模型：
const Animal = sequelize.define('animal', {
  id: { type: Sequelize.INTEGER, autoIncrement: true },
  name: { type: Sequelize.STRING, allowNull: false },
  weight: { type: Sequelize.INTEGER, allowNull: false },
}, {
  // 禁止sequelize修改表名，默认会在animal后边添加一个字母`s`表示负数
  freezeTableName: true,
  // 禁止自动添加时间戳相关属性
  timestamps: false,
})

// 然后就可以开始使用咯
// 还是假设方法都已经支持了Promise

// 查询
const results = await Animal.findAll({
  raw: true,
})

// 新增
const name = 'Niko'
const weight = 70

await Animal.create({
  name,
  weight,
})
```

> sequelize定义模型相关的各种配置：[docs](https://github.com/demopark/sequelize-docs-Zh-CN/blob/master/models-definition.md)  

抛开模型定义的部分，使用`Sequelize`无疑减轻了很多使用上的成本，因为模型的定义一般不太会去改变，一次定义多次使用，而使用手动拼接`SQL`的方式可能就需要将一段`SQL`改来改去的。  

而且可以帮助进行字段类型的转换，避免出现类型强制转换出错`NaN`或者数字被截断等一些粗心导致的错误。  

通过定义模型的方式来告诉程序，有哪些模型，模型的字段都是什么，让程序来帮助我们记忆，而非让我们自己去记忆。  
我们只需要拿到对应的模型进行操作就好了。  

### 这还不够

**But**，虽说切换为`ORM`工具已经帮助我们减少了很大一部分的记忆成本，但是依然还不够，我们仍然需要知道模型中都有哪些字段，才能在业务逻辑中进行使用，如果新人接手项目，仍然需要去翻看模型的定义才能知道有什么字段，所以就有了今天要说的真正的主角儿：[sequelize-typescript](https://www.npmjs.com/package/sequelize-typescript)

## CRUD终极版 装饰器实现模型定义

`Sequelize-typescript`是基于`Sequelize`针对`TypeScript`所实现的一个增强版本，抛弃了之前繁琐的模型定义，使用装饰器直接达到我们想到的目的。

### Sequelize-typescript的使用方式

首先因为是用到了`TS`，所以环境依赖上要安装的东西会多一些：
```bash
# 这里采用ts-node来完成举例
npm i ts-node typescript
npm i sequelize reflect-metadata sequelize-typescript
```

其次，还需要修改`TS`项目对应的`tsconfig.json`文件，用来让`TS`支持装饰器的使用：
```diff
{
  "compilerOptions": {
+   "experimentalDecorators": true,
+   "emitDecoratorMetadata": true
  }
}
```

然后就可以开始编写脚本来进行开发了，与`Sequelize`不同之处基本在于模型定义的地方：
```javascript
// /modles/animal.ts
import { Table, Column, Model } from 'sequelize-typescript'

@Table({
  tableName: 'animal'
})
export class Animal extends Model<Animal> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number

  @Column
  name: string

  @Column
  weight: number
}

// 创建与数据库的链接、初始化模型
// app.ts
import path from 'path'
import { Sequelize } from 'sequelize-typescript'
import Animal from './models/animal'

const sequelize = new Sequelize('mysql://root:jarvis@127.0.0.1:3306/ts_test')
sequelize.addModels([path.resolve(__dirname, `./models/`)])

// 查询
const results = await Animal.findAll({
  raw: true,
})

// 新增
const name = 'Niko'
const weight = 70

await Animal.create({
  name,
  weight,
})
```

与普通的`Sequelize`不同的有这么几点：
1. 模型的定义采用装饰器的方式来定义
2. 实例化`Sequelize`对象时需要指定对应的`model`路径
3. 模型相关的一系列方法都是支持`Promise`的

_如果在使用过程中遇到提示`XXX used before model init`，可以尝试在实例化前边添加一个`await`操作符，等到与数据库的连接建立完成以后再进行操作_

但是好像看起来这样写的代码相较于`Sequelize`多了不少呢，而且至少需要两个文件来配合，那么这么做的意义是什么的？  
答案就是`OOP`中一个重要的理念：__继承__。  

### 使用Sequelize-typescript实现模型的继承

因为`TypeScript`的核心开发人员中包括`C#`的架构师，所以`TypeScript`中可以看到很多类似`C#`的痕迹，在模型的这方面，我们可以尝试利用继承减少一些冗余的代码。  

比如说我们基于`animal`表又有了两张新表，`dog`和`bird`，这两者之间肯定是有区别的，所以就有了这样的定义：
```sql
CREATE TABLE dog (
  id INT AUTO_INCREMENT,
  name VARCHAR(14) NOT NULL,
  weight INT NOT NULL, 
  leg INT NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE bird (
  id INT AUTO_INCREMENT,
  name VARCHAR(14) NOT NULL,
  weight INT NOT NULL, 
  wing INT NOT NULL,
  claw INT NOT NULL,
  PRIMARY KEY (`id`)
);
```

关于`dog`我们有一个腿`leg`数量的描述，关于`bird`我们有了翅膀`wing`和爪子`claw`数量的描述。  
_特意让两者的特殊字段数量不同，省的有杠精说可以通过添加`type`字段区分两种不同的动物 :p_  

如果要用`Sequelize`的方式，我们就要将一些相同的字段定义`define`三遍才能实现，或者说写得灵活一些，将`define`时使用的`Object`抽出来使用`Object.assign`的方式来实现类似继承的效果。  

但是在`Sequelize-typescript`就可以直接使用继承来实现我们想要的效果：

```javascript
// 首先还是我们的Animal模型定义
// /models/animal.ts
import { Table, Column, Model } from 'sequelize-typescript'

@Table({
  tableName: 'animal'
})
export default class Animal extends Model<Animal> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number

  @Column
  name: string

  @Column
  weight: number
}

// 接下来就是继承的使用了
// /models/dog.ts
import { Table, Column, Model } from 'sequelize-typescript'
import Animal from './animal'

@Table({
  tableName: 'dog'
})
export default class Dog extends Animal {
  @Column
  leg: number
}

// /models/bird.ts
import { Table, Column, Model } from 'sequelize-typescript'
import Animal from './animal'

@Table({
  tableName: 'bird'
})
export default class Bird extends Animal {
  @Column
  wing: number

  @Column
  claw: number
}
```

有一点需要注意的：**每一个模型需要单独占用一个文件，并且采用`export default`的方式来导出**  
也就是说目前我们的文件结构是这样的：  

```bash
├── models
│   ├── animal.ts
│   ├── bird.ts
│   └── dog.ts
└── app.ts
```

得益于`TypeScript`的静态类型，我们能够很方便地得知这些模型之间的关系，以及都存在哪些字段。  
在结合着`VS Code`开发时可以得到很多动态提示，类似`findAll`，`create`之类的操作都会有提示：
```javascript
Animal.create<Animal>({
  abc: 1,
// ^ abc不是Animal已知的属性  
})
```

### 通过继承来复用一些行为

上述的例子也只是说明了如何复用模型，但是如果是一些封装好的方法呢？  
类似的获取表中所有的数据，可能一般情况下获取`JSON`数据就够了，也就是`findAll({raw: true})`  
所以我们可以针对类似这样的操作进行一次简单的封装，不需要开发者手动去调用`findAll`：

```javascript
// /models/animal.ts
import { Table, Column, Model } from 'sequelize-typescript'

@Table({
  tableName: 'animal'
})
export default class Animal extends Model<Animal> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number

  @Column
  name: string

  @Column
  weight: number

  static async getList () {
    return this.findAll({raw: true})
  }
}

// /app.ts
// 这样就可以直接调用`getList`来实现类似的效果了
await Animal.getList() // 返回一个JSON数组
```

同理，因为上边我们的两个`Dog`和`Bird`继承自`Animal`，所以代码不用改动就可以直接使用`getList`了。  

```javascript
const results = await Dog.getList()

results[0].leg // TS提示错误
```

但是如果你像上边那样使用的话，TS会提示错误的：`[ts] 类型“Animal”上不存在属性“leg”。`。  
哈哈，这又是为什么呢？细心的同学可能会发现，`getList`的返回值是一个`Animal[]`类型的，所以上边并没有`leg`属性，`Bird`的两个属性也是如此。  

所以我们需要教`TS`认识我们的数据结构，这样就需要针对`Animal`的定义进行修改了，用到了 __范型__。
我们通过在函数上边添加一个范型的定义，并且添加限制保证传入的范型类型一定是继承自`Animal`的，在返回值转换其类型为`T`，就可以实现功能了。

```javascript
class Animal {
  static async getList<T extends Animal>() {
    const results = await this.findAll({
      raw: true,
    })
    return results as T[]
  }
}

const dogList = await Dog.getList<Dog>()
// 或者不作任何修改，直接在外边手动as也可以实现类似的效果
// 但是这样还是不太灵活，因为你要预先知道返回值的具体类型结构，将预期类型传递给函数，由函数去组装返回的类型还是比较推荐的
const dogList = await Dog.getList() as Dog[]

console.log(dogList[0].leg) // success
```

这时再使用`leg`属性就不会出错了，如果要使用范型，一定要记住添加`extends Animal`的约束，不然`TS`会认为这里可以传入任意类型，那么很难保证可以正确的兼容`Animal`，但是继承自`Animal`的一定是可以兼容的。  

当然如果连这里的范型或者`as`也不想写的话，还可以在子类中针对父类方法进行重写。  
并不需要完整的实现逻辑，只需要获取返回值，然后修改为我们想要的类型即可：  

```javascript
class Dog extends Animal {
  static async getList() {
    // 调用父类方法，然后将返回值指定为某个类型
    const results = await super.getList()
    return results as Dog[]
  }
}

// 这样就可以直接使用方法，而不用担心返回值类型了
const dogList = await Dog.getList()

console.log(dogList[0].leg) // success
```

## 小结

本文只是一个引子，一些简单的示例，只为体现出三者（`SQL`、`Sequelize`和`Sequelize-typescript`）之间的区别，`Sequelize`中有更多高阶的操作，类似映射关系之类的，这些在`Sequelize-typescript`中都有对应的体现，而且因为使用了装饰器，实现这些功能所需的代码会减少很多，看起来也会更清晰。  

_当然了，`ORM`这种东西也不是说要一股脑的上，如果是初学者，从个人层面上我不建议使用，因为这样会少了一个接触SQL的机会_  
_如果项目结构也不是很复杂，或者可预期的未来也不会太复杂，那么使用`ORM`也没有什么意义，还让项目结构变得复杂起来_  
_以及，一定程度上来说，通用就意味着妥协，为了保证多个数据库之间的效果都一致，可能会抛弃一些数据库独有的特性，如果明确的需要使用这些特性，那么`ORM`也不会太适合_  
__选择最合适的，要知道使用某样东西的意义__  

最终的一个示例放在了GitHub上：[notebook | typescript/sequelize](https://github.com/jiasm/notebook/tree/master/labs/storage/typescript/sequelize)  

参考资料：
- [mysql | npm](https://www.npmjs.com/package/mysql)
- [sequelize](http://docs.sequelizejs.com/)
- [sequelize-typescript | npm](https://www.npmjs.com/package/sequelize-typescript)
- [waht are the advantages of using an orm](https://stackoverflow.com/questions/398134/what-are-the-advantages-of-using-an-orm)
