<template>
  <Loading v-if="state.mapLoad" />
  <div class="ambitus">
    <div id="map"></div>
  </div>
  <Popup
    round
    :overlay="false"
    position="bottom"
    v-if="state.stationAroundList.length"
    v-model:show="state.isShowAroundList"
    :style="{ height: 'auto', maxHeight: '45%', background: '#f7f7f7' }"
  >
    <div class="around-content">
      <div
        class="list"
        v-for="item in state.stationAroundList"
        :key="item.properties.name"
        @click="handleClickAroundItem(item)"
      >
        <div class="title flex flex-only-center">
          <i class="map-icon"></i>
          <p class="default-title-color">{{ item.properties.name }}</p>
        </div>
        <p class="default-body-color">距离查询位置 {{ parseInt((Number(item.properties.distance) * 1000)+ '') }} 米</p>
        <p class="default-body-color">{{ item.properties.label }}</p>
      </div>
    </div>
  </Popup>
</template>

<script lang="ts" setup>
import Loading from '../../components/loading/loading.vue'
import { Popup } from 'vant'
import { reactive, onMounted, onUnmounted } from 'vue'

import util from '../../utils/util'

interface stationAroundItem {
  properties: {
    name: string,
    distance: string,
    label: string,
  }
}

const state = reactive({
  popupHeight: '40%',
  map: null, // 地图
  ambitusPosition: { // 加油站 周边信息
    name: util.getUrlParam('tagName'),
    lat: util.getUrlParam('lat'),
    lng: util.getUrlParam('lng'),
    innerIcon: util.getUrlParam('innerIcon')
  },
  stationIconMarker: null,   // 加油站标记
  stationAroungMarkers: [],  // 加油站周边信息标记
  isShowAroundList: true,  // 是否显示周边信息列表
  stationAroundList: [] as Array<stationAroundItem>, // 加油站周边信息列表
  selectAronudMarker: null, // 点击周边信息列表，相应图标
  mapLoad: true
})

onMounted(() => {

  // 初始地图
  initMap()

  // 添加加油站 icon
  addStationIconMarker()

  // 添加周边 5公里内20个周边信息
  addStationAroundMarker(20, 5)

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
  const position = new LKMap.LngLat(state.ambitusPosition.lng, state.ambitusPosition.lat); // 加油站中心点

  //@ts-ignore
  const map = new LKMap.Map("map", {
    center: position,
    zoom: 11
  })
  state.map = map

  state.map.setTouchRotate(false)
  //@ts-ignore 地图加载完成
  state.map.on('load', onLoad);
}

// 地图加载完成
const onLoad = () => {
  state.mapLoad = false
}

/**
 * 添加 加油站 图标
 */
const addStationIconMarker = () => {

  //@ts-ignore 如果加油站图标存在，则先删除图标
  state.stationIconMarker && state.stationIconMarker.remove()

  //@ts-ignore
  const position = new LKMap.LngLat(state.ambitusPosition.lng, state.ambitusPosition.lat) // 加油站中心点

  //@ts-ignore
  const icon = new LKMap.Icon({
    //@ts-ignore
    image: `${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-map-site.svg`,
    //@ts-ignore
    imageSize: new LKMap.Size(55, 55),
  })

  //@ts-ignore
  const marker = new LKMap.Marker({
    position: position,
    anchor: 'bottom',
    icon: icon,
  })

  marker.setMap(state.map)
  state.stationIconMarker = marker
}

/**
 * 添加 加油站 周边信息
 * @param size 添加周边信息的数量
 * @param radius 添加周边信息的公里数
 */
const addStationAroundMarker = (size: number, radius: number) => {

  //@ts-ignore
  const search = new LKMap.PlaceSearch({
    size: size, // 个数
  })

  //@ts-ignore
  const center = new LKMap.LngLat(state.ambitusPosition.lng, state.ambitusPosition.lat) // 加油站中心点

  search.searchNearBy(state.ambitusPosition.name, center, radius, function (status: string, result: []) {
    // console.log('圆形检索-' + state.ambitusPosition.name + '=', status, result)
    // 检索周边信息列表
    state.stationAroundList = result

    // 如果周边图标存在，则先删除图标
    clearAroundMarkers()

    addStationAroundMarkers(result)
  })
}

/**
 * 清除加油站周边标记
 */
const clearAroundMarkers = () => {
  state.stationAroungMarkers.forEach((m: any) => {
    m && m.remove()
  })
}

/**
 * 添加加油站
 */
const addStationAroundMarkers = (result: []) => {

  const markers: any = []

  //@ts-ignore
  let icon = new LKMap.Icon({
    //@ts-ignore
    image: `${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/${state.ambitusPosition.innerIcon}`,
    //@ts-ignore
    imageSize: new LKMap.Size(55, 55),
  })

  for (let i in result) {

    //@ts-ignore
    const position = new LKMap.LngLat(result[i].coordinates[0], result[i].coordinates[1])

    //@ts-ignore
    markers[i] = new LKMap.Marker({
      position: position,
      anchor: 'bottom',
      icon: icon,
    })

    markers[i].setExtData({ pid: result[i] })
    markers[i].setMap(state.map)
  }

  state.stationAroungMarkers = markers
}

/**
 * 点击周边信息列表，地图上相应的图标变大，并追随地图中心点
 */
const handleClickAroundItem = (item: any) => {

  // 先重置图标大小
  resetSelectedMarker()

  const markers = state.stationAroungMarkers

  //@ts-ignore
  const markerList = markers.filter(m => item.properties.id === m.getExtData().pid.properties.id)

  //@ts-ignore
  const icon = new LKMap.Icon({
    //@ts-ignore
    image: `${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/${state.ambitusPosition.innerIcon}`,
    //@ts-ignore
    imageSize: new LKMap.Size(75, 75),
  })

  const marker = markerList[0]
  //@ts-ignore
  marker.setIcon(icon)
  //@ts-ignore
  state.map.setCenter({ lng: item.coordinates[0], lat: item.coordinates[1] })
  state.selectAronudMarker = marker
}

/**
 * 重置地图图标大小
 */
const resetSelectedMarker = () => {

  if (!state.selectAronudMarker) {
    return
  }

  //@ts-ignore
  const icon = new LKMap.Icon({
    //@ts-ignore
    image: `${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/${state.ambitusPosition.innerIcon}`,
    //@ts-ignore
    imageSize: new LKMap.Size(55, 55),
  })

  //@ts-ignore
  state.selectAronudMarker.setIcon(icon)
}

</script>

<style lang="less" scoped>
.ambitus {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.around-content {
  padding: 8px 10px;
  box-sizing: border-box;
  background-color: #f7f7f7;
  .list {
    padding: 15px 10px;
    border-radius: 4px;
    margin-bottom: 8px;
    box-sizing: border-box;
    background-color: #fff;
    .title {
      .map-icon {
        width: 16px;
        height: 16px;
        margin-right: 5px;
        background: url("../../assets/imgs/map.png") no-repeat 0 0;
        background-size: 100%;
      }
      .default-title-color {
        font-size: 14px;
        font-weight: 600;
      }
    }
    .default-body-color {
      margin-top: 5px;
      padding-left: 21px;
    }
  }
}
</style>
