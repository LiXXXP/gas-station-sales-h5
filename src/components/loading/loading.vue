<template>
  <div class="loading">
    <div>
      <img class="loadingImg" src="../../assets/imgs/loading.gif"/>
      <div>正在加载，请耐心等待...</div>
    </div>
  </div>
</template>

 

<style lang="less" scoped>
.loading {
  width: 100vw;
  position: fixed;
  z-index: 9999;
  top: 30%;

  .loadingImg {
    width: 179px;
    height: 58px;
    display: inline-block;
  }

  >div {
    position: relative;
    z-index: 500;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 12px;

    display: flex;
    justify-content: center;

    >div {
      color: #515151;
      padding-top: 10px;
      font-size: 14px;
      font-weight: 400;
      color: #515151;
    }
  }
}

</style>