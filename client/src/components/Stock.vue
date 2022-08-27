<template>
    <div class="stock">
        <h2>
            <span>库存</span>
            <span class="closeBtn iconBtn" @click="hideDialog" title="关闭窗口">
                <i class="purefont pure-o_close"></i>
                <i class="purefont pure-close"></i>
            </span>
        </h2>
        <div class="body">
            <object type="text/html" class="resizingObject" ref="resizingObject" data="about:blank" @load="resizeScrollbar($refs.resizingObject, $refs.scrollbar);" />
            <perfect-scrollbar ref="scrollbar">
                <div class="tableWrap">
                    <table>
                        <thead>
                            <tr>
                                <th></th>
                                <th v-for="(col, index) in columns" :key="'tb1_'+index"  v-html="col.field"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="Array.isArray(rows) && rows.length && !$store.state.stockLoading">
                                <tr v-for="(row, index) in rows" :key="'tr_'+index" :class="{ selected: row === editingStockItem }">
                                    <td>
                                        <label class="radio" :title="radioTitle">
                                            <input type="radio" v-model="editingStockItem" :value="row" :disabled="isEditing" />
                                            <span></span>
                                        </label>
                                    </td>
                                    <td v-for="(item, key, index) in row.fields" :key="'tr_'+index+'_'+key">
                                        <template v-if="isEditing && editingStockItem === row && (key === 'quantity' || (key === 'name' && !editingStockItem.id))">
                                            <dropdown v-if="key === 'name'" ref="goodsDropdown" v-model="editedCottonId" :defaultText="editingStockItem.defaultCottonText" :showTitle="'ellipsis'" :valKey="'id'" :nameKey="'name'" :hiddenKey="'hidden'" :datas="goodsTypes" :filterMode="true" :placeholder="'选择品种'" :nodataSet="true" :nodataText="'未找到品种，<a highlight>点此添加</a>'" :nodataClick="addGoodsType" :itemRemoveTiTle="'删除该品种'" :itemRemoveClick="removeGoodsType" />
                                            <div v-if="key === 'quantity'" class="inputWrap" :isInValid="editingStockItem.editedQuantity != undefined && quantityInValid">
                                                <input type="text" v-model="editingStockItem.editedQuantity" placeholder="填入库存数量"/>
                                                <span class="tip">
                                                    <i class="purefont pure-attention"> </i>
                                                    <em><span u="只能输入整数或小数：整数位不超过8位，小数位不超过6位"></span></em>
                                                </span>
                                            </div>
                                        </template>
                                        <template v-else>{{item}}</template>
                                    </td>
                                </tr>
                            </template>
                            <tr v-else>
                                <td class="dataStateTip" :colspan="columns.length + 1">
                                    <div class="noTextSelect" v-show="$store.state.stockLoading">
                                        数据加载中<span class="dotload purefont pure-ellipsis"></span>
                                    </div>
                                    <div class="noTextSelect" v-show="!$store.state.stockLoading">
                                        暂无数据
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </perfect-scrollbar>
        </div>
        <div>
            <template v-if="!$store.state.stockLoading">
                <div v-show="!isEditing" class="dataOperators">
                    <a class="btn commonBtn primary" title="添加一个新品种的库存信息" @click="addStore">手动添加</a>
                    <template v-if="Array.isArray(rows) && rows.length">
                        <a class="btn commonBtn primary" :disabled="editBtnDisabled" :title="editBtnTitle" @click="editStore">手动校正</a>
                        <a class="btn commonBtn danger" :disabled="deleteBtnDisabled" :title="deleteBtnTitle" @click="deleteStore">手动删除</a>
                    </template>
                </div>
                <div v-show="isEditing" class="operatorWrap">
                    <a class="btn commonBtn default" @click="closeEditing">取消</a>
                    <a class="btn commonBtn primary" :disabled="saveBtnDisabled" :title="saveBtnTitle" @click="saveData">保存</a>
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from 'vue-property-decorator';
    import { guid, isObj, sortByStr, RegExpTest } from '@/utils/Tools';
    import { reloadGoods, addGoodsType, removeGoodsType } from '@/utils/Constant';
    import { EventBus } from '@/EventBus';
    import api from '@/api';

    @Component
    export default class Stock extends Vue {
        @Prop() protected options!: any;
        private columns!: any[];
        private rows!: any[];
        private editingStockItem!: any;
        private isEditing!: boolean;
        private usableGoodsTypes: any[] | null = null;

        data() {
            this.columns = [{field: '品种'},
                            {field: '库存数量 <small>(吨)</small>'}];
            let stock = this.$store.state.stock;
            if(stock) {
                this.rows = JSON.parse(JSON.stringify(stock));
            }else {
                this.refreshList();
            }
            return {
                columns: this.columns,
                rows: this.rows,
                editingStockItem: this.editingStockItem,
                isEditing: this.isEditing
            }
        }

        mounted() {
            this.$watch('$store.state.stock', () => {
                this.rows = JSON.parse(JSON.stringify(this.$store.state.stock))
            });
            this.$watch('$store.state.goodsTypes', () => {
                this.updateUsableGoodsTypes();
            });
        }

        get editedCottonId() {
            return this.editingStockItem.editedCottonId;
        }

        set editedCottonId(value: any) {
            Vue.set(this.editingStockItem, 'editedCottonId', value);
            Vue.set(this.editingStockItem, 'defaultCottonText', value ? this.$store.state.goodsTypes.find((item: any) =>item.id === value).name : undefined);
        }

        get quantityInValid() {
            return !RegExpTest('decimal', this.editingStockItem.editedQuantity);
        }

        get saveBtnDisabled() {
            return !this.editingStockItem || !(this.editingStockItem.id || this.editingStockItem.editedCottonId) || this.quantityInValid || this.editingStockItem.isSaving;
        }

        get saveBtnTitle() {
            return this.saveBtnDisabled ? this.editingStockItem?.isSaving ? '当前不可操作，该品种库存信息正在保存中' : 
                '在进行此操作前，确保已填写完整，并且所有填入的数据符合规范':
                '保存当前品种的库存信息';
        }

        get editBtnDisabled() {
            return !(this.editingStockItem && this.editingStockItem.id && !this.editingStockItem.isSaving);
        }

        get deleteBtnDisabled() {
            return !(this.editingStockItem && this.editingStockItem.id);
        }

        get editBtnTitle() {
            return this.editBtnDisabled ? this.editingStockItem ? this.editingStockItem.isSaving ? '当前不可操作，该品种库存信息正在保存中' : '该项为正创建项，无法校正' : '在进行此操作前，必须选中一条库存记录':'修改当前品种的库存信息';
        }

        get deleteBtnTitle() {
            return this.deleteBtnDisabled ? this.editingStockItem ? '该项为正创建项，无法删除' : '在进行此操作前，必须选中一条库存记录':'删除当前品种的库存信息';
        }

        get radioTitle() {
            return this.isEditing ? '当前不可切换，正处于编辑状态' : undefined;
        }

        public updateUsableGoodsTypes() {
            let uselessRowsIds = this.rows.filter((item: any) => item.id != undefined).map((item: any) => item.id),
                usableGoodsTypes = this.$store.state.goodsTypes?.filter((item: any) => uselessRowsIds.indexOf(item.id) === -1);
            if(usableGoodsTypes) {
                if(this.usableGoodsTypes) {
                    this.usableGoodsTypes.splice(0, this.usableGoodsTypes.length, ...usableGoodsTypes);
                } else this.usableGoodsTypes = usableGoodsTypes;
            } else this.usableGoodsTypes = null;
        }

        public goodsTypes(fn: Function) {
            this.updateUsableGoodsTypes();
            let goodsTypes = this.usableGoodsTypes;
            if(goodsTypes) {
                fn(goodsTypes);
            } else {
                reloadGoods(() => {
                    this.$nextTick(() => {
                        fn(this.usableGoodsTypes);
                    });
                });
            }
        }

        public addGoodsType() {
            let inputDom = (this.$refs.goodsDropdown as Vue[])[0].$refs.filterInput as HTMLInputElement;
            if(this.rows.find((item: any) => item.id != undefined && item.name === inputDom.value)) {
                EventBus.$emit('showAlert', {title: `友情提醒`, content: `品种“${inputDom.value}”已存在库存列表中，不可重复添加！`});
            } else addGoodsType(inputDom);
        }

        public removeGoodsType(item: any) {
            removeGoodsType(item);
        }

        public hideDialog() {
            EventBus.$emit('hideDialog');
        }

        public refreshList() {
            this.editingStockItem = null;
            this.isEditing = false;
            this.rows = [];
            this.$store.commit('setStockLoading', true);
            
            api.stock.list().then((response: any) => {
                this.$store.commit('setStockLoading', false);
                //模拟获取数据
                if(isObj(response)) {
                    let data: any = response.data;
                    if(Array.isArray(data)) {
                        let stock = this.$store.state.stock;
                        if(Array.isArray(stock)) {
                            stock.splice(0, stock.length, ...sortByStr(data.map((item: any) => {return {id: item.id, name: item.name, editedQuantity: item.stock, originalQuantity: item.stock, isSaving: false, fields: {name: item.name, quantity: item.stock}}})));
                        } else this.$store.commit('setStock', sortByStr(data.map((item: any) => {return {id: item.id, name: item.name, editedQuantity: item.stock, originalQuantity: item.stock, isSaving: false, fields: {name: item.name, quantity: item.stock}}})));
                    }
                }
            });
        }

        public closeEditing() {
            if(!this.editingStockItem.id) {
                this.rows.splice(this.rows.findIndex((item: any) => item === this.editingStockItem), 1);
                this.editingStockItem = null;
            }
            this.isEditing = false;
        }

        public saveData() {
            if(this.saveBtnDisabled) return;
            this.isEditing = false;
            let stockItem = this.editingStockItem;
            stockItem.isSaving = true;
            stockItem.fields.quantity = stockItem.editedQuantity;
            if(!stockItem.id) stockItem.id = stockItem.editedCottonId;
            EventBus.$emit('addProgress', '保存产品库存中...');

            api.stock.update({id: stockItem.id, stock: stockItem.editedQuantity}).then(() => {
                EventBus.$emit('removeProgress', '保存产品库存中...');
                EventBus.$emit('addToast', { state: 'ok', content: '保存成功!'});
                this.refreshList();
            },() => {
                EventBus.$emit('removeProgress', '保存产品库存中...');
                EventBus.$emit('addToast', { state: 'error', content: '保存失败!'});
                stockItem.isSaving = false;
                if(stockItem.id) {
                    stockItem.editedQuantity = stockItem.fields.quantity = stockItem.originalQuantity;
                } else {
                    this.rows.splice(this.rows.findIndex((item: any) =>item === stockItem), 1);
                    if(this.editingStockItem === stockItem) this.editingStockItem = null;
                }
            }); 
        }

        public addStore() {
            let flag!: string;
            do {
                flag = guid();
            } while (this.rows.some((item: any) => item.flag === flag));
            let newStockItem = {flag: flag, fields: {name: undefined, quantity: undefined}, isSaving: false};
            this.rows.push(newStockItem);
            this.editingStockItem = newStockItem;
            this.isEditing = true;
        }

        public editStore() {
            if(this.editBtnDisabled) return;
            this.editingStockItem.editedQuantity = this.editingStockItem.fields.quantity;
            this.isEditing = true;
        }

        public deleteStore() {
            if(this.deleteBtnDisabled) return;
            EventBus.$emit('showAlert', {title: `删除库存信息`, content: `将删除“${this.editingStockItem.fields.name}”的库存信息，是否确定？`, 
                                          actions: [{text: '确定', callback: () => {
                                            let stockItem = this.editingStockItem;
                                            EventBus.$emit('addProgress', '删除信息中...');
                                            api.stock.remove(stockItem.id).then(() => {
                                                EventBus.$emit('removeProgress', '删除信息中...');
                                                EventBus.$emit('addToast', { state: 'ok', content: '删除成功!'});
                                                this.refreshList();
                                            },(error) => {
                                                EventBus.$emit('removeProgress', '删除信息中...');
                                                if(isObj(error) && error.message) {
                                                    EventBus.$emit('addToast', { state: 'error', content: error.message});
                                                }else EventBus.$emit('addToast', { state: 'error', content: '删除失败!'}); 
                                            }); 
                                          }}]});
        }
    }
</script>

<style scoped lang="less">
    .stock {
        display: flex;
        flex-direction: column;
        h2 {
            margin: 0;
            padding: 0 16px 10px;
            border-bottom: 1px solid #dfe1e6;
            display: flex;
            align-items: center;
            justify-content: space-between;
            .closeBtn i {
                font-size: 25px;
                &:nth-child(1){
                    font-weight: lighter;
                }
            }
        }
        .tableWrap {
            padding: 0 16px 30px;
            table thead tr th {
                &:first-child {
                    width: initial;
                }
                &:nth-child(2) {
                    width: 40%;
                }
            }
            table tbody tr {
                height: 40px;
            }
        }

        .inputWrap {
            flex: 1;
            padding-right: 0;
            > span {
                z-index: 991;
            }
            input {
                padding-right: 10px;
            }
            .tip {
                display: none;
            }
            &[isInValid] {
                padding-right: 30px;
                input {
                    padding-right: 0;
                }
                .tip {
                    display: block;
                }
            }
        }
    }

    .body {
        flex: 1;
        min-height: 0;
        height: 0;
        position: relative;
    }

    .body > .ps {
        height: 100%;
    }

    .operatorWrap, .dataOperators {
        padding: 12px 11px;
        border-top: 1px solid #dfe1e6;
        display: flex;
        justify-content: center;
        .btn {
            margin: 0 5px;
        }
    }

    .dataOperators {
        justify-content: flex-start;
    }

    @media screen and (max-width: 896px){
        .tableWrap table {
            font-size: 18px;
        }
        .dataOperators {
            .btn.commonBtn {
                flex: 1;
                text-align: center;
                padding: 0;
            }
        }
    }
</style>