/**
 * 位置相关接口
 */
import { get } from "@/http/riverRequest.js";

/**
 * 经纬度逆地理编码
 * 根据经纬度获取行政区划和河段信息
 * @param {Object} params
 * @param {number} params.longitude 经度
 * @param {number} params.latitude 纬度
 * @returns {Promise<{
 *   townshipId: string,
 *   townshipName: string,
 *   sectionId: string,
 *   sectionName: string
 * }>}
 */
export function reverseGeocode(params) {
  return get("/location/reverse", params);
}

/**
 * 经纬度匹配乡镇和河段
 * GET /river/openapi/v1/options/location
 * @param {Object} params
 * @param {number} params.longitude 经度
 * @param {number} params.latitude 纬度
 * @returns {Promise<{
 *   townshipId: number,
 *   townshipName: string,
 *   sectionId: number,
 *   sectionName: string
 * }>}
 */
export function matchLocation(params) {
  return get("/options/location", params);
}

export default {
  reverseGeocode,
  matchLocation,
};
