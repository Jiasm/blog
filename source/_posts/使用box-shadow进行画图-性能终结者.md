---
uuid: 35506ef0-5b5d-11e8-bd2b-5d0e24276911
title: 使用box-shadow进行画图(性能终结者)
date: 2018-05-19 20:07:31
tags:
  - javascript
  - canvas
---

> 最近突然想做一些好玩的东西，找来找去，想到了之前曾经在网上看到过有人用`box-shadow`画了一副蒙娜丽莎出来  
> 感觉这个挺有意思，正好趁着周末，自己也搞一波

<!-- more -->

## 前言

我们并不打算单纯的实现某一张图片，而是通过上传图片，来动态生成`box-shadow`的数据。  
所以，你需要了解这些东西：

1. `box-shadow`
3. `canvas`

### box-shadow

`box-shadow`可以让我们针对任意一个`html`标签生成阴影，我们可以控制阴影的偏移量、模糊面积、实际面积、颜色等一系列属性。  
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
