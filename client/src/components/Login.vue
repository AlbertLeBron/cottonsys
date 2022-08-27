<template>
  <div class="login noTextSelect">
    <object type="text/html" class="resizingObject" ref="resizingObject" data="about:blank" @load="resizeScrollbar($refs.resizingObject, $refs.scrollbar);" />
    <perfect-scrollbar ref="scrollbar" class="scrollbar">
      <span class="closeBtn iconBtn" @click="hideDialog" title="关闭窗口">
        <i class="purefont pure-o_close"></i>
        <i class="purefont pure-close"></i>
      </span>
      <div class="conWrap">
        <div class="conPop">
          <ul><li :class="{active: isLoginModel}" @click="jumpToLogin">登录</li><li :class="{active: !isLoginModel}" @click="jumpToRegister">注册</li></ul>
          <div v-if="!(isLoginModel && isLogining) && !(!isLoginModel && isRegistering)" class="form">
            <div class="inputWrap" :isInValid="userName != undefined && userNameInValid">
              <input type="text" v-model="userName" placeholder="用户名" @keyup.13="keyToTriggerBtn" />
              <span class="tip">
                  <i class="purefont pure-attention"></i>
                  <em><span :u="userNameInValid"></span></em>
              </span>
            </div>
            <div class="inputWrap" :isInValid="password != undefined && passwordInValid">
              <input type="password" v-model="password" placeholder="密码" @keyup.13="keyToTriggerBtn" />
              <span class="tip">
                  <i class="purefont pure-attention"></i>
                  <em><span :u="passwordInValid"></span></em>
              </span>
            </div>
            <div class="inputWrap" v-if="!isLoginModel" :isInValid="repeatPassword != undefined && repeatPasswordInValid">
              <input type="password" v-model="repeatPassword" placeholder="再次输入密码确认" @keyup.13="keyToTriggerBtn" />
              <span class="tip">
                  <i class="purefont pure-attention"></i>
                  <em><span :u="repeatPasswordInValid"></span></em>
              </span>
            </div>
            <a class="submitBtn btn success" :disabled="submitBtnDisabled" :title="submitBtnTitle" @click="submit">{{isLoginModel ? '立即登录' : '立即注册'}}</a>
          </div>
          <div v-else class="loadingWrap">
            <div>
              <div class="loading-circle-wrap">
                  <div class="loading-circle">
                      <div v-for="(item, index) in Array(9).fill(0)" :key="'sp_'+(item+index)"></div>
                  </div>
              </div>
              <p>{{isLoginModel ? '登录中' : '注册中'}}</p>
            </div>
          </div>
        </div>
      </div>
    </perfect-scrollbar>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { isObj, RegExpTest } from '@/utils/Tools'
import { loginState, clearLoginState } from '@/utils/Constant';
import { EventBus } from '@/EventBus';
import api from '@/api';

@Component
export default class Login extends Vue{
  @Prop() protected options!: any;
  private userName!: string | undefined;
  private password!: string | undefined;
  private repeatPassword!: string | undefined;
  private isRegistering!: boolean;
  private tobeDestroy!: boolean;

  data() {
    return {
      userName: this.userName,
      password: this.password,
      repeatPassword: this.repeatPassword,
      isRegistering: this.isRegistering
    }
  }

  mounted() {
    //验证登录状态
    this.initLoginState();

    this.$watch('$route', (to, from) => {
      if(from.name === 'Login' || from.name === 'Register') {
        this.userName = undefined;
        this.password = undefined;
        this.repeatPassword = undefined;
      }
      this.initLoginState();
    });
  }

  beforeDestroy() {
    this.tobeDestroy = true;
  }

  get isLoginModel() {
    return this.options?.anchor === 'login';
  }

  get userNameInValid() {
    return !this.userName ? '用户名不能为空' : this.userName.length > 45 ? '已超出45个字的限制' : RegExpTest('sql', this.userName) ? '存在不规范的文字或符号' : undefined;
  }

  get passwordInValid() {
    return !this.password ? '密码不能为空' : this.password.length > 45 ? '已超出45个字的限制' : RegExpTest('sql', this.password) ? '存在不规范的文字或符号' : undefined;
  }

  get repeatPasswordInValid() {
    return !this.password ? '密码不能为空' : this.repeatPassword !== this.password ? '两次密码不一致' : undefined;
  }

  get submitBtnDisabled() {
    return this.isLoginModel ? this.userNameInValid || this.passwordInValid : this.userNameInValid || this.passwordInValid || this.repeatPasswordInValid;
  }

  get submitBtnTitle() {
    return this.submitBtnDisabled ? `暂不可${this.isLoginModel ? '登录' : '注册'}，请检查用户名或密码是否符合规范` : undefined;
  }

  get isLogining() {
    return this.$store.state.loginChecked === 1;
  }

  public initLoginState() {
    if(this.isLoginModel && !this.isLogining) {
      let logined = loginState();
      if(logined.status === 1) {
        this.jumpToNext();
      }else if(logined.status === 3){
        this.checkLoginState(logined.storageUser);
      }
    }
  }
  
  public hideDialog() {
    this.$router.replace('home');
  }

  public jumpToLogin() {
    this.$router.replace('login');
  }

  public jumpToRegister() {
    this.$router.replace('register');
  }

  public jumpToNext() {
    let path: any = this.$route.query?.redirect || '/work';
    this.$router.replace(path);
  }

  public keyToTriggerBtn() {
    this.submit();
  }

  public submit() {
    if(this.submitBtnDisabled) return;
    let name = this.userName,
        password = this.password;
    if(this.isLoginModel){
      this.$store.commit('setLoginChecked', 1);
      api.user.login({name, password}).then((response: any) => {
        if(isObj(response)) {
          let user: any = response.data;
          this.$store.commit('setUser', user);
          localStorage.setItem('user', JSON.stringify(user));
          this.$store.commit('setLoginChecked', 0);
          EventBus.$emit('addToast', { state: 'ok', content: '登录成功!'});
          if(this.$route.name === 'Login') this.jumpToNext();
        }else {
          this.$store.commit('setLoginChecked', 0);
          EventBus.$emit('addToast', { state: 'error', content: '登录异常!'});
        }
      },(error) => {
        this.$store.commit('setLoginChecked', 0);
        if(isObj(error) && error.message) {
          EventBus.$emit('addToast', { state: 'error', content: error.message});
        }else EventBus.$emit('addToast', { state: 'error', content: '登录失败!'}); 
      });
    }else {
      this.isRegistering = true;
      api.user.register({name, password}).then(() => {
        this.isRegistering = false;
        EventBus.$emit('addToast', { state: 'ok', content: '注册成功!'});
        if(!this.tobeDestroy) this.jumpToLogin();
      },(error) => {
        this.isRegistering = false;
        if(isObj(error) && error.message) {
          EventBus.$emit('addToast', { state: 'error', content: error.message});
        }else EventBus.$emit('addToast', { state: 'error', content: '注册失败!'}); 
      });
    }
  }

  checkLoginState(storageUser: any) {
    this.$store.commit('setLoginChecked', 1);
    let id = storageUser.id,
        token = storageUser.token;
    //模拟数据，连接后端后删除
    api.user.checkLogin({id, token}).then((response: any) => {
      if(isObj(response)) {
        let user: any = response.data;
        this.$store.commit('setUser', user);
        localStorage.setItem('user', JSON.stringify(user));
        this.$store.commit('setLoginChecked', 0);
        EventBus.$emit('addToast', { state: 'ok', content: '检验登录成功!'});
        if(this.$route.name === 'Login') this.jumpToNext();
      }else {
        clearLoginState();
        EventBus.$emit('addToast', { state: 'error', content: '登录异常!'});
      }
    },(error) => {
      clearLoginState();
      if(isObj(error) && error.message) {
        EventBus.$emit('addToast', { state: 'error', content: error.message});
      }else EventBus.$emit('addToast', { state: 'error', content: '登录异常!'}); 
    });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.login {
  background-image: linear-gradient(90deg,#34d9e0,#d3e38d)!important;
  .scrollbar {
    height: 100%;
  }
  .ps {
    :deep(.ps__thumb-y) {
      background: rgba(0,0,0,.2);
    }
    :deep(.ps__rail-y:hover),
    :deep(.ps__rail-y:focus),
    :deep(.ps__rail-y.ps--clicking) {
      background: none;
      .ps__thumb-y {
        background-color: rgba(0,0,0,.3);
        width: 6px;
      }
    }
  }
  .closeBtn {
    position: fixed;
    top: 16px;
    right: 16px;
    i {
        font-size: 25px;
        &:nth-child(1){
            font-weight: lighter;
        }
    }
  }
  .conWrap {
    min-height: 100%;
    display: flex;
    align-items: center;
    &::before, &::after{
      content:'';
      flex: 1;
      width: 0;
      min-width: 0;
    }
  }
  .conPop {
    background: #FAFAFA;
    box-shadow: 0 0 6px 1px rgb(0 0 0 / 30%);
    border-radius: 3px;
    min-height: 300px;
    width: 320px;
    display: flex;
    flex-direction: column;
    ul {
      list-style-type: none;
      margin: 0;
      padding: 0;
      display: flex;
      li {
        height: 40px;
        line-height: 40px;
        text-align: center;
        flex: 1;
        width: 0;
        min-width: 0;
        &.active {
          color: #42b983;
        }
        &:not(.active){
          background: #f5f5f5;
        }
        &:not(.active):first-child {
          box-shadow: inset -1px -1px 1px rgba(0,0,0,.3);
          border-top-left-radius: 3px;
        }
        &:not(.active):last-child {
          box-shadow: inset 1px -1px 1px rgba(0,0,0,.3);
          border-top-right-radius: 3px;
        }
      }
    }
    .form {
      padding: 20px;
      .inputWrap {
        height: 40px;
        border-radius: 4px;
        width: 100%;
        margin-top: 20px;
        border: 1px solid rgb(46 51 57 / 50%);
        padding-right: 0;
        input {
          padding-right: 10px;
          border-radius: 4px;
        }
        .tip {
          display: none;
          line-height: 40px;
          em span {
            bottom: 19px;
          }
        }
        &[isInValid] {
          padding-right: 30px;
          input {
            padding-right: 0;
          }
          .tip {
            display: block;
          }
        }
      }
      .submitBtn {
        margin-top: 20px;
        border-radius: 4px;
        cursor: pointer;
        display: block;
        text-align: center;
      }
    }
    .loadingWrap {
      flex: 1;
      height: 0;
      min-height: 0;
      display: flex;
      align-items: center;
      > div {
        flex: 1;
        text-align: center;
        .loading-circle-wrap {
          height: 40px;
          .loading-circle {
              transform: translate(-50%, -50%) scale(1.5);
              -webkit-transform: translate(-50%, -50%) scale(1.5);
          }
        }
        p {
          margin: 0;
          padding-top: 10px;
          font-size: 13px;
          color: #aaa;
        }
      }
    }
  }
}
</style>
