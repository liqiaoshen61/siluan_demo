<template>
  <view v-if="showPrivacy" class="privacy-popup">
    <view class="privacy-content">
      <view class="privacy-title">用户隐私保护提示</view>
      <view class="privacy-desc">
        感谢您使用四乱随手拍小程序。在使用定位、相册、摄像头等功能前，我们需要获取您的同意。
        <text class="privacy-link" @click="openPrivacyContract">《用户隐私保护指引》</text>
      </view>
      <view class="privacy-buttons">
        <button class="btn-reject" @click="handleDisagree">拒绝</button>
        <!-- #ifdef MP-WEIXIN -->
        <button class="btn-agree" id="agree-btn" open-type="agreePrivacyAuthorization" @agreeprivacyauthorization="handleAgree">同意</button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <button class="btn-agree" @click="handleAgree">同意</button>
        <!-- #endif -->
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "PrivacyPopup",
  data() {
    return {
      showPrivacy: false,
      resolvePromise: null,
    };
  },
  methods: {
    // 显示隐私弹窗
    show(resolve) {
      this.resolvePromise = resolve;
      this.showPrivacy = true;
    },

    // 打开隐私协议
    openPrivacyContract() {
      // #ifdef MP-WEIXIN
      wx.openPrivacyContract({
        success: (res) => {
          console.log("打开隐私协议成功", res);
        },
        fail: (err) => {
          console.error("打开隐私协议失败", err);
        },
      });
      // #endif
    },

    // 用户同意
    handleAgree() {
      this.showPrivacy = false;
      if (this.resolvePromise) {
        this.resolvePromise({
          event: "agree",
          buttonId: "agree-btn",
        });
        this.resolvePromise = null;
      }
    },

    // 用户拒绝
    handleDisagree() {
      this.showPrivacy = false;
      if (this.resolvePromise) {
        this.resolvePromise({
          event: "disagree",
        });
        this.resolvePromise = null;
      }
      uni.showModal({
        title: "提示",
        content: "您拒绝了隐私协议，部分功能将无法使用",
        showCancel: false,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.privacy-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.privacy-content {
  width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx 32rpx;
}

.privacy-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  margin-bottom: 32rpx;
}

.privacy-desc {
  font-size: 28rpx;
  color: #475569;
  line-height: 1.8;
  text-align: justify;
  margin-bottom: 48rpx;
}

.privacy-link {
  color: #3b82f6;
  text-decoration: underline;
}

.privacy-buttons {
  display: flex;
  gap: 24rpx;
}

.btn-reject,
.btn-agree {
  flex: 1;
  height: 80rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.btn-reject {
  background: #f1f5f9;
  color: #64748b;
}

.btn-agree {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: #ffffff;
}
</style>
