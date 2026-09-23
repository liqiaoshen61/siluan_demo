/**
 * 河湖监管小程序专用请求封装
 * 接口文档：接口对接文档.md
 */
import { RiverBaseApi, RiverAuthUrl, RiverBaseUrl } from "./baseApi.js";

// 请求配置
const config = {
  baseUrl: RiverBaseApi,
  authUrl: RiverAuthUrl,
  timeout: 30000,
};

/**
 * 获取存储的Token
 */
export function getToken() {
  return uni.getStorageSync("river_token") || "";
}

/**
 * 设置Token
 */
export function setToken(token, refreshToken = "") {
  uni.setStorageSync("river_token", token);
  if (refreshToken) {
    uni.setStorageSync("river_refresh_token", refreshToken);
  }
}

/**
 * 清除Token
 */
export function clearToken() {
  uni.removeStorageSync("river_token");
  uni.removeStorageSync("river_refresh_token");
  uni.removeStorageSync("river_user_info");
  // 同步清除AI智能统计会话缓存（主动退出与token失效被动跳转都会走到这里）
  // 与 api/smart.js 的 clearSessionCache 等效；此处不直接引用以避免循环依赖
  uni.removeStorageSync("river_smart_session");
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return uni.getStorageSync("river_user_info") || null;
}

/**
 * 设置用户信息
 */
export function setUserInfo(userInfo) {
  uni.setStorageSync("river_user_info", userInfo);
}

/**
 * 生成请求ID（用于幂等性控制）
 */
export function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * 检查Token是否过期
 */
function isTokenExpired() {
  const token = getToken();
  if (!token) return true;

  // 可以根据JWT解析判断过期时间
  // 这里简单判断是否有token
  return false;
}

/**
 * 跳转登录页
 */
function goToLogin() {
  clearToken();
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  if (currentPage && currentPage.route !== "pages/login/index") {
    uni.reLaunch({
      url: "/pages/login/index",
    });
  }
}

/**
 * 刷新Token（内部方法，避免循环依赖）
 * @param {string} refreshTokenValue 刷新Token
 * @returns {Promise}
 */
async function doRefreshToken(refreshTokenValue) {
  const userInfo = getUserInfo();
  const tenantId = userInfo?.tenantId || "000000";
  const deptId = userInfo?.deptId || "";
  const roleId = userInfo?.roleId || "";

  return new Promise((resolve, reject) => {
    uni.request({
      url: config.authUrl + "/oauth/token",
      method: "POST",
      data: {
        tenantId,
        refresh_token: refreshTokenValue,
        grant_type: "refresh_token",
        scope: "all",
      },
      header: {
        "Tenant-Id": tenantId,
        "Dept-Id": deptId,
        "Role-Id": roleId,
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic c2FiZXI6c2FiZXJfc2VjcmV0",
      },
      success: (res) => {
        const data = res.data;
        if (data.access_token) {
          setToken(data.access_token, data.refresh_token);
          // 更新用户信息
          setUserInfo({
            userId: data.user_id,
            tenantId: data.tenant_id,
            roleId: data.role_id,
            deptId: data.dept_id,
            account: data.account,
            userName: data.user_name,
            realName: data.real_name,
          });
          resolve(data);
        } else {
          reject(data);
        }
      },
      fail: reject,
    });
  });
}

// 刷新Token状态管理
let isRefreshing = false;
let refreshSubscribers = [];

// 订阅刷新完成事件
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

// 通知所有订阅者刷新完成
function onRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// 刷新失败，清除订阅
function onRefreshFailed() {
  refreshSubscribers = [];
  clearToken();
  goToLogin();
}

/**
 * 处理401未授权错误，尝试刷新Token
 * @param {Object} options 原请求选项
 * @param {Function} retryCallback 刷新成功后的重试回调
 * @returns {Promise<boolean>} 是否刷新成功
 */
async function handleUnauthorized(options, retryCallback) {
  const refreshTokenValue = uni.getStorageSync("river_refresh_token");

  // 没有 refresh_token 或已经是重试请求，跳转登录
  if (!refreshTokenValue || options._isRetry) {
    clearToken();
    goToLogin();
    return false;
  }

  // 如果正在刷新，等待刷新完成
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        if (newToken && retryCallback) {
          retryCallback(newToken);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  // 执行刷新
  isRefreshing = true;
  try {
    const result = await doRefreshToken(refreshTokenValue);
    isRefreshing = false;
    onRefreshed(result.access_token);

    // 刷新成功，执行重试
    if (retryCallback) {
      retryCallback(result.access_token);
    }
    return true;
  } catch (error) {
    isRefreshing = false;
    onRefreshFailed();
    uni.showToast({
      title: "登录已过期，请重新登录",
      icon: "none",
      duration: 2000,
    });
    return false;
  }
}

/**
 * 核心请求方法
 */
function request(options) {
  const token = getToken();

  // 构建请求头
  const headers = {
    "Content-Type": "application/json",
    "Accept-Language": "zh-CN",
    "Blade-Requested-With": "BladeHttpRequest",
    ...options.header,
  };

  // 添加认证头
  if (token && !options.skipAuth) {
    headers["Blade-Auth"] = `bearer ${token}`;
  }

  // 构建完整URL
  let url;
  if (options.url.startsWith("http")) {
    // 已经是完整URL，直接使用
    url = options.url;
  } else if (options.baseUrl !== undefined) {
    // 明确传了 baseUrl（包括空字符串），使用传入的 baseUrl
    url = options.baseUrl + options.url;
  } else {
    // 没传 baseUrl，使用默认的 config.baseUrl
    url = config.baseUrl + options.url;
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method || "GET",
      data: options.data,
      header: headers,
      timeout: options.timeout || config.timeout,
      success: async (res) => {
        const { statusCode, data } = res;

        // 处理响应
        if (statusCode === 200) {
          if (data.code === 200 || data.success) {
            resolve(data);
          } else if (data.code === 401) {
            // Token过期，尝试刷新
            const success = await handleUnauthorized(options, (newToken) => {
              options.header = {
                ...options.header,
                "Blade-Auth": `bearer ${newToken}`,
              };
              options._isRetry = true;
              request(options).then(resolve).catch(reject);
            });
            if (!success) {
              reject(data);
            }
          } else {
            // 业务错误
            uni.showToast({
              title: data.msg || "请求失败",
              icon: "none",
              duration: 2000,
            });
            reject(data);
          }
        } else if (statusCode === 401) {
          // HTTP 401，同样尝试刷新Token
          const success = await handleUnauthorized(options, (newToken) => {
            options.header = {
              ...options.header,
              "Blade-Auth": `bearer ${newToken}`,
            };
            options._isRetry = true;
            request(options).then(resolve).catch(reject);
          });
          if (!success) {
            reject({ code: 401, msg: "未授权" });
          }
        } else {
          // HTTP错误
          uni.showToast({
            title: `网络错误: ${statusCode}`,
            icon: "none",
            duration: 2000,
          });
          reject({ code: statusCode, msg: data.msg || "网络请求失败" });
        }
      },
      fail: (err) => {
        uni.showToast({
          title: "网络连接失败",
          icon: "none",
          duration: 2000,
        });
        reject(err);
      },
    });
  });
}

/**
 * GET请求
 */
export function get(url, params = {}, options = {}) {
  // 构建查询字符串
  const queryString = Object.keys(params)
    .filter(
      (key) =>
        params[key] !== undefined && params[key] !== null && params[key] !== "",
    )
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
    )
    .join("&");

  const fullUrl = queryString ? `${url}?${queryString}` : url;

  return request({
    url: fullUrl,
    method: "GET",
    ...options,
  });
}

/**
 * POST请求
 */
export function post(url, data = {}, options = {}) {
  return request({
    url,
    method: "POST",
    data,
    ...options,
  });
}

/**
 * DELETE请求（带Body）
 */
export function del(url, data = {}, options = {}) {
  return request({
    url,
    method: "DELETE",
    data,
    ...options,
  });
}

/**
 * 文件上传
 */
export function uploadFile(filePath, options = {}) {
  const token = getToken();

  const doUpload = (currentToken) => {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url:
          options.url || RiverBaseUrl + "/blade-resource/oss/endpoint/put-file",
        filePath,
        name: options.name || "file",
        header: {
          "Blade-Auth": `bearer ${currentToken}`,
          "Blade-Requested-With": "BladeHttpRequest",
          "Accept-Language": "zh-CN",
        },
        formData: options.formData || {},
        success: async (res) => {
          if (res.statusCode === 200) {
            const data = JSON.parse(res.data);
            if (data.code === 200 || data.success) {
              resolve(data);
            } else if (data.code === 401) {
              // Token过期，尝试刷新
              const success = await handleUnauthorized(options, (newToken) => {
                options._isRetry = true;
                doUpload(newToken).then(resolve).catch(reject);
              });
              if (!success) {
                reject(data);
              }
            } else {
              uni.showToast({
                title: data.msg || "上传失败",
                icon: "none",
              });
              reject(data);
            }
          } else if (res.statusCode === 401) {
            // HTTP 401，尝试刷新Token
            const success = await handleUnauthorized(options, (newToken) => {
              options._isRetry = true;
              doUpload(newToken).then(resolve).catch(reject);
            });
            if (!success) {
              reject({ code: 401, msg: "未授权" });
            }
          } else {
            reject({ code: res.statusCode, msg: "上传失败" });
          }
        },
        fail: (err) => {
          uni.showToast({
            title: "上传失败",
            icon: "none",
          });
          reject(err);
        },
      });
    });
  };

  return doUpload(token);
}

/**
 * 流式请求（用于智能对话）
 * @param {Object} data 请求数据
 * @param {Function} onChunk 接收到数据块时的回调
 * @param {Function} onComplete 完成时的回调
 * @param {Function} onError 错误时的回调
 * @param {Object} options 可选配置
 * @param {string} options.url 自定义URL路径，默认为空
 * @param {string} options.baseUrl 自定义基础URL，默认使用 RiverBaseUrl
 */
export function streamChat(
  data = {},
  onChunk,
  onComplete,
  onError,
  options = {},
) {
  const token = getToken();
  const { url, baseUrl } = options;

  // 构建完整URL：优先使用自定义baseUrl，否则使用默认
  let fullUrl = "";
  if (baseUrl && url) {
    fullUrl = baseUrl + url;
  } else if (url) {
    fullUrl = RiverBaseUrl + url;
  }

  console.log("streamChat 请求URL:", fullUrl);
  console.log("streamChat 请求数据:", data);

  // 用于缓存未解析完的数据块
  let buffer = "";

  /**
   * 解析 SSE 数据块
   * @param {string} chunkText 数据块文本
   */
  function parseSSEChunk(chunkText) {
    if (!chunkText) return;

    // 将新数据追加到缓冲区
    buffer += chunkText;

    // 按双换行符分割事件
    const events = buffer.split("\n\n");

    // 最后一个可能是不完整的事件，保留在缓冲区
    buffer = events.pop() || "";

    for (const event of events) {
      if (!event.trim()) continue;

      // 解析事件
      let eventType = "message";
      let eventData = null;

      const lines = event.split("\n");
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("event:")) {
          eventType = trimmedLine.substring(6).trim();
        } else if (trimmedLine.startsWith("data:")) {
          eventData = trimmedLine.substring(5).trim();
        }
      }

      // 处理不同类型的事件
      if (eventType === "message" && eventData) {
        try {
          const parsed = JSON.parse(eventData);
          const content = parsed.content;
          if (typeof content === "string" && onChunk) {
            console.log("流式数据块:", content);
            onChunk(content);
          }
        } catch (e) {
          console.error("解析 SSE 数据失败:", e, eventData);
        }
      } else if (eventType === "done") {
        console.log("流式传输完成");
      }
    }
  }

  const doStreamChat = (currentToken) => {
    return new Promise((resolve, reject) => {
      console.log("使用流式请求（onChunkReceived）");

      const requestTask = uni.request({
        url: fullUrl,
        method: "POST",
        data,
        enableChunked: true, // 启用分块传输
        responseType: "arraybuffer", // 接收二进制数据
        header: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "Accept-Language": "zh-CN",
          "Blade-Requested-With": "BladeHttpRequest",
          ...(currentToken ? { "Blade-Auth": `bearer ${currentToken}` } : {}),
        },
        success: async (res) => {
          console.log("请求完成，状态码:", res.statusCode);

          if (res.statusCode === 200) {
            // 处理缓冲区中剩余的数据
            if (buffer.trim()) {
              parseSSEChunk("\n\n");
            }

            if (onComplete) {
              onComplete();
            }
            resolve();
          } else if (res.statusCode === 401) {
            const success = await handleUnauthorized(options, (newToken) => {
              options._isRetry = true;
              doStreamChat(newToken).then(resolve).catch(reject);
            });
            if (!success) {
              const error = { code: 401, msg: "未授权" };
              if (onError) onError(error);
              reject(error);
            }
          } else {
            const error = {
              code: res.statusCode,
              msg: "请求失败",
              data: res.data,
            };
            if (onError) onError(error);
            reject(error);
          }
        },
        fail: (err) => {
          console.error("请求失败:", err);
          if (onError) {
            onError(err);
          }
          reject(err);
        },
      });

      // 监听分块数据
      console.log("requestTask:", requestTask);
      console.log(
        "requestTask 方法:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(requestTask || {})),
      );

      if (requestTask && typeof requestTask.onChunkReceived === "function") {
        console.log("✅ requestTask 支持 onChunkReceived");

        requestTask.onChunkReceived((res) => {
          console.log("收到数据块（ArrayBuffer）:", res.data);

          try {
            // 将 ArrayBuffer 转换为字符串
            const uint8Array = new Uint8Array(res.data);

            // 使用 TextDecoder 解码（推荐方式）
            let text = "";
            if (typeof TextDecoder !== "undefined") {
              const decoder = new TextDecoder("utf-8");
              text = decoder.decode(uint8Array);
            } else {
              // 降级方案：使用 String.fromCharCode
              text = String.fromCharCode.apply(null, uint8Array);
              // 处理 UTF-8 编码
              try {
                // 使用已弃用的 escape，但在小程序环境中可能需要
                // eslint-disable-next-line
                text = decodeURIComponent(escape(text));
              } catch (e) {
                console.warn("解码失败，使用原始文本:", e);
              }
            }

            console.log("解码后的文本:", text);

            // 解析 SSE 数据
            parseSSEChunk(text);
          } catch (e) {
            console.error("处理数据块失败:", e);
          }
        });
      } else {
        console.warn("❌ requestTask 不支持 onChunkReceived");

        // 降级方案：使用 responseType: 'text' 获取完整数据
        requestTask.abort();

        uni.request({
          url: fullUrl,
          method: "POST",
          data,
          responseType: "text",
          header: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            "Accept-Language": "zh-CN",
            "Blade-Requested-With": "BladeHttpRequest",
            ...(currentToken ? { "Blade-Auth": `bearer ${currentToken}` } : {}),
          },
          success: async (res) => {
            console.log("降级方案：请求完成，状态码:", res.statusCode);

            if (res.statusCode === 200) {
              const finalData = res.data;

              if (typeof finalData === "string" && finalData.length > 0) {
                const parsedData = parseFullSSEData(finalData);
                console.log("解析后的数据:", parsedData);

                if (onComplete) {
                  onComplete(parsedData);
                }
                resolve(parsedData);
              } else {
                if (onComplete) {
                  onComplete("");
                }
                resolve("");
              }
            } else if (res.statusCode === 401) {
              const success = await handleUnauthorized(options, (newToken) => {
                options._isRetry = true;
                doStreamChat(newToken).then(resolve).catch(reject);
              });
              if (!success) {
                const error = { code: 401, msg: "未授权" };
                if (onError) onError(error);
                reject(error);
              }
            } else {
              const error = {
                code: res.statusCode,
                msg: "请求失败",
                data: res.data,
              };
              if (onError) onError(error);
              reject(error);
            }
          },
          fail: (err) => {
            console.error("降级方案：请求失败:", err);
            if (onError) {
              onError(err);
            }
            reject(err);
          },
        });
      }
    });
  };

  return doStreamChat(token);
}

/**
 * 解析完整的 SSE 响应数据
 * @param {string} sseText SSE 格式的文本
 * @returns {string} 解析后的内容
 */
function parseFullSSEData(sseText) {
  if (!sseText) return "";

  // 移除末尾的完成标记 {"completed":true}
  let cleanedText = sseText;
  const completedMatch = cleanedText.match(/\{"completed":true\}$/);
  if (completedMatch) {
    cleanedText = cleanedText.substring(
      0,
      cleanedText.length - completedMatch[0].length,
    );
  }

  // 检查是否有 SSE 格式的 data: 前缀
  if (cleanedText.includes("data:")) {
    const lines = cleanedText.split("\n");
    let content = "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("data:")) {
        const data = trimmedLine.substring(5).trim();
        if (data && data !== "[DONE]") {
          try {
            // 尝试解析 JSON
            const parsed = JSON.parse(data);
            // 提取内容字段
            const chunk =
              parsed.content ||
              parsed.text ||
              parsed.message ||
              parsed.delta?.content ||
              data;
            if (typeof chunk === "string") {
              content += chunk;
            }
          } catch (e) {
            // 如果不是 JSON，直接使用原始数据
            if (data) {
              content += data;
            }
          }
        }
      }
    }

    return content || cleanedText;
  }

  // 非 SSE 格式，直接返回清理后的文本
  return cleanedText.trim();
}

/**
 * 解析 SSE 数据块
 * @param {string} chunkText 数据块文本
 * @param {Function} onChunk 回调函数
 */
function parseSSEChunk(chunkText, onChunk) {
  const lines = chunkText.split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("data:")) {
      const data = trimmedLine.substring(5).trim();
      if (data && data !== "[DONE]") {
        try {
          // 尝试解析 JSON
          const parsed = JSON.parse(data);
          // 提取内容字段（根据实际接口返回格式调整）
          const content =
            parsed.content || parsed.text || parsed.message || data;
          onChunk(content);
        } catch (e) {
          // 如果不是 JSON，直接使用原始数据
          if (data) {
            onChunk(data);
          }
        }
      }
    } else if (trimmedLine && !trimmedLine.startsWith(":")) {
      // 非 SSE 格式，可能是纯文本
      onChunk(trimmedLine);
    }
  }
}

/**
 * 分页请求封装
 */
export async function getPage(url, params = {}) {
  const defaultParams = {
    current: 1,
    size: 10,
  };

  const result = await get(url, { ...defaultParams, ...params });

  return {
    records: result.data?.records || [],
    total: result.data?.total || 0,
    current: result.data?.current || 1,
    size: result.data?.size || 10,
    pages: result.data?.pages || 0,
  };
}

export default {
  get,
  post,
  del,
  request,
  uploadFile,
  streamChat,
  getPage,
  getToken,
  setToken,
  clearToken,
  getUserInfo,
  setUserInfo,
  generateRequestId,
  config,
};
