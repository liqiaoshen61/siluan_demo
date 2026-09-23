<template>
  <view class="userhd">
    <image class="userbgtop" mode="widthFix" src="/static/userbg.png"></image>

    <view class="userbox">
      <view class="pagename">我的</view>
      <view class="headt flexbox">
        <template v-if="userInfo.avatar">
          <image class="userimg" :src="userInfo.avatar" mode="widthFix"></image>
        </template>
        <template v-else>
          <image class="userimg" src="../../static/logo2.jpg" mode="widthFix"></image>
        </template>
        <view class="name">
          {{ isLoggedIn ? userName : "未登录" }}
        </view>
      </view>

      <!-- 功能菜单 -->
      <view class="menu-list">
        <view class="menu-item" @click="handleMenuClick('password')">
          <Icon class="menu-icon" name="lock" color="#3b82f6" size="40rpx" />
          <text class="menu-text">修改密码</text>
          <text class="arrow">›</text>
        </view>
        <view class="menu-item" @click="handleMenuClick('about')">
          <Icon class="menu-icon" name="info" color="#3b82f6" size="40rpx" />
          <text class="menu-text">关于系统</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <!-- 退出登录按钮 -->
      <view class="log-out">
        <button class="btn logout-btn" v-if="isLoggedIn" @click="handleLogout">退出登录</button>
        <button v-else class="btn login-btn" @click="goLogin">立即登录</button>
      </view>
    </view>
    <CustomTabBar current-tab="user" @change="handleTabChange" />

    <!-- 修改密码弹窗 -->
    <view v-if="showPasswordModal" class="modal-overlay" @click="handlePasswordModalClose">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text class="modal-title">修改密码</text>
          <view class="close-btn" @click="handlePasswordModalClose">
            <Icon name="close" color="#64748b" size="32rpx" />
          </view>
        </view>
        <view class="modal-body">
          <!-- 旧密码 -->
          <view class="input-item">
            <view class="input-icon">
              <Icon name="lock" color="#94a3b8" size="36rpx" />
            </view>
            <input class="input-field" type="text" :password="!showOldPassword" v-model="passwordForm.oldPassword"
              placeholder="请输入旧密码" placeholder-class="placeholder" />
            <view class="input-suffix" @click="showOldPassword = !showOldPassword">
              <Icon :name="showOldPassword ? 'eye' : 'eye-off'" color="#94a3b8" size="36rpx" />
            </view>
          </view>
          <!-- 新密码 -->
          <view class="input-item">
            <view class="input-icon">
              <Icon name="lock" color="#94a3b8" size="36rpx" />
            </view>
            <input class="input-field" type="text" :password="!showNewPassword" v-model="passwordForm.newPassword"
              placeholder="请输入新密码" placeholder-class="placeholder" />
            <view class="input-suffix" @click="showNewPassword = !showNewPassword">
              <Icon :name="showNewPassword ? 'eye' : 'eye-off'" color="#94a3b8" size="36rpx" />
            </view>
          </view>
          <!-- 确认新密码 -->
          <view class="input-item">
            <view class="input-icon">
              <Icon name="lock" color="#94a3b8" size="36rpx" />
            </view>
            <input class="input-field" type="text" :password="!showConfirmPassword"
              v-model="passwordForm.confirmPassword" placeholder="请再次输入新密码" placeholder-class="placeholder" />
            <view class="input-suffix" @click="showConfirmPassword = !showConfirmPassword">
              <Icon :name="showConfirmPassword ? 'eye' : 'eye-off'" color="#94a3b8" size="36rpx" />
            </view>
          </view>
          <view class="password-tips">
            <text>密码长度6-20位，建议包含字母和数字</text>
          </view>
          <!-- 错误提示 -->
          <view v-if="errorMessage" class="error-message">
            <text>{{ errorMessage }}</text>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn btn-cancel" @click="handlePasswordModalClose">取消</button>
          <button class="btn btn-confirm" :disabled="passwordLoading" @click="handlePasswordSubmit">
            {{ passwordLoading ? '提交中...' : '确定' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { defineComponent, ref, reactive, computed } from "vue";
import userStore from "@/store/user.js";
import CustomTabBar from "@/components/common/CustomTabBar.vue";
import Icon from "@/components/common/Icon.vue";
import api from "@/api/index.js";

export default defineComponent({
  name: "UserPage",
  components: {
    CustomTabBar,
    Icon,
  },
  setup() {
    const { state, actions, getters } = userStore;

    // 用户信息
    const userInfo = computed(() => state.userInfo || {});
    const isLoggedIn = computed(() => getters.isLoggedIn());
    const userName = computed(() => getters.userName());

    // 修改密码弹窗
    const showPasswordModal = ref(false);
    const showOldPassword = ref(false);
    const showNewPassword = ref(false);
    const showConfirmPassword = ref(false);
    const passwordLoading = ref(false);
    const errorMessage = ref("");
    const passwordForm = reactive({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    // 刷新用户数据
    const refreshAccountData = async () => {
      // 如果已登录但没有用户信息，尝试获取
      if (isLoggedIn.value && !userInfo.value?.realName) {
        try {
          await actions.fetchProfile();
        } catch (error) {
          console.error("获取用户资料失败:", error);
        }
      }
    };

    // 跳转登录页
    const goLogin = () => {
      uni.navigateTo({
        url: "/pages/login/index",
      });
    };

    // 菜单点击
    const handleMenuClick = (type) => {
      if (!isLoggedIn.value) {
        goLogin();
        return;
      }

      switch (type) {
        case "password":
          showPasswordModal.value = true;
          break;
        case "about":
          uni.showModal({
            title: "关于系统",
            content: "四乱监管AI助手 v1.0.0\n河湖监管小程序",
            showCancel: false,
          });
          break;
      }
    };

    // 关闭修改密码弹窗
    const handlePasswordModalClose = () => {
      showPasswordModal.value = false;
      passwordForm.oldPassword = "";
      passwordForm.newPassword = "";
      passwordForm.confirmPassword = "";
      errorMessage.value = "";
    };

    // 验证密码表单
    const validatePasswordForm = () => {
      if (!passwordForm.oldPassword.trim()) {
        uni.showToast({ title: "请输入旧密码", icon: "none" });
        return false;
      }
      if (!passwordForm.newPassword.trim()) {
        uni.showToast({ title: "请输入新密码", icon: "none" });
        return false;
      }
      if (passwordForm.newPassword.length < 6 || passwordForm.newPassword.length > 20) {
        uni.showToast({ title: "密码长度需6-20位", icon: "none" });
        return false;
      }
      if (!passwordForm.confirmPassword.trim()) {
        uni.showToast({ title: "请再次输入新密码", icon: "none" });
        return false;
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        uni.showToast({ title: "两次输入的密码不一致", icon: "none" });
        return false;
      }
      return true;
    };

    // 提交修改密码
    const handlePasswordSubmit = async () => {
      if (!validatePasswordForm()) return;
      if (passwordLoading.value) return;

      passwordLoading.value = true;
      errorMessage.value = "";
      try {
        await api.user.updatePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        });
        uni.showToast({
          title: "密码修改成功",
          icon: "success",
        });

        handlePasswordModalClose();
      } catch (error) {
        console.error("修改密码失败:", error);
        errorMessage.value = error.msg || "修改密码失败";
      } finally {
        passwordLoading.value = false;
      }
    };

    // 退出登录
    const handleLogout = () => {
      uni.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        confirmColor: "#ef4444",
        success: (res) => {
          if (res.confirm) {
            doLogout();
          }
        },
      });
    };

    // 执行退出登录
    const doLogout = async () => {
      try {
        uni.showLoading({ title: "退出中..." });

        // 调用退出登录接口
        await actions.logout();

        uni.hideLoading();
        uni.showToast({
          title: "已退出登录",
          icon: "success",
          duration: 1500,
        });

        // 跳转到登录页
        setTimeout(() => {
          uni.reLaunch({
            url: "/pages/login/index",
          });
        }, 1500);
      } catch (error) {
        uni.hideLoading();
        console.error("退出登录失败:", error);

        // 即使接口失败，也清除本地状态并跳转
        uni.showToast({
          title: "已退出登录",
          icon: "success",
          duration: 1500,
        });

        setTimeout(() => {
          uni.reLaunch({
            url: "/pages/login/index",
          });
        }, 1500);
      }
    };

    // Tab切换
    const handleTabChange = () => {
      // Tab切换由CustomTabBar内部处理
    };

    return {
      userInfo,
      isLoggedIn,
      userName,
      refreshAccountData,
      goLogin,
      handleMenuClick,
      handleLogout,
      handleTabChange,
      // 修改密码相关
      showPasswordModal,
      showOldPassword,
      showNewPassword,
      showConfirmPassword,
      passwordLoading,
      passwordForm,
      errorMessage,
      handlePasswordModalClose,
      handlePasswordSubmit,
    };
  },
  onLoad() {
    // 页面加载
  },
  onShow() {
    // 刷新用户数据
    this.refreshAccountData();
  },
});
</script>

<style lang="scss" scoped>
.userhd {
  position: relative;
  background: #f5faf9;
  min-height: 100vh;
  padding-bottom: 120rpx;
  box-sizing: border-box;

  .userbgtop {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100vw;
    z-index: 0;
    border-bottom-left-radius: 50rpx;
    border-bottom-right-radius: 50rpx;
    overflow: hidden;
  }

  .userbox {
    position: relative;
    z-index: 3;
    padding: 30rpx 40rpx;
    box-sizing: border-box;

    .pagename {
      padding-top: 40rpx;
      font-size: 40rpx;
      font-weight: bold;
      padding-bottom: 50rpx;
      color: #fff;
    }

    .headt {
      margin-bottom: 20rpx;
    }

    .userimg {
      width: 150rpx;
      height: 150rpx;
      border-radius: 100%;
      border: 4rpx solid #fff;
    }

    .name {
      margin-left: 40rpx;
      font-weight: bold;
      font-size: 32rpx;
      color: #fff;
    }

    .menu-list {
      margin-top: 40rpx;
      background: #fff;
      border-radius: 20rpx;
      overflow: hidden;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

      .menu-item {
        display: flex;
        align-items: center;
        padding: 30rpx;
        border-bottom: 1rpx solid #f0f0f0;
        transition: background 0.2s;

        &:last-child {
          border-bottom: none;
        }

        &:active {
          background: #f8fafc;
        }

        .menu-icon {
          font-size: 40rpx;
          margin-right: 20rpx;
        }

        .menu-text {
          flex: 1;
          font-size: 30rpx;
          color: #1e293b;
        }

        .arrow {
          color: #cbd5e1;
          font-size: 36rpx;
          font-weight: 300;
        }
      }
    }

    .log-out {
      margin-top: 40rpx;
    }

    .btn {
      width: 100%;
      height: 88rpx;
      line-height: 88rpx;
      font-size: 32rpx;
      border-radius: 20rpx;
      border: none;

      &.login-btn {
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        color: #ffffff;
      }

      &.logout-btn {
        background: #ffffff;
        color: #ef4444;
        border: 1rpx solid #fca5a5;
      }

      &:active {
        opacity: 0.8;
        transform: scale(0.99);
      }
    }
  }
}

.flexbox {
  display: flex;
  align-items: center;
}

/* 修改密码弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-container {
  width: 85%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #e2e8f0;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 32rpx;
}

.input-item {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 16rpx;
  padding: 0 20rpx;
  height: 88rpx;
  margin-bottom: 24rpx;
}

.input-icon {
  width: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-field {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #1e293b;
}

.input-suffix {
  width: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-tips {
  padding: 16rpx 0;

  text {
    font-size: 24rpx;
    color: #94a3b8;
  }
}

.error-message {
  padding: 16rpx;
  background: #fef2f2;
  border-radius: 12rpx;
  margin-bottom: 16rpx;

  text {
    font-size: 26rpx;
    color: #dc2626;
  }
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #e2e8f0;
}

.btn {
  flex: 1;
  height: 80rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &.btn-cancel {
    background: #f1f5f9;
    color: #64748b;
  }

  &.btn-confirm {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: #ffffff;
  }

  &[disabled] {
    opacity: 0.6;
  }
}

.placeholder {
  color: #94a3b8;
}
</style>
