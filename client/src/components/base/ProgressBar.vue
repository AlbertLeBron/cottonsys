<template>
    <div>
        <h5>{{title}}</h5>
        <div class="barWrap">
            <div class="bar">
                <div class="barFill" :style="{width: val + '%'}"></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from 'vue-property-decorator';

    @Component
    export default class Progress extends Vue {
        @Prop() protected tasks!: string[];
        private val!: number;
        private previousTasksLen!: number;
        private interVal!: any;
        
        data() {
            this.val = 0;
            this.previousTasksLen = 0;
            return {
                val: this.val
            }
        }

        get title() {
            let length = this.tasks.length;
            
            if(length > 0) {
                if (length > this.previousTasksLen) {
                    this.val = 0;
                } else if (length < this.previousTasksLen) {
                    this.val = 50;
                }

                if(this.previousTasksLen === 0) {
                    this.interVal = setInterval(this.process, 100);
                }
            } else clearInterval(this.interVal);

            this.previousTasksLen = length;
            return length > 1 ? `${this.tasks.length}个任务正在处理中...` : (this.tasks[0] || '');
        }

        public process() {
            let step = 0;

            if (this.val <= 70) {
                step = 1;
            } else if (this.val <= 80) {
                step = 0.5;
            } else if (this.val <= 90) {
                step = 0.25;
            } else if (this.val <= 99) {
                step = 0.01;
            }

            this.val += step;

            if (this.val >= 99) {
                clearInterval(this.interVal);
            }
        }
    }
</script>

<style scoped lang="less">
    .progress{
        min-width:240px;
        background: rgba(0,0,0,.75);
        box-shadow: 0 2px 6px 0 rgba(0,0,0,.5);
        h5 {
            margin: 0;
            color: #fff;
            font-weight: normal;
            padding: 10px 12px 0;
        }

        .barWrap {    
            padding: 10px 12px;   
            .bar {
                background-color: #f5f5f5;
                height: 6px;
                .barFill {
                    background-color: #5cbd74;
                    height: 100%;
                }
            }
        }
    }
</style>