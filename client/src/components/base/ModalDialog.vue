<template>
    <div>
        <transition name="fade">
            <div v-if="show" class="shade">
                <component :is="componentName" class="component fade-comp" :options="options"></component>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    import { DialogData } from '@/components/base/DialogData';
    import { EventBus } from '@/EventBus';
    import deal from '@/components/Deal.vue';
    import stock from '@/components/Stock.vue';
    import Login from '@/components/Login.vue';

    @Component({
        components: {
            deal,
            stock,
            Login
        }
    })
    export default class ModalDialog extends Vue {
        private componentName!: string;
        private options!: any;
        private show!: boolean;
        
        data() {
            return {
                componentName: this.componentName,
                options: this.options,
                show: this.show
            };
        }

        mounted() {
            EventBus.$on('showDialog', (data: DialogData) => {
                this.componentName = data.name;
                this.options = data.options;
                this.show = true;
            });
            EventBus.$on('hideDialog', () => {
                this.show = false;
            });
        }

        beforeDestroy() {
            EventBus.$off('showDialog');
            EventBus.$off('hideDialog');
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
        background: rgba(0, 0, 0, .7);
        overflow: hidden;
        z-index: 1150;
        .component {
            background: #fff;
            max-width: 100%;
            width: 600px;
            height: 100%;
            position: absolute;
            top: 0;
            right: 0;
            padding: 10px 0;
        }
    }

    .fade-enter-active, .fade-leave-active,
    .fade-enter-active .fade-comp, .fade-leave-active .fade-comp{
        transition: all 0.3s ease-in-out;
        -webkiit-transition: all 0.3s ease-in-out;
    }

    .fade-enter, .fade-leave-to{
        opacity: 0;
    }

    .fade-enter-to, .fade-leave{
        opacity: 1;
    }

    .fade-enter .fade-comp, .fade-leave-to .fade-comp{
        transform: translateX(100%);
        -webkit-transform: translateX(100%);
    }

    .fade-enter-to .fade-comp, .fade-leave .fade-comp{
        transform: translateX(0);
        -webkit-transform: translateX(0);
    }
</style>