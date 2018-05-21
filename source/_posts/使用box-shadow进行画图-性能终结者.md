---
uuid: 35506ef0-5b5d-11e8-bd2b-5d0e24276911
title: 使用box-shadow进行画图(性能优化终结者)
date: 2018-05-19 20:07:31
tags:
  - javascript
  - canvas
---

> 最近突然想做一些好玩的东西，找来找去，想到了之前曾经在网上看到过有人用`box-shadow`画了一副蒙娜丽莎出来  
> 感觉这个挺有意思，正好趁着周末，自己也搞一波

<!-- more -->

## 前言

### 在线地址：
[优化前的版本](https://blog.jiasm.org/box-shadow-image-generator/index-first)  
[优化后的版本](https://blog.jiasm.org/box-shadow-image-generator/)  
[源码仓库地址](https://github.com/Jiasm/box-shadow-image-generator/blob/master/index.js)  

*不建议上传大图片。。喜欢听电脑引擎声的除外*  

----

首先，并不打算单纯的实现某一张图片（这样太没意思了），而是通过上传图片，来动态生成`box-shadow`的数据。  
所以，你需要了解这些东西：

1. `box-shadow`
3. `canvas`

### box-shadow

`box-shadow`可以让我们针对任意一个`html`标签生成阴影，我们可以控制阴影的偏移量、模糊半径、实际半径、颜色等一系列属性。  
语法如下：  
```css
selector {
  /* offset-x | offset-y | color */
  box-shadow: 60px -16px teal;

  /* offset-x | offset-y | blur-radius | color */
  box-shadow: 10px 5px 5px black;

  /* offset-x | offset-y | blur-radius | spread-radius | color */
  box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);

  /* inset | offset-x | offset-y | color */
  box-shadow: inset 5em 1em gold;

  /* Any number of shadows, separated by commas */
  box-shadow: 3px 3px red, -1em 0 0.4em olive;
}
```

这里是MDN的[box-shadow](https://developer.mozilla.org/zh-CN/docs/Web/CSS/box-shadow)描述，里边有一些示例。

### canvas

是的，我们还需要`canvas`，因为我们需要将图片资源转存到`canvas`中，再生成我们实际需要的数据格式。
在这里并不会拿`canvas`去做渲染之类的，单纯的是要利用`canvas`的某些API。  

## 首版规划

刚开始的规划大致是这样的：
1. 我们上传一张图片
2. 创建一个`Image`对象接收上传的图片资源
3. 将`Image`对象放入`canvas`中
4. 通过`canvas`生成图片文件对应的`rgba`数据
5. 处理`rgba`数据转换为`box-shadow`属性
6. done

### 如何接收图片文件数据

我们在监听`input[type="file"]`的`change`事件时，可以在`target`里边拿到一个`files`的对象。  
该对象为本次上传传入的文件列表集合，一般来说我们取第一个元素就是了。  
我们拿到了一个`File`类型的对象，接下来就是用`Image`来接收这个`File`对象了。  

这里会用到一个浏览器提供的全局对象`URL`，`URL`提供了一个`createObjectURL`的方法。  
方法接收一个`Blob`类型的参数，而`File`则是继承自`Blog`，所以我们直接传入就可以了。
然后再使用一个`Image`对象进行接收就可以了：  

```javascript
$input.addEventListener('change', ({target: {files: [file]}}) => {
  let $img = new Image()

  $img.addEventListener('load', _ => {
    console.log('we got this image')
  })

  $img.src = URL.createObjectURL(file)
})
```

> MDN关于[URL.createObjectURL](https://developer.mozilla.org/zh-CN/docs/Web/API/URL/createObjectURL)的介绍  

### 通过canvas获取我们想要的数据

`canvas`可以直接渲染图片到画布中，可以是一个`Image`对象、`HTMLImageElement`及更多媒体相关的标签对象。  
所以我们上边会把数据暂存到一个`Image`对象中去。  
我们在调用`drawImage`时需要传入`x`、`y`、`width`、`height`四个参数，前两个必然是0了，关于后边两个属性，正好当我们的`Image`对象加载完成后，直接读取它的`width`和`height`就是真实的数据：  
```javascript
let context = $canvas.getContext('2d')
$img.addEventListener('load', _ => {
  context.drawImage($img, 0, 0, $img.width, $img.height)
})
```

当我们把图片渲染至`canvas`后，我们可以调用另一个API获取`rgba`相关的数据。  

#### getImageData

我们调用`getImageData`会返回如下几个参数：
1. data
2. width
2. height

`data`为一个数组，每相邻的四个元素为一个像素点的`rgba`描述。
一个类似这样结构的数组：`[r, g, b, a, r, g, b, a]`。

> MDN关于[context.drawImage](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/drawImage)的介绍  
> MDN关于[context.getImageData](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/getImageData)的介绍  

### 处理rgba数据并转换为box-shadow

在上边我们拿到了一个一维数组，接下来就是将它处理为更合理的结构。
**P.S. 一维数组是从左到右从上到下排列的，而不是从上到下从左到右**

我们可以发现，`width`与`height`相乘正好是`data`数组的`length`。  
而数组的顺序则是先按照`x`轴进行增加的，所以我们这样处理得到的数据：  
```javascript
function getRGBA (pixels) {
  let results = []
  let {width, height, data} = pixels
  for (let i = 0; i < data.length / 4; i++) {
    results.push({
      x: i % width | 0,
      y: i / width | 0,
      r: data[i * 4],
      g: data[i * 4 + 1],
      b: data[i * 4 + 2],
      a: data[i * 4 + 3]
    })
  }

  return results
}
```

我们将`length`除以`4`作为循环的最大长度，然后在生成每个像素点的描述时  
通过当前下标对图片宽度取余得到当前像素点在图片中的`x`轴下标  
通过当前下标对图片宽度取商得到当前像素点在图片中的`y`轴下标  
同时塞入`rgba`四个值，这样我们就会拿到一个类似这样结构的数据：
```javascript
[{
  x: 0,
  y: 0,
  r: 255,
  g: 255,
  b: 255,
  a: 255
}]
```

#### 将数据生成为box-shadow格式的数据

`box-shadow`是支持多组属性的，两组属性之间使用`,`进行分割。  
所以，我们拿到上边的数据以后，直接遍历拼接字符串就可以生成我们想要的结果：  
```javascript
let boxShadow = results.map(item =>
  `${item.x}px ${item.y}px rgba(${item.r}, ${item.g}, ${item.b}, ${item.a})`
).join(',')
```

效果图：
![](/images/box-shadow-generator-image/show-off-1.png)

虽说这样就做出来了，但是对浏览器来说太不友好了。因为是每一个像素点对应的一个`box-shadow`属性。  
好奇的童鞋可以选择F12检查元素查看该`div`。*(反正苹果本是扛不住)*
所以为了我们能够正常使用F12，我们下一步的操作就是合并相邻同色值的`box-shadow`，减少`box-shadow`属性值的数量。  

## 合并相邻的单元格

虽说图片可能是由各种颜色不规则的组合而成，但毕竟还是会有很多是重复颜色的。  
所以我们要计算出某一种颜色可合并的最大面积。  
针对某一种颜色，用表格表示可能是这样的：  
![](/images/box-shadow-generator-image/split-demo-1.png)  
就像在图中所示，我们最理想的合并方式应该是这样的 *（radius的取值意味着我们只能设置一个正方形）*：  
![](/images/box-shadow-generator-image/split-demo-2.png)  
于是。。如果计算出来这一块面积就成为了一个问题-.-  

目前的思路是，将数组转换为二维数组，而不是单纯的在对象中用`x`、`y`标识。  
所以，我们对处理数组的函数进行如下修改：
```javascript
function getRGBA (pixels) {
  let results = []
  let {width, height, data} = pixels
  for (let i = 0; i < data.length / 4; i++) {
    let x = i % width | 0
    let y = i / width | 0
    let row = results[y] = results[y] || []
    row[x] = {
      rgba: `${data.slice(i * 4, i * 4 + 4)}` // 为了方便后续的对比相同颜色，直接返回一个字符串
    }
  }

  return results
}
```

这时我们就能得到一个按照`x`、`y`排列的二维数组，下一步的操作就是以任意点为原点，进行匹配周围的`cell`。
参考上边的表格示例，我们会拿到一个类似这样的数据 *（仅作示例）*：
```javascript
[
  [1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1],
  [1, 1, 1, 1, 1, 1],
]
```

### 获取可合并的最大半径

目前采用的是递归的方式，从`0,0`原点处开始搜索，获取当前原点的色值，然后与周围进行比较，获取一个最大半径的正方形：
```javascript
/**
 * 根据给定范围获取匹配当前节点的正方形
 * @param  {Array}  matrix            二维矩阵数组
 * @param  {Object} tag               当前要匹配的节点
 * @param  {Number} [startRowIndex=0] 开始的行下标，默认为1
 * @param  {Number} [startColIndex=0] 开始的列下标，默认为1
 * @return {Number}                   返回一个最小范围
 */
function range (matrix, tag, startRowIndex = 0, startColIndex = 0) {
  let results = []
  rows:
  for (let rowIndex = startRowIndex; rowIndex < matrix.length; rowIndex++) {
    let row = matrix[rowIndex]
    for (let colIndex = startColIndex; colIndex < row.length; colIndex++) {
      let item = row[colIndex]

      if (item.rgba !== tag.rgba) {
        if (colIndex === startColIndex) {
          break rows
          // 这个表示在某一行的第一列就匹配失败了，没有必要再进行后续的匹配，直接`break`到最外层
        } else {
          results.push(colIndex - startColIndex)
          break
          // 将当前下标放入集合，终止当前循环
        }
      } else if (colIndex === row.length - 1) {
        results.push(colIndex - startColIndex)
        // 这里表示一整行都可以与当前元素匹配
      }
    }
  }

  // 对所有的x、y轴的值进行比较获取最小的值
  let count = Math.min.apply(Math, [results.length].concat(results))

  return count
}
```
函数会从起点开始按顺序遍历所有的元素，在遇到不匹配的节点后，就会`break`进入下次循环，并将当前的下标存入数组中。  
在遍历完成后，我们将数组所有的`item`以及数组的长度（可以认为是`y`轴的值）一同放入`Math.min`获取一个最小的值。  
这个最小的值就是我们以当前节点为原点时可以生成的最大范围的正方形了。  
*P.S. 这个计算方式并不是很好，还不够灵活*

### 递归计算剩余面积

因为上边也只是合并了一个正方形，还会剩下很多面积没有被查看。  
所以我们用递归的方式来计算剩余面积，在第一次匹配结束后，是大概这个样子的：
![](/images/box-shadow-generator-image/split-demo-3.png)  
所以我们在递归处拆分出了两块会有重复数据的面积：  ![](/images/box-shadow-generator-image/split-demo-4.png) ![](/images/box-shadow-generator-image/split-demo-5.png)  

以及之后的递归也是参照这个样子来的，这样能保证所有的节点都会被照顾到，不会漏掉。*(如果有更好的方式，求回复)。*  

这样配合着前边拿到的半径数据，很轻松的就可以组装出合并后的集合，下一步就是将其渲染到`DOM`中了。

### 渲染到box-shadow中

现在我们已经拿到了想要的数据，关于生成`box-shadow`属性处我们也要进行一些修改，之前因为是一个像素对应一个属性值，但是现在做了一些合并，所以，生成属性值的操作大概是这个样子的：
```javascript
$output.style.boxShadow = results.map(item =>
  `${item.x}px ${item.y}px 0px ${item.radius}px rgba(${item.target.rgba})`
).join(',')
```
**P.S. `x`和`y`的值必须要加上半径的值，否则会出现错位，因为`box-shadow`是从中心开始渲染的，而不是左上角**

### 完成后的效果对比

原图&两种实现方式的效果对比：  
![](/images/box-shadow-generator-image/split-demo-7.png)

我们拿合并前后生成的`CSS`存为了文件，并查看了文件大小，效果在一些背景不是太复杂的图片上还是很明显的，减少了`2/3`左右的体积。  
*如果将rgba替换为hex，还会再小一些*
![](/images/box-shadow-generator-image/split-demo-6.png)

现在再进行检查元素不会崩溃了，但是依然会卡:)

## 参考资料

- [box-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow)
- [drawImage](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/drawImage)
- [getImageData](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData)
- [createObjectURL](https://developer.mozilla.org/zh-CN/docs/Web/API/URL/createObjectURL)
