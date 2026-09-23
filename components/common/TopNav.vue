<template>
  <view class="top-nav">
    <!-- Logo和标题 -->
    <view class="nav-left">
      <view class="logo">
        <view class="logo-icon">
          <image src="/static/logo.png" mode="widthFix"></image>
        </view>
        <view class="logo-text">
          <text class="title">四乱监管AI助手</text>
        </view>
      </view>
    </view>

    <!-- 功能按钮 -->
    <view class="nav-right">
      <!-- 智能录入 -->
      <view v-if="canCreateInspection" class="nav-btn smart-input-btn" @click="handleSmartInput">
        <Icon name="bolt" color="#ffffff" size="44rpx" />
      </view>
      <!-- 智能统计 -->
      <view class="nav-btn smart-stats-btn" @click="handleSmartStats">
        <Icon name="bulb" color="#ffffff" size="44rpx" />
      </view>
      <!-- 新增暗访（仅巡查员可见） -->
      <view v-if="canCreateInspection" class="nav-btn add-btn" @click="handleAdd">
        <Icon name="plus" color="#ffffff" size="44rpx" />
      </view>
    </view>

    <!-- 智能录入弹窗 -->
    <SmartInputModal :visible="showSmartInputModal" @update:visible="showSmartInputModal = $event"
      @success="handleSmartInputSuccess" />

    <!-- 智能统计弹窗 -->
    <SmartStatsModal :visible="showSmartStatsModal" @update:visible="showSmartStatsModal = $event" />

    <!-- 新增暗访弹窗 -->
    <InspectionFormModal :visible="showFormModal" :edit-data="editData" :prefill-data="prefillData"
      @update:visible="showFormModal = $event" @success="handleFormSuccess" />
  </view>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import SmartInputModal from "@/components/modals/SmartInputModal.vue";
import SmartStatsModal from "@/components/modals/SmartStatsModal.vue";
import InspectionFormModal from "@/components/modals/InspectionFormModal.vue";
import Icon from "@/components/common/Icon.vue";
import userStore from "@/store/user.js";

export default defineComponent({
  name: "TopNav",
  components: {
    SmartInputModal,
    SmartStatsModal,
    InspectionFormModal,
    Icon,
  },
  emits: ["smartInputSuccess", "formSuccess"],
  setup(props, { emit }) {
    // 弹窗状态
    const showSmartInputModal = ref(false);
    const showSmartStatsModal = ref(false);
    const showFormModal = ref(false);
    const editData = ref(null);
    const prefillData = ref(null);

    // 权限判断
    const canCreateInspection = computed(() => userStore.getters.canCreateInspection());

    // 智能录入
    const handleSmartInput = () => {
      showSmartInputModal.value = true;
    };

    // 智能统计
    const handleSmartStats = () => {
      showSmartStatsModal.value = true;
    };

    // 新增暗访
    const handleAdd = () => {
      editData.value = null;
      prefillData.value = null;
      showFormModal.value = true;
    };

    // 智能录入成功
    const handleSmartInputSuccess = (data) => {
      showSmartInputModal.value = false;
      editData.value = null;
      prefillData.value = data;
      showFormModal.value = true;
    };

    // 新增暗访成功
    const handleFormSuccess = () => {
      showFormModal.value = false;
      editData.value = null;
      prefillData.value = null;
      emit("formSuccess");
    };

    return {
      showSmartInputModal,
      showSmartStatsModal,
      showFormModal,
      canCreateInspection,
      handleSmartInput,
      handleSmartStats,
      handleAdd,
      handleSmartInputSuccess,
      handleFormSuccess,
      editData,
      prefillData,
    };
  },
});
</script>

<style lang="scss" scoped>
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 90rpx 20rpx 20rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 9999;
  /* #ifndef H5 */
  /* 非H5环境（小程序、APP）才有padding */
  padding-top: 90rpx;
  /* #endif */

  /* #ifdef H5 */
  /* H5环境无padding */
  padding-top: 20rpx;
  /* #endif */
}

/* Logo区域 */
.nav-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.logo-icon {
  width: 72rpx;
  height: 72rpx;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    border-radius: 10rpx;
  }
}

.logo-symbol {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
}

.subtitle {
  font-size: 22rpx;
  color: #64748b;
  line-height: 1.2;
  margin-top: 4rpx;
}

/* 按钮区域 */
.nav-right {
  display: flex;
  align-items: center;
  gap: 16rpx;

  /* #ifndef H5 */
  /* 非H5环境（小程序、APP）才有padding */
  padding-right: 170rpx;
  /* #endif */

  /* #ifdef H5 */
  /* H5环境无padding */
  padding: 0;
  /* #endif */
}

.nav-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }

  &.smart-input-btn {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  }

  &.smart-stats-btn {
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  }

  &.add-btn {
    background: rgb(22 163 74 / var(--tw-bg-opacity, 1));
  }
}
</style>
