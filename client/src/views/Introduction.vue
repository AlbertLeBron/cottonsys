<template>
  <div class="introduction">
    <img alt="Vue logo" src="../../public/mh.svg">
    <h1>记货本</h1>
    <p>随时记下货品出入，轻松清点个人仓库</p>
    <div class="btnWrapper noTextSelect">
      <a class="btn success" @click="$router.push('login')">开始使用</a>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Introduction extends Vue{
  
}
</script>
<style scoped lang="less">
  p {
    color: #aaa;
  }
  .btnWrapper {
    padding: 20px 0;
    .btn {
      border-radius: 5px;
    }
  }
</style>