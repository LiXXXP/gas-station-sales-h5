<template>
  <Loading v-if="state.mapLoad"/>
	<div class="updating">
		<div class="block">
			<div class="title default-title-color">站点名称</div>
			<div id="map"></div>
		</div>
		<div class="block">
			<div class="title default-title-color flex flex-only-center">
				<span>申报原因</span>
				<span class="sign">*</span>
			</div>
			<Field
				rows="4"
				autosize
				size="large"
				maxlength="300"
				type="textarea"
				show-word-limit
				class="field"
				v-model="state.content"
				placeholder="请输入详细的更新原因，有助于加速审核～"
			/>
		</div>
		<div class="block">
			<div class="title default-title-color flex flex-between flex-only-center">
				<span>图片上传</span>
				<span class="upload-img-number">{{ state.uploadImgList.length }}/9</span>
			</div>
			<p class="hint">请确保图片清晰可见</p>
			<Uploader v-model="state.uploadImgList" :before-read="beforeRead"   max-count="9" preview-size="118px" />
		</div>
		<div class="block">
			<Button
				class="submit"
				round
				type="primary"
				text="提交"
				:loading="state.addLoading"
				loading-text="提交中..."
				:disabled="state.disabled"
				@click="submitUpdata"
			></Button>
		</div>
	</div>
</template>

<script lang="ts" setup>

import { Field, Button, Uploader, Toast } from 'vant';
import { reactive, onMounted, onUnmounted } from 'vue';

import Loading from '../../components/loading/loading.vue'

import api from '../../api/api';
import util from '../../utils/util';
import ImageCompressor from 'image-compressor.js';

const state = reactive({
	map: null,
	stationPosition: {
		// 加油站
		stationId: util.getUrlParam('id') || '', // 加油站 id 小程序传入
		lat: localStorage.getItem('lat'),
		lng: localStorage.getItem('lng'),
	},
	stationIntro: {
		// 加油站详情
		stationName: '',
		address: '',
	},
	content: '', // 申报原因
	ufile: null, // ucloud
	//@ts-ignore
	buketName: import.meta.env.VITE_APP_UCLOUD_BUCKET_NAME,
	//@ts-ignore
	buketUrl: import.meta.env.VITE_APP_UCLOUD_BUCKET_URL,
	uploadImgList: [], // 上传图片列表
	disabled: false, // 提交按钮 禁止点击
	addLoading: false,
  mapLoad:true
});

onMounted(() => {
	// 初始地图
	getStationIntro(state.stationPosition.stationId);

	//@ts-ignore ucloud
	state.ufile = new window.UCloudUFile(state.buketName, state.buketUrl);
});

onUnmounted(() => {
	// 销毁地图
	if (!state.map) {
		return;
	}
	//@ts-ignore
	state.map.destroy();
});

/**
 * 初始化地图
 */
const initMap = () => {
	//@ts-ignore
	const position = new LKMap.LngLat(state.stationIntro.lng, state.stationIntro.lat); // 加油站中心点

	//@ts-ignore
	const map = new LKMap.Map('map', {
		center: position,
		zoom: 14,
	});

	//@ts-ignore 添加加油站icon
	const icon = new LKMap.Icon({
		image: `${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/Icon-location.png`,
		//@ts-ignore
		imageSize: new LKMap.Size(30, 30),
	});
	//@ts-ignore
	const marker = new LKMap.Marker({
		position: position,
		anchor: 'top',
		icon: icon,
	});
	marker.setMap(map);

	//@ts-ignore 添加加油站名字，地址
	const text = new LKMap.Text({
		position: position,
		text: `<p style="color: #131313;font-weight:600;font-size:14px;">${state.stationIntro.stationName}</p><p style="color:#515151;font-size:12px;padding-top:3px;">${state.stationIntro.address}</p>`,
		style: {
			'width': '315px',
      'min-height': '92px',
      'height': 'auto',
			'padding': '12px 15px',
			'line-height': '30px',
			'margin-top': '-90px',
			'margin-left': '-5px',
      'word-break': 'normal',
      'text-overflow': 'clip',
			'box-sizing': 'border-box',
			'word-wrap': 'break-word',
			'white-space': 'pre-line',
      'box-shadow': 'none',
      'background': `url("${import.meta.env.VITE_APP_UCLOUD_BUCKET_URL}/assets/shape-group.png") no-repeat 0 0`,
			'background-size': '100% 100%',
		},
	});
	text.setMap(map);

	state.map = map;

  state.map.setTouchRotate(false)
    //@ts-ignore 地图加载完成
  state.map.on('load', onLoad);
};

// 地图加载完成
const onLoad = () =>{
  state.mapLoad = false
} 

/**
 * 加油站详情
 */
const getStationIntro = (stationId: string) => {
	const params = {
		stationId: stationId,
		lat: state.stationPosition.lat, // 加油站纬度
		lng: state.stationPosition.lng, // 加油站经度
	};
	api.miniGasStationInquiry(params).then((res: any) => {
		if (res.status.success) {
			state.stationIntro = res.body;
			initMap();
		}
	});
};

// 图片处理 压缩
const beforeRead = (file: any) => {
	return new Promise((resolve, reject) => {
		new ImageCompressor(file, {
			maxWidth: 1024,
			maxHeight: 1024,
			success(result) {
				resolve(result);
			},
			error(e) {
				reject(e);
			},
		});
	});
};

/**
 * 提交
 */
const submitUpdata = () => {
	if (state.uploadImgList.length === 0 || state.content === '') {
		Toast('请填写申报原因和上传图片');
		return;
	}
	state.addLoading = true;
	state.disabled = true;

	let pictures = [] as Array<string>;

	state.uploadImgList.forEach((f: any) => {
		let filePrefix = new Date().getTime();
		let fullname = f.file.name;
		let file = {
			file: f.file,
			fileRename: 'correction/' + filePrefix + fullname,
		};
		pictures.push(file.fileRename);
		//@ts-ignore
		state.ufile.uploadFile(file, successCallBack, errorCallBack, progressCallBack);
	});

	const params = {
		stationId: state.stationPosition.stationId,
		pictures: pictures,
		content: state.content,
	};

	api.miniGasStationCorrectionAddition(params).then((res) => {
			if (res.status.success) {
				state.disabled = true;
				if (state.disabled) {
					Toast('提交成功');
					state.addLoading = false;
					setTimeout(() => {
            //@ts-ignore
						wx.miniProgram.navigateBack(-1);
					}, 1500);
				}
			} else {
				Toast('申报原因不符合要求，请修改');
				state.addLoading = false;
				state.disabled = false;
			}
		})
		.catch((err) => {
			state.addLoading = false;
			state.disabled = false;
		});
};

const successCallBack = (res: any) => {
	if (state.disabled) {
		Toast('提交成功');
		state.addLoading = false;
		setTimeout(() => {
      //@ts-ignore
			wx.miniProgram.navigateBack(-1);
		}, 1500);
	}
};
const errorCallBack = (res: any) => {
	console.log('errorCallBack:' + res);
};
const progressCallBack = (res: any) => {
	console.log('progressCallBack' + res);
};
</script>

<style lang="less" scoped>
.updating {
	width: 100%;
	height: 100%;
	background-color: #f6f7fd;
	.block {
		padding: 15px;
		margin-bottom: 6px;
		box-sizing: border-box;
		background-color: #fff;
		&:last-child {
			margin-bottom: 0;
		}
		.title {
			font-size: 16px;
			font-weight: 600;
			margin-bottom: 10px;
			.sign {
				color: #fb3834;
			}
			.upload-img-number {
				color: #999;
				font-size: 14px;
			}
		}
		#map {
			width: 100%;
			height: 160px;
			border-radius: 4px;
			background: rgba(0, 0, 0, 0.08);
			box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.1);
		}
		.field {
			background-color: #f7f8fa;
		}
		.hint {
			color: #999;
			font-size: 12px;
			margin: -5px 0 10px;
		}
		.submit {
			color: #fff;
			width: 100%;
			height: 44px;
			font-size: 14px;
			line-height: 44px;
			text-align: center;
			border-radius: 22px;
			border: 0 !important;
			background: linear-gradient(90deg, #ff4d69 0%, #fa301f 100%) !important;
		}
	}
}
</style>
