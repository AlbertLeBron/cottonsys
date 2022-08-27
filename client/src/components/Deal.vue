<template>
    <div class="deal">
        <h2>
            <span>{{title}}</span>
            <span class="closeBtn iconBtn" @click="hideDialog" title="关闭窗口">
                <i class="purefont pure-o_close"></i>
                <i class="purefont pure-close"></i>
            </span>
        </h2>
        <div class="body">
            <object type="text/html" class="resizingObject" ref="resizingObject" data="about:blank" @load="resizeScrollbar($refs.resizingObject, $refs.scrollbar);" />
            <perfect-scrollbar ref="scrollbar">
                <div class="form">
                    <dl>
                        <dt>品种*</dt>
                        <dd>
                            <dropdown ref="goodsDropdown" v-model="dealGoodsCottonId" :defaultText="dealGoods.defaultCottonText" :showTitle="'ellipsis'" :valKey="'id'" :nameKey="'name'" :hiddenKey="'hidden'" :datas="goodsTypes" :filterMode="true" :placeholder="'必选项，选择或添加货物品种'" :nodataSet="true" :nodataText="'未找到品种，<a highlight>点此添加</a>'" :nodataClick="addGoodsType" :itemRemoveTiTle="'删除该品种'" :itemRemoveClick="removeGoodsType" />
                        </dd>
                    </dl>
                    <dl>
                        <dt>单价*</dt>
                        <dd>
                            <div class="inputWrap" :isInValid="dealGoods.unitPrice != undefined && unitPriceInValid">
                                <input type="text" v-model="dealGoods.unitPrice" placeholder="必填项，需输入数字（整数或小数）"/>
                                <span class="tip">
                                    <i class="purefont pure-attention"> </i>
                                    <em><span u="只能输入整数或小数：整数位不超过8位，小数位不超过6位"></span></em>
                                </span>
                            </div>
                            <small class="unit">万元 / 吨</small>
                        </dd>
                    </dl>
                    <dl>
                        <dt>数量*</dt>
                        <dd>
                            <div class="inputWrap" :isInValid="dealGoods.quantity != undefined && quantityInValid">
                                <input type="text" v-model="dealGoods.quantity" placeholder="必填项，需输入数字（整数或小数）"/>
                                <span class="tip">
                                    <i class="purefont pure-attention"> </i>
                                    <em><span u="只能输入整数或小数：整数位不超过8位，小数位不超过6位"></span></em>
                                </span>
                            </div>
                            <small class="unit">吨</small>
                        </dd>
                    </dl>
                    <dl>
                        <dt>交易方*</dt>
                        <dd>
                            <dropdown ref="partyDropdown" v-model="dealGoodsPartyId" :defaultText="dealGoods.defaultPartyText" :showTitle="'ellipsis'" :valKey="'id'" :nameKey="'name'" :hiddenKey="'hidden'" :datas="parties" :filterMode="true" :placeholder="'必填项，选择或添加货物品种'" :nodataSet="true" :nodataText="'未找到交易方，<a highlight>点此添加</a>'" :nodataClick="addParty" :itemRemoveTiTle="'删除该交易方'" :itemRemoveClick="removeParty" />
                        </dd>
                    </dl>
                    <dl>
                        <dt>交易日期</dt>
                        <dd>
                            <datePicker v-model="dealGoods.datePick" :disabled-date="date => date >= new Date()" placeholder="可输入或选择日期" />
                        </dd>
                    </dl>
                    <dl>
                        <dt>备注</dt>
                        <dd>
                            <div class="textAreaWrap" :isInValid="dealGoods.comment != undefined && commentInValid">
                                <perfect-scrollbar>
                                    <div ref="comment" class="editableContent" contenteditable="true" placeholder="可填写本次交易的备注说明" @input="writeComment"></div>
                                </perfect-scrollbar>
                                <span class="tip">
                                    <i class="purefont pure-attention"> </i>
                                    <em><span u="存在不规范的文字或符号"></span></em>
                                </span>
                            </div>
                        </dd>
                    </dl>
                </div>
            </perfect-scrollbar>
        </div>
        <div class="operatorWrap">
            <a class="btn commonBtn default" @click="hideDialog">取消</a>
            <a class="btn commonBtn primary" :disabled="saveBtnDisabled" :title="saveBtnTitle" @click="saveData">保存</a>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from 'vue-property-decorator';
    import { EventBus } from '@/EventBus';
    import { RegExpTest, isObj, dateFormat } from '@/utils/Tools';
    import { reloadGoods, reloadParty, addGoodsType, removeGoodsType, addParty, removeParty } from '@/utils/Constant';
    import datePicker from 'vue2-datepicker';
    import 'vue2-datepicker/index.css';
    import 'vue2-datepicker/locale/zh-cn';
    import api from '@/api';

    @Component({
        components: {
            datePicker
        }
    })
    export default class Deal extends Vue {
        @Prop() protected options!: any;
        private dealGoods!: any;
        private isSaving!: any;

        data(){
            if(this.options.data) {
                this.dealGoods = {
                    id: this.options.data.id,
                    cottonId: this.options.data.cottonId,
                    defaultCottonText: this.options.data.cottonName,
                    unitPrice: String(this.options.data.unitPrice),
                    quantity: String(this.options.data.quantity),
                    partyId: this.options.data.partyId,
                    defaultPartyText: this.options.data.partyName,
                    datePick: new Date(this.options.data.businessDate),
                    comment: this.options.data.comment
                };
                this.$nextTick(() => {
                    (this.$refs.comment as HTMLElement).innerHTML = this.options.data.comment;
                });
            } else this.dealGoods = {};
            
            return {
                dealGoods: this.dealGoods,
                isSaving: this.isSaving
            }
        }

        get type() {
            return ['入货', '出货'][this.options.type];
        }

        get title() {
            return `${['新建', '修改'][this.options.action] + this.type}记录` ;
        }

        get dealGoodsCottonId() {
            return this.dealGoods.cottonId;
        }

        set dealGoodsCottonId(value: any) {
            Vue.set( this.dealGoods, 'cottonId', value);
            Vue.set( this.dealGoods, 'defaultCottonText', value ? this.$store.state.goodsTypes.find((item: any) =>item.id === value).name : undefined);
        }

        get dealGoodsPartyId() {
            return this.dealGoods.partyId;
        }

        set dealGoodsPartyId(value: any) {
            Vue.set( this.dealGoods, 'partyId', value);
            Vue.set( this.dealGoods, 'defaultPartyText', value ? this.$store.state.parties.find((item: any) =>item.id === value).name : undefined);
        }       

        get unitPriceInValid() {
            return !RegExpTest('decimal', this.dealGoods.unitPrice);
        }

        get quantityInValid() {
            return !RegExpTest('decimal', this.dealGoods.quantity);
        }

        get commentInValid() {
            return RegExpTest('sql', this.dealGoods.comment);
        }

        get saveBtnDisabled() {
            return !this.dealGoods.cottonId || !this.dealGoods.partyId || this.unitPriceInValid || this.quantityInValid || this.commentInValid || this.isSaving;
        }

        get saveBtnTitle() {
            return this.saveBtnDisabled ? this.isSaving ? '当前不可操作，正在保存中' : 
                '在进行此操作前，确保带 * 的必填项已填写完整，并且所有填入的数据符合规范':
                '保存当前' + this.type + '记录的信息';
        }

        public hideDialog() {
            EventBus.$emit('hideDialog');
        }

        public addGoodsType() {
            addGoodsType((this.$refs.goodsDropdown as Vue).$refs.filterInput as HTMLInputElement);
        }

        public removeGoodsType(item: any) {
            removeGoodsType(item);
        }

        public addParty() {
            addParty((this.$refs.partyDropdown as Vue).$refs.filterInput as HTMLInputElement);
        }

        public removeParty(item: any) {
            removeParty(item);
        }

        public goodsTypes(fn: Function) {
            let goodsTypes = this.$store.state.goodsTypes;
            if(goodsTypes) {
                fn(goodsTypes);
            } else {
                reloadGoods(() => {
                    fn(this.$store.state.goodsTypes);
                });
            }
        }

        public parties(fn: Function) {
            let parties = this.$store.state.parties;
            if(parties) {
                fn(parties);
            } else {
                reloadParty(() => {
                    fn(this.$store.state.parties);
                });
            }
        }

        public writeComment() {
            Vue.set(this.dealGoods, 'comment', (this.$refs.comment as HTMLElement).innerHTML);
        }

        public saveData() {
            if(this.saveBtnDisabled) return;
            let body: any = {
                cottonId: this.dealGoods.cottonId,
                unitPrice: this.dealGoods.unitPrice,
                quantity: this.dealGoods.quantity,
                partyId: this.dealGoods.partyId,
                businessDate: dateFormat(this.dealGoods.datePick || new Date(), 'pure'),
                comment: this.dealGoods.comment || undefined,
                type: this.options.type
            };
            this.isSaving = true;
            if(this.options.data?.id) {
                EventBus.$emit('addProgress', '修改交易记录中...');
                Object.assign(body, {id: this.options.data.id, originalCottonId: this.options.data.cottonId, originalQuantity: this.options.data.quantity});
                api.deal.update(body).then(() => {
                    this.isSaving = false;
                    EventBus.$emit('removeProgress', '修改交易记录中...');
                    EventBus.$emit('addToast', { state: 'ok', content: '修改成功!'});
                    this.hideDialog();
                    EventBus.$emit('refreshList');
                },(error) => {
                    this.isSaving = false;
                    EventBus.$emit('removeProgress', '修改交易记录中...');
                    if(isObj(error) && error.message) {
                        EventBus.$emit('addToast', { state: 'error', content: error.message});
                    }else EventBus.$emit('addToast', { state: 'error', content: '修改失败!'}); 
                });
            }else {
                EventBus.$emit('addProgress', '添加交易记录中...');
                api.deal.add(body).then(() => {
                    this.isSaving = false;
                    EventBus.$emit('removeProgress', '添加交易记录中...');
                    EventBus.$emit('addToast', { state: 'ok', content: '添加成功!'});
                    this.hideDialog();
                    EventBus.$emit('resetList', true);
                },(error) => {
                    this.isSaving = false;
                    EventBus.$emit('removeProgress', '添加交易记录中...');
                    if(isObj(error) && error.message) {
                        EventBus.$emit('addToast', { state: 'error', content: error.message});
                    }else EventBus.$emit('addToast', { state: 'error', content: '添加失败!'}); 
                });
            }
        }
    }
</script>

<style scoped lang="less">
    .deal {
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

    .form {
        padding: 30px 16px; 
        max-width: 100%;
        width: 500px;
        margin: 0 auto;
    }

    .form dl {
        display: flex;
        align-items: center;
        margin: 0;
        + dl {
            margin-top: 20px;
        }
    }

    .form dl dt {
        max-width: 30%;
        width: 20%;
        text-align: right;
        font-weight: bold;
    }

    .form dl dd {
        flex: 1;
        width: 0;
        min-width: 0;;
        margin-left: 20px;
        display: inline-flex;
        align-items: center;
    }

    .mx-datepicker {
        width: 100%;
    }

    .dropdown-ui {
        flex: 1;
        width: 0;
        min-width: 0;
    }

    .inputWrap {
        flex: 1;
        padding-right: 0;
        input {
            padding-right: 10px;
        }
        + .unit {
            padding-left: 10px;
            min-width: 65px;
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

    .textAreaWrap {
        flex: 1;
        min-width: 0;
        width: 0;
        padding-right: 0;
        .tip {
            display: none;
        }
        &[isInValid] {
            .editableContent {
                padding-right: 30px;
            }
            .tip {
                display: block;
            }
        }
    }

    .operatorWrap {
        padding: 12px 20px;
        border-top: 1px solid #dfe1e6;
        display: flex;
        justify-content: center;
        .btn {
            margin: 0 5px;
        }
    }
</style>