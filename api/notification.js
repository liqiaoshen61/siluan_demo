/**
 * 通知相关接口
 */
import { get, post, del } from "@/http/riverRequest.js";

/**
 * 通知分页查询
 * @param {Object} params 查询参数
 * @param {number} params.current 当前页
 * @param {number} params.size 每页条数
 * @param {boolean} params.unreadOnly 是否只查未读
 * @param {string} params.notificationType 通知类型
 * @returns {Promise}
 */
export function getNotificationPage(params = {}) {
  return get("/notification/page", params).then((res) => ({
    records: res.data?.records || [],
    total: res.data?.total || 0,
    current: res.data?.current || 1,
    size: res.data?.size || 10,
    pages: res.data?.pages || 0,
  }));
}

/**
 * 获取未读通知数量
 * @param {string} notificationType 通知类型（可选）
 * @returns {Promise<number>}
 */
export function getUnreadCount(notificationType) {
  const params = notificationType ? { notificationType } : {};
  return get("/notification/unread-count", params).then((res) => res.data || 0);
}

/**
 * 获取不同类型未读通知数量
 * @returns {Promise<number>}
 */
export function getNotificationCount() {
  return get("/notification/unread-statistics").then((res) => res.data || 0);
}

/**
 * 标记单条通知已读
 * @param {string} id 通知ID
 * @returns {Promise}
 */
export function markAsRead(id) {
  return post(`/notification/read?id=${id}`);
}

/**
 * 标记全部通知已读
 * @param {string} notificationType 通知类型（可选）
 * @returns {Promise}
 */
export function markAllAsRead(notificationType) {
  const url = notificationType
    ? `/notification/read-all?notificationType=${notificationType}`
    : "/notification/read-all";
  return post(url);
}
/**
 * 删除全部通知已读
 * @param {string} notificationType 通知类型（可选）
 * @returns {Promise}
 */
export function deleteAllAsRead(params) {
  const url = "/notification/remove-read";
  return del(url, params);
}
/**
 * 删除通知
 * @param {string} id 通知ID
 * @returns {Promise}
 */
export function deleteNotification(id) {
  return del(`/notification/remove?id=${id}`);
}

export default {
  getNotificationPage,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationCount,
  deleteAllAsRead,
};
