/**
 * 智能对话相关接口
 */
import { post, streamChat } from "@/http/riverRequest.js";
import { RiverBaseUrl } from "@/http/baseApi.js";

/**
 * 创建智能会话
 * POST /river/admin/assistant/session
 * @param {string} title 会话标题（可选）
 * @returns {Promise<{code: number, success: boolean, data: number, msg: string}>}
 */
export function createSession(title) {
  return post("/river/admin/assistant/session?title=" + encodeURIComponent(title || "水利统计对话"), {}, {
    baseUrl: RiverBaseUrl,
  });
}

/**
 * 获取缓存的会话信息
 * @returns {{sessionId: string, title: string, createdAt: number} | null}
 */
export function getSessionCache() {
  try {
    const cache = uni.getStorageSync("river_smart_session");
    if (cache && cache.sessionId) {
      return cache;
    }
    return null;
  } catch (e) {
    console.error("读取会话缓存失败:", e);
    return null;
  }
}

/**
 * 保存会话到缓存
 * @param {number|string} sessionId 会话ID
 * @param {string} title 会话标题
 */
export function saveSessionCache(sessionId, title = "水利统计对话") {
  try {
    uni.setStorageSync("river_smart_session", {
      sessionId: String(sessionId),
      title,
      createdAt: Date.now(),
    });
  } catch (e) {
    console.error("保存会话缓存失败:", e);
  }
}

/**
 * 清除会话缓存
 */
export function clearSessionCache() {
  try {
    uni.removeStorageSync("river_smart_session");
  } catch (e) {
    console.error("清除会话缓存失败:", e);
  }
}

/**
 * 智能解析问题文本
 * POST /river/openapi/v1/inspection/parse
 * @param {string} text 用户输入的自然语言问题描述
 * @returns {Promise<{
 *   originalText: string,
 *   townshipId: number,
 *   townshipName: string,
 *   sectionId: number,
 *   sectionName: string,
 *   problemTypeId: number,
 *   problemTypeName: string,
 *   problemSubtypeId: number,
 *   problemSubtypeName: string,
 *   location: string,
 *   description: string,
 *   longitude: number,
 *   latitude: number,
 *   complete: boolean,
 *   confirmationRequired: boolean,
 *   missingFields: string[],
 *   warnings: string[]
 * }>}
 */
export function parseInspectionText(text) {
  return post("/inspection/parse", { text });
}

/**
 * 智能统计流式问答
 * POST /river/admin/assistant/chat
 * @param {Object} options
 * @param {number|string} options.sessionId 会话ID
 * @param {string} options.message 用户消息
 * @param {Function} options.onChunk 接收到数据块时的回调
 * @param {Function} options.onComplete 完成时的回调
 * @param {Function} options.onError 错误时的回调
 * @returns {Promise}
 */
export function assistantChat(options) {
  const { sessionId, message, onChunk, onComplete, onError } = options;

  if (!sessionId) {
    console.error("assistantChat: sessionId 不能为空，请先创建会话");
    if (onError) {
      onError({ msg: "会话未初始化" });
    }
    return Promise.reject(new Error("sessionId 不能为空"));
  }

  return streamChat(
    {
      sessionId: sessionId,  // 保持字符串格式，避免 int64 精度丢失
      message,
    },
    onChunk,
    onComplete,
    onError,
    {
      url: "/river/admin/assistant/chat",
      baseUrl: RiverBaseUrl,
    }
  );
}

export default {
  createSession,
  getSessionCache,
  saveSessionCache,
  clearSessionCache,
  parseInspectionText,
  assistantChat,
};
