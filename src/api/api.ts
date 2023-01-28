import http from './http'

/**
 *
 * 进入首页 请求用户接口
 * @param {*} params
 */
const userInfoInquiry = async (params: object) => {
  return await http.postRequest('gas/v1/UserInfoInquiry', params)
}


/**
 *
 * 读取标签列表
 * @param {*} params
 */
const miniTagListInquiry = async (params: object) => {
  return await http.postRequest('gas/v1/MiniTagListInquiry', params)
}

/**
 *
 * 加油站详情查询
 * @param {*} params
 */
const miniGasStationInquiry = async (params: object) => {
  return await http.postRequest('gas/v1/MiniGasStationInquiry', params)
}

/**
 *
 * 加油站数量列表查询
 * @param {*} params
 */
const miniGasStationQuantityListInquiry = async (params: object) => {
  return await http.postRequest('gas/v1/MiniGasStationQuantityListInquiry', params)
}

/**
 *
 * 加油站区域查询
 * @param {*} params
 */
const gasStationDistrictInquiry = async (params: object) => {
  return await http.postRequest('gas/v1/GasStationDistrictInquiry', params)
}

/**
 *
 * 加油站信息更新新增
 * @param {*} params
 */
const miniGasStationCorrectionAddition = async (params: object) => {
  return await http.postRequest('gas/v1/MiniGasStationCorrectionAddition', params)
}

/**
 *
 * 站点信息更新列表
 * @param {*} params
 */
const miniGasStationCorrectionListInquiry = async (params: object) => {
  return await http.postRequest('gas/v1/MiniGasStationCorrectionListInquiry', params)
}

/**
 *
 * 加油站搜索列表查询
 * @param {*} params
 */
const miniGasStationListInquiry = async (params: object) => {
  return await http.postRequest('gas/v1/MiniGasStationListInquiry', params)

}

/**
 *
 * 加油站市区域
 * @param {*} params
 */
const miniGasStationRegionInquiry = async (params: object) => {
  return await http.postRequest('gas/v1/MiniGasStationRegionInquiry', params)
}


export default {
  userInfoInquiry,
  miniTagListInquiry,
  miniGasStationInquiry,
  miniGasStationQuantityListInquiry,
  gasStationDistrictInquiry,
  miniGasStationCorrectionAddition,
  miniGasStationCorrectionListInquiry,
  miniGasStationListInquiry,
  miniGasStationRegionInquiry
}