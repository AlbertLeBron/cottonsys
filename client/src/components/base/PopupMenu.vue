<template>
    <div :class="['popupMenuBox', {free: useMode != 'pinned'}]" ref="popupMenuBox">
        <transition name="fade">
            <div v-for="(item, index) in popupMenuBox" :key="'pm_'+index" v-show="item.showPopupMenu" ref="popupMenu" class="popup-menu hide" :level="index" :style="computedStyle(item.popupMenuData.event)" @mouseleave="dropLeave($event, index)" @click.stop.prevent="" @contextmenu.stop.prevent="">
                <ul>
                    <perfect-scrollbar ref="scrollbar">
                        <object type="text/html" class="pm-object" ref="contentWatcher" data="about:blank" @load="listenContentResize(index)"></object>
                        <div v-if="item.popupMenuData && item.popupMenuData.items && item.popupMenuData.items.length">
                            <li v-for="(subItem, subIndex) in item.popupMenuData.items" :key="'li_'+subIndex"
                                :class="{ seperator: subItem.isSeperator, disabled: subItem.disabled, hovered: subItem.hovered, selected: selectedItem === subItem }"
                                @click="itemSelected(subItem)"
                                @mouseenter="itemEnter($event,subIndex,subItem,index)"
                                @mouseleave="itemLeave($event,subIndex,subItem,index)">
                                <span v-if="!subItem.isSeperator && subItem.icon" :class="['icon', subItem.icon]"></span>
                                <span :class="[!subItem.disabled && subItem.red? 'error': '', 'text']">{{subItem.title}}</span>
                                <i v-if="subItem.subMenuItems || subItem.callback" class="icon-Chevron_r"></i>
                            </li>
                        </div>
                        <div v-else-if="item.popupMenuData && item.popupMenuData.callback" class="loading">
                            <div class="loading-circle">
                                <div v-for="(item, index) in Array(9).fill(0)" :key="'sp_'+(item+index)"></div>
                            </div>
                        </div>
                        <div v-else class="nodata"><span>暂无数据</span></div>
                    </perfect-scrollbar>               
                </ul>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from 'vue-property-decorator';
    @Component
    export default class PopupMenu extends Vue {
        @Prop() protected useMode!: 'pinned' | 'free';
        @Prop() protected selectedItem!: any;
        private depth!: number;
        private popupMenuBox!: any[];
        private mousedownEvent!: MouseEvent;

        data() {
            this.popupMenuBox = [];
            return {
                popupMenuBox: this.popupMenuBox
            }
        }
        mounted() {
            document.addEventListener('mousedown', this.setMousedownEvent);
            document.addEventListener('mouseup', this.closeSelect);
        }
        beforeDestroy() {
            document.removeEventListener('mousedown', this.setMousedownEvent);
            document.removeEventListener('mouseup', this.closeSelect);
        }
        public computedStyle(event: any) {
            return {left: this.getMouseX(event) + "px", top: this.getMouseY(event) + "px"};
        }
        public itemSelected(item: any): void {
            if (!item.isSeperator && !item.disabled && item.selectedCallback) {
                item.selectedCallback(item);
                this.hidePopupMenu();
            }
        }
        public setMousedownEvent(e: MouseEvent) {
            this.mousedownEvent = e;
        }
        public closeSelect(e: MouseEvent) {
            if (!this.mousedownEvent || (this.$refs.popupMenuBox as any).contains(this.mousedownEvent.target) || (this.$refs.popupMenuBox as any).contains(e.target)) return;
            this.hidePopupMenu();
        }
        public hidePopupMenu() {
            this.popupMenuBox.forEach((item: any, index: number) => {
                this.$set(this.popupMenuBox, index, { popupMenuData: item.popupMenuData, showPopupMenu: false });
            });
        }
        public itemEnter(event: MouseEvent, subIndex: number, subItem: any, level: number): void {
            if (subItem.subMenuItems || subItem.callback) {
                let data = { level: level, item: subItem, index: subIndex },
                    index = data.level + 1,
                    item = this.popupMenuBox[index],
                    curItems = item.popupMenuData.items,
                    popupMenu = (this.$refs['popupMenu'] as any)[data.level] as HTMLElement,
                    opageX = this.popupMenuBox[data.level].popupMenuData.event.pageX + popupMenu.getBoundingClientRect().width - 2,
                    opageY = this.popupMenuBox[data.level].popupMenuData.event.pageY + data.index * (event.target as HTMLElement).getBoundingClientRect().height + 6;
                data.item.hovered = true;
                item.popupMenuData.event.pageX = opageX;
                item.popupMenuData.event.pageY = opageY;
                item.popupMenuData.items = data.item.subMenuItems;
                item.popupMenuData.callback = data.item.callback;
                item.popupMenuData.callbackExcuting = data.item.callbackExcuting;
                item.popupMenuData.ancIndex = subIndex;
                item.showPopupMenu = true;
                this.$set(this.popupMenuBox[data.level].popupMenuData.items, data.index, data.item);
                this.$set(this.popupMenuBox, index, item);                
                this.$nextTick(() => {   
                    this.setMenuPosition(event, index);
                    this.updateScrollbar(index, curItems !== item.popupMenuData.items);
                });
                setTimeout(() => {
                    if (!item.popupMenuData.items && item.popupMenuData.callback && !item.popupMenuData.callbackExcuting) {
                        data.item.callbackExcuting = true;
                        let ancIndex = item.popupMenuData.ancIndex;
                        item.popupMenuData.callback((list: any[]) => {
                            data.item.subMenuItems = list;
                            item.popupMenuData.callbackExcuting = false;
                            if (item.popupMenuData.ancIndex == ancIndex) {
                                item.popupMenuData.items = data.item.subMenuItems;
                                this.refreshDepth();
                                item.popupMenuData.event.pageX = opageX;
                                item.popupMenuData.event.pageY = opageY;
                                this.$nextTick(() => {
                                    this.setMenuPosition(event, index);
                                    this.updateScrollbar(index);
                                });
                            }
                        }, JSON.parse(JSON.stringify(data.item)));
                    }
                }, 0);
            }
        }
        public itemLeave(event: MouseEvent, subIndex: number, subItem: any, level: number): void {
            let dom = event.relatedTarget as any;
            if ((subItem.subMenuItems || subItem.callback) && !!dom && this.matchPopupmenu(dom, (this.$refs.popupMenu as any)?.[level])) {
                let data = { level: level, item: subItem, index: subIndex },
                    index = data.level + 1,
                    item = this.popupMenuBox[index];
                data.item.hovered = false;
                item.showPopupMenu = false;
                this.$set(this.popupMenuBox[data.level].popupMenuData.items, data.index, data.item);
                this.$set(this.popupMenuBox, index, item);
            }
        }
        public dropLeave(event: MouseEvent, level: number): void {
            let dom = event.relatedTarget as any;
            if (this.matchPopupmenu(dom, (this.$refs.popupMenu as any)?.[level + 1])) {
                return;
            } else if (this.matchPopupmenu(dom, (this.$refs.popupMenu as any)?.[level - 1])) {
                let data = { level: level };
                for (let i = data.level; i < this.depth; i++) {
                    this.popupMenuBox[i].showPopupMenu = false;
                    this.$set(this.popupMenuBox, i, this.popupMenuBox[i]);
                    this.popupMenuBox[i-1].popupMenuData.items?.forEach((item: any, index: number) => {
                        item.hovered = false;
                        this.$set(this.popupMenuBox[i-1].popupMenuData.items, index, item);
                    });
                }
            } else {
                let data = { level: 1 };
                for (let i = data.level; i < this.depth; i++) {
                    this.popupMenuBox[i].showPopupMenu = false;
                    this.$set(this.popupMenuBox, i, this.popupMenuBox[i]);
                    this.popupMenuBox[i-1].popupMenuData.items?.forEach((item: any, index: number) => {
                        item.hovered = false;
                        this.$set(this.popupMenuBox[i-1].popupMenuData.items, index, item);
                    });
                }
            }
        }
        public matchPopupmenu(curDom: any, relDom: any) {
            return relDom && relDom.contains(curDom);
        }
        public updateScrollbar(index: number, scrollToTop?: boolean) {
            let scrollbar = (this.$refs.scrollbar as any)?.[index];
            if (scrollbar) {
                scrollbar.update();
                if(scrollToTop) scrollbar.$el.scrollTop = 0;
            }
        }
        public listenContentResize(index: number) {
            let contentWatcher = (this.$refs.contentWatcher as any)?.[index];
            if (contentWatcher && contentWatcher.contentWindow)
                contentWatcher.contentWindow.addEventListener('resize', () => {this.updateScrollbar(index);});
        }
        public refreshDepth() {
            let depth = this.getDepth(this.popupMenuBox[0].popupMenuData);
            if (depth > this.depth) {
                for (var i = this.depth; i < depth; i++) {
                    this.popupMenuBox.push({ popupMenuData: { event: { pageX: this.popupMenuBox[0].pageX, pageY: this.popupMenuBox[0].pageX + i * 180 }, items: [] }, showPopupMenu: false });
                }
                this.depth = depth;
            }
        }
        public getDepth(popupMenuData: any) {
            let depthArr: number[] = [],
                num = 0;
            this.ergodic(popupMenuData.items, depthArr, num);
            return Math.max.apply(null, depthArr);
        }
        public ergodic(popupMenuItems: any[], depthArr: number[], num: number) {
            popupMenuItems.forEach((item: any) => {
                if (!item.subMenuItems && !item.callback) {
                    depthArr.push(num + 1);
                } else if ((item.subMenuItems && !item.subMenuItems.length) || (!(item.subMenuItems && item.subMenuItems.length) && item.callback)) {
                    depthArr.push(num + 2);
                } else {
                    this.ergodic(item.subMenuItems as any[], depthArr, num + 1);
                }
            });
        }
        public setMenuPosition(event: MouseEvent, level: number) {
            let popupMenu = (this.$refs['popupMenu'] as any)[level] as HTMLElement;
            if (popupMenu) {
                let bodyRect = document.body.getBoundingClientRect(),
                    lastPopupMenu = (this.$refs['popupMenu'] as any)[level - 1] as HTMLElement,
                    ptyh = lastPopupMenu.getElementsByClassName('ps__thumb-y')[0].getBoundingClientRect().width;
                let xpos = this.getMouseX(this.popupMenuBox[level].popupMenuData.event),
                    ypos = this.getMouseY(this.popupMenuBox[level].popupMenuData.event),
                    xpagePos = popupMenu.getBoundingClientRect().left,
                    ypagePos = popupMenu.getBoundingClientRect().top;
                let ww = bodyRect.width + (window.pageXOffset || (document.documentElement as HTMLElement).scrollLeft || document.body.scrollLeft),
                    mw = popupMenu.getBoundingClientRect().width,
                    lmw = lastPopupMenu.getBoundingClientRect().width;
                let x = xpagePos + mw > ww ? xpos - mw - lmw + 4 : xpos - ptyh;
                let wh = bodyRect.height + (window.pageYOffset || (document.documentElement as HTMLElement).scrollTop || document.body.scrollTop),
                    mh = popupMenu.getBoundingClientRect().height,
                    st = (this.$refs['scrollbar'] as any)[level - 1].$el.scrollTop,
                    eh = (event.target as HTMLElement).getBoundingClientRect().height;
                let y = ypagePos - st + mh > wh ? ypos - mh - st + eh : ypos - st;
                this.popupMenuBox[level].popupMenuData.event.pageX = x;
                this.popupMenuBox[level].popupMenuData.event.pageY = y;
            }
        }
        public getMouseX(e: MouseEvent): number {
            if (e.pageX != undefined && e.pageX != null) {
                return e.pageX;
            } else if (e.clientX != undefined && e.clientX != null) {
                let scrollLeft = document.documentElement ? document.documentElement.scrollLeft : document.body.scrollLeft;
                return e.clientX + scrollLeft;
            }
            return 0;
        }
        public getMouseY(e: MouseEvent): number {
            if (e.pageY != undefined && e.pageY != null) {
                return e.pageY;
            } else if (e.clientY != undefined && e.clientY != null) {
                let scrollTop = document.documentElement ? document.documentElement.scrollTop : document.body.scrollTop;
                return e.clientY + scrollTop;
            }
            return 0;
        }
        public showPopupMenu(event: MouseEvent, popupMenuData: any) {
            (popupMenuData as any).event = { pageX: 0, pageY: 1 } as MouseEvent;
            this.depth = this.getDepth(popupMenuData);
            this.popupMenuBox = [];
            this.popupMenuBox[0] = { popupMenuData: popupMenuData, showPopupMenu: true };
            for (var i = 1; i < this.depth; i++) {
                this.popupMenuBox.push({ popupMenuData: { event: { pageX: 0, pageY: 0 }, items: []}, showPopupMenu: false });
            }
            if(this.useMode == 'pinned'){
                this.setPinnedPopupMenuPos(event);
            }else this.setFreePopupMenuPos(event);
        }
        public setPinnedPopupMenuPos(event: MouseEvent) {
            this.$nextTick(() => {
                if ((this.$refs['popupMenu'] as any).length) {
                    let popupMenu = (this.$refs['popupMenu'] as any)[0] as HTMLElement,
                        bodyRect = document.body.getBoundingClientRect(),
                        xpagePos = (popupMenu.parentNode as any).getBoundingClientRect().left,
                        lmw = (popupMenu.parentNode as any).getBoundingClientRect().width,
                        ww = bodyRect.width + (window.pageXOffset || (document.documentElement as HTMLElement).scrollLeft || document.body.scrollLeft),
                        mw = popupMenu.getBoundingClientRect().width,
                        ypagePos = (popupMenu.parentNode as any).getBoundingClientRect().top,
                        emh = (event.currentTarget ? event.currentTarget as any : event.target as any).getBoundingClientRect().height,
                        wh = bodyRect.height + (window.pageYOffset || (document.documentElement as HTMLElement).scrollTop || document.body.scrollTop),
                        mh = popupMenu.getBoundingClientRect().height;
                    if (xpagePos + mw > ww) this.popupMenuBox[0].popupMenuData.event.pageX = lmw - mw;
                    if (ypagePos + mh > wh) this.popupMenuBox[0].popupMenuData.event.pageY = 0 - emh - mh;
                    this.$set(this.popupMenuBox, 0 , this.popupMenuBox[0]);
                }
            });
        }
        public setFreePopupMenuPos(event: MouseEvent) {
            let popupMenuBox = this.$refs.popupMenuBox as any;
            if(popupMenuBox) {
                popupMenuBox.style.left = this.getMouseX(event) + 'px';
                popupMenuBox.style.top = this.getMouseY(event) + 'px';
            }
            this.$nextTick(() => {
                if ((this.$refs['popupMenu'] as any).length) {
                    let popupMenu = (this.$refs['popupMenu'] as any)[0] as HTMLElement,
                        bodyRect = document.body.getBoundingClientRect(),
                        xpagePos = (popupMenu.parentNode as any).getBoundingClientRect().left,
                        ww = bodyRect.width + (window.pageXOffset || (document.documentElement as HTMLElement).scrollLeft || document.body.scrollLeft),
                        mw = popupMenu.getBoundingClientRect().width,
                        ypagePos = (popupMenu.parentNode as any).getBoundingClientRect().top,
                        wh = bodyRect.height + (window.pageYOffset || (document.documentElement as HTMLElement).scrollTop || document.body.scrollTop),
                        mh = popupMenu.getBoundingClientRect().height;
                    if (xpagePos + mw > ww) this.popupMenuBox[0].popupMenuData.event.pageX = 0 - mw;
                    if (ypagePos + mh > wh) this.popupMenuBox[0].popupMenuData.event.pageY = 0 - mh;
                    this.$set(this.popupMenuBox, 0 , this.popupMenuBox[0]);
                }
            });
        }
    }
</script>

<style scoped>
    .popupMenuBox.free{
        position: fixed;
    }
    .popupMenuBox{
        user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        font-family: Helvetica Neue, helvetica, tahoma, arial, sans-serif;
        font-size: 14px;
        position: relative;
        z-index: 998;
    }
    .popup-menu {
        position: fixed;
        left: -100%;
        top: 0;
        z-index: 999;
        box-shadow: 0 2px 10px 0 rgb(0 0 0 / 20%);
        border: 1px solid rgba(0, 0, 0, 0.2);
        background: #fff;
        min-width: 180px;
        position: absolute;
    }
    .ps {
        height: auto;
        max-height: 55vh;
        max-width: 250px;
    }
    .ps > div{
        padding: 6px 0;
    }
    ul{
        margin: 0;
        padding: 0;
        list-style: none;
        width: 100%;
    }
    li{
        height: 30px;
        line-height: 30px;
        cursor: pointer;
        position: relative;
        display: flex;
        padding: 0 10px;
        box-sizing: border-box;
    }
    li:not(.seperator) {
        cursor: pointer;
    }
    .disabled {
        cursor: default !important;
        color: rgba(0, 0, 0, 0.3) !important;
        pointer-events: none;
    }
    .popup-menu ul{
        padding: 0;
        width: auto;
        position: relative;
    }
    .pm-object{
        position: absolute;
        height: 100%;
        width: 100%;
        pointer-events: none;
        top: 0;
        left: 0;
    }
    .popup-menu ul li{
        display: flex;
        width: 100%;
        overflow: hidden;
        align-items: center;
    }
    .popup-menu ul li.hovered,
    .popup-menu ul li:hover {
        background: rgba(93, 164, 241, 0.2);
    }
    .popup-menu ul li.hovered:active,
    .popup-menu ul li:active,
    .popup-menu ul li.selected {
        background-color: #5da4f1;
        color:#fff;
    }
    .text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .nodata {
        max-height: 55vh;
        height: 42px;
        display: flex;
        align-items: center;
        font-style: italic;
        text-align: center;
        color: rgba(0, 0, 0, 0.3);
        box-sizing: border-box;
    }
    .nodata > span {
        width: 0;
        min-width: 0;
        flex: 1;
    }
    .loading {
        max-height: 55vh;
        height: 100px;
        position: relative;
        box-sizing: border-box;
    }
    .loading-circle {
        display: inline-block;
        width: 24px;
        height: 24px;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%,-50%);
    }
        .loading-circle div {
            transform-origin: 12px 12px;
            animation: loading 1.2s linear infinite;
        }
            .loading-circle div:after {
                content: " ";
                display: block;
                position: absolute;
                top: 10px;
                left: 20px;
                width: 2px;
                height: 2px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.9);
            }
            .loading-circle div:nth-child(1) {
                transform: rotate(0deg);
                animation-delay: -0.8s;
            }
            .loading-circle div:nth-child(2) {
                transform: rotate(40deg);
                animation-delay: -0.7s;
            }
            .loading-circle div:nth-child(3) {
                transform: rotate(80deg);
                animation-delay: -0.6s;
            }
            .loading-circle div:nth-child(4) {
                transform: rotate(120deg);
                animation-delay: -0.5s;
            }
            .loading-circle div:nth-child(5) {
                transform: rotate(160deg);
                animation-delay: -0.4s;
            }
            .loading-circle div:nth-child(6) {
                transform: rotate(200deg);
                animation-delay: -0.3s;
            }
            .loading-circle div:nth-child(7) {
                transform: rotate(240deg);
                animation-delay: -0.2s;
            }
            .loading-circle div:nth-child(8) {
                transform: rotate(280deg);
                animation-delay: -0.1s;
            }
            .loading-circle div:nth-child(9) {
                transform: rotate(320deg);
                animation-delay: 0s;
            }
    .icon-Chevron_r {
        position: relative;
        pointer-events: none;
        display: inline-block;
        height: 4px;
        width: 8px;
        transform: rotate(-90deg);
        -webkit-transform: rotate(-90deg);
    }
    .icon-Chevron_r:before{
        display: none;
    }
    .icon-Chevron_r:after {
        content: '';
        border-top: 4px solid rgba(0,0,0,.75);
        border-right: 4px solid transparent;
        border-left: 4px solid transparent;
    }
    .popup-menu ul li.hovered:active  .icon-Chevron_r:after,
    .popup-menu ul li:active .icon-Chevron_r:after {
        border-top-color: #fff;
    }
    .icon{
        padding-right: 10px;
    }
    .ps :deep(.ps__rail-y) {
        width: 6px;
        opacity: 1;
    }
    .ps :deep(.ps__thumb-y) {
        right: 0;
    }
    .ps :deep(.ps__rail-y:hover > .ps__thumb-y),
    .ps :deep(.ps__rail-y:focus > .ps__thumb-y),
    .ps :deep(.ps__rail-y.ps--clicking .ps__thumb-y) {
        background-color: #aaa;
        width: 6px;
    }
    .head-color {
       width: 20px;
        height: 20px;
        display: inline-block;
        margin-right: 5px;
    }
    .fade-enter-active, .fade-leave-active {
        transition: transform .3s cubic-bezier(0.23, 1, 0.32, 1),
                    opacity .3s cubic-bezier(0.23, 1, 0.32, 1);
        transform-origin:center top;
        -webkit-transition: -webkit-transform .3s cubic-bezier(0.23, 1, 0.32, 1),
                    opacity .3s cubic-bezier(0.23, 1, 0.32, 1);
        -webkit-transform-origin: center top;
    }
    .fade-enter, .fade-leave-to{
        opacity: 0;
        -webkit-transform: scaleY(0);
        transform: scaleY(0);
    }
    .fade-enter-to, .fade-leave{
        opacity: 1;
        transform: scaleY(1);
        -webkit-transform: scaleY(1);
    }
</style>