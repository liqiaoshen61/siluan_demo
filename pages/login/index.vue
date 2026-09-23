<template>
  <view class="login-page">
    <!-- 顶部背景 -->
    <image class="loginbg1" mode="widthFix" src="/static/loginbg.svg"></image>
    <image class="loginbg2" mode="widthFix" src="/static/loginbg2.svg"></image>
    <image class="loginbg3" mode="widthFix" src="/static/loginbg3.svg"></image>
    <view class="login-header">
      <view class="logo-container">
        <view class="logo-icon">
          <image src="/static/logo.png" mode="widthFix"></image>
        </view>
      </view>
      <view class="form-title">四乱监管AI助手</view>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">


      <!-- 账号输入 -->
      <view class="input-item">
        <view class="input-icon">
          <Icon name="user" color="#64748b" size="40rpx" />
        </view>
        <input class="input-field" type="text" v-model="form.username" placeholder="请输入账号"
          placeholder-class="placeholder" @blur="checkUserRole" />
      </view>

      <!-- 密码输入 -->
      <view class="input-item">
        <view class="input-icon">
          <Icon name="lock" color="#64748b" size="40rpx" />
        </view>
        <input class="input-field" type="text" :password="!showPassword" v-model="form.password"
          placeholder="请输入密码" placeholder-class="placeholder" />
        <view class="input-suffix" @click="showPassword = !showPassword">
          <Icon :name="showPassword ? 'eye' : 'eye-off'" color="#64748b" size="40rpx" />
        </view>
      </view>

      <!-- 验证码（仅县级角色显示） -->
      <view v-if="showCaptcha" class="input-item captcha-item">
        <view class="input-icon">
          <Icon name="code" color="#64748b" size="40rpx" />
        </view>
        <input class="input-field captcha-input" type="text" v-model="form.captcha" placeholder="请输入验证码"
          placeholder-class="placeholder" maxlength="6" />
        <image class="captcha-image" :src="captchaImage" mode="aspectFill" @click="getCaptcha"></image>
      </view>

      <!-- 登录按钮 -->
      <button class="login-btn" :class="{ loading: isLoading }" :disabled="isLoading" @click="handleLogin">
        <text v-if="!isLoading">登 录</text>
        <text v-else>登录中...</text>
      </button>

      <!-- 记住账号 -->
      <view class="remember-account">
        <view class="checkbox" @click="rememberAccount = !rememberAccount">
          <view :class="['checkbox-inner', { checked: rememberAccount }]">
            <Icon v-if="rememberAccount" name="check" color="#ffffff" size="24rpx" />
          </view>
        </view>
        <text class="remember-text">记住账号</text>
      </view>
    </view>

    <!-- 底部信息 -->
    <view class="login-footer">
      <!-- <text class="footer-text">永春河湖监管平台</text> -->
    </view>
  </view>
</template>

<script>
import smCrypto from "@/http/smCrypto.js";
import api from "@/api/index.js";
import userStore from "@/store/user.js";
import Icon from "@/components/common/Icon.vue";

export default {
  components: {
    Icon,
  },
  data() {
    return {
      form: {
        username: "",
        password: "",
        captcha: "",
      },
      isLoading: false,
      showPassword: false,
      rememberAccount: false,
      captchaImage: "",
      captchaKey: "",
      tenantId: "000000",
      showCaptcha: false, // 是否显示验证码（仅县级角色显示）
      countyRoles: ["administrator", "river_county_admin", "river_county_office"], // 县级角色
      checkingRole: false, // 是否正在检查角色
    };
  },
  onLoad() {
    // 进入登录页时，重置选项缓存，确保下次加载时重新获取
    userStore.state.optionsLoaded = false;
    userStore.state.options = {
      townships: [],
      sections: [],
      problemTypes: [],
      problemTypesFlat: [],
      planItems: [],
    };

    // 检查是否已登录
    const token = uni.getStorageSync("river_token");
    if (token) {
      // 根据角色跳转到对应页面
      const userInfo = uni.getStorageSync("river_user_info");
      const roleAliases = userInfo?.roleAliases || [];
      const isInspector = roleAliases.includes("river_inspector");
      const isTownship = roleAliases.includes("river_township");

      let targetPage = "/pages/stats/index";
      if (isInspector) {
        targetPage = "/pages/index/index";
      } else if (isTownship) {
        targetPage = "/pages/affairs/index";
      }

      uni.switchTab({
        url: targetPage,
      });
      return;
    }

    // 读取保存的账号
    const savedUsername = uni.getStorageSync("saved_username");
    if (savedUsername) {
      this.form.username = savedUsername;
      this.rememberAccount = true;
    }

    // 默认不获取验证码，根据角色判断后决定是否获取
  },
  methods: {
    // 检查用户角色，判断是否需要验证码
    async checkUserRole() {
      const username = this.form.username.trim();
      if (!username) {
        this.showCaptcha = false;
        return;
      }

      if (this.checkingRole) return;
      this.checkingRole = true;

      try {
        const result = await api.auth.getUserRoles({ userName: username });
        // 检查是否包含县级角色
        if (result && result.length > 0) {
          const hasCountyRole = result.some((user) =>
            user.roleAliases && this.countyRoles.some((role) =>
              user.roleAliases.includes(role)
            )
          );
          this.showCaptcha = hasCountyRole;
          // 如果是县级角色，自动获取验证码
          if (hasCountyRole) {
            await this.getCaptcha();
          }
        } else {
          this.showCaptcha = false;
        }
      } catch (error) {
        console.error("查询用户角色失败:", error);
        this.showCaptcha = false;
      } finally {
        this.checkingRole = false;
      }
    },

    async getCaptcha() {
      try {
        const result = await api.auth.getCaptcha();
        if (result) {
          this.captchaImage = result.image || "";
          this.captchaKey = result.key || "";
        }
      } catch (error) {
        console.error("获取验证码失败:", error);
        uni.showToast({
          title: "获取验证码失败",
          icon: "none",
        });
      }
    },

    validateForm() {
      if (!this.form.username.trim()) {
        uni.showToast({ title: "请输入账号", icon: "none" });
        return false;
      }
      if (!this.form.password.trim()) {
        uni.showToast({ title: "请输入密码", icon: "none" });
        return false;
      }
      // 只有显示验证码时才校验验证码
      if (this.showCaptcha && !this.form.captcha.trim()) {
        uni.showToast({ title: "请输入验证码", icon: "none" });
        return false;
      }
      return true;
    },

    async handleLogin() {
      if (!this.validateForm()) return;
      if (this.isLoading) return;

      this.isLoading = true;

      try {
        const params = {
          tenantId: this.tenantId,
          username: this.form.username.trim(),
          // password: this.form.password,
          password: smCrypto.doSm2Encrypt(this.form.password),
          type: "account",
          deptId: "",
          roleId: "",
        };

        // 只有显示验证码时才传递验证码参数
        if (this.showCaptcha) {
          params.key = this.captchaKey;
          params.code = this.form.captcha.trim();
        }

        await userStore.actions.login(params);

        // 记住账号
        if (this.rememberAccount) {
          uni.setStorageSync("saved_username", this.form.username);
        } else {
          uni.removeStorageSync("saved_username");
        }

        // 获取用户详细资料
        await userStore.actions.fetchProfile();

        // 加载基础选项
        // await userStore.actions.loadOptions();

        // 更新红点
        await userStore.actions.updateBadges();

        uni.showToast({
          title: "登录成功",
          icon: "success",
          duration: 1500,
        });

        // 根据角色跳转到对应页面
        setTimeout(() => {
          const isInspector = userStore.getters.isInspector();
          const isTownship = userStore.getters.isTownship();

          // 巡查员跳转暗访页，整改员跳转事务页，其他跳转统计页
          let targetPage = "/pages/stats/index";
          if (isInspector) {
            targetPage = "/pages/index/index";
          } else if (isTownship) {
            targetPage = "/pages/affairs/index";
          }

          uni.switchTab({
            url: targetPage,
          });
        }, 500);
      } catch (error) {
        console.error("登录失败:", error);
        // 只有显示验证码时才刷新验证码
        if (this.showCaptcha) {
          this.getCaptcha();
          this.form.captcha = "";
        }
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  .loginbg1 {
    position: absolute;
    top: -30rpx;
    left: 0;
    width: 100%;
    z-index: -1;
  }

  .loginbg2 {
    position: absolute;
    top: -200rpx;
    left: -200rpx;
    z-index: -1;
  }

  .loginbg3 {
    position: absolute;
    right: -300rpx;
    bottom: 40%;
    z-index: -1;
  }
}

/* 头部区域 */
.login-header {
  padding: 200rpx 0 80rpx;
  justify-content: center;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-icon {
  width: 160rpx;
  height: 160rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  image {
    width: 100%;
    height: 100%;
    border-radius: 10rpx;
  }
}


.logo-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

/* 表单区域 */
.login-form {
  flex: 1;
  background: #ffffff77;
  border: 1rpx solid #ffffff;
  backdrop-filter: blur(10rpx);
  border-radius: 48rpx 48rpx 0 0;
  padding: 40rpx 38rpx;
  margin-top: 20rpx;
  width: 70%;
  margin: 0 auto;
}

.form-title {
  font-size: 50rpx;
  letter-spacing: 2rpx;
  font-weight: 600;
  color: #2a8cce;
  margin-bottom: 40rpx;
  padding-top: 50rpx;
  text-align: center;
  display: block;
}

/* 输入项 */
.input-item {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 24rpx;
  padding: 0 20rpx;
  height: 100rpx;
  margin-bottom: 32rpx;
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
  font-size: 32rpx;
  color: #1e293b;
}

.input-suffix {
  width: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 验证码 */
.captcha-item {
  padding-right: 16rpx;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 180rpx;
  height: 72rpx;
  border-radius: 12rpx;
  background: #e2e8f0;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  border-radius: 24rpx;
  font-size: 36rpx;
  font-weight: 500;
  color: #ffffff;
  border: none;
  margin-top: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.loading {
    opacity: 0.7;
  }

  &:active {
    transform: scale(0.98);
  }
}

/* 记住账号 */
.remember-account {
  display: flex;
  align-items: center;
  margin-top: 32rpx;
  padding-left: 16rpx;
}

.checkbox {
  margin-right: 16rpx;
}

.checkbox-inner {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #cbd5e1;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.checked {
    background: #1e40af;
    border-color: #1e40af;
  }
}

.remember-text {
  font-size: 28rpx;
  color: #64748b;
}

/* 底部 */
.login-footer {
  padding: 40rpx 0;
  text-align: center;
}

.footer-text {
  font-size: 24rpx;
  color: #94a3b8;
}

/* 占位符样式 */
.placeholder {
  color: #94a3b8;
}
</style>
