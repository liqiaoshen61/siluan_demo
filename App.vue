<template>
  <view></view>
</template>

<script>
export default {
  onLaunch: function () {
    console.log("App Launch");

    // #ifdef MP-WEIXIN
    // 隐私协议：3.16.2 起隐私校验默认全局开启，不注册 onNeedPrivacyAuthorization
    // 时，微信会在调用隐私接口（如 getLocation）时自动弹出系统官方隐私弹窗，
    // 用户同意后本地持久化授权状态，后续不再弹窗。
    // 之前在此注册 onNeedPrivacyAuthorization 并尝试用自定义 PrivacyPopup 弹窗，
    // 但 App.vue 的 template 在小程序端不参与渲染，PrivacyPopup 从未挂载，
    // 导致 resolve 无法被正确调用、getLocation 永久挂起并触发框架内部错误。
    // 故改用微信默认弹窗，最稳妥。
    wx.getPrivacySetting({
      success: (res) => {
        console.log("隐私设置:", res);
      },
      fail: (err) => {
        console.error("获取隐私设置失败:", err);
      },
    });
    // #endif
  },
  onShow: function () {
    console.log("App Show");
  },
  onHide: function () {
    console.log("App Hide");
  },
};
</script>

<style lang="scss">
// @import "./uni_modules/vk-uview-ui/index.scss";
/* 如需使用 uv-ui，请替换为：
@import "@/uni_modules/uv-ui-tools/index.scss";
*/

page {
  height: 100%;
}

/* #ifdef H5 */
/* H5 环境：提升 uni-modal 的层级，避免被其他元素遮挡 */
uni-modal {
  z-index: 9999 !important;
}

/* uni-popup、uni-action-sheet 等弹窗组件 */
uni-popup,
uni-actionsheet {
  z-index: 9999 !important;
}

/* picker 选择器容器 */
uni-picker,
.uni-picker-container {
  z-index: 9999 !important;
}

/* 如果使用了其他 uni-ui 弹窗组件 */
.uni-modal,
.uni-popup,
.uni-actionsheet,
.uni-picker-container {
  z-index: 9999 !important;
}

/* uni-toast 提示框，z-index 设置为比弹窗更高 */
uni-toast,
.uni-toast {
  z-index: 10000 !important;
}
/* #endif */

/* 通用 flex 布局类 */
.flexbox {
  display: flex;
}
.flexbox_sb {
  justify-content: space-between;
}
.flexbox_nw {
  flex-wrap: nowrap;
  width: fit-content;
}
.justify-center {
  justify-content: center;
}
.items-center {
  align-items: center;
}
.items-start {
  align-items: flex-start;
}
.flex-wrap {
  flex-wrap: wrap;
}
</style>
