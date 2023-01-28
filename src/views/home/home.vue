<template>
  <div class="home">
    <div class="header flex flex-between flex-only-center">
      <City />
      <div class="search" @click="toSearchPageForMini">
        <i class="search-icon"></i>
        <span>请输入搜索关键词</span>
      </div>
      <Selection @handleConfirmEmit="handleConfirmEmit" />
    </div>
    <div id="map"></div>
    <div class="handles">
      <div class="block" @click="handleResetMap">
        <i class="reset-icon"></i>
        <p class="default-title-color">重置</p>
      </div>
      <div class="block" @click="handlePositionMap">
        <i class="position-icon"></i>
        <p class="default-title-color">定位</p>
      </div>
    </div>
  </div>
  <Intro
    :stationIntro="state.stationIntro"
    :isShowIntro="state.isShowIntro"
  />
  <Loading v-if="state.mapLoad" />
</template>

<script lang="ts" setup>
import City from '../../components/City/index.vue';
import Selection from '../../components/Selection/index.vue';
import Intro from '../../components/Intro/index.vue';
import Loading from '../../components/loading/loading.vue';

import { onMounted, onUnmounted, reactive, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

import api from '../../api/api';
import util from '../../utils/util';
import selectData from '../../components/Selection/selection';

/**
 * 首页地图交互流程：
 * 1，进入页面默认显示区域加油站数量汇总
 * 2，微信小程序授权个人位置，在地图上显示个人定位（微信小程序传参给h5）
 * 3，重置按钮：回到首页初始状态
 * 4，定位按钮：定位到个人位置坐标，地图放大到12级，显示加油站名字，增加附近加油站入口
 * 5，点击 或者 放大 区域聚合点，地图放大层级，显示加油站图标,
 * 6，点击加油站图标，该图标变大，并展示加油站简介
 * 7，再放大地图层级，去掉加油站图标，显示加油站名字
 * 8，点击加油站名字，该加油站名字底部变蓝，并展示加油站简介
 * 9，每缩放地图层级，显示该层级对应的展示方式（ >9: 默认，<9, <12: 图标，<12: 名字）
 * 10，地图12层级时，增加附近加油站入口，点击进入加油站列表（调起小程序）
 * 11，右上角筛选按钮
 * 12，离开页面，销毁地图
 * 13，点击地图空白处，简介收回（新增）
 */
const $route = useRoute();

const state = reactive({
	map: null, // 地图
	geocoder: null,
	gasTotalSum: [], // 地图默认聚合点列表，区域汇总数量
	totalSumTextList: [], // 区域点聚合汇总数量
	gasDistrictIconList: [], // 区域 加油站图标 列表
	gasDistrictMarkerList: [], // 区域加油站标记
	gasDistrictStationNameList: [], // 区域加油站名字标记
	cityId: 0,
	districtId: 0, // 区域 id
	zoom: 8, // 地图缩放层级，默认
	stationIntro: {}, // 加油站简介
	isShowIntro: false, // 是否显示加油站简介
	tagSelectList: selectData.tagSelectList, // 筛选标签的id列表
	userPosition: {
		// 个人定位
		lat: localStorage.getItem('lat'),
		lng: localStorage.getItem('lng'),
	},
	stationNearbyText: null, // 附近加油站 标记
	selectedGasIconMarker: null, // 点击的加油站标记
	selectedGasNameMarker: null, // 点击的加油站名称
	userPositonMarker: null, // 个人定位标记
	zoomUpdate: [],
	mapLoad: true,
	route: {},
  dragPosition: { // 拖拽经纬度
    lat: '',
		lng: '',
    range: 20000
  }
});

onMounted(() => {
  state.districtId = 110101;

  state.cityId = 110100;

  // 1，初始地图
  initMap();

  // 1，请求加油站区域汇总数量
  initGas();

	if (localStorage.getItem('userId')) {
		// 初始个人信息
		initUserInfo();
	}

	// 获取是否授权定位
	state.route = $route.query;
});

onUnmounted(() => {
  // 7, 销毁地图
  if (!state.map) {
    return;
  }
  //@ts-ignore
  state.map.destroy();
});

// 地图加载完成
const onLoad = () => {
  state.mapLoad = false;
};

/**
 * 1，进入首页 请求用户信息 验证userid
 */
const initUserInfo = () => {
  let params = {
    userId: localStorage.getItem('userId'),
  };
  api.userInfoInquiry(params).then((res) => {
    if (res.status.success) {
      localStorage.userId = res.body.id;
    }
  });
};

/**
 * 1, 初始化地图
 */
const initMap = () => {
  //@ts-ignore
  const position = new LKMap.LngLat(116.39800739556716, 39.90769032003752); // 北京市中心
  //@ts-ignore
  const map = new LKMap.Map('map', {
    center: position,
    zoom: state.zoom,
    dragRotate: false
  });
  state.map = map;

  state.map.setTouchRotate(false)

  //@ts-ignore 初始化 Geocoder
  state.geocoder = new LKMap.Geocoder({
    adcode: 110000, // 初始值
    size: 1, // 返回结果数量
  });

  //@ts-ignore 地图加载完成
  state.map.on('load', onLoad);

  //@ts-ignore 绑定地图缩放事件
  state.map.on('zoomend', onZoomEnd);

  //@ts-ignore 绑定地图拖动事件
  state.map.on('touchend', onTouchEnd);

  // 增加个人定位标记
  addUserPosition();
};

/**
 * 1, 首页区域加油站聚合数
 */
const initGas = () => {
  const params = {
    cityId: '110100', // 城市
    advScreen: util.sum(state.tagSelectList[0].selected), // 广告大屏
    outTags: state.tagSelectList[1].selected, // 标签选择
    stars: util.sum(state.tagSelectList[2].selected), // 星级
    optCondition: util.sum(state.tagSelectList[3].selected), // 经营状况
    brands: util.sum(state.tagSelectList[4].selected), // 品牌
  };
  api.miniGasStationQuantityListInquiry(params).then((res: any) => {
    if (res.status.success) {
      state.gasTotalSum = res.body.dataList;
      addMarkers();
    }
  });
};

/**
 * 1, 添加地图聚合点 汇总数据
 */
const addMarkers = () => {
  if (state.gasTotalSum.length === 0) return;
  for (const item of state.gasTotalSum) {
    addTotalSumText(item);
  }
};

/**
 * 1, 清除地图聚合点 汇总数据
 */
const clearTotalSumText = () => {
  state.totalSumTextList.forEach((s) => {
    //@ts-ignore
    s && s.remove();
  });
  state.totalSumTextList = [];
};

/**
 * 1, 添加地图聚合点 汇总数据 文本标记
 */
const addTotalSumText = (data: any) => {
  //@ts-ignore
  const textPosition = new LKMap.LngLat(data.lng, data.lat);
  //@ts-ignore
  const text = new LKMap.Text({
    map: state.map,
    position: textPosition,
    text: `<span>${data.districtName}</span><span>${data.quantity}</span>`, // 内容
    anchor: 'center', // 设置文本对齐方式
    draggable: true, // 是否可拖动
    opacity: 1, // 设置透明度
    rotation: 0, // 旋转角度
    style: {
      // 自定义样式
      opacity: 1,
      'border-radius': '100%',
      background: 'linear-gradient(90deg, #FF4D69 0%, #FA301F 100%)',
      'box-shadow': '0px 2px 2px 0px rgba(251, 56, 52, 0.2)',
      'text-align': 'center',
      'font-size': '14px',
      color: '#fff',
      width: '64px',
      height: '64px',
      display: 'flex',
      'flex-direction': 'column',
      'justify-content': 'center',
      'z-index': '100',
    },
  });
  // 设置 区域 id
  text.setExtData({ districtId: data.districtId });

  text.on('touchend', handleTextClick);

  //@ts-ignore
  state.totalSumTextList.push(text);
};

/**
 * 9, 获取当前地图级别
 * 根据缩放级别，移动地图坐标，显示不同 聚合点
 */
const onZoomEnd = () => {
  
  //@ts-ignore
  const { lng, lat } = { ...state.map.getCenter() };
  state.dragPosition.lat = lat
  state.dragPosition.lng = lng

  //@ts-ignore
  state.zoom = parseInt(state.map.getZoom());

  // OK
  if (state.zoom > 6 && state.zoom <= 8) {
    if (!state.zoomUpdate.includes(state.zoom)) {
      state.zoomUpdate = [6, 7, 8];
      // 清除地图标记
      clearMap();
      addMarkers();
      state.isShowIntro = false;

      // 清除点击了的加油站图标
      state.selectedGasIconMarker = null;
    }
  }
  if (state.zoom > 8 && state.zoom <= 11) {
    if (!state.zoomUpdate.includes(state.zoom)) {
      state.zoomUpdate = [9, 10, 11];
      // 清除地图标记
      clearMap();
      fetchGasIconAddMarker();
    }
  }
  if (state.zoom > 11 && state.zoom <= 18) {
    if (!state.zoomUpdate.includes(state.zoom)) {
      state.zoomUpdate = [12, 13, 14, 15, 16, 17, 18];
      // 清除地图标记
      clearMap();

      // 清除点击了的加油站图标
      state.selectedGasIconMarker = null;

      // 在区域编号没有发生变化的情况下，加油站列表并没有发生变化，所以可以直接基于9 10 11层的加油站数据，将加油站的名称进行渲染
      addGasName();

      // 增加附近加油站入口
      addStationNearby();
    }
  }
};

/**
 * 地图拖动事件
 */
const onTouchEnd = () => {

  state.isShowIntro = false
  // 重置图标大小
  handleClickIconToReset();

  //@ts-ignore
  const { lng, lat } = { ...state.map.getCenter() };
  state.dragPosition.lat = lat
  state.dragPosition.lng = lng

  //@ts-ignore
  const center = new LKMap.LngLat(lng, lat);

  //@ts-ignore
  state.geocoder.getAddress(center, function (status: any, result: any) {
    if (state.zoom > 6 && state.zoom <= 8) {
      // 区编号 county_id 市编号city_id 省编号 province_id
      if (state.cityId == result[0].properties.city_id) return;

      // 区域id
      state.cityId = result[0].properties.city_id;

      // 清除地图标记
      clearMap();

      // 获取城市中每个区的加油站汇总数据，并渲染在7 8 9 层
      fetchGasCityStatistic();

      return;
    }

    if (state.zoom > 8 && state.zoom <= 11) {
      // 区编号 county_id 市编号city_id 省编号 province_id
      if (state.districtId == result[0].properties.county_id) return;

      // 区域id
      state.districtId = result[0].properties.county_id;

      // 清除点击了的加油站图标
      state.selectedGasIconMarker = null;

      clearMap();

      fetchGasIconAddMarker();
    }

    if (state.zoom > 11) {
      // 区编号 county_id 市编号city_id 省编号 province_id
      if (state.districtId == result[0].properties.county_id) return;

      // 区域id
      state.districtId = result[0].properties.county_id;

      clearMap();

      fetchGasNameAddMarker();
    }
  });
};

/**
 * 3，重置按钮：回到首页初始状态
 */
const handleResetMap = (): void => {
  // 清除地图标记
  clearMap();

  state.zoom = 8;
  //@ts-ignore 地图缩放到 9 级
  state.map.setZoom(state.zoom);
  addMarkers();
};

/**
 * 4，定位按钮：定位到个人位置坐标，地图放大到12级，
 *   显示加油站名字，增加附近加油站入口
 */
const handlePositionMap = () => {
	// 没有授权位置
 
	if (state.route.position == 'true') {
 
    // 跳转小程序
    	//@ts-ignore
	  wx.miniProgram.navigateTo({ url: '/pages/position/position' });
	} else {
 
		// 清除地图标记
		clearMap();

		//@ts-ignore 设置个人位置的经纬度
		const currentCenter = new LKMap.LngLat(state.userPosition.lng, state.userPosition.lat);
		//@ts-ignore
		state.map.setCenter(currentCenter);

		state.zoom = 12;

		//@ts-ignore 地图放大到 12 级
		state.map.setZoom(state.zoom);

		// 增加个人定位标记
		addUserPosition();

		// 增加附近加油站入口
		addStationNearby();

    // @ts-ignore
		state.geocoder.getAddress(currentCenter, function (status: any, result: any) {
			state.districtId = result[0].properties.county_id;

			fetchGasNameAddMarker();
		});
	}
};

/**
 * 4, 添加个人定位标记
 */
const addUserPosition = () => {
  //@ts-ignore
  const position = new LKMap.LngLat(state.userPosition.lng, state.userPosition.lat); // 个人定位

  //@ts-ignore 加油站 icon
  const icon = new LKMap.Icon({
    image: `${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-positioning.png`,
    //@ts-ignore
    imageSize: new LKMap.Size(36, 36),
  });

  //@ts-ignore
  const marker = new LKMap.Marker({
    position: position,
    anchor: 'bottom',
    icon: icon,
    zIndex: 9999,
  });

  marker.setMap(state.map);

  state.userPositonMarker = marker;
};

/**
 * 4，增加附近加油站入口
 */
const addStationNearby = () => {
  if (state.stationNearbyText) {
    //@ts-ignore
    state.stationNearbyText && state.stationNearbyText.remove();
  }

  //@ts-ignore 添加附近加油站入口
  const position = new LKMap.LngLat(state.userPosition.lng, state.userPosition.lat); // 个人定位
  //@ts-ignore
  const text = new LKMap.Text({
    map: state.map,
    position: position,
    text: '附近加油站',
    style: {
      width: '95px',
      height: '34px',
      color: '#FB3834',
      'font-size': '12px',
      'line-height': '30px',
      'margin-top': '-70px',
      'box-shadow': 'none',
      'padding-left': '10px',
      'box-sizing': 'border-box',
      'background': `url("${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-near.png") no-repeat 0 0`,
      'background-size': '100% 100%',
    },
  });
  text.on('touchend', handleToMiniStation);

  state.stationNearbyText = text;
};

/**
 * 4，点击附近加油站入口，进入小程序加油站页面
 */
const handleToMiniStation = () => {
  //@ts-ignore
  wx.miniProgram.switchTab({ url: '/pages/station/station' });
};

/**
 * 5，点击区域的聚合点，放大地图层级，展示加油站图标
 */
const handleTextClick = (e: any) => {
  //@ts-ignore 地图区域放大
  state.map.setZoom(10);

  //@ts-ignore 更改地图中心点
  state.map.setCenter({
    lng: e.target.options.position.lng,
    lat: e.target.options.position.lat,
  });

  // 区域id
  // state.districtId = e.target.getExtData().districtId;
  state.dragPosition.lat = e.target.options.position.lat
  state.dragPosition.lng = e.target.options.position.lng

  // 地图放大一个层级，10， 显示区域加油站图标
  // 清除地图标记
  clearMap();

  fetchGasIconAddMarker();
};

/**
 * 5，获取区域id，展示加油站图标
 */
const getDistrictStationIcon = (event: string) => {
  const params = {
    // districtId: state.districtId, // 区域id
    lat: state.dragPosition.lat,
    lng: state.dragPosition.lng,
    range: state.dragPosition.range,
    advScreen: util.sum(state.tagSelectList[0].selected), // 广告大屏
    outTags: state.tagSelectList[1].selected, // 标签选择
    stars: util.sum(state.tagSelectList[2].selected), // 星级
    optCondition: util.sum(state.tagSelectList[3].selected), // 经营状况
    brands: util.sum(state.tagSelectList[4].selected), // 品牌
  };
  api.gasStationDistrictInquiry(params).then((res: any) => {
    if (res.status.success) {
      state.gasDistrictIconList = res.body.dataList;
      if (event === 'click') {
        // 添加加油站图标标记
        addGasIcon();
      }
      if (event === 'zoom') {
        // 添加加油站名字标记
        addGasName();
      }
    }
  });
};

const fetchGasNameAddMarker = () => {
  const params = {
    // districtId: state.districtId, // 区域id
    lat: state.dragPosition.lat,
    lng: state.dragPosition.lng,
    range: state.dragPosition.range,
    advScreen: util.sum(state.tagSelectList[0].selected), // 广告大屏
    outTags: state.tagSelectList[1].selected, // 标签选择
    stars: util.sum(state.tagSelectList[2].selected), // 星级
    optCondition: util.sum(state.tagSelectList[3].selected), // 经营状况
    brands: util.sum(state.tagSelectList[4].selected), // 品牌
  };
  api.gasStationDistrictInquiry(params).then((res: any) => {
    if (res.status.success) {
      state.gasDistrictIconList = res.body.dataList;
      // 添加加油站名字标记
      addGasName();
    }
  });
};

const fetchGasCityStatistic = () => {
  const params = {
    cityId: state.cityId, // 城市
    advScreen: util.sum(state.tagSelectList[0].selected), // 广告大屏
    outTags: state.tagSelectList[1].selected, // 标签选择
    stars: util.sum(state.tagSelectList[2].selected), // 星级
    optCondition: util.sum(state.tagSelectList[3].selected), // 经营状况
    brands: util.sum(state.tagSelectList[4].selected), // 品牌
  };
  api.miniGasStationQuantityListInquiry(params).then((res: any) => {
    if (res.status.success) {
      state.gasTotalSum = res.body.dataList;
      addMarkers();
    }
  });
};

// 根据预期编号或者筛选条件查询区域下的所有加油站，并将加油站图标分类（有广告屏和无广告屏幕的加油站）渲染在图标上
const fetchGasIconAddMarker = () => {
  // 获取区域加油站图标
  const params = {
    // districtId: state.districtId, // 区域id
    lat: state.dragPosition.lat,
    lng: state.dragPosition.lng,
    range: state.dragPosition.range,
    advScreen: util.sum(state.tagSelectList[0].selected), // 广告大屏
    outTags: state.tagSelectList[1].selected, // 标签选择
    stars: util.sum(state.tagSelectList[2].selected), // 星级
    optCondition: util.sum(state.tagSelectList[3].selected), // 经营状况
    brands: util.sum(state.tagSelectList[4].selected), // 品牌
  };
  api.gasStationDistrictInquiry(params).then((res: any) => {
    if (res.status.success) {
      state.gasDistrictIconList = res.body.dataList;
      // 添加加油站图标标记
      addGasIcon();
    }
  });
};

/**
 * 5，添加加油站图标
 */
const addGasIcon = () => {
  if (state.gasDistrictIconList.length === 0) return;

  for (const item of state.gasDistrictIconList) {
    addGasIconMarker(item);
  }
};

/**
 * 5，在地图上添加标记
 */
const addGasIconMarker = (data: any) => {
  //@ts-ignore
  const position = new LKMap.LngLat(data.lng, data.lat);

  let iconUrl =
    data.advScreen === 1
      ? `${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-No-advertising.png`
      : `${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-There-are-ads.png`;

  //@ts-ignore 加油站 icon
  const icon = new LKMap.Icon({
    image: iconUrl,
    //@ts-ignore
    imageSize: new LKMap.Size(40, 40),
  });

  //@ts-ignore
  const marker = new LKMap.Marker({
    position: position,
    anchor: 'bottom',
    icon: icon,
  });

  marker.setMap(state.map);

  // 添加 加油站id 经纬度
  marker.setExtData({
    station: data,
  });

  // 给加油站图标添加点击事件
  marker.on('click', handleGasIconClick);

  //@ts-ignore
  state.gasDistrictMarkerList.push(marker);
};

/**
 * 5，清除加油站图标标记
 */
const clearGasIconMarker = () => {
  state.gasDistrictMarkerList.forEach((m) => {
    //@ts-ignore
    m && m.remove();
  });
  state.gasDistrictMarkerList = [];
};

/**
 * 6，点击加油站图标，该图标变大，并展示加油站简介
 */
const handleGasIconClick = (e: any) => {

  // 点击加油站图标变大
  handleClickIconToBig(e);

  // 加油站 id
  const stationId = e.target.getExtData().station.stationId;

  fetchStationAndShowInfo(stationId);
};

const handleGasNameClick = (e: any) => {
  handleGasNameToBlue(e);

  // 加油站 id
  const stationId = e.target.getExtData().station.stationId;

  fetchStationAndShowInfo(stationId);
};

/**
 * 8，点击加油站名字，该加油站名字底部变蓝，并展示加油站简介
 */
const handleGasNameToBlue = (e: any) => {
  // 先重置文字背景
  handleClickTextToReset();

  state.selectedGasNameMarker = e.target;

  //@ts-ignore 点击当前名字背景变蓝色
  e.target.setStyle({
    background: `url("${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-Gas-station-b.png") no-repeat 0 0`,
    'background-size': '100% 100%',
  });
};

/**
 * 8，重置文字背景色，默认为红色
 */
const handleClickTextToReset = () => {
  if (!state.selectedGasNameMarker) {
    return;
  }

  //@ts-ignore
  state.selectedGasNameMarker.setStyle({
    background: `url("${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-Gas-station.png") no-repeat 0 0`,
    'background-size': '100% 100%',
  });
};

/**
 * 6，点击加油站图标变大
 */
const handleClickIconToBig = (e: any) => {
  // 先重置图标大小
  handleClickIconToReset();

  // 将被点击的加油站图标存起来
  state.selectedGasIconMarker = e.target;

  //@ts-ignore 点击当前图标变大
  const icon = new LKMap.Icon({
    image: e.target.getIcon().image,
    //@ts-ignore
    imageSize: new LKMap.Size(55, 55),
  });

  //@ts-ignore
  state.selectedGasIconMarker.setIcon(icon);
};

/**
 * 6，点击加油站图标变大，其余恢复默认
 */
const handleClickIconToReset = () => {
  if (!state.selectedGasIconMarker) {
    return;
  }

  //@ts-ignore
  let iconUrl = state.selectedGasIconMarker.extData.station.advScreen === 1 ?
    `${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-No-advertising.png` :
    `${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-There-are-ads.png`;

  //@ts-ignore
  const icon = new LKMap.Icon({
    //@ts-ignore
    image: iconUrl,
    //@ts-ignore
    imageSize: new LKMap.Size(40, 40),
  });
  //@ts-ignore
  state.selectedGasIconMarker.setIcon(icon);
};

/**
 * 6，加油站简介
 */
const fetchStationAndShowInfo = (stationId: string) => {
  const params = {
    stationId: stationId,
    lat: state.userPosition.lat,
    lng: state.userPosition.lng,
  };
  api.miniGasStationInquiry(params).then((res: any) => {
    if (res.status.success) {
      state.stationIntro = res.body;
      state.isShowIntro = true;
    }
  });
};

/**
 * 7，再放大地图层级，去掉加油站图标，显示加油站名字
 */
const addGasName = () => {
  if (state.gasDistrictIconList.length === 0) return;

  for (const item of state.gasDistrictIconList) {
    addGasNameMarker(item);
  }
};

/**
 * 7，添加地图加油站名字标记
 */
const addGasNameMarker = (data: any) => {
  //@ts-ignore
  const textPosition = new LKMap.LngLat(data.lng, data.lat);
  //@ts-ignore
  const text = new LKMap.Text({
    map: state.map,
    position: textPosition,
    text: data.stationName, // 内容
    anchor: 'bottom', // 设置文本对齐方式
    draggable: false, // 是否可拖动
    opacity: 1, // 设置透明度
    rotation: 0, // 旋转角度
    style: {
      // 自定义样式
      'min-width': '92px',
      height: '30px',
      color: '#fff',
      'font-size': '12px',
      'line-height': '25px',
      'text-align': 'center',
      'box-shadow': 'none',
      background: `url("${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-Gas-station.png") no-repeat 0 0`,
      'background-size': '100% 100%',
    },
  });

  // 添加 加油站id 经纬度
  text.setExtData({
    station: data,
  });

  text.on('touchend', handleGasNameClick);

  //@ts-ignore
  state.gasDistrictStationNameList.push(text);
};

/**
 * 7，清除加油站名字标记
 */
const clearGasNameMarker = () => {
  state.gasDistrictStationNameList.forEach((n) => {
    //@ts-ignore
    n && n.remove();
  });
  state.gasDistrictStationNameList = [];
};

/**
 * 11，右上角筛选
 */
const handleConfirmEmit = (tagSelectList: any) => {
  // 初始化
  state.zoom = 8;
  //@ts-ignore
  state.map.setZoom(8);

  // 清除地图标记
  clearMap();

  initGas();

  state.isShowIntro = false;

  // if (state.zoom < 9) {
  //   initGas();
  // }
  // if (state.zoom >= 9 && state.zoom < 12) {
  //   getDistrictStationIcon('click');
  // }
  // if (state.zoom >= 12) {
  //   getDistrictStationIcon('zoom');
  // }
  
};

/**
 * 12, 清除地图标记
 */
const clearMap = () => {
  clearTotalSumText();
  clearGasIconMarker();
  clearGasNameMarker();
  //@ts-ignore 清除点击加油站标记
  state.selectedGasIconMarker && state.selectedGasIconMarker.remove();
  //@ts-ignore
  state.stationNearbyText && state.stationNearbyText.remove();
};

/**
 * 点击搜索框，跳到 小程序 搜索页面
 */
const toSearchPageForMini = () => {
  //@ts-ignore
  wx.miniProgram.navigateTo({ url: '/pages/search/search' });
};
</script>

<style lang="less" scoped>
.home {
  width: 100%;
  height: 100%;
  z-index: 999;
  .header {
    font-size: 14px;
    padding: 11px 15px 10px 20px;
    background-color: #fff;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 9999;
    .search {
      width: 232px;
      height: 30px;
      margin-left: 5px;
      line-height: 30px;
      border-radius: 15px;
      box-sizing: border-box;
      background-color: #FCFCFC;
      border: 1px solid rgba(180, 185, 191, 0.1);
      position: relative;
      top: 1px;
      .search-icon {
        width: 18px;
        height: 18px;
        display: block;
        background: url("../../assets/imgs/search.png") no-repeat 0 0;
        background-size: 100%;
        position: absolute;
        top: 5px;
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
  .handles {
    position: fixed;
    right: 15px;
    bottom: 20px;
    z-index: 999;
    .block {
      width: 40px;
      height: 60px;
      padding: 10px 0;
      margin-top: 10px;
      border-radius: 4px;
      text-align: center;
      box-sizing: border-box;
      background-color: #fff;
      box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.06);
      .reset-icon {
        width: 20px;
        height: 20px;
        display: block;
        margin: 0 auto 5px;
        background: url("../../assets/imgs/reset.png") no-repeat 0 0;
        background-size: 100%;
      }
      .position-icon {
        width: 20px;
        height: 20px;
        display: block;
        margin: 0 auto 5px;
        background: url("../../assets/imgs/position.png") no-repeat 0 0;
        background-size: 100%;
      }
      .default-title-color {
        font-size: 12px;
      }
    }
  }
}
</style>
