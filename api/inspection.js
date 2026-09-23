/**
 * 问题上报相关接口
 */
import {
  get,
  post,
  del,
  getPage,
  generateRequestId,
} from "@/http/riverRequest.js";

/**
 * 问题分页查询
 * @param {Object} params 查询参数
 * @param {number} params.current 当前页
 * @param {number} params.size 每页条数
 * @param {string} params.status 状态：DRAFT/RECTIFYING/COMPLETED/WITHDRAWN
 * @param {string} params.townshipId 乡镇ID
 * @param {string} params.sectionId 河段ID
 * @param {string} params.issuedStartTime 提交开始时间
 * @param {string} params.issuedEndTime 提交结束时间
 * @param {boolean} params.overdueOnly 是否只查逾期
 * @returns {Promise}
 */
export function getInspectionPage(params = {}) {
  return getPage("/inspection/page", params);
}

/**
 * 获取问题详情
 * @param {string} id 问题ID
 * @returns {Promise}
 */
export function getInspectionDetail(id) {
  return get("/inspection/detail", { id });
}

/**
 * 保存问题草稿
 * @param {Object} data 草稿数据
 * @param {string} data.id 草稿ID（编辑时必填）
 * @param {string} data.planItemId 计划明细ID
 * @param {string} data.townshipId 乡镇ID
 * @param {string} data.sectionId 河段ID
 * @param {string} data.capturedAt 采集时间
 * @param {number} data.longitude 经度
 * @param {number} data.latitude 纬度
 * @param {string} data.location 地点描述
 * @param {string} data.problemTypeId 问题大类ID
 * @param {string} data.problemSubtypeId 问题小类ID
 * @param {string} data.description 问题描述
 * @param {string[]} data.backgroundImageRefs 背景图引用
 * @param {string[]} data.problemImageRefs 问题图引用
 * @param {string[]} data.participantUserIds 参与人员ID
 * @param {number} data.version 版本号（编辑时必填）
 * @returns {Promise}
 */
export function saveDraft(data) {
  return post("/inspection/draft", data);
}

/**
 * 识别问题图片
 * @param {Object} data
 * @param {string} data.inspectionId 问题ID（可选）
 * @param {string} data.imageRef 图片引用
 * @returns {Promise}
 */
export function recognizeImage(data) {
  return post("/inspection/recognition", data);
}

/**
 * 提交草稿并创建整改任务
 * @param {Object} data
 * @param {string} data.inspectionId 问题ID
 * @param {number} data.version 版本号
 * @param {string} data.requestId 请求ID
 * @returns {Promise}
 */
export function submitInspection(data) {
  const params = {
    inspectionId: data.inspectionId,
    version: data.version,
    requestId: data.requestId || generateRequestId(),
  };
  return post("/inspection/submit", params);
}

/**
 * 直接提交完整问题并创建整改任务
 * @param {Object} data
 * @param {string} data.townshipId 乡镇ID
 * @param {string} data.sectionId 河段ID
 * @param {number} data.longitude 经度
 * @param {number} data.latitude 纬度
 * @param {string} data.location 地点描述
 * @param {string} data.problemTypeId 问题大类ID
 * @param {string} data.problemSubtypeId 问题小类ID
 * @param {string} data.description 问题描述
 * @param {string[]} data.backgroundImageRefs 背景图引用
 * @param {string[]} data.problemImageRefs 问题图引用
 * @param {string} data.requestId 请求ID
 * @returns {Promise}
 */
export function directSubmitInspection(data) {
  const params = {
    ...data,
    requestId: data.requestId || generateRequestId(),
  };
  return post("/inspection/direct-submit", params);
}

/**
 * 撤回问题
 * @param {Object} data
 * @param {string} data.inspectionId 问题ID
 * @param {number} data.version 版本号
 * @param {string} data.requestId 请求ID
 * @param {string} data.remark 撤回原因
 * @returns {Promise}
 */
export function withdrawInspection(data) {
  const params = {
    ...data,
    requestId: data.requestId || generateRequestId(),
  };
  return post("/inspection/withdraw", params);
}

/**
 * 恢复已撤回问题为草稿
 * @param {Object} data
 * @param {string} data.inspectionId 问题ID
 * @param {number} data.version 版本号
 * @param {string} data.requestId 请求ID
 * @returns {Promise}
 */
export function restoreDraft(data) {
  const params = {
    ...data,
    requestId: data.requestId || generateRequestId(),
  };
  return post("/inspection/draft/restore", params);
}

/**
 * 删除草稿
 * @param {Object} data
 * @param {string} data.inspectionId 问题ID
 * @param {number} data.version 版本号
 * @param {string} data.requestId 请求ID
 * @returns {Promise}
 */
export function deleteDraft(data) {
  const params = {
    ...data,
    requestId: data.requestId || generateRequestId(),
  };
  return del("/inspection/draft", params);
}

/**
 * 直接删除巡查任务
 * 可删除 RECTIFYING/COMPLETED/WITHDRAWN 状态的问题（不能删草稿）
 * @param {Object} data
 * @param {string} data.inspectionId 问题ID
 * @param {number} data.version 版本号
 * @param {string} data.requestId 请求ID
 * @returns {Promise}
 */
export function deleteTask(data) {
  const params = {
    ...data,
    requestId: data.requestId || generateRequestId(),
  };
  return del("/inspection/task", params);
}

export default {
  getInspectionPage,
  getInspectionDetail,
  saveDraft,
  recognizeImage,
  submitInspection,
  directSubmitInspection,
  withdrawInspection,
  restoreDraft,
  deleteDraft,
  deleteTask,
};
