<p align="center">
  <a href="http://119.3.144.14:8080">
    <a href="http://119.3.144.14:8080"><img src="https://cn.vuejs.org/images/logo.svg" width="160" height="160" alt="Vue组件"></a>
  </a>
</p>

> 简单通用的vue控件。如下拉选择框、弹出菜单、滑块、分段滑块、穿梭框等。

# 下拉选择框

简单易用的下拉选择框，除了常规select需求外，集成了可输入、分组、多选、悬停提示、异步加载等需求。

[DEMO（案例）](http://119.3.144.14:8080/#/dropdown)

## Install（初始化）
通过NPM下载并初始化组件

```bash
npm install simple-dropdown-select
```

## Usage（使用）

#### &bull;&nbsp;全局注册使用&nbsp;&bull;

```js
import SimpleDropdownSelect from 'simple-dropdown-select'
import 'simple-dropdown-select/lib/simple-dropdown-select.css'

Vue.component('SimpleDropdownSelect', SimpleDropdownSelect)
```

在模板中需要组件的地方直接插入
```html
<simple-dropdown-select v-if="hack" v-model="此处为选中值变量（必须有）" :datas="此处为数据源列表（必须有）"></simple-dropdown-select>
```

#### &bull;&nbsp;局部注册使用&nbsp;&bull;

```html
<template>
    <div>
        <simple-dropdown-select v-if="hack" v-model="此处为选中值变量（必须有）" :datas="此处为数据源列表（必须有）"></simple-dropdown-select>
    </div>
</template>
<script>
import SimpleDropdownSelect from 'simple-dropdown-select'
import 'simple-dropdown-select/lib/simple-dropdown-select.css'
export default {
    components: {
        SimpleDropdownSelect
    }
}
</script>
```

## Props（属性）

#### &bull;&nbsp;组件属性绑定&nbsp;&bull;

```html
 <simple-dropdown-select v-model="xxx" :datas="xxx" :valKey="xxx" :nameKey="xxx" :defaultText="xxx" :placeholder="xxx" :showTitle="xxx" :groupBy="xxx" :multiMode="xxx" :multiNameMode="xxx" :filterMode="xxx" :openFlexible="xxx" :beforeClick="xxx" :afterClick="xxx"></simple-dropdown-select>
```

以下表格中罗列了组件所有可选属性，组合使用来满足不同需求。

<table>
    <thead>
        <tr>
            <th align="left" colspan="2">属性</th>
            <th align="left">类型</th>
            <th align="left">默认值</th>
            <th align="left">描述</th>
        </tr>
    </thead>
    <tr>
        <td colspan="2" rowspan="2">v-model</td>
        <td>any（必选）</td>
        <td><code>undefined</code></td>
        <td>该属性关联到组件选中值。若给该变量一个初始值，即可给组件设置一个默认选中项。</td>
    </tr>
    <tr>
        <td>any[]（必选）</td>
        <td><code>undefined</code></td>
        <td>该属性关联到组件选中值。多选模式下，操作组件时返回的是一个数组类型。</td>
    </tr>
    <tr>
        <td colspan="2" rowspan="2">datas</td>
        <td>any[] | undefined（必选）</td>
        <td><code>undefined</code></td>
        <td>该属性可传入一个数组，作为组件的数据源。</td>
    </tr>
    <tr>
        <td>function</td>
        <td><code>自定义</code></td>
        <td>该属性可传入一个回调函数实现异步加载。如“(fn: Function) => { setTimeout(() => {let list = [1,2]; fn(list);}, 1000) }”。</td>
    </tr>
    <tr>
        <td colspan="2">valKey</td>
        <td>string</td>
        <td><code>undefined</code></td>
        <td>可选，指定数据源中的某个属性作为需要的返回值。</td>
    </tr>
    <tr>
        <td colspan="2">nameKey</td>
        <td>string</td>
        <td><code>undefined</code></td>
        <td>可选，指定数据源中的某个属性作为显示在组件中的内容。</td>
    </tr>
    <tr>
        <td colspan="2">defaultText</td>
        <td>string</td>
        <td><code>undefined</code></td>
        <td>可选，未有选中项时显示的默认文本。</td>
    </tr>
    <tr>
        <td colspan="2">placeholder</td>
        <td>string</td>
        <td><code>undefined</code></td>
        <td>可选，未有选中项或默认文本时，显示的提示文本。</td>
    </tr>
    <tr>
        <td colspan="2">showTitle</td>
        <td>"all" | "ellipsis"</td>
        <td><code>undefined</code></td>
        <td>可选，是否显示悬停提示。默认不显示，可选择始终显示或截断显示。</td>
    </tr>
    <tr>
        <td colspan="2">groupBy</td>
        <td>string</td>
        <td><code>undefined</code></td>
        <td>可选，指定数据源中的某个属性作为需要的返回值。</td>
    </tr>
    <tr>
        <td colspan="2">multiMode</td>
        <td>boolean</td>
        <td><code>false</code></td>
        <td>可选，是否开启多选模式。</td>
    </tr>
    <tr>
        <td colspan="2">multiNameMode</td>
        <td>"count" | "string"</td>
        <td><code>"count"</code></td>
        <td>可选，多选模式下生效，设置多选模式下的显示文本形式。</td>
    </tr>
    <tr>
        <td colspan="2">filterMode</td>
        <td>boolean</td>
        <td><code>false</code></td>
        <td>可选，是否开启输入框模式。</td>
    </tr>
    <tr>
        <td colspan="2">openFlexible</td>
        <td>boolean</td>
        <td><code>false</code></td>
        <td>可选，输入框模式且单选模式且valKey&nameKey特定组合下生效。是否在过滤后的列表中添加输入值作为选项。</td>
    </tr>
    <tr>
        <td colspan="2">beforeClick</td>
        <td>function</td>
        <td><code>undefined</code></td>
        <td>可选，该回调函数在下拉选项click前触发，当前下拉选项作为参数传入。</td>
    </tr>
    <tr>
        <td colspan="2">afterClick</td>
        <td>function</td>
        <td><code>undefined</code></td>
        <td>可选，该回调函数在下拉选项click后触发，当前下拉选项作为参数传入。</td>
    </tr>
</table>

## License（授权许可）

MIT 


