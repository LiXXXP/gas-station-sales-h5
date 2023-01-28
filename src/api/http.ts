import axios from 'axios'

//@ts-ignore
const sparkUrl = import.meta.env.VITE_APP_SPARK_URL

const TIMEOUT = 30000 // 设置请求超时时间

// 创建 axios 实例
const server = axios.create({
  //@ts-ignore
  baseURL: sparkUrl, // api 的 base_url
  timeout: TIMEOUT, // request timeout
  responseType: "json",
  // withCredentials: true, // 是否允许带cookie
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'accept': 'application/json',
  }
})
/**
 * 请求拦截器
 */
server.interceptors.request.use(
  config => {
    if (localStorage.getItem("accessToken")) {
      //@ts-ignore
      config.headers.common['accessToken'] = localStorage.getItem("accessToken")
    }
    return config
  },
  (error: object) => {
    return Promise.reject(error)
  }
);

/**
 * 响应拦截器
 */
server.interceptors.response.use(
  response => {
    // 如果返回的状态码为200，说明接口请求成功
    if (response.status === 200 && response.data) {
      return Promise.resolve(response)
    } else {
      return Promise.reject()
    }
  },
  // http请求状态出错提示,直接返回错误data
  error => {
    if (error.response.status) {
      switch (error.response.status) {
        // 401: 未登录 
        // 未登录则跳转 小程序 登录页面 
        case 401:
          localStorage.clear()
          //@ts-ignore
          wx.miniProgram.navigateTo({ url: '/pages/index/index' })
          break;
      }
    }
    return Promise.reject(error)
  }
);

/**
 * get方法
 * @param url
 * @param params
 * @returns {Promise}
 */
function getRequest(url: string, params = {}): Promise<any> {
  let fullUrl = sparkUrl + url;
  return new Promise((resolve, reject) => {
    server.get(fullUrl, {
      params: params
    }).then(response => {
      resolve(response.data)
    }).catch(err => {
      reject(err)
    });
  });
}

/**
 * post请求
 * @param url
 * @param params
 * @returns {Promise}
 */
function postRequest(url: string, params = {}): Promise<any> {
  let fullUrl = sparkUrl + url
  return new Promise((resolve, reject) => {
    const sessionContext = {
      context: {
        channel: "gas-sales-h5",
        entityId: "gas",
        locale: "",
        orgId: "",
        privileges: "",
        roles: "",
        serviceId: "",
        userId: localStorage.getItem("userId") || ""
      },
      ...params
    }
    server.post(fullUrl, sessionContext)
      .then(response => {
        resolve(response.data)
      }).catch(err => {
        reject(err)
      });
  });
}

/**
 * put请求
 * @param url
 * @param params
 * @returns {Promise}
 */
function putRequest(url: string, params = {}): Promise<any> {
  let fullUrl = sparkUrl + url
  return new Promise((resolve, reject) => {
    server.put(fullUrl, params)
      .then(response => {
        resolve(response.data)
      }, err => {
        reject(err)
      });
  });
}

export default{
  getRequest,
  postRequest,
  putRequest
}

