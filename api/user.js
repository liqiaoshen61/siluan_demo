/**
 * 用户相关接口
 */
import { get, post, getToken } from "@/http/riverRequest.js";
import { RiverBaseUrl } from "@/http/baseApi.js";
import smCrypto from "@/http/smCrypto.js";

/**
 * 获取当前用户资料
 * @returns {Promise}
 */
export function getProfile() {
  return get("/profile");
}

/**
 * 获取用户可访问的乡镇列表
 * @returns {Promise}
 */
export function getTownships() {
  return get("/options/townships");
}

/**
 * 获取用户可访问的河段列表
 * @param {string} townshipId 乡镇ID
 * @returns {Promise}
 */
export function getSections(townshipId) {
  return get("/options/sections", { townshipId });
}

/**
 * 获取问题类型选项
 * @returns {Promise}
 */
export function getProblemTypes() {
  return get("/options/problem-types");
}

/**
 * 获取巡查人员可选的计划项（乡镇）
 * 接口地址: /river/admin/inspection/plan-options
 * @returns {Promise<Array<{planItemId, townshipId, townshipName, groupName, planMonth}>>}
 */
export function getPlanOptions() {
  // 使用完整路径，不走默认的 /river/openapi/v1 前缀
  return get(
    "/river/admin/inspection/plan-options",
    {},
    { baseUrl: RiverBaseUrl },
  );
}

/**
 * 获取所有基础选项（一次性加载）
 * @param {Object} options 配置选项
 * @param {boolean} options.includePlanOptions 是否包含计划选项（仅巡查员需要）
 * @returns {Promise}
 */
export async function getAllOptions(options = {}) {
  const { includePlanOptions = true } = options;

  try {
    const requests = [
      // getTownships(),
      getProblemTypes().catch((err) => {
        console.error("获取问题类型失败:", err);
        return { data: [] };
      }),
    ];

    // 只有巡查员才获取计划选项
    if (includePlanOptions) {
      requests.push(
        getPlanOptions().catch((err) => {
          console.error("获取计划选项失败:", err);
          return { data: [] };
        }),
      );
    }

    const results = await Promise.all(requests);
    const [problemTypes, planOptions] = includePlanOptions
      ? results
      : [results[0], { data: [] }];

    // 处理问题类型为树形结构
    const problemTypeTree = buildProblemTypeTree(problemTypes?.data || []);

    return {
      problemTypes: problemTypeTree,
      problemTypesFlat: problemTypes?.data || [],
      planItems: planOptions?.data || [],
    };
  } catch (error) {
    console.error("获取基础选项失败:", error);
    return {
      problemTypes: [],
      problemTypesFlat: [],
      planItems: [],
    };
  }
}

/**
 * 构建问题类型树形结构
 * @param {Array} flatList 扁平列表
 * @returns {Array}
 */
function buildProblemTypeTree(flatList) {
  const map = {};
  const roots = [];

  // 创建映射
  flatList.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });

  // 构建树
  flatList.forEach((item) => {
    if (item.parentId === "0" || !item.parentId) {
      roots.push(map[item.id]);
    } else if (map[item.parentId]) {
      map[item.parentId].children.push(map[item.id]);
    }
  });

  return roots;
}

/**
 * 修改密码
 * @param {Object} data 密码数据
 * @param {string} data.oldPassword 旧密码（明文）
 * @param {string} data.newPassword 新密码（明文）
 * @returns {Promise}
 */
export function updatePassword(data) {
  // 加密密码
  const encryptedData = {
    oldPassword: smCrypto.doSm2Encrypt(data.oldPassword),
    newPassword: smCrypto.doSm2Encrypt(data.newPassword),
    newPassword1: smCrypto.doSm2Encrypt(data.newPassword),
  };

  // 使用 application/x-www-form-urlencoded 格式
  const formData = Object.keys(encryptedData)
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(encryptedData[key])}`,
    )
    .join("&");

  return new Promise((resolve, reject) => {
    const token = getToken();
    uni.request({
      url: RiverBaseUrl + "/blade-system/user/update-password",
      method: "POST",
      data: formData,
      header: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Blade-Auth": `bearer ${token}`,
        "Blade-Requested-With": "BladeHttpRequest",
        "Accept-Language": "zh-CN",
      },
      success: (res) => {
        const { statusCode, data: responseData } = res;
        if (statusCode === 200) {
          if (responseData.code === 200 || responseData.success) {
            resolve(responseData);
          } else {
            uni.showToast({
              title: responseData.msg || "修改密码失败",
              icon: "none",
            });
            reject(responseData);
          }
        } else {
          uni.showToast({
            title: `网络错误: ${statusCode}`,
            icon: "none",
          });
          reject({ code: statusCode, msg: responseData.msg || "网络请求失败" });
        }
      },
      fail: (err) => {
        uni.showToast({
          title: "网络连接失败",
          icon: "none",
        });
        reject(err);
      },
    });
  });
}

export default {
  getProfile,
  getTownships,
  getSections,
  getProblemTypes,
  getPlanOptions,
  getAllOptions,
  updatePassword,
};
