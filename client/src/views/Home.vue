<template>
  <div class="home">
    <object type="text/html" class="resizingObject" ref="resizingObject" data="about:blank" @load="resizeScrollbar($refs.resizingObject, $refs.scrollbar);" />
    <perfect-scrollbar ref="scrollbar">
      <div id="nav">
        <router-link to="/home/introduction">首页</router-link> |
        <router-link to="/home/about">帮助</router-link>
      </div>
      <router-view/>
    </perfect-scrollbar>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Home extends Vue {

}
</script>

<style scoped lang="less">
.home {
  text-align: center;
  position: relative;
  height: 100%;
}

.ps {
  height: 100%;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
