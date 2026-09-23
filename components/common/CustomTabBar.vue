<template>
  <view>
    <view class="custom-tabbar">
      <view v-for="(item, index) in tabs" :key="index" class="tab-item" :class="{ active: currentTab === item.key }"
        @click="handleTabClick(item)">
        <!-- 图标 -->
        <view class="tab-icon">
          <Icon :name="item.icon" :color="currentTab === item.key ? '#1e40af' : '#64748b'" size="44rpx" />
          <!-- 红点 -->
          <view v-if="item.badge && item.badge > 0" class="badge">
            {{ item.badge > 99 ? '99+' : item.badge }}
          </view>
        </view>
        <!-- 文字 -->
        <text class="tab-text">{{ item.label }}</text>
      </view>
    </view>

    <!-- 消息弹窗 -->
    <MessageModal :visible="showMessageModal" @update:visible="showMessageModal = $event" />
  </view>
</template>

<script>
import { defineComponent, computed, ref } from "vue";
import userStore from "@/store/user.js";
import MessageModal from "@/components/modals/MessageModal.vue";
import Icon from "@/components/common/Icon.vue";

export default defineComponent({
  name: "CustomTabBar",
  components: {
    MessageModal,
    Icon,
  },
  props: {
    currentTab: {
      type: String,
      default: "inspection",
    },
  },
  emits: ["change"],
  setup(props, { emit }) {
    const { state } = userStore;

    // 消息弹窗状态
    const showMessageModal = ref(false);

    // Tab配置 - 根据角色控制badge显示和模块可见性
    const tabs = computed(() => {
      const isInspector = userStore.getters.isInspector();
      const isTownship = userStore.getters.isTownship();
      const inspectionLabel = userStore.getters.getInspectionLabel();
      const isNotTown = !userStore.getters.isTownReceiver();

      // 基础配置
      const allTabs = [
        {
          key: "inspection",
          label: inspectionLabel,
          icon: "tasks",
          pagePath: "/pages/index/index",
          // 巡查员可见
          visible: isInspector,
          // 只有巡查员显示草稿数
          badge: isInspector ? state.badges.draftCount : 0,
        },
        {
          key: "affairs",
          label: "事务",
          icon: "affairs",
          pagePath: "/pages/affairs/index",
          // 乡镇整改员可见
          visible: isTownship,
          // 只有整改员显示待处理数
          badge: isTownship ? state.badges.pendingCount : 0,
        },
        {
          key: "stats",
          label: "统计",
          icon: "chart",
          pagePath: "/pages/stats/index",
          // 除了乡镇相关的其他都可见
          visible: isNotTown,
          badge: 0,
        },
        {
          key: "message",
          label: "消息",
          icon: "notification",
          pagePath: "",
          // 所有人可见
          visible: true,
          // 消息数对所有角色都显示
          badge: state.badges.notificationCount,
          isModal: true,
        },
        {
          key: "user",
          label: "我的",
          icon: "user",
          pagePath: "/pages/user/index",
          // 所有人可见
          visible: true,
          badge: 0,
        },
      ];

      // 过滤出当前角色可见的模块
      return allTabs.filter(tab => tab.visible);
    });

    // 点击Tab
    const handleTabClick = (item) => {
      // 消息Tab打开弹窗
      if (item.isModal) {
        showMessageModal.value = true;
        return;
      }

      if (props.currentTab === item.key) return;

      emit("change", item.key);

      uni.switchTab({
        url: item.pagePath,
      });
    };

    return {
      tabs,
      showMessageModal,
      handleTabClick,
    };
  },
});
</script>

<style lang="scss" scoped>
.custom-tabbar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 100rpx;
  background: #ffffff;
  border-top: 1rpx solid #e2e8f0;
  padding-bottom: env(safe-area-inset-bottom, 16rpx);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  /* #ifndef H5 */
  /* 非H5环境（小程序、APP）height高度 */
  height: 100rpx;
  /* #endif */

  /* #ifdef H5 */
  /* H5环境无height高度 */
  height: 120rpx;
  /* #endif */
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8rpx 0;
  transition: all 0.2s;

  &.active {
    .tab-text {
      color: #1e40af;
      font-weight: 500;
    }
  }
}

.tab-icon {
  position: relative;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge {
  position: absolute;
  top: -16rpx;
  right: -20rpx;
  min-width: 36rpx;
  height: 36rpx;
  background: #ef4444;
  border-radius: 18rpx;
  font-size: 20rpx;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  font-weight: 500;
}

.tab-text {
  font-size: 22rpx;
  color: #64748b;
  margin-top: 4rpx;
  transition: color 0.2s;
}
</style>
