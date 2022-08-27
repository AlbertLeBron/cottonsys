<template>
  <div id="app">
    <router-view/>
    <modalDialog id="modalDialog" />
    <alert id="alert" />
    <popup id="popup" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { EventBus } from '@/EventBus';
import modalDialog from '@/components/base/ModalDialog.vue'; 
import alert from '@/components/base/Alert.vue'; 
import popup from '@/components/base/Popup.vue';

@Component({
  components: {
      modalDialog,
      alert,
      popup
  }
})
export default class App extends Vue {
  mounted() {
    this.checkJumpToLogin(this.$route);

    this.$watch('$route', (to) => {
      this.checkJumpToLogin(to);
    });
  }

  public checkJumpToLogin(to: any) {
    if(to.name === 'Login'){
      EventBus.$emit('showDialog', {name:'login', options:{anchor: 'login'}});
    }else if(to.name === 'Register') {
      EventBus.$emit('showDialog', {name:'login', options:{anchor: 'register'}});
    }
  }
}
</script>
<style scoped lang="less">
  #app {
    height: 100%;
  }
</style>