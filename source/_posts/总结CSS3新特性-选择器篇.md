---
uuid: 93ea18c0-b97a-11e6-a0c5-3bd186f6bd4e
title: 总结CSS3新特性(选择器篇)
date: 2015-07-15 17:23
tags: css
---
CSS3新增了
![](/images/summary-css-new-feature-selectors/screen-shot-1.png)
嗯- -21个选择器,脚本通过控制台在[这里](http://www.w3school.com.cn/cssref/css_selectors.asp)运行;

#### ~:

```css
p ~ p{color: red;/*此条规则将用于p后边所有的p...就是除了第一个p的所有p,规则同p:not(:nth-of-type(1)),但是权重要低于后者*/}
```
<!-- more -->
#### [attribute^=value]:

选择该属性以特定值开头的元素
![](/images/summary-css-new-feature-selectors/screen-shot-2.png)

#### [attribute$=value]:

选择该属性以特定值结尾的元素
![](/images/summary-css-new-feature-selectors/screen-shot-3.png)
#### [attribute*=value]:

选择该属性中出现了特定值的元素
![](/images/summary-css-new-feature-selectors/screen-shot-4.png)
##### 上边三个是可以组合使用的,方法如 ↓ :
![](/images/summary-css-new-feature-selectors/screen-shot-5.png)
实际中可以应用在区分本地链接与外部链接,通过判断是否有http.com什么的(等到CSS4选择器问世就不用这么麻烦了[:local-link])

#### :first-of-type与:last-of-type:

从字面大概能看出来是干嘛使得,第一个这个类型的/最后一个这个类型的...
![](/images/summary-css-new-feature-selectors/screen-shot-6.png)

如上图所示,每个元素内的第一个p与最后一个p都应用了该样式;

#### :only-of-type:

选择仅仅仅有一个此类型的子元素,不包含子元素的子元素;
![](/images/summary-css-new-feature-selectors/screen-shot-7.png)
可以利用:not来实现反选
![](/images/summary-css-new-feature-selectors/screen-shot-8.png)

#### :only-child:

选择仅有一个子元素的元素;
![](/images/summary-css-new-feature-selectors/screen-shot-9.png)
如果去掉:only-child前边的p,那个孤独的span也会应用该样式;

同样可以使用:not反选,
![](/images/summary-css-new-feature-selectors/screen-shot-10.png)
#### :nth-child(n):

选择第n个子元素,可以结合选择器来限制
![](/images/summary-css-new-feature-selectors/screen-shot-11.png)
结合变量n(应该说是关键字吧= =),可以用来在表格里,列表里做隔行换色什么的
![](/images/summary-css-new-feature-selectors/screen-shot-12.png)

#### :nth-last-child(n):

基本同上...只不过是从后往前数

#### :nth-of-type(n):

这个跟上边的让我很蛋疼- -这两者的区别一直让人很凌乱,详情看下图
![](/images/summary-css-new-feature-selectors/screen-shot-13.png)

通过w3school上边做的.

p:nth-child(2)将父元素中子元素第二个为p的p的颜色设为红色,

p:nth-of-type(2)将子元素中的第二个p背景色设为绿色- -好乱的;

我认为两者的却别在于,nth-of-type计数过滤标签类型,而nth-child计数不过滤;

#### :nth-last-of-type(n):

这个不做解释了...反之

#### :last-child:

选取父元素中最后一个子元素
![](/images/summary-css-new-feature-selectors/screen-shot-14.png)

![Image](http://images0.cnblogs.com/blog2015/731575/201507/151711256578755.png)注意tr后边伪类的位置,这就是一个空格的差距= =上边那个选择的是最后一个tr,而下边那个是选择的tr中的最后一个元素;

#### :root:

选择文档根节点- -相当于 html {},但是权重要比html高,因为人家是伪类,沾点类就比标签高- -;

#### :empty:

选择没有子元素的标签,额,这个一般没什么大用,因为文本节点也是节点,一般就是表格有空单元格,列表有空项,然后做点处理,用js选择空元素时这个挺有用的;

#### :target:

W3C给的解释是设置活动的id的样式,其实就是浏览器路径上边缀着#什么,就选着什么 [传送阵](http://www.w3school.com.cn/cssref/selector_target.asp);

#### :enabled与:disabled:

用于表单元素是否可用的伪类;

:enabled为可用,:disabled反之;

#### :checked:

用于多选及单选被选中的伪类;

#### :not:

这个就不多说了- -上边用了那么多了;

#### ::selection:

被选中文本的样式;

   

#### 总结:

CSS3选择器带来了极大的便利,上文有什么不对或不详细,还请指出.有点虎头蛇尾了,哈哈

#### 部分参考链接:

[http://www.w3school.com.cn/cssref/css_selectors.asp](http://www.w3school.com.cn/cssref/css_selectors.asp)

再来几个CSS4前瞻的

[http://www.admin10000.com/document/5900.html](http://www.admin10000.com/document/5900.html)

[http://www.webhek.com/css4-selectors/](http://www.webhek.com/css4-selectors/)

[http://www.iinterest.net/2011/10/09/css4-selectors-level-4/](http://www.iinterest.net/2011/10/09/css4-selectors-level-4/)
