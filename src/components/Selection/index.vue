<template>
  <div class="select flex flex-only-center" @click="handleSelect">
    <i class="select-icon"></i>
    <span class="default-body-color">筛选</span>
  </div>
  <Popup position="right" v-model:show="state.show" :style="{ width: '75%', height: '100%' }">
    <div class="select-content" v-for="(item,index) in state.tagList" :key="item.title">
      <div class="title default-title-color">{{ item.title }}</div>
      <div class="tags flex flex-only-center flex-wrap">
        <div
          v-for="tag in item.tags"
          :key="tag.tagId"
          @click="handleSelectTag(index, tag.tagId)"
          :class="['tag beyond-ellipsis default-title-color', {
            active: state.tagSelectList[index].selected.indexOf(tag.tagId) !== -1
          }]"
        >{{ tag.tagName }}</div>
      </div>
    </div>
    <div class="select-button flex flex-center">
      <div class="button flex flex-center">
        <div class="reset" @click="handleReset">重置</div>
        <div class="confirm" @click="handleConfirm">确定</div>
      </div>
    </div>
  </Popup>
</template>

<script lang="ts" setup>

import { Popup } from 'vant'

import selectData from './selection'

import { reactive } from 'vue'

import api from '../../api/api'

const emit = defineEmits(['handleConfirmEmit'])

const state = reactive({
  show: false,
  tagList: selectData.tagList,
  tagSelectList: selectData.tagSelectList
})

/**
 * 点击筛选，获取标签内容，弹出筛选弹出层
 */
const handleSelect = () => {
  getOutTags()
}

/**
 * 标签选择，请求
 */
const getOutTags = () => {
  api.miniTagListInquiry({}).then((res: any) => {
    if (res.status.success) {
      state.tagList[1].tags = res.body.dataList
      state.show = true
    }
  })
}

/**
 * 标签选择
 */
const handleSelectTag = (index: number, tagId: string) => {
  if (state.tagSelectList[index].selected.indexOf(tagId) !== -1) {
    state.tagSelectList[index].selected.splice(state.tagSelectList[index].selected.indexOf(tagId), 1)
  } else {
    state.tagSelectList[index].selected.push(tagId)
  }
}

/**
 * 重置按钮
 */
const handleReset = (): void => {
  for (let item of state.tagSelectList) {
    item.selected = []
  }
}

/**
 * 确定按钮
 */
const handleConfirm = () => {
  emit('handleConfirmEmit')
  state.show = false
}

</script>

<style lang="less" scoped>
.select {
  .select-icon {
    width: 18px;
    height: 18px;
    margin-right: 5px;
    background: url("../../assets/imgs/select.png") no-repeat 0 0;
    background-size: 100%;
  }
}
.select-content {
  margin-top: 15px;
  &:nth-child(5)::after {
    display: none;
  }
  &::after {
    content: "";
    width: 100%;
    height: 1px;
    display: block;
    margin-top: 15px;
    transform: scaleY(0.5);
    background-color: #e5e6e8;
  }
  .title {
    font-size: 14px;
    font-weight: 600;
    margin-left: 15px;
    margin-bottom: 4px;
  }
  .tags {
    margin-left: 12px;
    .tag {
      width: 31%;
      height: 30px;
      font-size: 12px;
      line-height: 30px;
      text-align: center;
      border-radius: 15px;
      margin: 10px 5px 0 0;
      box-sizing: border-box;
      border: 1px solid #f8f8f8;
      background-color: #f8f8f8;
      &::nth-child(3n) {
        margin-right: 0;
      }
      &.active {
        color: #fb3834;
        border: 1px solid #fb3834;
        background-color: rgba(251, 56, 52, 0.1);
      }
    }
  }
}
.select-button {
  width: 100%;
  padding: 10px 0;
  box-sizing: border-box;
  background-color: #fff;
  box-shadow: 0px -2px 4px 0px rgba(0, 0, 0, 0.06);
  margin-top: 40px;
  .button {
    width: 248px;
    height: 36px;
    overflow: hidden;
    border-radius: 100px;
    background-color: #fb3834;
    .reset {
      width: 124px;
      font-size: 14px;
      font-weight: 600;
      color: #fb3834;
      line-height: 36px;
      text-align: center;
      background-color: #fff;
      border: 1px solid #fb3834;
      border-radius: 50px 0px 50px 50px;
    }
    .confirm {
      width: 124px;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      line-height: 36px;
      text-align: center;
      background-color: #fb3834;
      border-radius: 0px 50px 50px 0px;
    }
  }
}
</style>