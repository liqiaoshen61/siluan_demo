<template>
  <view v-if="showPopup" class="privacy-popup-mask">
    <view class="privacy-popup-container">
      <view class="privacy-popup-header">
        <text class="title">用户隐私保护提示</text>
      </view>
      <view class="privacy-popup-content">
        <text class="content-text">
          为了更好地为您提供服务，我们需要获取以下权限：\n\n
          • 访问您的相册（用于选择照片）\n
          • 使用您的摄像头（用于拍摄照片）\n\n
          我们承诺仅在使用相关功能时申请这些权限，并严格保护您的隐私安全。
          请您仔细阅读并同意《用户隐私保护指引》。
        </text>
      </view>
      <view class="privacy-popup-buttons">
        <button class="disagree-btn" @click="onDisagree">暂不同意</button>
        <!-- 必须使用 open-type="agreePrivacyAuthorization" 的button -->
        <button class="agree-btn" open-type="agreePrivacyAuthorization" @agreeprivacyauthorization="onAgree">同意</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "PrivacyPopup",
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showPopup: this.show,
    };
  },
  watch: {
    show(newVal) {
      this.showPopup = newVal;
    }
  },
  methods: {
    onAgree() {
      uni.setStorageSync('hasAgreedPrivacy', true); // 存储同意状态
      this.hidePopup();
      this.$emit('agreed'); // 通知父组件
    },
    onDisagree() {
      this.hidePopup();
      this.$emit('disagreed');
      uni.showToast({ title: '需要同意才能使用完整功能', icon: 'none' });
    },
    hidePopup() {
      this.showPopup = false;
      this.$emit('update:show', false);
    }
  }
};
</script>

<style scoped>
.privacy-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.privacy-popup-container {
  width: 80%;
  max-width: 300px;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}
.privacy-popup-header {
  padding: 20px 20px 10px;
  text-align: center;
  border-bottom: 1px solid #eeeeee;
}
.title {
  font-size: 18px;
  font-weight: bold;
  color: #333333;
}
.privacy-popup-content {
  padding: 20px;
}
.content-text {
  font-size: 14px;
  color: #666666;
  line-height: 1.6;
  white-space: pre-line;
}
.privacy-popup-buttons {
  display: flex;
  border-top: 1px solid #eeeeee;
}
.agree-btn, .disagree-btn {
  flex: 1;
  height: 44px;
  line-height: 44px;
  border-radius: 0;
  border: none;
  font-size: 16px;
}
.agree-btn {
  color: #007AFF;
}
.disagree-btn {
  color: #999999;
  border-right: 1px solid #eeeeee;
}
</style>