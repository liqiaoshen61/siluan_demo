/**
 * 整改任务相关接口
 */
import { get, post, getPage, generateRequestId } from "@/http/riverRequest.js";
import { RiverBaseUrl } from "@/http/baseApi.js";

/**
 * 整改任务分页查询
 * @param {Object} params 查询参数
 * @param {number} params.current 当前页
 * @param {number} params.size 每页条数
 * @param {string} params.status 状态：PENDING/COMPLETED
 * @param {boolean} params.overdueOnly 是否只查逾期
 * @returns {Promise}
 */
export function getTaskPage(params = {}) {
  return getPage("/task/page", params);
}

/**
 * 获取整改任务详情
 * @param {string} id 任务ID
 * @returns {Promise}
 */
export function getTaskDetail(id) {
  return get("/task/detail", { id });
}

/**
 * 第一步：AI判定
 * @param {Object} data
 * @param {string} data.rectificationId 整改任务ID
 * @param {number} data.version 版本号
 * @param {string} data.requestId 幂等号
 * @param {string[]} data.imageRefs 整改图片引用
 * @returns {Promise<{judgmentId, rectificationId, aiResult, conclusion, aiJudgmentCount, version, canSubmit, forceRequired}>}
 */
export function aiJudgment(data) {
  const params = {
    ...data,
    requestId: data.requestId || generateRequestId(),
  };
  return post("/rectification/ai-judgment", params);
}

/**
 * 第二步：正式提交整改
 * @param {Object} data
 * @param {string} data.rectificationId 整改任务ID
 * @param {number} data.version AI判定响应中的新版本
 * @param {string} data.requestId 幂等号
 * @param {string} data.judgmentId AI判定记录ID
 * @param {string} data.description 整改说明
 * @returns {Promise<{rectificationId, status, aiResult, aiJudgmentCount, version, forceRequired, forceCompleted, conclusion}>}
 */
export function submitRectification(data) {
  const params = {
    ...data,
    requestId: data.requestId || generateRequestId(),
  };
  return post("/rectification/submit", params);
}

/**
 * 连续三次AI未通过后强制完成整改
 * 注意：该接口现已变更为提交人工判定，不会直接完成任务
 * @param {Object} data
 * @param {string} data.rectificationId 整改任务ID
 * @param {number} data.version 版本号
 * @param {string} data.requestId 幂等号
 * @param {string} data.judgmentId 最近一次AI判定记录ID
 * @param {string} data.description 整改说明
 * @param {string} data.reason 申请人工判定说明
 * @returns {Promise<{rectificationId, status, manualReviewStatus, version}>}
 */
export function forceCompleteRectification(data) {
  const params = {
    ...data,
    requestId: data.requestId || generateRequestId(),
  };
  return post("/rectification/force-complete", params);
}

/**
 * 县级巡查员人工判定接口
 * @param {Object} data
 * @param {string} data.rectificationId 整改任务ID
 * @param {number} data.version 版本号
 * @param {string} data.requestId 幂等号
 * @param {boolean} data.approved 是否通过：true=通过，false=驳回继续整改
 * @param {string} data.reason 判定原因
 * @returns {Promise<{rectificationId, status, manualReviewStatus, rejectionCount, version}>}
 */
export function manualReview(data) {
  const params = {
    ...data,
    requestId: data.requestId || generateRequestId(),
  };
  return post("/rectification/manual-review", params);
}

/**
 * @deprecated 已废弃 - 请使用 aiJudgment + submitRectification 两步提交流程
 * 旧接口：提交整改并执行AI判定
 */
export function completeRectification(data) {
  const params = {
    ...data,
    requestId: data.requestId || generateRequestId(),
  };
  return post("/rectification/complete", params);
}

/**
 * 获取字典数据
 * @param {string} code 字典code
 * @returns {Promise<Array<{dictKey: string, dictValue: string}>>}
 */
export function getDictionary(code) {
  // H5开发环境走代理，小程序使用完整URL
  // #ifdef H5
  const baseUrl = "";
  // #endif
  // #ifndef H5
  const baseUrl = RiverBaseUrl || "";
  // #endif
  return get("/blade-system/dict-biz/dictionary", { code }, { baseUrl });
}

export default {
  getTaskPage,
  getTaskDetail,
  aiJudgment,
  submitRectification,
  forceCompleteRectification,
  manualReview,
  completeRectification, // 已弃用,保留向后兼容
  getDictionary,
};
