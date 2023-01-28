/**
* xss防止注入
* @param str 字符串
*/
function transHtml(str: string) {
  if (!str) {
    return '';
  }
  var xssList = [
    '<input',
    '<link',
    '<meta',
    '<img',
    '<bgsound',
    '<layer',
    '<base',
    '<script',
    '<\/script',
    '<table',
    '<\/table',
    '<object',
    '<\/object',
    '<body',
    '<\/body',
    '<iframe',
    '<\/iframe',
    '<div',
    '<\/div',
    '<style',
    '<\/style',
    '<xml',
    '<\/xml',
    '<h1',
    '<\/h1',
    '<h2',
    '<\/h2',
    '<h3',
    '<\/h3',
    '<h4',
    '<\/h4',
    '<h5',
    '<\/h5',
    '<h6',
    '<\/h6',
    '<span',
    '<\/span',
    '<textarea',
    '<\/textarea',
  ];
  let tempStr = str.toLowerCase();
  for (let i = 0; i < xssList.length; i++) {
    if (tempStr.indexOf(xssList[i]) !== -1) {
      str = str.replace(/</g, '&lt;');
      str = str.replace(/>/g, '&gt;');
      break;
    }
  }
  return str;
}

/**
 * 参数求和方法
 */
const sum = (arr: any): any => {
  if (typeof arr === 'undefined' || arr.length === 0) {
    return null
  }
  return arr.reduce((n: string, m: string) => parseInt(n) + parseInt(m))
}

/**
 * 米转换为千米
 * @param m 距离
 * @returns 
 */
const setMorKm = (m: number) => {
  let n = ''
  if (m) {
    if (m >= 1000) {
      n = (m / 1000).toFixed(2) + 'km'
    } else {
      n = m + 'm'
    }
  } else {
    n = '0m'
  }
  return n
}

/**
* 获取url参数
* @param name 参数名字
*/
const getUrlParam = (name: string) => {
  return (
    decodeURIComponent(
      //@ts-ignore
      (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href) || [, ''])[1].replace(/\+/g, '%20')
    ) || null
  )
}

/**
 * 设置title
 * @param title 参数
 */
 function setTitle(title: string) {
  return document.title = title
}

export default {
  transHtml,
  sum,
  setMorKm,
  getUrlParam,
  setTitle
}
