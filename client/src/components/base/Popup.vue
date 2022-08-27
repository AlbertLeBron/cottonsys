<template>
    <div>
        <div class="compWrap">
            <transition-group name="fade">
                <toast v-for="item in toasts" class="toast" :key="'toast_'+item.id" :toast="item" @removeToast="removeToast" />
            </transition-group>
            <transition name="fade">
                <progress-bar v-if="progressTasks.length" class="progress" :tasks="progressTasks" />
            </transition>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    import { guid } from '@/utils/Tools';
    import progressBar from '@/components/base/ProgressBar.vue';
    import toast from '@/components/base/Toast.vue';
    import { ToastData } from '@/components/base/ToastData';
    import { EventBus } from '@/EventBus';

    @Component({
        components: {
            progressBar,
            toast
        }
    })
    export default class Popup extends Vue {
        private progressTasks!: string[];
        private toasts!: ToastData[];

        data() {
            this.progressTasks = [];
            this.toasts = [];
            return {
                progressTasks: this.progressTasks,
                toasts: this.toasts
            }
        }

        mounted() {
            EventBus.$on('addProgress', (name: string) => {
                this.progressTasks.push(name);
            });
            EventBus.$on('removeProgress', (name: string) => {
                let index = this.progressTasks.indexOf(name);
                if(index > -1) this.progressTasks.splice(index, 1);
            });
            EventBus.$on('addToast', (toast: ToastData) => {
                let id!: string;
                do {
                    id = guid();
                } while (this.toasts.some((item: any) => item.id === id));
                toast.id = id;
                this.toasts.push(toast);
            });
        }

        beforeDestroy() {
            EventBus.$off('addProgress');
            EventBus.$off('removeProgress');
            EventBus.$off('addToast');
        }

        public removeToast(toast: ToastData) {
            let index = this.toasts.indexOf(toast);
            if(index > -1) this.toasts.splice(index, 1);
        }
    }
</script>

<style scoped lang="less">
    .compWrap {
        display: inline-block;
        position: fixed;
        right: 5px;
        bottom: 5px;
        z-index: 1250;
    }

    .fade-enter-active, .fade-leave-active {
        transition: all 0.3s ease-out;
        -webkiit-transition: all 0.3s ease-out;
    }

    .fade-enter, .fade-leave-to{
        opacity: .5;
        transform: translateX(100%);
        -webkit-transform: translateX(100%);
    }

    .fade-enter-to, .fade-leave{
        opacity: 1;
        transform: translateX(0);
        -webkit-transform: translateX(0);
    }
</style>