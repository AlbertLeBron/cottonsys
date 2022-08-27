<template>
    <div class="book">
        <object type="text/html" class="resizingObject" ref="resizingObject" data="about:blank" @load="resizeScrollbar($refs.resizingObject, $refs.scrollbar);" />
        <perfect-scrollbar ref="scrollbar">
            <div class="bookContent">
                <ul class="mainBtnWrap noTextSelect">
                    <li @click="inGoods">入货</li>
                    <li @click="outGoods">出货</li>
                    <li @click="checkStock">库存</li>
                </ul>
                <div class="conWrap">
                    <div class="mainContent">
                        <div class="topic">
                            <h5><i class="purefont pure-list"></i><span>出入货记录查询</span></h5>
                        </div>
                        <div class="filter">
                            <div>
                                <dropdown ref="goodsDropdown" v-model="goods" :showTitle="'ellipsis'" :valKey="'id'" :nameKey="'name'" :hiddenKey="'hidden'" :datas="goodsTypes" :filterMode="true" :placeholder="'所有品种'" />
                            </div>
                            <div @click="openPopupMenu($event, 'dealTypesPopupMenu')">
                                <a class="btn">{{filtersData.dealType.title}}</a>
                                <popupMenu ref="dealTypesPopupMenu" class="popupMenu" useMode="pinned" :selectedItem="filtersData.dealType" />
                            </div>
                            <div>
                                <dropdown ref="goodsDropdown" v-model="party" :showTitle="'ellipsis'" :valKey="'id'" :nameKey="'name'" :hiddenKey="'hidden'" :datas="parties" :filterMode="true" :placeholder="'所有交易方'" />
                            </div>
                            <div>
                                <datePicker v-model="datePick" :disabled-date="date => date >= new Date()" :placeholder="'所有交易日期'" range />
                            </div>
                            <div>
                                <div class="inputWrap" :isInValid="searchInValid">
                                    <input type="text" v-model="searchField" placeholder="搜索关键词..." @input="debounceSearch" />
                                    <span v-show="!searchInValid" class="purefont pure-search"></span>
                                    <span v-show="searchInValid" class="tip">
                                        <i class="purefont pure-attention"> </i>
                                        <em><span u="存在不规范的文字或符号"></span></em>
                                    </span>
                                </div>
                            </div>
                            <!-- <div>
                                <a class="btn pure" @click="refreshList"><i class="purefont pure-refresh"></i><span>刷新</span></a>
                            </div> -->
                        </div>
                        <div class="tableWrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>
                                            <label class="checkbox">
                                                <input type="checkbox" v-model="cpAllSelected" />
                                                <span></span>
                                            </label>
                                        </th>
                                        <th class="PCDevice" v-for="(col, index) in columns" :key="'tb1_'+index" v-html="col.field"></th>
                                        <th class="MobileDevice">记录详情</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template v-if="Array.isArray(rows) && rows.length && !listLoading">
                                        <tr v-for="(row, index) in rows" :key="'tr_'+index" :class="{ selected: cpSelections.indexOf(row) > -1 }">
                                            <td>
                                                <label class="checkbox">
                                                    <input type="checkbox" v-model="cpSelections" :value="row" />
                                                    <span></span>
                                                </label>
                                            </td>
                                            <td class="PCDevice" v-for="(item, key, index) in row.fields" :key="'tr_'+index+'_'+key" v-html="item"></td>
                                            <td class="MobileDevice">
                                                <div v-for="(item, key, index) in row.fields" :key="'mobile_tr_'+index+'_'+key">
                                                    <dl><dt v-html="columns[index].field"></dt><dd v-html="item"></dd></dl>
                                                </div>
                                            </td>
                                        </tr>
                                    </template>
                                    <tr v-else>
                                        <td class="dataStateTip PCDevice" :colspan="columns.length + 1">
                                            <div class="noTextSelect" v-show="listLoading">
                                                数据加载中<span class="dotload purefont pure-ellipsis"></span>
                                            </div>
                                            <div class="noTextSelect" v-show="!listLoading">
                                                暂无数据
                                            </div>
                                        </td>
                                        <td class="dataStateTip MobileDevice" :colspan="3">
                                            <div class="noTextSelect" v-show="listLoading">
                                                数据加载中<span class="dotload purefont pure-ellipsis"></span>
                                            </div>
                                            <div class="noTextSelect" v-show="!listLoading">
                                                暂无数据
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="excutionWrap">
                    <div class="excution">
                        <div>
                            <div v-if="Array.isArray(rows) && rows.length" class="dataOperators">
                                <a :class="['btn', 'commonBtn', 'default', {active: allSelections}]" title="选中全部页数的所有记录" @click="debounceSelectAll">全选记录</a>
                                <a class="btn commonBtn primary" :disabled="editBtnDisabled" :title="editBtnTitle" @click="editData">修改</a>
                                <a class="btn commonBtn danger" :disabled="deleteBtnDisabled" :title="deleteBtnTitle" @click="removeDatas">删除</a>
                                <span>*合计已选 {{realSelections.length}} 笔交易，入货 <big>{{selectedData.inQuantity}}</big> 吨、<big>{{selectedData.inTotal}}</big> 万元，出货 <big>{{selectedData.outQuantity}}</big> 吨、<big>{{selectedData.outTotal}}</big> 万元</span>
                            </div>
                        </div>
                        <div>
                            <div class="pages" ref="pages">
                                <span class="operatorIconWrap iconBtn" title="前一页" @click="movePage(-1)">
                                    <i class="purefont pure-o_left"></i>
                                    <i class="purefont pure-left"></i>
                                </span>
                                <span class="pageInfo"><input type="text" :value="pageNumber" @input="keyInPageChange" /> / 页</span>
                                <span class="operatorIconWrap iconBtn" title="后一页" @click="movePage(1)">
                                    <i class="purefont pure-o_right"></i>
                                    <i class="purefont pure-right"></i>
                                </span>
                                <span class="pageCount"> 共 {{pageCount}} 页</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </perfect-scrollbar>
        <div></div>
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from 'vue-property-decorator';
    import { debounce, isObj, RegExpTest, MathAdd, MathMul, dateFormat } from '@/utils/Tools';
    import { reloadGoods, reloadParty } from '@/utils/Constant';
    import { EventBus } from '@/EventBus';
    import datePicker from 'vue2-datepicker';
    import 'vue2-datepicker/index.css';
    import 'vue2-datepicker/locale/zh-cn';
    import api from '@/api';

    @Component({
        components: {
            datePicker
        }
    })
    export default class Book extends Vue {
        private columns!: any[];
        private rows!: any[];
        private pageNumber!: number;
        private dataCount!: number;
        private pageSize!: number;
        private ChangePageByBtnDisabled!: boolean;
        private currentPageSelections!: any[];
        private currentPageAllSelected!: boolean;
        private allSelections!: any[] | undefined;
        private listLoading!: boolean;
        private filtersData!: any;
        private popupMenuListData!: any;
        private searchField!: any;
        private pickedDate!: any;
        private debounceSearch: Function = debounce(this.inputSearchField, 1000, this);
        private debouncePageChange: Function = debounce(this.setPageNumber, 1000, this);
        private debounceSelectAll: Function = debounce(this.selectAll, 500, this);

        data() {
            this.pageSize = this.$store.state.pageSize;
            this.filtersData = {
                goods: undefined,
                dealType: {
                    title: '所有类型'
                },
                party: undefined
            };
            
            this.popupMenuListData = {
                dealTypesPopupMenu: {
                    popupMenuData: {
                        items: [Object.assign(this.filtersData.dealType, {
                            selectedCallback: (selectedItem: any) => {
                                this.filtersData.dealType = selectedItem;
                                this.resetList();
                            }
                        }),{
                            title: '入货',
                            guid: 0,
                            selectedCallback: (selectedItem: any) => {
                                this.filtersData.dealType = selectedItem;
                                this.resetList();
                            }
                        },{
                            title: '出货',
                            guid: 1,
                            selectedCallback: (selectedItem: any) => {
                                this.filtersData.dealType = selectedItem;
                                this.resetList();
                            }
                        }]
                    }
                }
            };

            this.currentPageSelections = [];
            this.columns = [{field: '品种'},
                            {field: '类型'},
                            {field: '单价 <small>(万元/吨)</small>'},
                            {field: '数量 <small>(吨)</small>'},
                            {field: '总价 <small>(万元)</small>'},   
                            {field: '交易方'},
                            {field: '交易日期'},
                            {field: '备注'}];
                            
            this.resetList();

            return {
                columns: this.columns,
                rows: this.rows,
                pageNumber: this.pageNumber,
                dataCount: this.dataCount,
                currentPageSelections: this.currentPageSelections,
                currentPageAllSelected: this.currentPageAllSelected,
                allSelections: this.allSelections,
                listLoading: this.listLoading,
                filtersData: this.filtersData,
                searchField: this.searchField,
                pickedDate: this.pickedDate
            }
        }

        mounted() {
            EventBus.$on('refreshList', () => {
                this.refreshList();
            });
            EventBus.$on('resetList', (all?: boolean) => {
                this.resetList(all);
            });
        }

        beforeDestroy() {
            EventBus.$off('refreshList');
            EventBus.$off('resetList');
        }

        get goods() {
            return this.filtersData.goods;
        }

        set goods(value: any) {
            this.filtersData.goods = value;
            this.resetList();
        }

        get party() {
            return this.filtersData.party;
        }

        set party(value: any) {
            this.filtersData.party = value;
            this.resetList();
        }

        get datePick() {
            return this.pickedDate;
        }

        set datePick(date: any) {
            this.pickedDate = date;
            this.resetList();
        }

        get searchInValid() {
            return RegExpTest('sql', this.searchField);
        }

        get selectedData() {
            let result = { inQuantity: 0, inTotal: 0, outQuantity: 0, outTotal: 0};
            this.realSelections?.forEach((item: any) => {
                if(item.type === 0) {
                    result.inQuantity = MathAdd(result.inQuantity , item.quantity);
                    result.inTotal = MathAdd(result.inTotal , MathMul(item.unitPrice, item.quantity));
                }else if(item.type === 1) {
                    result.outQuantity = MathAdd(result.outQuantity , item.quantity);
                    result.outTotal = MathAdd(result.outTotal , MathMul(item.unitPrice, item.quantity));
                }
            });
            return result;
        }

        get deleteBtnTitle() {
            return this.deleteBtnDisabled?'在进行此操作前，需要选中至少一条交易记录':'删除选中的交易记录';
        }

        get deleteBtnDisabled() {
            return this.realSelections.length === 0;
        }

        get editBtnTitle() {
            return this.editBtnDisabled?'在进行此操作前，必须且只能选中一条交易记录':'修改当前交易记录的信息';
        }

        get editBtnDisabled() {
            return this.realSelections.length !== 1;
        }

        get realSelections() {
            return this.allSelections || this.currentPageSelections;
        }

        get cpAllSelected() {
            if(!this.currentPageAllSelected) this.allSelections = undefined;
            return this.currentPageAllSelected;
        }

        set cpAllSelected(value: any) {
            this.currentPageAllSelected = value;
            if(this.currentPageAllSelected) {
                this.rows.forEach((item: any) => {
                    if(this.currentPageSelections.indexOf(item) === -1) {
                        this.currentPageSelections.push(item);
                    }
                });
            } else {
                this.currentPageSelections.splice(0);
            }
        }

        get cpSelections() {           
            return this.currentPageSelections;
        }

        set cpSelections(value: any) {
            this.currentPageSelections = value;
            if(Array.isArray(this.rows) && this.rows.length > 0 && this.rows.length === this.currentPageSelections?.length) {
                this.currentPageAllSelected = true;
            }else {
                if(this.currentPageAllSelected) this.currentPageAllSelected = false;
            }
        }

        get pageCount() {
            return Math.ceil(this.dataCount/this.pageSize);
        }

        public handledItem(items: any) {
            let map = {} as any;
            for(let key in items) {
                map[key] = this.searchField && key !== 'total' ? String(items[key]).replace(new RegExp(this.searchField, 'g'), `<span class="matchedField">${this.searchField}</span>`) : String(items[key]);
            }
            return map;
        }

        public goodsTypes(fn: Function) {
            if(this.$store.state.goodsTypes) {
                fn(this.$store.state.goodsTypes);
            } else {
                reloadGoods(() => {
                    fn(this.$store.state.goodsTypes);
                });
            }
        }

        public parties(fn: Function) {
            if(this.$store.state.parties) {
                fn(this.$store.state.parties);
            } else {
                reloadParty(() => {
                    fn(this.$store.state.parties);
                });
            }
        }

        public keyInPageChange(event: any) {
            let operatorIconWraps = (this.$refs.pages as HTMLElement).getElementsByClassName('operatorIconWrap');
            Array.prototype.forEach.call(operatorIconWraps, (item: any) => {
                item.setAttribute('disabled', '');
            });
            this.ChangePageByBtnDisabled = true;
            this.debouncePageChange(event);
        }

        public setPageNumber(event: any) {
            let operatorIconWraps = (this.$refs.pages as HTMLElement).getElementsByClassName('operatorIconWrap');
            Array.prototype.forEach.call(operatorIconWraps, (item: any) => {
                item.removeAttribute('disabled');
            });
            this.ChangePageByBtnDisabled = false;
            if(!RegExpTest('posInt', event.target.value) || Number(event.target.value) > this.pageCount){
                event.target.value = this.pageNumber;
            }
            if(event.target.value == this.pageNumber){
                return;
            }
            this.pageNumber = Number(event.target.value);
            this.refreshList();
        }

        public movePage(step: number) {
            if(this.ChangePageByBtnDisabled) return;
            if(this.pageNumber + step >= 1 && this.pageNumber + step <= this.pageCount) {
                this.pageNumber += step;
                this.refreshList();
            }           
        }

        public inputSearchField() {
            if(!this.searchInValid) this.resetList();
        }

        public resetList(all?: boolean) {
            this.dataCount = 0;
            this.pageNumber = 0;
            if(all) {
                this.filtersData.goods = undefined;
                this.filtersData.dealType = this.popupMenuListData.dealTypesPopupMenu.popupMenuData.items[0];
                this.filtersData.party = undefined;
                this.pickedDate = undefined;
                this.searchField = undefined;
            }
            this.refreshList();
        }

        public refreshList() {
            this.cpAllSelected = false;
            this.rows = [];
            this.listLoading = true;
            let startDate!: string, endDate!: string;
            if(Array.isArray(this.pickedDate) && this.pickedDate.every((item: any) => item)) {
                startDate = dateFormat(this.pickedDate[0]);
                endDate = dateFormat(this.pickedDate[1]);
            }
            let query = {
                pageSize: this.pageSize,
                pageNumber: this.pageNumber > 0 ? this.pageNumber - 1 : 0,
                cottonId: this.filtersData.goods,
                type: this.filtersData.dealType.guid,
                partyId: this.filtersData.party,
                startDate: startDate,
                endDate: endDate,
                searchText: this.searchField ? this.searchField : undefined
            }
            api.deal.list(query).then((response: any) => {
                this.cpAllSelected = false;
                this.listLoading = false;
                //模拟获取数据
                if(isObj(response)) {
                    let data: any = response.data;
                    if(Array.isArray(data?.value)) {
                        this.dataCount = data.count;
                        this.pageNumber = (data.pagenum != undefined && Number(data.pagenum) + 1) || this.pageNumber ;
                        this.rows = data.value.map((item: any) => {return {id: item.id, cottonId: item.cottonId, partyId: item.partyId, cottonName: item.cottonName, type: item.type, unitPrice: item.unitPrice, quantity: item.quantity, partyName: item.partyName, businessDate: item.businessDate, comment: item.comment, fields: this.handledItem({cottonName: item.cottonName, type: ['入货', '出货'][item.type], unitPrice: item.unitPrice, quantity: item.quantity, total: MathMul(item.unitPrice, item.quantity), partyName: item.partyName, businessDate: dateFormat(new Date(item.businessDate)), comment: item.comment || ''})}});
                    }
                }
                this.$store.commit('setStock', null);
            }, () => {
                this.cpAllSelected = false;
                this.listLoading = false;
                EventBus.$emit('addToast', { state: 'error', content: '加载数据失败!'});
            });
        }

        public selectAll() {
            EventBus.$emit('addProgress', '选取记录中...');

            let startDate!: string, endDate!: string;
            if(Array.isArray(this.pickedDate) && this.pickedDate.every((item: any) => item)) {
                startDate = dateFormat(this.pickedDate[0]);
                endDate = dateFormat(this.pickedDate[1]);
            }
            let query = {
                pageSize: 0,
                pageNumber: 0,
                cottonId: this.filtersData.goods,
                type: this.filtersData.dealType.guid,
                partyId: this.filtersData.party,
                startDate: startDate,
                endDate: endDate,
                searchText: this.searchField ? this.searchField : undefined
            }
            api.deal.list(query).then((response: any) => {
                EventBus.$emit('removeProgress', '选取记录中...');
                if(isObj(response)) {
                    let data: any = response.data;
                    if(Array.isArray(data?.value) && data.value.length) {
                        EventBus.$emit('addToast', { state: 'ok', content: '选取记录成功!'});
                        this.cpAllSelected = true;
                        this.allSelections = data.value;
                    } else EventBus.$emit('addToast', { state: 'error', content: '选取记录失败!'});
                } else EventBus.$emit('addToast', { state: 'error', content: '选取记录失败!'});
            }, () => {
                EventBus.$emit('addToast', { state: 'error', content: '选取记录失败!'});
            });
        }

        public editData() {
            if(this.editBtnDisabled) return;
            EventBus.$emit('showDialog', {name: 'deal', options: { action: 1, type: this.realSelections[0]?.type, data: this.realSelections[0] }});
        }

        public removeDatas() {
            if(this.deleteBtnDisabled) return;
            let length = this.realSelections.length,
                inLen = this.realSelections.filter((item: any) => item.type === 0).length,
                title = '', content = '';

            switch(inLen) {
                case 0: 
                    title = '出货';
                    content = `即将删除${length}条出货记录`;
                    break;
                case length:
                    title = '入货';
                    content = `即将删除${length}条入货记录`;
                    break;
                default:
                    title = '交易';
                    content = `即将删除${length}条交易记录，含${inLen}条入货记录、${length - inLen}条出货记录`;
                    break;
            }
            EventBus.$emit('showAlert', {title: `删除${title}记录`, content: `${content}，是否确定？`, 
                                          actions: [{text: '确定', callback: () => {
                                            EventBus.$emit('addProgress', '删除记录中...');
                                            let body = {
                                                ids: this.realSelections.map((item: any) => {return {id: item.id}})
                                            }
                                            api.deal.remove(body).then(() => {
                                                EventBus.$emit('removeProgress', '删除记录中...');
                                                EventBus.$emit('addToast', { state: 'ok', content: '删除成功!'});
                                                this.refreshList();
                                            }, (error) => {
                                                EventBus.$emit('removeProgress', '删除记录中...');
                                                if(isObj(error) && error.message) {
                                                    EventBus.$emit('addToast', { state: 'error', content: error.message});
                                                }else EventBus.$emit('addToast', { state: 'error', content: '删除失败!'}); 
                                            });
                                          }}]});
        }

        public inGoods() {
            EventBus.$emit('showDialog', {name: 'deal', options: { action: 0, type: 0}});
        }

        public outGoods() {
            EventBus.$emit('showDialog', {name: 'deal', options: { action: 0, type: 1}});
        }

        public checkStock() {
            EventBus.$emit('showDialog', {name: 'stock'});
        }

        public openPopupMenu(event: MouseEvent, name: string) {
            (this.$refs[name] as any).showPopupMenu(event, this.popupMenuListData[name].popupMenuData);
        }

        public openDatePicker(name: string) {
            console.log(name)
        }

        public closeDatePicker(name: string) {
            console.log(name)
        }

    }
</script>

<style scoped lang="less">
    .book {
        height: 100%;
        position: relative;
    }

    .ps {
        height: 100%;
    }

    .bookContent {
        min-height: 100%;
        padding: 20px;
        background: #eef0f5;
    }

    ul {
        margin: 0;
        padding: 0;
    }
    
    h5 {
        margin: 0;
    }

    ul.mainBtnWrap {
        display: flex;
        justify-content: center;
        li {
            list-style: none;
            height: 50px;
            min-width: 100px;
            border: 2px solid #2c3e50;
            text-align: center;
            line-height: 50px;
            font-size: 22px;
            letter-spacing: 10px;
            text-indent: 10px;
            color: #2c3e50;
            cursor: pointer;
            transition: all 0.3s;
            -webkit-transition: all 0.3s;
            + li {
                margin-left: 30px;
            }
            &:hover {
                background: #2c3e50;
                color: #fff;
            }
        }
    }

    .conWrap {
        padding-top: 20px;
        .mainContent {
            padding: 12px 24px 0;
            background: #fff;
            box-shadow: 0 0 0 1px rgba(0, 0, 0, .132);
            .topic {
                h5 {
                    color: #aaa;
                    border-bottom: 1px solid #dfe1e6;
                    i {
                        vertical-align: middle;
                    }
                    span {
                        display: inline-block;
                        vertical-align: middle;
                        padding: 8px 0 8px 2px; 
                    }
                }
            }
            .filter {
                padding: 20px 0;
                display: flex;
                align-items: center;
                flex-flow: wrap;
                > div {
                    margin: 8px 10px 8px 0;
                    .dropdown-ui,
                    .mx-datepicker.mx-datepicker-range,
                    .inputWrap {
                        width: 220px;
                        &:not([isinvalid]) {
                            input[type='text']:focus {
                                + span {
                                    display: none;
                                }
                                ~ span.tip {
                                    display: block!important;
                                    color: #2c3e50;
                                    > em > span:after {
                                        content: '总价暂不支持搜索';
                                    }
                                }
                            }
                        }
                    }
                    .btn {
                        border: 1px solid #2c3e50;
                        height: 30px;
                        line-height: 30px;
                        font-size: 15px;
                        padding: 0 30px 0 20px;
                        position: relative;
                        &:hover {
                            background: #2c3e50;
                            color: #fff;
                            &:after{
                                border-top-color: #fff;
                            }
                        }
                        &:not(.pure):after {
                            content: '';
                            border-top: 4px solid #2c3e50;
                            border-right: 4px solid transparent;
                            border-left: 4px solid transparent;
                            position: absolute;
                            right: 12px;
                            top: 50%;
                            margin-top: -2px;
                        }
                        &.pure {
                            padding: 0 10px;
                            display: flex;
                            align-items: center;
                            line-height: initial;
                            i {
                                margin-right: 2px;
                            }
                        }
                    }
                    .popupMenu :deep(li) {
                        padding: 0 20px;
                    }
                }
            }
            .MobileDevice {
                display: none;
                dl {
                    display: flex;
                    align-items: center;
                    dt {
                        font-weight: bold;
                        min-width: 100px;
                        padding-right: 10px;
                    }
                    dd {
                        flex: 1;
                        width: 0;
                        min-width: 0;
                        margin: 0;
                    }
                }
            }
        }
    }

    .excutionWrap {
        position: sticky;
        position: -webkit-sticky;
        bottom: 0;
        padding: 0 24px 8px;
        background: #fff;
        z-index: 993;
        box-shadow: 1px 0 0 rgb(0 0 0 / 13%), -1px 0 0 rgb(0 0 0 / 13%),
                    0 1px 0 rgb(0 0 0 / 13%);
        .excution {
            box-shadow: 0 -1px 0 rgb(0 0 0 / 13%);
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            .dataOperators {               
                .btn {
                    vertical-align: middle;
                    margin: 8px 10px 8px 0;                          
                }
                span {
                    display: inline-block;
                    font-size: 13px;
                    vertical-align: middle;
                    big {
                        color: red;
                    }
                }
            }
            .pages {
                white-space: nowrap;
                font-size: 13px;
                display: flex;
                align-items: center;
                .operatorIconWrap {
                    display: inline-block;
                    .pure-o_left, .pure-o_right {
                        font-weight: bold;
                        color: #aaa;
                    }
                }
                .pageInfo {
                    margin: 0 5px;
                    display: inline-flex;
                    align-items: center;
                    input[type="text"] {
                        border: 1px solid #aaa;
                        height: 22px;
                        width: 50px;
                        margin-right: 5px;
                    }
                }
                .pageCount {
                    margin-left: 5px;
                }
            }
        }
    }

    @media screen and (max-width: 896px){
        ul.mainBtnWrap li {
            flex: 1;
            width: 0;
            min-width: 0;
        }
        .PCDevice {
            display: none;
        }
        .conWrap .mainContent {
            .filter{
                > div {
                    &:last-child, .dropdown-ui, .btn, 
                    .mx-datepicker.mx-datepicker-range, .inputWrap {
                        width: 100%;
                    }
                    .popupMenu :deep(.ps), .popupMenu :deep(.popup-menu) {
                        min-width: 100%;
                    }
                    &:nth-child(n+1):nth-child(-n+4) {
                        width: calc(50% - 5px);
                    }
                    &:nth-child(even), &:last-child {
                        margin-right: 0;
                    }
                }
            }
            .MobileDevice {
                display: table-cell;
                font-size: 15px;
            }
        }
        .excutionWrap .excution {
            display: block;
            .dataOperators {
                .btn {
                    margin-right: 0;
                    padding: 0;
                    text-align: center;
                    width: calc(33.33% - 7px);
                    + .btn {
                        margin-left: 10px;
                    }
                }
                span {
                    padding-bottom: 8px;
                }
            }
            .pages {
                justify-content: center;
            }
        }
    }
    
</style>