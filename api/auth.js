/**
 * 登录相关接口
 */
import { RiverAuthUrl } from "@/http/baseApi.js";
import { post, setToken, setUserInfo } from "@/http/riverRequest.js";

/**
 * 获取验证码
 * GET /blade-auth/oauth/captcha
 * @returns {Promise<{key: string, image: string}>}
 */
export function getCaptcha() {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${RiverAuthUrl}/oauth/captcha`,
      method: "GET",
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: reject,
    });
  });
}

/**
 * 登录
 * @param {Object} params 登录参数
 * @param {string} params.tenantId 租户ID
 * @param {string} params.username 用户名
 * @param {string} params.password 密码（加密后）
 * @param {string} params.type 类型
 * @param {string} params.key 验证码key
 * @param {string} params.code 验证码
 * @param {string} params.deptId 部门ID
 * @param {string} params.roleId 角色ID
 * @returns {Promise}
 */
export function login(params) {
  const { tenantId, deptId, roleId, username, password, type, key, code } = params;

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${RiverAuthUrl}/oauth/token`,
      method: "POST",
      data: {
        tenantId,
        username,
        password,
        grant_type: key ? "captcha" : "password",
        scope: "all",
        type,
      },
      header: {
        "Tenant-Id": tenantId || "000000",
        "Dept-Id": deptId || "",
        "Role-Id": roleId || "",
        "Captcha-Key": key || "",
        "Captcha-Code": code || "",
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic c2FiZXI6c2FiZXJfc2VjcmV0",
      },
      success: (res) => {
        const data = res.data;
        if (data.access_token) {
          // 保存Token
          setToken(data.access_token, data.refresh_token);
          // 保存用户基本信息
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
        } else if (data.error_description) {
          uni.showToast({
            title: data.error_description,
            icon: "none",
          });
          reject(data);
        } else {
          reject(data);
        }
      },
      fail: (err) => {
        uni.showToast({
          title: "登录失败，请稍后重试",
          icon: "none",
        });
        reject(err);
      },
    });
  });
}

/**
 * 免鉴权查询用户角色
 * GET /river/openapi/v1/profile/roles
 * @param {Object} params 查询参数
 * @param {string} params.userName 用户名（支持账号、用户名或真实姓名精确匹配）
 * @param {string} params.tenantId 租户ID，默认 000000
 * @returns {Promise<Array<{userId, userName, realName, roleNames, roleAliases}>>}
 */
export function getUserRoles(params) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${RiverAuthUrl.replace('/blade-auth', '')}/river/openapi/v1/profile/roles`,
      method: "GET",
      data: {
        userName: params.userName,
        tenantId: params.tenantId || "000000",
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data?.data || []);
        } else {
          reject(res);
        }
      },
      fail: reject,
    });
  });
}

/**
 * 退出登录
 * 根据接口文档：GET /blade-auth/oauth/logout
 * @returns {Promise}
 */
export function logout() {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync("river_token") || "";
    uni.request({
      url: `${RiverAuthUrl}/oauth/logout`,
      method: "GET",
      header: {
        "Blade-Auth": `bearer ${token}`,
        "Blade-Requested-With": "BladeHttpRequest",
      },
      success: () => {
        // 清除本地存储
        uni.removeStorageSync("river_token");
        uni.removeStorageSync("river_refresh_token");
        uni.removeStorageSync("river_user_info");
        // 跳转登录页
        uni.reLaunch({
          url: "/pages/login/index",
        });
        resolve();
      },
      fail: (err) => {
        // 即使请求失败也清除本地存储
        uni.removeStorageSync("river_token");
        uni.removeStorageSync("river_refresh_token");
        uni.removeStorageSync("river_user_info");
        uni.reLaunch({
          url: "/pages/login/index",
        });
        reject(err);
      },
    });
  });
}

/**
 * 刷新Token
 * POST /blade-auth/oauth/token
 * @param {string} refreshToken 刷新Token
 * @param {string} tenantId 租户ID，默认 000000
 * @param {string} deptId 部门ID
 * @param {string} roleId 角色ID
 * @returns {Promise}
 */
export function refreshToken(refreshToken, tenantId = "000000", deptId = "", roleId = "") {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${RiverAuthUrl}/oauth/token`,
      method: "POST",
      data: {
        tenantId,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "all",
      },
      header: {
        "Tenant-Id": tenantId,
        "Dept-Id": deptId || "",
        "Role-Id": roleId || "",
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic c2FiZXI6c2FiZXJfc2VjcmV0",
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

export default {
  getCaptcha,
  getUserRoles,
  login,
  logout,
  refreshToken,
};
