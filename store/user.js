/**
 * 用户状态管理
 * 使用Vue3 reactive实现简单的状态管理
 */
import { reactive } from "vue";
import {
  getToken,
  setToken,
  clearToken,
  getUserInfo,
  setUserInfo as saveUserInfo,
} from "@/http/riverRequest.js";
import api from "@/api/index.js";

// 用户状态
const state = reactive({
  // 登录状态
  isLoggedIn: !!getToken(),
  // Token
  token: getToken() || "",
  // 用户信息
  userInfo: getUserInfo() || null,
  // 基础选项
  options: {
    townships: [],
    sections: [],
    problemTypes: [],
    problemTypesFlat: [],
    planItems: [],
  },
  // 是否已加载选项
  optionsLoaded: false,
  // 红点数据
  badges: {
    draftCount: 0,
    pendingCount: 0,
    notificationCount: 0,
  },
});

// Actions
const actions = {
  /**
   * 登录
   */
  async login(params) {
    try {
      const result = await api.auth.login(params);
      state.isLoggedIn = true;
      state.token = getToken();
      state.userInfo = getUserInfo();
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 退出登录
   */
  async logout() {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error("退出登录失败:", error);
    } finally {
      clearToken();
      // 清除AI智能统计的会话缓存，避免换账号后恢复上一个账号的对话
      api.smart.clearSessionCache();
      state.isLoggedIn = false;
      state.token = "";
      state.userInfo = null;
      state.optionsLoaded = false;
      state.options = {
        townships: [],
        sections: [],
        problemTypes: [],
        problemTypesFlat: [],
        planItems: [],
      };
      // 重置红点数据
      state.badges = {
        draftCount: 0,
        pendingCount: 0,
        notificationCount: 0,
      };
    }
  },

  /**
   * 获取用户资料
   */
  async fetchProfile() {
    try {
      const result = await api.user.getProfile();
      if (result.data) {
        state.userInfo = {
          ...state.userInfo,
          ...result.data,
        };
        saveUserInfo(state.userInfo);
      }
      return result.data;
    } catch (error) {
      console.error("获取用户资料失败:", error);
      throw error;
    }
  },

  /**
   * 加载基础选项
   */
  async loadOptions() {
    if (state.optionsLoaded) {
      return state.options;
    }

    try {
      // 只有巡查员才需要获取计划选项
      const isInspector = getters.isInspector();
      const result = await api.user.getAllOptions({
        includePlanOptions: isInspector,
      });
      state.options = result;
      state.optionsLoaded = true;
      return result;
    } catch (error) {
      console.error("加载基础选项失败:", error);
      throw error;
    }
  },

  /**
   * 根据乡镇ID获取河段
   */
  async getSectionsByTownship(townshipId) {
    if (!townshipId || townshipId == -1) {
      state.options.sections = [];
      return [];
    }

    try {
      const result = await api.user.getSections(townshipId);
      state.options.sections = result.data || [];
      return state.options.sections;
    } catch (error) {
      console.error("获取河段失败:", error);
      return [];
    }
  },

  /**
   * 获取问题类型（树形）
   */
  getProblemTypeTree() {
    return state.options.problemTypes || [];
  },

  /**
   * 根据大类ID获取小类
   */
  getProblemSubtypes(parentId) {
    return state.options.problemTypesFlat.filter(
      (item) => item.parentId === parentId,
    );
  },

  /**
   * 更新红点数据
   */
  async updateBadges() {
    try {
      const isInspector = getters.isInspector();
      const canRectify = getters.canRectify();

      // 根据角色构建请求列表
      const requests = [];

      // 只有巡查员才获取草稿数量
      if (isInspector) {
        requests.push(
          api.inspection.getInspectionPage({ status: "DRAFT", size: 1 }),
        );
      }

      // 只有整改员才获取待处理任务数量
      if (canRectify) {
        requests.push(api.task.getTaskPage({ status: "PENDING", size: 1 }));
      }

      // 未读通知数量所有角色都需要
      requests.push(api.notification.getUnreadCount());

      const results = await Promise.all(requests);

      // 根据请求顺序解析结果
      let resultIndex = 0;

      // 草稿数量（仅巡查员）
      if (isInspector) {
        state.badges.draftCount = results[resultIndex]?.total || 0;
        resultIndex++;
      } else {
        state.badges.draftCount = 0;
      }

      // 待处理任务数量（仅整改员）
      if (canRectify) {
        state.badges.pendingCount = results[resultIndex]?.total || 0;
        resultIndex++;
      } else {
        state.badges.pendingCount = 0;
      }

      // 未读通知数量
      state.badges.notificationCount = results[resultIndex] || 0;
    } catch (error) {
      console.error("更新红点数据失败:", error);
    }
  },

  /**
   * 更新未读通知数
   */
  async updateNotificationBadge() {
    try {
      state.badges.notificationCount = await api.notification.getUnreadCount();
    } catch (error) {
      console.error("更新未读通知数失败:", error);
    }
  },

  /**
   * 更新草稿数
   */
  async updateDraftBadge() {
    try {
      // 只有巡查员才有草稿
      if (!getters.isInspector()) {
        state.badges.draftCount = 0;
        return;
      }

      const result = await api.inspection.getInspectionPage({
        status: "DRAFT",
        size: 1,
      });
      state.badges.draftCount = result.total || 0;
    } catch (error) {
      console.error("更新草稿数失败:", error);
    }
  },

  /**
   * 更新待处理任务数
   */
  async updatePendingBadge() {
    try {
      // 只有整改员才有待处理任务
      if (!getters.canRectify()) {
        state.badges.pendingCount = 0;
        return;
      }

      const result = await api.task.getTaskPage({ status: "PENDING", size: 1 });
      state.badges.pendingCount = result.total || 0;
    } catch (error) {
      console.error("更新待处理任务数失败:", error);
    }
  },
};

// Getters
const getters = {
  isLoggedIn: () => state.isLoggedIn,
  token: () => state.token,
  userInfo: () => state.userInfo,
  userId: () => state.userInfo?.id || "",
  userName: () => state.userInfo?.realName || state.userInfo?.userName || "",
  countyWide: () => state.userInfo?.countyWide || false,
  townshipIds: () => state.userInfo?.townshipIds || [],
  groupIds: () => state.userInfo?.groupIds || [],
  options: () => state.options,
  badges: () => state.badges,
  totalBadge: () => {
    const total =
      state.badges.draftCount +
      state.badges.pendingCount +
      state.badges.notificationCount;
    return total > 99 ? "99+" : total.toString();
  },
  // 角色ID
  roleId: () => state.userInfo?.roleId || "",
  // 是否为巡查员
  isInspector: () => {
    const roleId = String(state.userInfo?.roleId || "");
    return roleId === "2207141100000000002" || roleId === "2208071100000000003";
  },
  // 是否为县级巡查员
  isDistrictInspector: () => {
    const roleId = String(state.userInfo?.roleId || "");
    return roleId === "2207141100000000002";
  },
  // 是否为乡镇人员接收月度预警、日常通知、问题通知的人 `river_township`、`river_township_leader`、`river_township_inspector`
  isTownReceiver: () => {
    const roleId = String(state.userInfo?.roleId || "");
    return (
      roleId === "2207141100000000003" ||
      roleId === "2208071100000000001" ||
      roleId === "2208071100000000003"
    );
  },
  // 是否为乡镇巡查员
  isTownInspector: () => {
    const roleId = String(state.userInfo?.roleId || "");
    return roleId === "2208071100000000003";
  },
  // 是否为乡镇整改员
  isTownship: () => {
    const roleId = String(state.userInfo?.roleId || "");
    return roleId === "2207141100000000003" || roleId === "2208071100000000001";
  },
  // 是否为管理员  管理员、河长办
  isAdmin: () => {
    const roleId = String(state.userInfo?.roleId || "");
    return (
      roleId === "2207141100000000001" ||
      roleId === "1123598816738675201" ||
      roleId === "2208071100000000002"
    );
  },
  // 是否可以新增问题（巡查员可以）
  canCreateInspection: () => {
    const roleId = String(state.userInfo?.roleId || "");
    // 巡查员可以新增
    if (roleId === "2207141100000000002" || roleId === "2208071100000000003")
      return true;
    // 其他角色不能新增
    return false;
  },
  // 是否可以撤回问题（县级巡查员可以）
  canWidrawInspection: () => {
    const roleId = String(state.userInfo?.roleId || "");
    // 县级巡查员可以撤回
    if (roleId === "2207141100000000002") return true;
    // 其他角色不能新增
    return false;
  },

  // 是否可以提交整改（乡镇整改员可以）
  canRectify: () => {
    const roleId = String(state.userInfo?.roleId || "");
    // 乡镇整改员可以提交整改
    if (roleId === "2207141100000000003" || roleId === "2208071100000000001")
      return true;
    // 其他角色不能提交整改
    return false;
  },

  // 获取"暗访/巡查"标签文字（乡镇专管员显示"巡查"）
  getInspectionLabel: () => {
    const roleId = String(state.userInfo?.roleId || "");
    return roleId === "2208071100000000003" ? "巡查" : "暗访";
  },
};

export default {
  state,
  actions,
  getters,
};

// 导出便捷方法
export const useUserStore = () => ({
  ...state,
  ...actions,
  ...getters,
});
