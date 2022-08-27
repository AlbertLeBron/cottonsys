<template>
    <div>
        <i v-if="toast.state === 'ok'" class="purefont pure-ok"></i>
        <i v-if="toast.state === 'error'" class="purefont pure-close"></i>
        <p>{{toast.content}}</p>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from 'vue-property-decorator';
    import { ToastData } from '@/components/base/ToastData';

    @Component
    export default class Progress extends Vue {
        @Prop() protected toast!: ToastData;

        mounted() {
            setTimeout(() => { this.$emit('removeToast', this.toast); }, 2000)
        }
    }
</script>

<style scoped lang="less">
    .toast{
        display: flex;        
        min-height: 53px;
        align-items: center;
        min-width:240px;
        background: rgba(0,0,0,.75);
        box-shadow: 0 2px 6px 0 rgba(0,0,0,.5);
        padding: 10px 12px;
        margin-bottom: 5px;
        i {
            padding-right: 5px;
            &.pure-ok {
                color: #47f472;
                + p {
                    color: #47f472;
                }
            }
            &.pure-close {
                color: #fc8581;
                + p {
                    color: #fc8581;
                }
            }
        }

        p {
            margin: 0;
            font-size: 15px;
        }
    }
</style>