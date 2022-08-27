<template>
    <div class="header">
        <div v-if="$store.state.user" class="userInfo">
            <i class="iconfont icon-avatar"></i>
            <span>{{$store.state.user.name}} •</span>
            <a @click="logout">退出</a>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    import { logout } from '@/utils/Constant';

    @Component
    export default class Header extends Vue {
        public logout() {
            logout();
            //(window as any).reload();
        }
    }
</script>

<style scoped lang="less">
    .header {
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 1100;
        justify-content: flex-end;
        align-items: center;
        height: 40px;
        box-shadow: 0 1px 8px 0 rgb(0 0 0 / 10%);
        background: #fff url('../../public/mh.svg') no-repeat 20px center/auto 60%;
        .userInfo {
            padding: 0 20px;
            font-size: 13px;
            display: inline-flex;
            align-items: center;
            i {
                display: inline-block;
                height: 26px;
                width: 26px;
                font-size: 26px;
                margin-right: 8px;
            }
            a {
                color: #42b983;
                cursor: pointer;
                margin-left: 5px;
            }
        }
    }
</style>