<template>
  <div class="intro">
    <Popup
      round
      :overlay="false"
      position="bottom"
      v-model:show="props.isShowIntro"
      :style="{ height: state.height }"
    >
      <!--说明页-->
      <div v-if="state.introState" class="content">
        <div class="slide" @touchstart="touchstart" @touchmove="touchmove"></div>
        <p
          class="title default-title-color"
          @touchstart="touchstart"
          @touchmove="touchmove"
        >{{ props.stationIntro.stationName }}</p>
        <div class="tags" @touchstart="touchstart" @touchmove="touchmove">
          <span class="tag">{{ getState(props.stationIntro.optCondition) }}</span>
          <span class="tag">{{ getStar(props.stationIntro.star) }}</span>
          <span class="tag">{{ getScreen(props.stationIntro.advScreen) }}</span>
        </div>
        <p
          class="address default-body-color"
          @touchstart="touchstart"
          @touchmove="touchmove"
        >{{ props.stationIntro.address }}</p>
        <div
          class="station-img flex flex-only-center"
          v-if="props.stationIntro.pictures.length > 0"
          
        >
          <img
            :src="state.buketUrl + '/' + item"
            v-for="(item,index) in props.stationIntro.pictures"
            :key="item"
            @click.stop="handleImagePreview(index)"
          />
        </div>
        <div class="station-img" v-else @touchstart="touchstart" @touchmove="touchmove">
          <img src="../../assets/imgs/none.png" />
        </div>
        <div
          class="distance"
          @click.stop="handleToNavigation"
        >
          <i class="distance-icon"></i>
          <p class="default-body-color">{{ util.setMorKm(props.stationIntro.distance) }}</p>
        </div>
      </div>
      <!--简介-->
      <div v-if="!state.introState" v-touch:swipe.bottom="handleTouchend">
        <div class="slide"></div>
        <div class="detail" v-if="props.stationIntro">
          <div class="station">
            <div>
              <div class="name default-text-color">{{ props.stationIntro.stationName }}</div>
              <div class="address">{{ props.stationIntro.address }}</div>
            </div>
            <div class="flex flex-only-center flexImg">
              <div
                class="station-img flex flex-only-center"
                v-if="props.stationIntro.pictures.length != 0"
              >
                <img
                  class="titleImg"
                  v-for="(item,index) of props.stationIntro.pictures"
                  :src="state.buketUrl + '/' + item"
                  @click.stop="handleImagePreview(index)"
                />
              </div>
              <img
                class="titleImg"
                v-if="props.stationIntro.pictures.length == 0"
                src="../../assets/imgs/none.png"
              />
            </div>
            <div
              class="distance flex flex-column flex-only-center"
              @click.stop="handleToNavigation"
            >
              <img class="distance-icon" src="../../assets/imgs/distance.png" />
              <span>{{ util.setMorKm(props.stationIntro.distance) }}</span>
            </div>
          </div>
          <div class="detailText">
            <div class="title">站点信息</div>
            <div class="detailList">
              <div
                class="{{state.arrowShow && index == 2 ? 'opacity' : ''}}"
                v-for="(item, index) of props.stationIntro.detailList"
                :key="index"
              >
                <template v-if="state.arrowShow ? index < 3 : true">
                  <span>{{ item.text }}</span>
                  <span>{{ item.value || '-' }}</span>
                </template>
              </div>
            </div>
            <div class="arrowBg">
              <div v-if="state.arrowShow" @click="state.arrowShow = false" class="opacityTo">
                展开
                <Icon name="arrow-down" />
              </div>
              <div v-else @click="state.arrowShow = true">
                收起
                <Icon name="arrow-up" />
              </div>
            </div>
          </div>
          <div class="tab">
            <div class="title">周边快查</div>
            <Grid column-num="5" :border="false">
              <GridItem
                v-for="(item, index) of props.stationIntro.outTags"
                :key="index"
                class="tabText"
                @click="gridBtn(item)"
              >
                <img :src="state.buketUrl + '/' + item.outerIcon" />
                <span>{{ item.tagName }}</span>
              </GridItem>
            </Grid>
          </div>
          <div class="help" @click="addBtn">
            <div class="title flex flex-between">
              站点信息更新
              <Icon name="arrow" style="color: #a4a4a5" />
            </div>
            <span>信息有误？反馈该地点问题</span>
          </div>
        </div>
      </div>
    </Popup>
  </div>
</template>

<script lang="ts" setup>
import { Popup } from 'vant';
import { reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Grid, GridItem, Icon, ImagePreview } from 'vant';
import util from '../../utils/util';

import api from '../../api/api'

const $router = useRouter();

const props = defineProps({
  stationIntro: {
    type: Object,
    default: () => { },
  },
  isShowIntro: {
    type: Boolean,
    default: false,
  },
});

const state = reactive({
  height: '38%', //38
  //@ts-ignore
  buketUrl: import.meta.env.VITE_APP_UCLOUD_BUCKET_URL,
  startX: '',
  startY: '',
  moveX: '',
  moveY: '',
  toPageShow: false,
  introState: true,
  arrowShow: true,
});

watch(() => props.stationIntro, (count, prevCount) => {
  getStationIntro()
})

/**
 * 加油站简介
 */
const getStationIntro = (stationId?: string, event?: string) => {
  const params = {
    stationId: props.stationIntro.stationId,
    lat: localStorage.getItem("lat"), // 用户纬度
    lng: localStorage.getItem("lng"), // 用户经度
  }
  api.miniGasStationInquiry(params).then((res: any) => {
    if (res.status.success) {
      let detailList = [
        { text: '经营状态', value: getState(res.body.optCondition) },
        { text: '加油站星级', value: getStar(res.body.star) },
        { text: '广告大屏', value: advText(res.body.advScreen) },
      ]
      for (let index in res.body.properties) {
        detailList.push({ text: index, value: res.body.properties[index] })
      }
      props.stationIntro.detailList = detailList
    }
  })
}

/**
 * 星级
 */
const getStar = (star: number) => {
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
      return '暂无星级';
      break;
  }
};

// 状态
const getState = (state: number) => {
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
};

/**
 * 点击放大图片
 */
const handleImagePreview = (index: number) => {
  let imgs = []
  for (let item of props.stationIntro.pictures) {
    imgs.push(state.buketUrl + '/' + item)
  }
  ImagePreview({
    images: imgs,
    startPosition: index,
  });
}

/**
 * 广告大屏
 */
const getScreen = (star: number) => {
  switch (star) {
    case 2:
      return '100寸以上';
      break;
    case 4:
      return '120寸以上';
      break;
    case 8:
      return '150寸以上';
      break;
    default:
      return '无广告屏';
      break;
  }
};
const advText = (advScreen: number) => {
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
      return '150寸以上';
      break;
    default:
      break;
  }
}

// 更新信息
const addBtn = () => {
  // $router.push('/updating?id=' + props.stationIntro.stationId);
  let web = `${import.meta.env.VITE_APP_UCLOUD_WEB_URL}/updating&id=${props.stationIntro.stationId}`
  //@ts-ignore
  wx.miniProgram.navigateTo({
    url: `/pages/openWeb/openWeb?updating=${web}`,
  });
};

// 周边
const gridBtn = (item: any) => {
  let web = `${import.meta.env.VITE_APP_UCLOUD_WEB_URL}/ambitus&tagName=${item.tagName}&innerIcon=${item.innerIcon}&lat=${props.stationIntro.lat}&lng=${props.stationIntro.lng}`
  //@ts-ignore
  wx.miniProgram.navigateTo({
    url: `/pages/openWeb/openWeb?ambitus=${web}`,
  });
};

/**
 * 向上滑动，进入站点简介
 */
const touchstart = (e: any) => {
  // 如果你要阻止点击事件，请反注释下一行代码
  e.preventDefault()

  state.startX = e.touches[0].clientX;
  state.startY = e.touches[0].clientY;
};
const touchmove = (e: any) => {
  e.preventDefault()
  state.moveX = e.touches[0].clientX;
  state.moveY = e.touches[0].clientY;
  if (parseInt(state.startY) - parseInt(state.moveY) <= 0) {

  } else {
    if (!state.toPageShow && state.height != '90%') {
      state.toPageShow = true;
      state.introState = false;
      let up = 40;
      const time = setInterval(() => {
        up += 5;
        state.height = up + '%';
        if (up == 90) {
          clearInterval(time);
          state.height = '90%';
          state.toPageShow = false;
        }
      }, 30);
    }
  }
};

const handleTouchend = () => {
  if (!state.toPageShow && state.height == '90%') {
    let up = 90;
    const time = setInterval(() => {
      up -= 5;
      state.height = up + '%';
      if (up == 40) {
        clearInterval(time);
        state.height = '38%'
        state.introState = true
      }
    }, 30);
  }
};

/**
 * 导航路线
 */
const handleToNavigation = () => {
  //@ts-ignore
  wx.miniProgram.navigateTo({
    url: `/pages/openLocation/openLocation?lat=${props.stationIntro.lat}&lng=${props.stationIntro.lng}&name=${props.stationIntro.stationName}&address=${props.stationIntro.address}`,
  });
};
</script>

<style lang="less" scoped>
.intro {
  width: 100px;
  /**detail.less**/
  .detail {
    background: #f7f7f7;
    .arrowBg {
      text-align: center;
      padding-bottom: 10px;
      font-size: 12px;
      font-weight: 400;
      color: #515151;
    }
    .station {
      background: #fff;
      padding: 20px 15px 15px;
      box-sizing: border-box;
      position: relative;
      margin-bottom: 10px;
      overflow: hidden;

      .name {
        font-size: 20px;
        font-weight: 600;
      }

      .address {
        color: #515151;
        font-size: 12px;
        margin: 10px 0;
        .text();
      }

      .distance {
        position: absolute;
        right: 15px;
        top: 20px;

        .distance-icon {
          width: 24px;
          height: 24px;
        }

        span {
          color: #515151;
          font-size: 12px;
        }
      }
      .station-img {
        width: 100%;
        overflow: auto;
        overflow-x: scroll;
        margin-top: 10px;
        padding-bottom: 5px;
      }
      .titleImg {
        width: 160px;
        height: 100px;
        min-width: 160px;
        display: inline-table;
        margin-right: 10px;
        border-radius: 5px;
      }
    }
    .opacityTo {
      opacity: 0.3;
    }
    .opacity {
      opacity: 0.5;
    }
    .detailText {
      background: #fff;
      margin-bottom: 10px;

      .detailList {
        padding: 15px;

        > div {
          display: flex;
          > span:last-child {
            color: #131313 !important;
            opacity: 1 !important;
            flex: 1;
          }
          > span {
            border: 1px solid #f5f5f5;
            display: flex;
            flex: 1;
            padding: 5px 10px;
            font-size: 12px;
            font-weight: 400;
            color: #515151;
            opacity: 0.6;
          }
        }
      }
    }

    .tab {
      width: 100%;
      background: #fff;
      margin-bottom: 10px;

      .tabText {
        img {
          width: 30px;
          height: 30px;
          padding-bottom: 5px;
        }

        span {
          font-size: 12px;
          font-weight: 400;
          color: #515151;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          /*! autoprefixer: off */
          -webkit-box-orient: vertical;
          /*autoprefixer: on */
        }
      }

      .tabBg {
        width: 100%;
        padding: 0 15px;
      }
    }

    .help {
      background: #fff;
      margin-bottom: 10px;

      span {
        font-size: 12px;
        font-weight: 400;
        color: #515151;
        padding: 15px;
        display: inline-block;
      }
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #131313;
      padding: 15px 15px 0 15px;
    }

    .text {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-box-orient: vertical;
      word-break: break-all;
    }
  }
  .content {
    width: 100%;
    padding: 0 15px;
    box-sizing: border-box;
    position: relative;
    z-index: 999;
    .title {
      font-size: 20px;
      font-weight: 600;
    }
    .tags {
      margin: 10px 0;
      .tag {
        color: #fb3834;
        padding: 2px 5px;
        margin-right: 5px;
        border-radius: 2px;
        display: inline-block;
        background-color: rgba(251, 56, 52, 0.1);
      }
    }
    .address {
      font-size: 12px;
    }
    .station-img {
      width: 100%;
      overflow: auto;
      overflow-x: scroll;
      margin-top: 10px;
      padding-bottom: 5px;
      img {
        width: 160px;
        height: 110px;
        min-width: 160px;
        margin-right: 5px;
        border-radius: 4px;
      }
    }
    .distance {
      text-align: center;
      position: absolute;
      top: 15px;
      right: 20px;
      .distance-icon {
        width: 24px;
        height: 24px;
        display: block;
        margin: 0 auto 5px;
        background: url("../../assets/imgs/distance.png") no-repeat 0 0;
        background-size: 100%;
      }
      p {
        font-size: 12px;
      }
    }
  }
  .slide {
    width: 30px;
    height: 10px;
    margin: 10px auto 10px;
    background: url("../../assets/imgs/slide.png") no-repeat 0 0;
    background-size: 100%;
  }
}
</style>
