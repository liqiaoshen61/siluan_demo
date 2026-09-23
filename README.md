# 四乱问题管理 H5 演示模块

基于现有 uni-app / Vue 3 项目，默认进入 `pages/demo/index`。免登录，同一演示用户可以新增、整改、复核。没有底部导航、个人中心、统计、消息入口；原有页面源码保留但不注册到构建路由。

## 运行

```sh
npm ci
npm run dev:h5
npm run build:h5
npm test
```

开发地址为 `http://localhost:8081`，构建输出为 `dist/h5`。宿主 App 使用 WebView 打开部署地址。使用 hash 路由；拍照/相册需要宿主 WebView 支持文件选择与相机权限。

## 数据与真实接口

`demo/seed.json` 来自用户提供的 20 条图斑示例。保留原始字段，分配待整改、待复核、已完成三种**演示状态**。新增和业务状态存储在浏览器本地，点击“重置演示”恢复初始数据。列表、详情、搜索、保存、整改提交均不请求后端。

仅以下接口请求真实后端，任何失败都展示错误，不自动降级成模拟成功：

| 功能 | 地址 |
| --- | --- |
| 上传 | `/jwsk-resource/oss/endpoint/put-file-attach` |
| 新增识别 | `/api/v1/issue/detect` |
| 整改识别 | `/api/v1/issue/verify-rectification` |
| 复核校验 | `/river/openapi/v1/rectification/manual-review` |

开发代理在 `vite.config.js`：AI 识别 API 转发到 `http://192.168.2.92:7010`；人工复核转发到 `http://192.168.2.67:8905`；上传转发到 `http://192.168.2.103:8086`。上传表单字段为 `file`，支持响应 `data.link`、`data.url`、`data.name` 或字符串地址。识别请求带 `X-API-Key`。

## 联调必须具备的条件

1. **真实任务映射**：示例文件只有图斑 ID，没有整改任务 ID。现有整改识别与人工复核接口需要真实 `rectificationId`、版本和对应后端状态。不能把图斑 ID 直接当作任务 ID，也不能以纯本地新增替代后端任务创建。通过下述 `taskBindings` 关联真实演示任务。新建本地问题 ID 可在详情查看。
2. **后端状态前提**：人工复核接口是有副作用的真实提交接口，并非纯图片校验。后端任务必须满足允许人工复核的状态；本地“提交整改”不会修改后端状态。要让任意本地新增问题完整通过真实识别、复核，需后端提供支持演示上下文的无状态接口，或预置符合要求的演示任务；前端不会偷偷调用额外业务接口。
3. **免登录**：不发送 token，不刷新登录、不跳转登录页。后端/网关需要对上述演示接口提供免登录访问，否则页面显示后端 401 错误。
4. **整改前照片**：`beforeImageText` 按分号拆分多张图片，每项取逗号前的路径，拼接 `http://27.156.118.74:19200`。例如 `/static/work_file/2025-04-02/pic52574003368.JPG` 会使用该前缀显示；可通过 `sampleImageBase` 覆盖图片服务地址。

可在 `index.html` 的应用脚本之前加入配置，或修改 `demo/config.js`：

```html
<script>
window.RIVER_DEMO_CONFIG = {
  apiBase: '/river/openapi/v1',
  aiApiBase: '/api/v1',
  uploadUrl: '/jwsk-resource/oss/endpoint/put-file-attach',
  fileBase: 'http://192.168.2.103:8086',
  sampleImageBase: 'http://27.156.118.74:19200',
  taskBindings: {
    // '图斑或本地问题ID': { rectificationId: '真实后端任务ID', version: 0 }
  }
};
</script>
```

## 部署代理示例

生产静态服务器也需要代理（Vite 代理只用于开发）：

```nginx
location /api/ {
    proxy_pass http://192.168.2.92:7010;
}
location /river/ {
    proxy_pass http://192.168.2.67:8905;
}
location /jwsk-resource/ {
    proxy_pass http://192.168.2.103:8086;
}
```

HTTPS 页面需将图片也通过 HTTPS/同源代理提供，避免内网 HTTP 图片被 WebView 拦截。如部署到子目录，同时调整 `manifest.json` 的 `h5.router.base`。运行环境必须能够访问配置的内网后端。
