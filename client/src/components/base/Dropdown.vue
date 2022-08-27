<template>
    <div class="dropdown-ui" ref="dropdown" @contextmenu="$event.stopPropagation();$event.preventDefault();">
        <div v-if="filterMode" class="dropdown-filterWrap">
            <input ref="filterInput" type="text" v-model="filterValue" :placeholder="filterPlaceholder" @focus="filterFocus" @keydown="filterKeyAction" />
            <span v-show="filterKey || labelText" @click="clearValue"></span>
        </div>        
        <label v-else @click="labelToggle">
            <span v-if="typeof labelText != 'undefined'"><span class="dropdown-textWrap" @mouseenter="enterLT($event, labelText)" @mouseleave="leaveLT">{{labelText}}</span></span>
            <i v-else class="placeholder">{{placeholder}}</i>
        </label>
        <transition name="pop">
            <div v-show="open" class="dropdown-container">
                <div class="dropdown-wrap">
                    <div v-if="loading" class="loading">
                        <div class="loading-circle">
                            <div v-for="(item, index) in Array(9).fill(0)" :key="'sp_'+(item+index)"></div>
                        </div>
                    </div>
                    <div v-else-if="shownListHasItem && groupShownList.some(p => !p.hidden)" class="dropdown-content-wrap">
                        <object type="text/html" class="dropdown-object" ref="contentWatcher" data="about:blank" @load="listenContentResize"></object>
                        <div class="dropdown-scrollbody-wrap" ref="dropdown-scrollbody-wrap" @wheel.stop.prevent="wheelSBW" @touchstart.stop="startMoveSBW" @scroll="updateSBPos">                        
                            <div class="dropdown-ul-wrap">
                                <object type="text/html" class="dropdown-object" ref="ulWatcher" data="about:blank" @load="listenUlResize"></object>
                                <ul class="dropdown-ul-root" ref="dropdown-ul-root">
                                    <li v-for="(gsl, gslIndex) in groupShownList" :key="'gsl_'+gsl.guid" v-show="!gsl.hidden">
                                        <div v-if="typeof groupBy != 'undefined'" class="dropdown-ul-groupTitle" @mousedown="groupToggle"><i></i><span>{{gsl.key}}</span></div>
                                        <ul class="dropdown-ul-group">
                                            <li v-for="(item, index) in gsl.list"
                                                :key="'it_'+index"
                                                v-show="!(hiddenKey != undefined && item[hiddenKey])"
                                                ref="li"
                                                :class="{anchored: realIndex(gslIndex, index) === itemAnchor , selected: !filterMode && !multiMode && typeof value != 'undefined' && (typeof valKey != 'undefined' ? value === item[valKey] : value === item)}"
                                                @mouseenter="setItemAnchor(realIndex(gslIndex, index))"
                                                @mouseleave="setItemAnchor()"
                                                @click="selectLi(item)">
                                                <span v-if="multiMode" class="dropdown-multiBox">
                                                    <input type="checkbox" :checked="checkedIndex(item)>-1" /><em></em>
                                                </span>
                                                <div class="dropdown-textDiv"><span :class="['dropdown-textWrap',{hasNextEle: itemRemoveClick}]" @mouseenter="enterLi($event, item)" @mouseleave="leaveLi">{{typeof nameKey != 'undefined' ? item[nameKey] : item}}</span></div>
                                                <span v-if="itemRemoveClick" class="dropdown-item-remove" :title="itemRemoveTiTle" @click.stop="itemRemoveClick(item)"></span>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div v-if="showScrollbar" class="dropdown-scrollbar-wrap" ref="dropdown-scrollbar-wrap" @mousedown="anchorScroll"><em ref="dropdown-scrollbar-button" @mousedown.stop="startDragScrollBar"></em></div>
                    </div>
                    <div v-else class="nodata">
                        <div v-if="nodataSet" class="nodataSet">
                            <ul><li @click="noDataClick" v-html="nodataText"></li></ul>
                        </div>
                        <div v-else>{{nodataText || '暂无数据'}}</div>
                    </div>               
                </div>
            </div>
        </transition>
        <div class="dropdown-tooltip-wrap">
            <transition-group name="fade">
                <template v-if="tooltipList">
                    <div v-for="item in tooltipList" :ref="item.id" :key="item.id" :class="['dropdown-tooltip']" :style="{left: (item.pageX | 0)+'px', top: (item.pageY | 0)+'px'}">{{item.text}}</div>
                </template>
            </transition-group>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from 'vue-property-decorator';

    @Component
    export default class Dropdown extends Vue {
        @Prop() protected datas!: any;
        @Prop() protected value!: any | any[];
        @Prop() protected valKey!: string;
        @Prop() protected nameKey!: string;
        @Prop() protected hiddenKey!: string;
        @Prop() protected defaultText!: string;
        @Prop() protected placeholder!: string;
        @Prop() protected beforeClick!: Function;
        @Prop() protected afterClick!: Function;
        @Prop() protected showTitle!: 'all' | 'ellipsis' | undefined;
        @Prop() protected multiMode?: boolean;
        @Prop() protected multiNameMode?: 'count' | 'string';
        @Prop() protected filterMode?: boolean;
        @Prop() protected openFlexible?: boolean;
        @Prop() protected groupBy?: string;
        @Prop() protected nodataSet?: any;
        @Prop() protected nodataText?: any;
        @Prop() protected nodataClick?: Function;
        @Prop() protected itemRemoveTiTle?: string;
        @Prop() protected itemRemoveClick?: Function;
        private open!: boolean;
        private list!: any[] | undefined;
        private tooltipList!: any[] | undefined;
        private tooltipIdCounter: number = 0;
        private loading!: boolean;
        private filterKey!: string | undefined;
        private itemAnchor!: number | undefined;
        private showScrollbar!: boolean;
        private mousedownEvent!: MouseEvent;
        private wheelRatio: number = 3;

        data() {
            return{
                open: this.open,
                list: this.list,
                loading: this.loading,
                tooltipList: this.tooltipList,
                filterKey: this.filterKey,
                itemAnchor: this.itemAnchor,
                showScrollbar: this.showScrollbar
            }
        }
        
        mounted() {
            document.addEventListener('mousedown', this.setMousedownEvent);
            document.addEventListener('mouseup', this.closeSelect);
            if (Array.isArray(this.datas)) {
                this.list = this.datas;
            }
            this.$watch('datas', () => {
                this.list = Array.isArray(this.datas) ? this.datas : undefined;
            });
            this.$watch('open', (open: boolean) => {
                if (open && this.shownListHasItem) this.updateScrollbar();
                if (!this.filterMode) return;
                if (!open) {
                    this.filterKey = undefined;
                } else this.filterKey = '';
            });
            this.$watch('filterKey', () => {
                if (this.open) this.setItemAnchor();
            });
        }

        beforeDestroy() {
            document.removeEventListener('mousedown', this.setMousedownEvent);
            document.removeEventListener('mouseup', this.closeSelect);
        }

        //keep the index of a anhored item in dropdown (used in filterMode).
        public setItemAnchor(index?: number) {
            this.itemAnchor = index;
        }

        //text shown in the filter input (used in filterMode).
        get filterValue() {
            return typeof this.filterKey != 'undefined' ? this.filterKey : this.labelText;
        }

        //set the filterkey when key words is entered in filter input (used in filterMode).
        set filterValue(value: string) {
            this.filterKey = value;
        }

        //placeholder shown in filter input (used in filterMode).
        get filterPlaceholder() {
            return typeof this.labelText != 'undefined' ? this.labelText : this.placeholder;
        }

        //show the filterList in filterMode and the original list in the others.
        get shownList() {
            return this.filterMode ? this.filterList : this.list;
        }

        //check if the shown list has any item. 
        get shownListHasItem() {
            let hasItem = this.shownList && this.shownList.length ? true : false;
            if (hasItem && this.open) this.$nextTick(() => {
                this.updateScrollbar();
            });
            return hasItem;
        }

        //add the key words in filter input to dropdown list or filter it (used in filterMode).
        get canAttachFlexible() {
            return this.openFlexible && !this.multiMode && !(typeof this.valKey != 'undefined' && this.valKey !== this.nameKey);
        }

        //filter the dropdown list by enterd key words in the filter input.
        get filterList() {
            let emptyList: any[] = [];
            if (typeof this.list != 'undefined') {
                if (this.filterKey) {
                    let isExist = false;
                    if (this.nameKey) {
                        this.list?.forEach((item: any) => {
                            let nameStr = typeof item[this.nameKey] == 'string' ? item[this.nameKey] : JSON.stringify(item[this.nameKey]);
                            if (nameStr.toUpperCase().indexOf((this.filterKey as string).toUpperCase()) > -1) {
                                emptyList.push(item);
                            }
                            if (nameStr == this.filterKey) isExist = true;
                        });
                        if (this.canAttachFlexible && !isExist) {
                            let opt: any = {};
                            opt[this.nameKey] = this.filterKey;
                            emptyList.unshift(opt);
                        }
                    } else {
                        this.list?.forEach((item: any) => {
                            let nameStr = typeof item == 'string' ? item : JSON.stringify(item);
                            if (nameStr.toUpperCase().indexOf((this.filterKey as string).toUpperCase()) > -1) {
                                emptyList.push(item);
                            }
                            if (nameStr == this.filterKey) isExist = true;
                        });
                        if (this.canAttachFlexible && !isExist) emptyList.unshift(this.filterKey);
                    }
                } else emptyList = this.list;
            } else if (this.canAttachFlexible && this.filterKey) {
                if (this.nameKey) {
                    let opt: any = {};
                    opt[this.nameKey] = this.filterKey;
                    emptyList.unshift(opt);
                } else emptyList.unshift(this.filterKey);
            }

            return emptyList;
        }

        //update text of the selected item.
        get labelText() {
            let text!: any;
            if (typeof this.value != 'undefined') {
                if (this.multiMode) {                   
                    if (this.multiNameMode == 'string') {
                        let checkedItems!: any[] | undefined;
                        if (typeof this.valKey != 'undefined') {
                            this.groupShownList?.forEach((item: any) => {
                                let list = item.list?.filter((p: any) => this.value.indexOf(p[this.valKey]) > -1);
                                if (Array.isArray(list) && list.length > 0) {
                                    if (typeof checkedItems == 'undefined') checkedItems = [];
                                    checkedItems = checkedItems.concat(list);
                                }
                            });
                        } else {
                            this.groupShownList?.forEach((item: any) => {
                                let list = item.list?.filter((p: any) => this.value.indexOf(p) > -1);
                                if (Array.isArray(list) && list.length > 0) {
                                    if (typeof checkedItems == 'undefined') checkedItems = [];
                                    checkedItems = checkedItems.concat(list);
                                }
                            });
                        }
                        if (checkedItems) text = (typeof this.nameKey != 'undefined' ? 
                                                checkedItems.map((p: any) => typeof p[this.nameKey] == 'object' ?  JSON.stringify(p[this.nameKey]) : p[this.nameKey]) : 
                                                checkedItems.map((p: any) => typeof p == 'object' ? JSON.stringify(p) : p)).join(', ');
                    } else {
                        if (this.value.length) text = `已选中 ${this.value.length} 项`;
                    }
                } else {
                    let selectedItem!: any;
                    if (typeof this.valKey != 'undefined') {
                        selectedItem = this.list ? this.list.find(p => p[this.valKey] === this.value) : undefined;
                    } else {
                        selectedItem = this.list ? this.list.find(p => p === this.value) : undefined;
                    }
                    if (selectedItem) {
                        text = typeof this.nameKey != 'undefined' ? selectedItem[this.nameKey] : selectedItem;
                        text = typeof text == 'object' ? JSON.stringify(text) : text;
                    } else if (this.filterMode && this.openFlexible) {
                        if (typeof this.valKey === typeof this.nameKey) {
                            text = typeof this.value == 'object' ? JSON.stringify(this.value) : this.value;
                        } else if (typeof this.valKey == 'undefined') {
                            if (typeof this.value == 'object') text = this.value[this.nameKey];
                        }
                    }
                }
            }
            return typeof text != 'undefined' ? text : this.defaultText;
        }

        //Show data by group in the dropdown list.
        get groupShownList() {
            let groups: any[] = [];
            if (typeof this.groupBy == 'undefined') {
                groups = [{ key: 'shownList', hidden: this.hiddenKey != undefined && this.shownList?.every((p: any) => p[this.hiddenKey]), list: this.shownList }];
            } else {
                let groupKeys: any[] = [];
                this.shownList?.forEach((item: any) => {
                    if (groupKeys.indexOf(item[this.groupBy as any]) == -1) {
                        groupKeys.push(item[this.groupBy as any]);
                        let guid!: string;
                        do {
                            guid = this.generateGuid();
                        } while (groups.some((p: any) => p.guid === guid));
                        groups.push({ guid: guid, key: item[this.groupBy as any], list: [] });
                    }
                    groups.find((p: any) => p.key === item[this.groupBy as any]).list.push(item);
                });
                if(this.hiddenKey != undefined) {
                    groups.forEach((gsl: any) => {
                        gsl.hidden = gsl.list.every((p: any) => p[this.hiddenKey]);
                    });
                }
            }
            return groups;
        }

        //Show the dropdown list box or hide it.
        public labelToggle() {
            this.open = !this.open;
            this.datasActionByType();
        }

        //trigger keydown actions of filter input: enter, up and down (used in filterMode).
        public filterKeyAction(event: any) {
            let doms = this.$refs.li as HTMLElement[],
                sbWrap = this.$refs['dropdown-scrollbody-wrap'] as HTMLElement;
            if (event.keyCode == 13) {
                if (doms && doms.length && typeof this.itemAnchor != 'undefined') {
                    if (!this.multiMode) event.target.blur();
                    doms[this.itemAnchor].click();
                } else {
                    event.target.blur();
                    this.open = false;
                }
            } else if (event.keyCode == 38) {               
                this.setItemAnchor(typeof this.itemAnchor != 'undefined' && this.itemAnchor > 0 ? --this.itemAnchor : undefined);
                if (typeof this.itemAnchor != 'undefined' && doms && sbWrap) {
                    let dugDom = (doms[this.itemAnchor] as any).parentNode.parentNode.getElementsByClassName('dropdown-ul-groupTitle')[0];
                    if (dugDom?.hasAttribute('dropdown-group-hidden')) dugDom.removeAttribute('dropdown-group-hidden');
                    if (doms[this.itemAnchor].offsetTop < sbWrap.scrollTop) {
                        if (sbWrap) sbWrap.scrollTop = doms[this.itemAnchor].offsetTop;
                    }                    
                }
            } else if (event.keyCode == 40) {
                this.setItemAnchor(doms ? typeof this.itemAnchor != 'undefined' ? this.itemAnchor < doms.length - 1 ? ++this.itemAnchor : doms.length - 1 : 0 : undefined);
                if (typeof this.itemAnchor != 'undefined' && doms && sbWrap) {
                    let sbWrapHeight = sbWrap.getBoundingClientRect().height,                        
                        dugDom = (doms[this.itemAnchor] as any).parentNode.parentNode.getElementsByClassName('dropdown-ul-groupTitle')[0];
                    if (dugDom?.hasAttribute('dropdown-group-hidden')) dugDom.removeAttribute('dropdown-group-hidden');
                    let domHeight = doms[this.itemAnchor].getBoundingClientRect().height;
                    if (doms[this.itemAnchor].offsetTop > sbWrap.scrollTop + sbWrapHeight - domHeight) {
                        if (sbWrap) sbWrap.scrollTop = doms[this.itemAnchor].offsetTop - sbWrapHeight + domHeight;
                    }
                }
            }
        }

        //Different performance by datas type.
        public datasActionByType() {
            if (this.open && typeof this.datas == 'function') {
                this.loading = true;
                this.datas((list: any[]) => {
                    this.list = list;
                    this.loading = false;
                });
            } else if (this.loading) this.loading = false;
        }

        //set mousedownEvent
        public setMousedownEvent(e: MouseEvent) {
            this.mousedownEvent = e;
        }

        //Hide the selectionbox after clicking the entire document except the component itself.
        public closeSelect(e: MouseEvent) {
            if (!this.mousedownEvent || (this.$refs.dropdown as any).contains(this.mousedownEvent.target) || (this.$refs.dropdown as any).contains(e.target)) return;
            this.open = false;
        }

        //Select an item, and update the value of the component.
        public selectLi(item: any) {
            let beforeClick = typeof item.beforeClick == 'function' ? item.beforeClick : this.beforeClick;
            beforeClick && beforeClick(item);

            if (this.multiMode) {
                this.clickMultiLi(item);
            } else this.selectSingleLi(item);

            let afterClick = typeof item.afterClick == 'function' ? item.afterClick : this.afterClick;
            afterClick && afterClick(item);
        }

        //Select an item, and update the value of the component.
        public selectSingleLi(item: any) {           
            if (typeof this.valKey != 'undefined') {
                this.$emit('input', item[this.valKey]);
            } else this.$emit('input', item);
            this.open = false;            
        }

        //Click an item, and turn it to checked or unchecked (used in multiMode).
        public clickMultiLi(item: any) {
            let checkedIndex: number = this.checkedIndex(item);           
            if (checkedIndex > -1) {
                this.value.splice(checkedIndex, 1);
                if (this.value.length === 0) {
                    this.$emit('input', undefined);
                }
            } else {
                if (typeof this.value == 'undefined') {
                    let value: any[] = [];
                    this.$emit('input', value);
                }
                this.$nextTick(() => {
                    if (typeof this.valKey != 'undefined') {
                        this.value.push(item[this.valKey]);
                        this.value.sort((a: any, b: any) => (this.list as any[]).findIndex((p: any) => p[this.valKey] === a) - (this.list as any).findIndex((p: any) => p[this.valKey] === b));
                    } else {
                        this.value.push(item);
                        this.value.sort((a: any, b: any) => (this.list as any[]).indexOf(a) - (this.list as any).indexOf(b));
                    }
                });
            }
        }

        //Get the index of the current item in value list (used in multiMode).
        public checkedIndex(item: any) {
            return typeof this.value != 'undefined' ? typeof this.valKey != 'undefined' ? this.value.indexOf(item[this.valKey]) : this.value.indexOf(item) : -1;
        }

        //Mouseenter text label
        public enterLT(event: MouseEvent, labelText: string) {
            if (this.showTitle == 'all' ||
                (this.showTitle == 'ellipsis' && (event.target as HTMLElement).getBoundingClientRect().width == ((event.target as HTMLElement).parentNode as HTMLElement).getBoundingClientRect().width))
                this.addTooltip(event, labelText);
        }

        //Mouseleave text label
        public leaveLT(event: MouseEvent) {
            if (this.showTitle == 'all' ||
                (this.showTitle == 'ellipsis' && (event.target as HTMLElement).getBoundingClientRect().width == ((event.target as HTMLElement).parentNode as HTMLElement).getBoundingClientRect().width))
                this.removeTooltip(event);
        }

        //Mouse enter li
        public enterLi(event: MouseEvent, item: any) {            
            if (this.showTitle == 'all' ||
                (this.showTitle == 'ellipsis' && (event.target as HTMLElement).getBoundingClientRect().width == ((event.target as HTMLElement).parentNode as HTMLElement).getBoundingClientRect().width))
                this.addTooltip(event, typeof this.nameKey != 'undefined' ? item[this.nameKey] : item);
        }

        //Mouse leave li
        public leaveLi(event: MouseEvent) {
            if (this.showTitle == 'all' ||
                (this.showTitle == 'ellipsis' && (event.target as HTMLElement).getBoundingClientRect().width == ((event.target as HTMLElement).parentNode as HTMLElement).getBoundingClientRect().width))
                this.removeTooltip(event);
        }

        //add a tooltip element to tooltipList when an item is mouseentered.
        public addTooltip(event: MouseEvent, text: string) {
            if (typeof this.tooltipList == 'undefined') this.tooltipList = [];
            let tooltip = { id: `tooltip_${this.tooltipIdCounter++}`, text: text};
            this.tooltipList.push(tooltip);
            this.$nextTick(() => {
                this.setPosition(tooltip, event);
            });
            (event.target as HTMLElement).onmousemove = (ev: MouseEvent) => {
                this.setPosition(tooltip, ev);
            }
        }

        //remove a tooltip element to tooltipList when an item is mouseleft.
        public removeTooltip(event: MouseEvent) {
            if (this.tooltipList) {
                let tooltip = this.tooltipList[this.tooltipList.length - 1];
                this.tooltipList.splice(this.tooltipList.indexOf(tooltip), 1);
                (event.target as HTMLElement).onmousemove = null;
            }
        }

        //set position of tooltip.
        public setPosition(item: any, event: MouseEvent) {
            let dom = (this.$refs[item.id] as HTMLElement[])[0] as HTMLElement;
            if (dom) {
                let bodyRect = document.body.getBoundingClientRect(),
                    xpos = this.getMouseX(event),
                    ypos = this.getMouseY(event),
                    ww = bodyRect.width + (window.pageXOffset || (document.documentElement as HTMLElement).scrollLeft || document.body.scrollLeft),
                    mw = dom.getBoundingClientRect().width,
                    wh = bodyRect.height + (window.pageYOffset || (document.documentElement as HTMLElement).scrollTop || document.body.scrollTop),
                    mh = dom.getBoundingClientRect().height,
                    x = xpos + mw + 10 > ww ? xpos - mw - 10 : xpos + 10,
                    y = ypos + mh + 10 > wh ? ypos - mh : ypos + 10;

                Vue.set(item, 'pageX', x);
                Vue.set(item, 'pageY', y);
            }
        }

        //get the xAxis position of mouse.
        public getMouseX(e: MouseEvent): number {
            if (e.pageX != undefined) {
                return e.pageX;
            } else if (e.clientX != undefined) {
                let scrollLeft = document.documentElement ? document.documentElement.scrollLeft : document.body.scrollLeft;
                return e.clientX + scrollLeft;
            }
            return 0;
        }

        //get the yAxis position of mouse.
        public getMouseY(e: MouseEvent): number {
            if (e.pageY != undefined) {
                return e.pageY;
            } else if (e.clientY != undefined) {
                let scrollTop = document.documentElement ? document.documentElement.scrollTop : document.body.scrollTop;
                return e.clientY + scrollTop;
            }
            return 0;
        }

        //get the yAxis position of touch in mobile device.
        public getTouchY(e: TouchEvent): number {
            if (e.touches[0].pageY) {
                return e.touches[0].pageY;
            } else if (e.touches[0].clientY) {
                let scrollTop = document.documentElement ? document.documentElement.scrollTop : document.body.scrollTop;
                return e.touches[0].clientY + scrollTop;
            }
            return 0;
        }

        //get the yAxis position of mouse or touch.
        public getY(e: MouseEvent | TouchEvent) {
            if (e.type.indexOf('mouse') > -1) {
                return this.getMouseY(e as MouseEvent);
            } else if (e.type.indexOf('touch') > -1) {
                return this.getTouchY(e as TouchEvent);
            } else return 0;
        }

        //open the dropdown list when the filter is focused (used in filterMode).
        public filterFocus() {           
            this.open = true;
            this.datasActionByType();
        }

        //clear the value (used in filterMode).
        public clearValue() {
            this.$emit('input', undefined);
            this.open = false;
        }

        //triggered when the size of contentWatcher (or dropdown-content-wrap) is changed.
        public listenContentResize() {
            let contentWatcher = this.$refs.contentWatcher as HTMLObjectElement;
            if (contentWatcher && contentWatcher.contentWindow)
                contentWatcher.contentWindow.addEventListener('resize', this.updateScrollbar);
        }

        //triggered when the size of ulWatcher (or dropdown-ul-wrap) is changed.
        public listenUlResize() {
            let ulWatcher = this.$refs.ulWatcher as HTMLObjectElement;
            if (ulWatcher && ulWatcher.contentWindow)
                ulWatcher.contentWindow.addEventListener('resize', this.updateScrollbar);
        }

        //update scrollbar.
        public updateScrollbar() {
            let sbWrap = this.$refs['dropdown-scrollbody-wrap'] as HTMLElement;
            if (sbWrap && sbWrap.clientHeight < sbWrap.scrollHeight) {
                this.showScrollbar = true;
                this.$nextTick(() => {
                    let scrollButton = this.$refs['dropdown-scrollbar-button'] as HTMLElement,
                        barWrap = this.$refs['dropdown-scrollbar-wrap'] as HTMLElement;
                    scrollButton.style.height = barWrap.clientHeight * sbWrap.clientHeight / sbWrap.scrollHeight + 'px';
                    scrollButton.style.top = Math.round((barWrap.clientHeight - scrollButton.offsetHeight) * sbWrap.scrollTop / (sbWrap.scrollHeight - sbWrap.clientHeight)) + 'px';
                });
            } else this.showScrollbar = false;
        }

        //update scrollButton Position.
        public updateSBPos() {
            if (!this.showScrollbar) return;
            let sbWrap = this.$refs['dropdown-scrollbody-wrap'] as HTMLElement,
                scrollButton = this.$refs['dropdown-scrollbar-button'] as HTMLElement,
                barWrap = this.$refs['dropdown-scrollbar-wrap'] as HTMLElement;           
            scrollButton.style.top = Math.round((barWrap.clientHeight - scrollButton.offsetHeight) * sbWrap.scrollTop / (sbWrap.scrollHeight - sbWrap.clientHeight)) + 'px';
        }

        //update scrollTop of dropdown-scrollbody-wrap
        public updateSBWTop(distance: number) {
            let sbWrap = this.$refs['dropdown-scrollbody-wrap'] as HTMLElement,
                barWrap = this.$refs['dropdown-scrollbar-wrap'] as HTMLElement,
                scrollButton = this.$refs['dropdown-scrollbar-button'] as HTMLElement;
            if (distance > 0 && scrollButton.offsetTop + distance + scrollButton.offsetHeight >= barWrap.clientHeight) {
                sbWrap.scrollTop = sbWrap.scrollHeight - sbWrap.clientHeight;
            } else if (distance < 0 && scrollButton.offsetTop + distance <= 0) {
                sbWrap.scrollTop = 0;
            } else {
                sbWrap.scrollTop = sbWrap.scrollTop + Math.round((sbWrap.scrollHeight - sbWrap.clientHeight) * distance / (barWrap.clientHeight - scrollButton.offsetHeight));
            }
        }

        //update scrollTop of dropdown-scrollbody-wrap by mousewheel.
        public wheelSBW(e: any) {
            if (!this.showScrollbar) return;
            this.updateSBWTop((e.deltaY > 0 ? 1 : -1)*this.wheelRatio);
        }

        //update the position of scrollButton by clicking dropdown-scrollbar-wrap.
        public anchorScroll(e: MouseEvent) {
            let barWrap = this.$refs['dropdown-scrollbar-wrap'] as HTMLElement,
                scrollButton = this.$refs['dropdown-scrollbar-button'] as HTMLElement;
            let distance = (e.offsetY || this.getY(e) - barWrap.getBoundingClientRect().top) - (scrollButton.offsetTop + scrollButton.offsetHeight / 2);
            this.updateSBWTop(distance);
        }

        //triggered when the dropdown-scrollbar-button mousedown.
        public startDragScrollBar(e: MouseEvent) {
            let oy: number = this.getY(e);
            document.onmousemove = this.moveScrollbar(oy);
            document.addEventListener('mouseup', this.endDragScrollBar);
        }

        //triggered when the document mouseup (removing related events of dropdown-scrollbar-button).
        public endDragScrollBar() {
            document.onmousemove = null;
            document.removeEventListener('mouseup', this.endDragScrollBar);
        }

        //triggered when the document mousemove in order to drag the dropdown-scrollbar-button.
        public moveScrollbar(oy: number) {           
            return (e: MouseEvent) => {
                e.preventDefault();
                let cy: number = this.getY(e), distance = cy - oy;
                this.updateSBWTop(distance);
                oy = cy;
            };
        }       

        //triggered once the dropdown-scrollbody-wrap starts to be touched.
        public startMoveSBW(e: TouchEvent) {
            let oy: number = this.getY(e), options = { capture: true, passive: false },
                moveSBW = this.showScrollbar ? (e: TouchEvent) => {
                    e.stopPropagation();
                    e.preventDefault();
                    let cy: number = this.getY(e), distance = cy - oy;
                    this.updateSBWTop(-1 * distance);
                    oy = cy;
                } : (e: TouchEvent) => {
                    e.stopPropagation();
                    e.preventDefault();
                };
            document.addEventListener('touchmove', moveSBW, options);
            document.addEventListener('touchend', endMoveSBW, options);

            //triggered once the document ends to be touched.
            function endMoveSBW(e: TouchEvent) {
                e.stopPropagation();
                document.removeEventListener('touchmove', moveSBW, options);
                document.removeEventListener('touchend', endMoveSBW, options);
            }

        }        

        //Show the current group or hide it.
        public groupToggle(e: MouseEvent) {
            let dom = e.currentTarget as HTMLElement;
            if (dom.hasAttribute('dropdown-group-hidden')) {
                dom.removeAttribute('dropdown-group-hidden');
            } else dom.setAttribute('dropdown-group-hidden', '');
        }

        //Get the real index of the current item in whole list.
        public realIndex(gslIndex: number, index: number) {
            let count = 0;
            for (let i = 0; i < gslIndex; i++) {
                count += this.groupShownList[i].list.length;
            }
            return count + index;
        }

        //Generate a unique guid for every item in dropdown list.
        public generateGuid(): string {
            return ('' + [1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, ch => {
                let c = Number(ch);
                return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            });
        }

        //Excute When nodataClick Function is set
        public noDataClick() {
            this.nodataClick && this.nodataClick();
            this.open = false;
        }
    }
</script>
<style scoped>
    * {
        touch-action: none;
        font-family: Helvetica Neue, helvetica, tahoma, arial, sans-serif; 
    }
    .dropdown-ui {
        font-size: 14px;
        height: 30px;
        color: rgba(0, 0, 0, 0.75);        
        user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
    }

        .dropdown-ui > label {
            background: rgba(0, 0, 0, 0.05);
            height: 100%;
            border: 0;
            padding: 0 30px 0 10px;
            outline: none;
            display: block;
            margin: 0;
            position: relative;
            cursor: pointer;
            transition: all .3s ease-in-out;
            -webkit-transition: all .3s ease-in-out;
            line-height: 30px;
        }

        .dropdown-ui:hover > label,
        .dropdown-filterWrap > input:focus {
            background: rgba(0, 0, 0, 0.09);
        }

        .dropdown-ui > label::after,
        .dropdown-filterWrap:after,
        .dropdown-ul-groupTitle > i:after {
            content: '';
            border-top: 4px solid rgba(0,0,0,.75);
            border-right: 4px solid transparent;
            border-left: 4px solid transparent;
            position: absolute;
            right: 12px;
            top: 12px;
        }

        .dropdown-ui > label > * {
            display: block;            
        }

        .dropdown-ui > label > .placeholder,
        .dropdown-ui .dropdown-textWrap {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .dropdown-ui .dropdown-textWrap {
            display: inline-block;
            vertical-align: top;
            max-width: 100%;
        }

        .dropdown-ui .dropdown-item-remove {
            display: inline-block;
            vertical-align: top;
            width: 30px;
            text-align: center;
            color: #aaa;
            transition: color .3s;
            -webkit-transition: color .3s;
        }

        .dropdown-ui .dropdown-item-remove:hover {
            color: #2c3e50;
        }

        .dropdown-ui .dropdown-item-remove::before {
            content: "×";
        }

        .placeholder {
            color: rgba(0,0,0,0.50);
        }

        .dropdown-ui > .dropdown-container {
            position: relative;
            z-index: 999;
        }

        .dropdown-ui .dropdown-wrap{
            box-shadow: 0 2px 10px 0 rgba(0,0,0,.2);
            border: 1px solid rgba(0, 0, 0, 0.2);
            background: #fff;
        }

        .dropdown-ui ul.dropdown-ul-root, .loading, .nodata {
            padding: 5px 0;
        }

        .dropdown-ui ul{
            margin: 0;
            padding: 0;
            list-style: none;            
            width: 100%;
        }

        .dropdown-scrollbody-wrap{
            max-height: 50vh;
            overflow-y: hidden;
        }

    .dropdown-content-wrap,
    .dropdown-ul-wrap {
        position: relative;
    }

        .dropdown-object{
            position: absolute;
            height: 100%;
            width: 100%;
            pointer-events: none;
            top: 0;
            left: 0;
        }

        .dropdown-scrollbar-wrap{
            position: absolute;            
            background: rgba(0, 0, 0, .05);
            height: 100%;
            width: 10px;
            top: 0;            
            right: 0;
            overflow: hidden;
        }

        .dropdown-scrollbar-wrap em{
            display: block;
            position: absolute;
            width: 80%;
            left: 10%;
            min-height: 20px;
            background: #ccc;
            border-radius: 10px;
            cursor: pointer;
            transition: background .3s;
            -webkit-transition: background .3s;
        }

        .dropdown-scrollbar-wrap em:hover{
            background: #bbb;
        }

        .loading {
            height: 100px;
            position: relative;
        }

        .nodata{
            text-align: center;
            font-size: 13px;
            font-style: italic;
            color: #bbb;
        }

        .nodataSet ul li{
            height: 30px;
            line-height: 30px;
            white-space: nowrap;
            overflow: hidden;
        }

        .dropdown-ul-groupTitle {
            position: relative;
            font-weight:700;
            padding: 5px 0 0 25px;
            min-height: 24px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
        }

        .dropdown-ul-groupTitle > i {
            position: absolute;
            left:10px;
            top: 13px;
            display: inline-block;
            height: 4px;
            width: 8px;
        }

        .dropdown-ul-groupTitle[dropdown-group-hidden] > i {
            transform: rotate(-90deg);
            -webkit-transform: rotate(-90deg);
        }

        .dropdown-ui .dropdown-ul-groupTitle + ul.dropdown-ul-group > li .dropdown-textWrap,
        .dropdown-ui .dropdown-ul-groupTitle + ul.dropdown-ul-group > li .dropdown-multiBox{
            padding-left: 25px;
        }

        .dropdown-ul-groupTitle[dropdown-group-hidden] + ul.dropdown-ul-group {
            display: none;
        }

        .dropdown-ul-groupTitle > i:after {
            right: initial;
            top: initial;
        }

            .dropdown-ui ul.dropdown-ul-group > li {                
                height: 30px;
                line-height: 30px;
                cursor: pointer;
                position: relative;
                display: flex;
            }

                .dropdown-ui ul.dropdown-ul-group > li.selected {
                    background: #5da4f1;
                    color: #fff;
                }

                .dropdown-ui ul.dropdown-ul-group > li.anchored:not(.selected) {
                    background: rgba(93,164,241,.2);
                }

                .dropdown-ui ul.dropdown-ul-group > li .dropdown-multiBox {
                    padding: 0 0 0 10px;
                }

                .dropdown-ui ul.dropdown-ul-group > li .dropdown-multiBox + .dropdown-textDiv .dropdown-textWrap{
                    padding-left: 0;
                }
                
                .dropdown-ui ul.dropdown-ul-group > li .dropdown-multiBox input[type=checkbox]{
                    display: none;
                }

                .dropdown-ui ul.dropdown-ul-group > li .dropdown-multiBox input[type=checkbox] + em {
                    position: relative;
                }

                .dropdown-ui ul.dropdown-ul-group > li .dropdown-multiBox input[type=checkbox] + em:before {
                    content: '';
                    display: inline-block;
                    vertical-align: middle;
                    -webkit-transition: all 0.5s;
                    transition: all 0.5s;
                    width: 16px;
                    height: 16px;
                    outline: none;
                    background-color: rgba(0, 0, 0, 0.2);
                    margin-right: 5px;
                    margin-top: -2px;
                }

                .dropdown-ui ul.dropdown-ul-group > li .dropdown-multiBox input[type=checkbox]:checked + em:before {
                    background-color: #5da4f1;
                }

                .dropdown-ui ul.dropdown-ul-group > li .dropdown-multiBox input[type=checkbox]:checked + em:after {
                    content: '';
                    display: block;
                    width: 5px;
                    height: 9px;
                    border: solid #ffffff;
                    border-width: 0 2px 2px 0;
                    -webkit-transform: rotate(45deg);
                    transform: rotate(45deg);
                    position: absolute;
                    top: 4px;
                    left: 5px;
                    box-sizing: border-box;
                }

                .dropdown-ui ul.dropdown-ul-group > li .dropdown-textDiv {
                    flex: 1;
                    width: 0;
                    min-width: 0;
                }

                .dropdown-ui ul.dropdown-ul-group > li .dropdown-textWrap {
                    padding: 0 10px;
                    box-sizing: border-box;
                }

                .dropdown-ui ul.dropdown-ul-group > li .dropdown-textWrap.hasNextEle {
                    padding: 0 0 0 10px;
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

    @keyframes loading {
        0% {
            opacity: 1;
        }

        100% {
            opacity: 0;
        }
    }

    /*dropdown-tooltip*/
    .dropdown-tooltip {
        position: fixed;
        padding: 6px 10px;
        background: rgba(50,50,50,.6);
        border-radius: 2px;
        box-shadow: 0 2px 6px 0 rgba(0,0,0,0.50);
        color: #fff;
        max-width: 300px;
        word-wrap: break-word;
        pointer-events: none;
        z-index: 9999;
        white-space: pre-wrap;
        line-height: 18px;
    }

    .fade-enter-active,
    .fade-leave-active {
        transition: opacity .5s ease;
    }

    .fade-enter,
    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }

    .pop-enter-active, .pop-leave-active {
        transition: transform .3s cubic-bezier(0.23, 1, 0.32, 1),
                    opacity .3s cubic-bezier(0.23, 1, 0.32, 1);
        transform-origin:center top;
        -webkit-transition: -webkit-transform .3s cubic-bezier(0.23, 1, 0.32, 1),
                    opacity .3s cubic-bezier(0.23, 1, 0.32, 1);
        -webkit-transform-origin: center top;
    }

    .pop-leave-active {
        transition-delay: .1s;
        -webkit-transition-delay: .1s;
    }

    .pop-enter, .pop-leave-to{
        opacity: 0;
        -webkit-transform: scaleY(0);
        transform: scaleY(0);
    }

    .pop-enter-to, .pop-leave{
        opacity: 1;
        transform: scaleY(1);
        -webkit-transform: scaleY(1);
    }

    /*filter-input*/
    .dropdown-filterWrap {
        position: relative;
        height: 100%;
        width: 100%;
    }

    .dropdown-filterWrap > input {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background-color: rgba(0, 0, 0, 0.05);
        padding: 0 46px 0 10px;
        outline: none;
        line-height: 24px;
        border: none;
        box-sizing: border-box;
        font-size: 14px;
        transition: all .3s ease-in-out;
        -webkit-transition: all .3s ease-in-out;
    }

    ::-ms-clear, ::-ms-reveal {
        display: none;
    }

    .dropdown-filterWrap > span {
        position: absolute;
        top: 0;
        right: 26px;
        height: 100%;
        width: 16px;
        display: inline-flex;
        align-items: center;
        overflow: hidden;       
        cursor: pointer;
    }

        .dropdown-filterWrap > span:before {
            content: "×";
            color: #fff;
            text-align: center;
            line-height: 14px;
            display: block;
            height: 14px;
            width: 14px;           
            position: absolute;
            background: rgba(60,60,60,.5);
            border-radius: 50%;
        }

    :deep(a[highlight]) {
        color: blue;
        text-decoration: underline;
    }

    .dropdown-filterWrap:after {
        pointer-events: none;
    }

    ::-webkit-input-placeholder {
        font-style: italic;
        color: rgba(0, 0, 0, .5);
    }

    :-moz-placeholder {
        font-style: italic;
        color: rgba(0, 0, 0, .5);
    }

    ::-moz-placeholder {
        font-style: italic;
        color: rgba(0, 0, 0, .5);
    }

    :-ms-input-placeholder {
        font-style: italic;
        color: rgba(0, 0, 0, .5);
    }
</style>
