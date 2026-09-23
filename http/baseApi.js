// 原有系统地址
// const BaseUrl = "http://192.168.2.72:8085"; // 系统 测试地址
// const BaseUrl = "http://192.168.9.153:8085"; // 系统 开发
const BaseUrl = "https://ptaax.fjswxsj.com:20287/api"; // 系统 正式地址
const BaseFileUrl = "https://ptaax.fjswxsj.com:20287/";
const BaseApi = BaseUrl; // 系统 接口地址
const BaseStatic = "http://192.168.2.97:8209"; //静态资源地址
// const WebsocketHost = "wss://ptaax.fjswxsj.com:20287";
// const WebsocketHost = "ws://192.168.9.153:8085"

// 河湖监管小程序接口地址
let RiverBaseUrl;
let RiverBaseApi;
let RiverAuthUrl;
let RiverOssUrl;
let RiverFileBaseUrl;

// #ifdef H5
// H5环境配置
// 开发环境：使用相对路径 + 代理（manifest.json devServer.proxy）
// 生产环境：使用完整域名 + 后端CORS，或使用Nginx代理
if (process.env.NODE_ENV === "development") {
  // 开发环境：使用相对路径，通过代理转发
  RiverBaseUrl = "http://192.168.2.67:8905";
  // RiverBaseUrl = "http://192.168.9.191:8905";
  RiverBaseApi = "/river/openapi/v1";
  RiverAuthUrl = "/blade-auth";
  RiverOssUrl = "/blade-resource/oss/endpoint/put-file";
} else {
  // 生产环境：根据部署方式选择
  // 方式1: 使用Nginx代理 - 保持相对路径
  RiverBaseUrl = "";
  RiverBaseApi = "/river/openapi/v1";
  RiverAuthUrl = "/blade-auth";
  RiverOssUrl = "/blade-resource/oss/endpoint/put-file";

  // 方式2: 使用完整域名（需要后端配置CORS）
  // RiverBaseUrl = "https://your-domain.com";  // 替换为你的域名
  // RiverBaseApi = RiverBaseUrl + "/river/openapi/v1";
  // RiverAuthUrl = RiverBaseUrl + "/blade-auth";
  // RiverOssUrl = RiverBaseUrl + "/blade-resource/oss/endpoint/put-file";
}
// #endif

// #ifndef H5
// 小程序和APP使用完整地址
// RiverBaseUrl = "http://192.168.9.191:8905"; // 泽滨 本地测试地址
// RiverBaseUrl = "http://192.168.2.67:8905"; // 河湖监管 本地测试地址
RiverBaseUrl = "https://ycsl.fjswxsj.com:20319/api"; // 河湖监管 小程序线上地址
RiverFileBaseUrl = "https://ycsl.fjswxsj.com:20319"; // 河湖监管 小程序线上地址
RiverBaseApi = RiverBaseUrl + "/river/openapi/v1"; // 河湖监管 业务接口
RiverAuthUrl = RiverBaseUrl + "/blade-auth"; // 河湖监管 认证接口
RiverOssUrl = RiverBaseUrl + "/blade-resource/oss/endpoint/put-file"; // 河湖监管 OSS上传
// #endif

export {
  BaseUrl,
  BaseApi,
  BaseFileUrl,
  BaseStatic,
  // WebsocketHost,
  RiverBaseUrl,
  RiverBaseApi,
  RiverAuthUrl,
  RiverOssUrl,
  RiverFileBaseUrl,
};
