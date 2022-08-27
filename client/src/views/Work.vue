<template>
    <div class="work">
        <Header/>
        <router-view/>
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    import Header from './Header.vue';

    @Component({
        components: {
            Header
        }
    })
    export default class Work extends Vue {

    }
</script>

<style scoped lang="less">
    .work {
        padding-top: 40px;
        height: 100%;
    }
</style>