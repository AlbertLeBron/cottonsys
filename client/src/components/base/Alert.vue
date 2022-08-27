<template>
    <div>
        <transition name="fade">
            <div v-if="show" class="shade noTextSelect">
                <div class="pop fade-pop">
                    <h5>
                        <div class="title"><i class="purefont pure-warning"></i>{{alertData.title}}</div>
                        <div class="closeBtn iconBtn" @click="hideAlert" title="关闭窗口">
                            <i class="purefont pure-o_close"></i>
                            <i class="purefont pure-close"></i>
                        </div>
                    </h5>
                    <div class="content">
                        {{alertData.content}}
                    </div>
                    <div class="actions">
                        <a class="btn default" @click="hideAlert">{{alertData.actions && alertData.actions.length ? '取消' : '关闭'}}</a>
                        <a class="btn primary" v-for="(item, index) in alertData.actions" :key="'action_'+index" @click="actionExcute(item)">{{item.text}}</a>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    import { AlertData, Action } from '@/components/base/AlertData';
    import { EventBus } from '@/EventBus';

    @Component
    export default class Alert extends Vue {
        private alertData!: any;
        private show!: boolean;
        
        data() {
            return {
                alertData: this.alertData,
                show: this.show
            }
        }

        mounted() {
            EventBus.$on('showAlert', (data: AlertData) => {
                this.alertData = data;
                this.show = true;
            });
            EventBus.$on('hideAlert', () => {
                this.show = false;
            });
        }

        beforeDestroy() {
            EventBus.$off('showAlert');
            EventBus.$off('hideAlert');
        }

        public hideAlert() {
            EventBus.$emit('hideAlert');
        }

        public actionExcute(item: Action) {
            item.callback();
            this.hideAlert();
        }
    }
</script>

<style scoped lang="less">
    .shade {
        position: fixed;
        left: 0;
        top: 0;
        height: 100%;
        width: 100%;
        overflow: hidden;
        z-index: 1200;
        .pop {
            display: flex;
            flex-direction: column;
            background: #f5f5f5;
            box-shadow: 0 2px 10px 0 rgb(0 0 0 / 20%);
            border: 1px solid rgba(0, 0, 0, 0.2);
            max-width: 90%;
            width: 300px;
            min-height: 120px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            -webkit-transform: translate(-50%, -50%);
            font-size: 15px;
            h5 {
                margin: 0;
                padding: 5px;
                border-bottom: 1px solid #dfe1e6;
                display: flex;
                justify-content: space-between;
                font-size: 15px;
                .title{
                    i {
                        font-weight: lighter;
                        font-size: 20px;
                        color: #ffc528;
                        margin-right: 2px;
                        vertical-align: bottom;
                    }
                }
                .closeBtn {
                    font-size: 16px;
                    i:nth-child(1){
                        font-weight: lighter;
                    }
                }
            }
            .content {
                padding: 8px 12px;
                font-size: 13px;
                flex: 1;
                height: 0;
                min-height: 0;
                word-break: break-all;
            }
            .actions {
                display: flex;
                justify-content: flex-end;
                padding: 8px 12px;
                .btn {
                    height: 24px;
                    line-height: 24px;
                    font-size: 15px;
                    padding: 0 20px;
                    + .btn {
                        margin-left: 10px;
                    }
                }
            }
        }
    }

    .fade-enter-active, .fade-leave-active,
    .fade-enter-active .fade-pop, .fade-leave-active .fade-pop{
        transition: all 0.3s ease-in-out;
        -webkiit-transition: all 0.3s ease-in-out;
    }

    .fade-enter .fade-pop, .fade-leave-to .fade-pop{
        opacity: 0;
        transform: translate(-50%, -50%) scale(.5);
        -webkit-transform: translate(-50%, -50%) scale(.5);
    }

    .fade-enter-to .fade-pop, .fade-leave .fade-pop{
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
        -webkit-transform: translate(-50%, -50%) scale(1);
    }
</style>