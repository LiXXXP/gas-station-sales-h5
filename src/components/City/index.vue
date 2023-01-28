<template>
  <div class="city">
    <img class="positioning" src="../../assets/imgs/positioning.png" alt="">
    <DropdownMenu>
      <DropdownItem v-model="state.cityName" :options="state.cityOptions" disabled></DropdownItem>
    </DropdownMenu>
  </div>
</template>

<script lang="ts" setup>

import { reactive } from 'vue'
import { DropdownMenu, DropdownItem } from 'vant'

const state = reactive({
  cityName: 0,
  cityOptions: [
    { text: '北京', value: 0 },
  ]
})

</script>

<style lang="less" scoped>
.city {
  display: flex;
  align-items: center;
  :deep(.van-dropdown-menu__bar) {
    height: 0;
    box-shadow: none;
  }
  :deep(.van-ellipsis) {
    color: #515151;
  }
  :deep(.van-dropdown-menu__title){
    padding: 0!important;
  }
  :deep(.van-dropdown-menu__title::after){
    display: none;
  }
  .positioning{
    width: 18px;
    height: 18px;
    display: inline-block;
    margin-right: 5px;
  }
}
</style>