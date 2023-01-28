<template>
  <Loading v-if="!state.stationIntro.stationName"/>
  <div class="station">
    <div class="header flex flex-between flex-only-center">
      <City />
      <div class="search" @click="toSearchPageForMini">
        <i class="search-icon"></i>
        <span v-if="state.searchStationName">{{ state.searchStationName }}</span>
        <span v-else>请输入搜索关键字</span>
      </div>
      <Selection @handleConfirmEmit="handleConfirmEmit" />
    </div>
    <div id="map"></div>
  </div>
  <Intro
    :stationIntro="state.stationIntro"
    :isShowIntro="state.isShowIntro"
  />
</template>

<script lang="ts" setup>
import Loading from '../../components/loading/loading.vue'
import City from '../../components/City/index.vue'
import Selection from '../../components/Selection/index.vue'
import Intro from '../../components/Intro/index.vue'

import { reactive, onMounted, onUnmounted } from 'vue'

import api from '../../api/api'
import util from '../../utils/util'
import selectData from '../../components/Selection/selection'

interface nameListParam {
  stationId: string
}

const state = reactive({
  map: null, // 地图
  searchStationName: util.getUrlParam('stationName') || '', // 搜索加油站的关键字，小程序获取
  searchStationPosition: {
    stationId: util.getUrlParam('id') || '', // 点击搜索列表中加油站的id，小程序获取
    lat: localStorage.getItem("lat"), // 个人定位 纬度
    lng: localStorage.getItem("lng")  // 个人定位 经度
  }, // 搜索加油站的经纬度
  stationIntro: { // 加油站简介
    stationName: ''
  },
  isShowIntro: false, // 是否显示加油站简介
  gasDistrictNameList: [] as Array<nameListParam>, // 搜索加油站结果列表
  gasNameTextList: [], // 区域加油站标记
  tagSelectList: selectData.tagSelectList, // 筛选标签的id列表
  clickStationText: null, // 点击加油站的标记
})

onMounted(() => {

  // 初始地图
  initMap()

  // 加油站简介
  getStationIntro(state.searchStationPosition.stationId, 'init')

  // 请求搜索关键字列表
  if (state.searchStationName) {
    getStationListForSearch(state.searchStationName)
  }

})

onUnmounted(() => {
  // 销毁地图
  if (!state.map) {
    return
  }
  //@ts-ignore
  state.map.destroy()
})

/**
 * 初始化地图
 */
const initMap = () => {
  //@ts-ignore
  const position = new LKMap.LngLat(state.searchStationPosition.lng, state.searchStationPosition.lat)
  //@ts-ignore
  const map = new LKMap.Map("map", {
    center: position,
    zoom: 12
  })

  state.map = map

  state.map.setTouchRotate(false)

  //@ts-ignore 加油站 icon
  const icon = new LKMap.Icon({
    image: `${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-positioning.svg`,
    //@ts-ignore
    imageSize: new LKMap.Size(36, 36)
  })

  //@ts-ignore
  const marker = new LKMap.Marker({
    position: position,
    anchor: 'bottom',
    icon: icon
  })

  marker.setMap(state.map)
}

/**
 * 搜索加油站关键字，请求
 * miniGasStationListInquiry
 */
const getStationListForSearch = (searchName: string) => {
  const params = {
    stationName: util.transHtml(searchName).replace(/\s+/g, ""),  // 搜索关键字
    lat: state.searchStationPosition.lat,                         // 用户纬度
    lng: state.searchStationPosition.lng,                         // 用户经度
    advScreen: util.sum(state.tagSelectList[0].selected),        // 广告大屏
    outTags: state.tagSelectList[1].selected,                     // 标签选择
    stars: util.sum(state.tagSelectList[2].selected),             // 星级
    optCondition: util.sum(state.tagSelectList[3].selected),      // 经营状况
    brands: util.sum(state.tagSelectList[4].selected),            // 品牌
  }
  api.miniGasStationListInquiry(params).then(res => {
    if (res.status.success) {
      state.gasDistrictNameList = res.body.dataList
      // 地图上添加加油站名字标记
      addGasName()
    }
  })
}

// 星级
 const starText=(star: any)=> {
    switch (star) {
      case 4:
        return '三星级';
        break;
      case 8:
        return '四星级';
        break;
      case 16:
        return '五星级';
        break;
      default:
        break;
    }
  }
  // 状态
 const getState = (state: number)=> {
    switch (state) {
      case 1:
        return '正常营业';
        break;
      case 2:
        return '装修';
        break;
      case 4:
        return '停业';
        break;
      default:
        break;
    }
  }
  // 大屏
 const advText=(advScreen: number)=> {
    switch (advScreen) {
      case 1:
        return '无';
        break;
      case 2:
        return '100寸以上';
        break;
      case 4:
        return '120寸以上';
        break;
      case 8:
        return  '150寸以上';
        break;
      default:
        break;
    }
  }

/**
 * 显示加油站名字
 */
const addGasName = () => {
  if (state.gasDistrictNameList.length === 0) return

  for (const item of state.gasDistrictNameList) {
    if(item.stationId !== state.searchStationPosition.stationId) {
      addGasNameMarker(item)
    }
  }
}

/**
 * 添加地图加油站名字标记
 */
const addGasNameMarker = (data: any) => {
  //@ts-ignore
  const textPosition = new LKMap.LngLat(data.lng, data.lat)
  //@ts-ignore
  const text = new LKMap.Text({
    map: state.map,
    position: textPosition,
    text: data.stationName, // 内容
    anchor: 'center',       // 设置文本对齐方式
    draggable: false,       // 是否可拖动
    opacity: 1,             // 设置透明度
    rotation: 0,            // 旋转角度
    style: {                // 自定义样式
      'min-width': '92px',
      'height': '30px',
      'color': '#fff',
      'font-size': '12px',
      'line-height': '25px',
      'text-align': 'center',
      'box-shadow': 'none',
      'background': `url("${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-Gas-station.png") no-repeat 0 0`,
      'background-size': '100% 100%',
    },
  })

  // 添加 加油站id 经纬度
  text.setExtData({
    station: data
  })

  //@ts-ignore
  state.gasNameTextList.push(text)

  text.on('touchend', handleStationIntro)
}

/**
 * 点击加油站名字更换蓝色背景
 */
const handleStationIntro = (e: any) => {

  handleClickTextToBlue(e)

  // 加油站 id 经纬度
  const stationdId = e.target.getExtData().station.stationId
  getStationIntro(stationdId, 'click')
}

/**
 * 点击加油站名字，该加油站名字底部变蓝，并展示加油站简介
 */
const handleClickTextToBlue = (e: any) => {

  // 先重置文字背景
  handleClickTextToReset()

  //@ts-ignore 点击当前名字背景变蓝色
  e.target.setStyle({
    'background': `url("${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-Gas-station-b.png") no-repeat 0 0`,
    'background-size': '100% 100%',
  })

  state.clickStationText = e.target

}

/**
 * 重置文字背景色，默认为红色
 */
const handleClickTextToReset = () => {

  if (!state.clickStationText) {
    return
  }

  //@ts-ignore
  state.clickStationText.setStyle({
    'background': `url("${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-Gas-station.png") no-repeat 0 0`,
    'background-size': '100% 100%',
  })
}

/**
 * 清除加油站名字标记
 */
const clearGasNameMarker = () => {
  state.gasNameTextList.forEach(n => {
    //@ts-ignore
    n && n.remove()
  })
}

/**
 * 加油站简介
 */
const getStationIntro = (stationId: string, event: string) => {
  const params = {
    stationId: stationId,
    lat: state.searchStationPosition.lat, // 用户纬度
    lng: state.searchStationPosition.lng, // 用户经度
  }
  api.miniGasStationInquiry(params).then((res: any) => {
    if (res.status.success) {
       let detailList = [
          { text: '经营状态', value: getState(res.body.optCondition) },
          { text: '加油站星级', value: ''  },
          { text: '广告大屏', value: advText(res.body.advScreen) },
        ]
        for (let index in res.body.properties) {
          detailList.push({ text: index, value: res.body.properties[index] })
        }
      res.body.detailList  = detailList
      state.stationIntro = res.body
      console.log(state.stationIntro)
      state.isShowIntro = true
      //@ts-ignore 地图上添加加油站名字标记
      if(event === 'init') {
        stationSearchText()
      }
    }
  })
}

/**
 * / 添加搜索的加油站标记
 */
const stationSearchText = () => {

  //@ts-ignore
  const textPosition = new LKMap.LngLat(state.stationIntro.lng, state.stationIntro.lat)

  //@ts-ignore
  state.map.setCenter(textPosition)

  //@ts-ignore
  const text = new LKMap.Text({
    map: state.map,
    position: textPosition,
    text: state.stationIntro.stationName, // 内容
    anchor: 'center',       // 设置文本对齐方式
    draggable: false,       // 是否可拖动
    opacity: 1,             // 设置透明度
    rotation: 0,            // 旋转角度
    style: {                // 自定义样式
      'min-width': '92px',
      'height': '30px',
      'color': '#fff',
      'font-size': '12px',
      'line-height': '25px',
      'text-align': 'center',
      'box-shadow': 'none',
      'background': `url("${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-Gas-station-b.png") no-repeat 0 0`,
      'background-size': '100% 100%',
    },
  })

  // 添加 加油站id 经纬度
  text.setExtData({
    station: state.stationIntro
  })

  text.on('touchend', handleStationIntro)

  //@ts-ignore
  state.clickStationText = text
}

/**
 * 右上角筛选
 */
const handleConfirmEmit = (tagSelectList: any) => {

  // 清除地图标记
  clearGasNameMarker()

  getStationListForSearch(state.searchStationName)
  state.isShowIntro = false
}

/**
 * 点击搜索框，跳到 小程序 搜索页面
 */
const toSearchPageForMini = () => {
  //@ts-ignore
  wx.miniProgram.navigateTo({ url: '/pages/search/search' })
}

</script>

<style lang="less" scoped>
.station {
  width: 100%;
  height: 100%;
  overflow: hidden;
  .header {
    font-size: 14px;
    padding: 11px 15px;
    background-color: #fff;
       position: fixed;
    top: 0;
    width: 100%;
    z-index: 9999;
    .search {
      width: 226px;
      height: 29px;
      margin-left: 5px;
      line-height: 24px;
      border-radius: 15px;
      background-color: #FCFCFC;
      border: 2px solid rgba(180, 185, 191, 0.1);
      position: relative;
      top: 1px;
      .search-icon {
        width: 18px;
        height: 18px;
        display: block;
        background: url("../../assets/imgs/search.png") no-repeat 0 0;
        background-size: 100%;
        position: absolute;
        top: 3px;
        left: 12px;
      }
      span {
        color: #c3c7cc;
        font-size: 14px;
        padding-left: 34px;
        font-weight: 400;
      }
    }
  }
  #map {
    flex: 1;
  }
}
</style>
