import http from "./interface";
import CryptoJS from "crypto-js";

var issuccess = true;
var errCount = 0;
let loginTimer = null;

function goLogin() {
  // if (loginTimer) {
  //   clearTimeout(loginTimer);
  //   loginTimer = null;
  // }
  uni.removeStorageSync("token");
  uni.removeStorageSync("refreshToken");
  uni.removeStorageSync("userId");
  // loginTimer = setTimeout(function () {
  //   const pages = getCurrentPages();
  //   const currentPage = pages[pages.length - 1];
  //   if (currentPage.route != "pages/login/index") {
  //     uni.navigateTo({
  //       url: "/pages/login/index",
  //     });
  //   }
  // }, 1200);
}

export const $http = (url, method, data, datatype, baseUrl, header) => {
  //设置请求前拦截器
  http.interceptor.request = (config) => {
    // uni.showLoading({
    // 	title:'加载中...'
    // })

    config.header = {
      "content-type":
        datatype == "json"
          ? "application/json;charset=UTF-8"
          : datatype == "formdata"
          ? "multipart/form-data"
          : "application/x-www-form-urlencoded",
      Authorization: "Basic c2FiZXI6c2FiZXJfc2VjcmV0",
      "jwkj-Auth": "bearer " + uni.getStorageSync("token"),
      ...header,
    };
  };
  //设置请求结束后拦截器

  http.interceptor.response = async (response) => {
    //判断返回状态 执行相应操作
    // uni.hideLoading()
    // 请根据后端规定的状态码判定
    if (response.data.code === 401) {
      //token失效
      issuccess = false;
      if (uni.getStorageSync("refreshToken")) {
        await refreshToken(response); //动态刷新token,并重新完成request请求
        if (issuccess) {
          response.data = await $http(
            response.config.url,
            response.config.method,
            {
              ...response.config.data,
            },
            true
          );
        }
        return response.data;
      } else {
        uni.showToast({
          icon: "loading",
          title: "请先登录",
          duration: 1000,
        });
        goLogin();
        return false;
      }
    } else if (response.data.code === 402) {
      uni.showToast({
        icon: "none",
        title: response.data.msg,
        duration: 1000,
      });
      setTimeout(function () {
        uni.reLaunch({
          url: response.data.data,
        });
      }, 1000);
    } else {
      if (response.data.code === 200) {
        return response["data"];
      } else if (response.data.code !== 200 && response.data.msg) {
		  // console.log(response)
        if (response.config.url.includes("/jwkj-auth/oauth/token")) {
          goLogin();
        }
        uni.showToast({
          title: response.data.msg,
          icon: "none",
          duration: 1500,
        });
      } else {
        return response;
      }
    }
  };
  // let token = uni.getStorageSync('token');
  // if(data){
  //     data.token = token;
  // }else{
  //     data = {token: token};
  // }

  return http.request({
    method: method,
    url: url,
    dataType: "json",
    data,
    baseUrl: baseUrl,
  });
};

async function login() {
  //返回login code
  return new Promise((resolve) => {
    uni.login({
      provider: "weixin",
      success(loginRes) {
        resolve(loginRes.code);
      },
      fail() {},
    });
  });
}

async function refreshToken(response, url) {
  errCount++;
  let params = {
    refresh_token: uni.getStorageSync("refreshToken"),
    tenantId: "000000",
    grant_type: "refresh_token",
    scope: "all",
  };
  let res = await postJson("/jwkj-auth/oauth/token", params);
  if (res && res.data.refresh_token && errCount < 3) {
    let config = response.config;
    uni.setStorageSync("token", res.data.access_token);
    uni.setStorageSync("refreshToken", res.data.refresh_token);
    uni.setStorageSync("userId", res.data.user_id);
    config.header["jwkj-Auth"] = "Bearer " + uni.getStorageSync("token");
    issuccess = true;
    errCount = 0;
  } else {
    uni.clearStorage();
    uni.showToast({
      title: "授权失效，请重新登录",
      duration: 1000,
    });
    goLogin();
    issuccess = false;
    errCount = 0;
  }
}

function postJson(url, data, header) {
  //data.token = uni.getStorageSync("token");
  return $http(url, "POST", data);
}

function get(url, data) {
  //data.token = uni.getStorageSync("token");
  return $http(url, "GET", data);
}

function post(url, data) {
  return $http(url, "POST", data, "json");
}
function postlogin(url, data, header) {
  return $http(url, "POST", data, null, null, header);
}
function postFormdata(url, data) {
  return $http(url, "POST", data, "formdata");
}

function put(url, data) {
  return $http(url, "PUT", data, "json");
}

function del(url, data) {
  return $http(url, "DELETE", data, "json");
}
function delBody(url, data) {
  return $http(url, "DELETE", data);
}
/**
 * 返回地址
 * @param params 要上传的文件
 */
async function uploadfile(url, file) {
  var filename = await generateFileName(file);
  var fileTheOne = null;
  const res = await get("/infra/file/presigned-url", { path: filename });
  fileTheOne = { ...res.data.data };
  fileTheOne.path = filename;
  fileTheOne.size = file.size;
  fileTheOne.name = file.name;
  fileTheOne.type = file.type;

  let data;

  // #ifdef MP-WEIXIN
  // 微信小程序使用文件系统管理器
  const fileSystemManager = uni.getFileSystemManager();
  data = await fileSystemManager.readFileSync(file.path);
  // #endif

  // #ifdef H5
  // H5环境使用FileReader读取文件
  data = await readFileAsArrayBuffer(file);
  // #endif

  const upfile = await uni.request({
    url: fileTheOne.uploadUrl, // 你的API接口地址
    data: data, // 请求方法
    header: {
      "content-type": "application/x-www-form-urlencoded",
    },
    method: "PUT",
  });
  delete fileTheOne.uploadUrl;
  const resfile = await post("/infra/file/create", fileTheOne);
  return res;
}

/**
 * 生成文件名称（使用算法SHA256）
 * @param file 要上传的文件
 */
async function generateFileName(file) {
  let data;

  // #ifdef MP-WEIXIN
  // 微信小程序使用文件系统管理器
  const fileSystemManager = wx.getFileSystemManager();
  data = await fileSystemManager.readFileSync(file.path);
  // #endif

  // #ifdef H5
  // H5环境使用FileReader读取文件
  data = await readFileAsArrayBuffer(file);
  // #endif

  const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(data));
  // 计算SHA256
  const sha256 = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
  const ext = file.name.substring(file.name.lastIndexOf("."));

  return `${sha256}${ext}`;
}

/**
 * H5环境读取文件为ArrayBuffer
 * @param file 文件对象
 */
// #ifdef H5
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
// #endif

export default {
  postFormdata,
  postJson,
  get,
  post,
  postlogin,
  put,
  del,
  uploadfile,
  delBody,
};
