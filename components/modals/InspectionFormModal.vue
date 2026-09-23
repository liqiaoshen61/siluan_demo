<template>
  <view v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <view class="modal-container" @click.stop>
      <!-- 头部 -->
      <view class="modal-header">
        <text class="modal-title">{{ isEdit ? "编辑暗访" : "新增暗访" }}</text>
        <view class="close-btn" @click="handleClose">
          <Icon name="close" color="#64748b" size="28rpx" />
        </view>
      </view>

      <!-- 内容区域 -->
      <scroll-view class="modal-body" scroll-y>
        <!-- 计划项选择（代替乡镇选择） -->
        <view class="form-item">
          <text class="form-label"><text class="required">*</text>巡查计划</text>
          <picker :range="planItemOptions" range-key="townshipName" @change="handlePlanItemChange">
            <view class="form-input picker">
              <text :class="{ placeholder: !form.planItemId }">
                {{ getPlanItemName() || "请选择计划项" }}
              </text>
              <text class="arrow">▼</text>
            </view>
          </picker>
          <view v-if="form.planItemId" class="plan-info">
            <text class="plan-group">巡查组：{{ selectedPlanItem?.groupName || "-" }}</text>
            <text class="plan-month">月份：{{ selectedPlanItem?.planMonth || "-" }}</text>
          </view>
        </view>

        <!-- 河段选择 -->
        <view class="form-item">
          <text class="form-label"><text class="required">*</text>问题所在河段</text>
          <picker :range="sectionOptions" range-key="name" :disabled="!form.townshipId" @change="handleSectionChange">
            <view class="form-input picker" :class="{ disabled: !form.townshipId }">
              <text :class="{ placeholder: !form.sectionId }">
                {{ getSectionName() || (form.townshipId ? "请选择河段" : "请先选择计划项") }}
              </text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <!-- 经纬度 -->
        <view class="form-item">
          <text class="form-label"><text class="required">*</text>经纬度</text>
          <view class="coordinate-inputs">
            <input class="form-input coord-input" type="digit" v-model="form.longitude" placeholder="经度"
              placeholder-class="placeholder" />
            <input class="form-input coord-input" type="digit" v-model="form.latitude" placeholder="纬度"
              placeholder-class="placeholder" />
            <view class="location-btn" @click="getLocation">
              <Icon name="location" color="#3b82f6" size="36rpx" />
            </view>
          </view>
        </view>

        <!-- 背景图片 -->
        <view class="form-item">
          <text class="form-label"><text class="required">*</text>背景图片</text>
          <view class="image-upload">
            <view v-if="form.backgroundImage" class="image-item">
              <image :src="$img(form.backgroundImage)" mode="aspectFill" @click="previewImage(form.backgroundImage)" />
              <view class="remove-btn" @click="form.backgroundImage = ''">
                <Icon name="close" color="#ffffff" size="24rpx" />
              </view>
            </view>
            <view v-else class="upload-btn" @click="chooseImage('background')">
              <Icon name="plus" color="#94a3b8" size="48rpx" />
              <text class="text">上传图片</text>
            </view>
          </view>
        </view>

        <!-- 问题图片 -->
        <view class="form-item">
          <text class="form-label"><text class="required">*</text>问题图片</text>
          <view class="image-upload">
            <view v-for="(img, index) in form.problemImages" :key="index" class="image-item-wrapper">
              <view class="image-item">
                <image :src="$img(img)" mode="aspectFill" @click="previewImage(img)" />
                <view class="remove-btn" @click="removeProblemImage(index)">
                  <Icon name="close" color="#ffffff" size="24rpx" />
                </view>
              </view>
            </view>
            <view v-if="form.problemImages.length < 9" class="upload-btn" @click="chooseImage('problem')">
              <Icon name="plus" color="#94a3b8" size="48rpx" />
              <text class="text">上传图片</text>
            </view>
          </view>
        </view>

        <!-- 问题类型 -->
        <view class="form-item">
          <text class="form-label"><text class="required">*</text>问题类型（大类）</text>
          <picker :range="problemTypeOptions" range-key="name" @change="handleProblemTypeChange">
            <view class="form-input picker">
              <text :class="{ placeholder: !form.problemTypeId }">{{ getProblemTypeName() || "请选择类型" }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <!-- 问题小类 -->
        <view class="form-item">
          <text class="form-label"><text class="required">*</text>问题类型（小类）</text>
          <picker :range="problemSubtypeOptions" range-key="name" :disabled="!form.problemTypeId"
            @change="handleProblemSubtypeChange">
            <view class="form-input picker" :class="{ disabled: !form.problemTypeId }">
              <text :class="{ placeholder: !form.problemSubtypeId }">{{ getProblemSubtypeName() || (form.problemTypeId ?
                "请选择小类" : "请先选择大类") }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <!-- 问题描述 -->
        <view class="form-item">
          <text class="form-label"><text class="required">*</text>问题详述</text>
          <textarea class="form-textarea" v-model="form.description" placeholder="请描述问题" placeholder-class="placeholder"
            :maxlength="1000" />
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="modal-footer">
        <button class="btn btn-cancel" @click="handleClose">取消</button>
        <button class="btn btn-draft" :disabled="saving" @click.stop="handleSaveDraft">保存草稿</button>
        <button class="btn btn-submit" :disabled="saving" @click.stop="handleSubmit">提交</button>
      </view>
    </view>

    <!-- H5 自定义图片预览组件 -->
    <!-- #ifdef H5 -->
    <ImageViewer :visible="imageViewerVisible" :urls="imageViewerUrls" :current="imageViewerCurrent"
      @update:visible="imageViewerVisible = $event" />
    <!-- #endif -->

    <!-- AI识别结果弹窗 -->
    <view v-if="showRecognitionModal" class="recognition-modal-overlay" @click="showRecognitionModal = false">
      <view class="recognition-modal" @click.stop>
        <view class="modal-header">
          <Icon name="ai" color="#3b82f6" size="32rpx" />
          <text class="modal-title">AI识别结果</text>
        </view>

        <view class="modal-body">
          <view>
            <text class="label2">识别到的问题类型：</text>
            <text class="description-text">{{ recognizedProblemTypeName }}-{{ recognizedProblemSubtypeName }}</text>
          </view>
          <view>
            <text class="label">识别到的问题描述：</text>
            <view class="description-box">
              <text class="description-text">{{ recognizedDescription }}</text>
            </view>
          </view>
          <text class="tip">请选择如何使用此描述</text>
        </view>
        <view class="modal-footer">
          <button class="btn btn-skip" @click="showRecognitionModal = false">跳过</button>
          <button class="btn btn-replace" @click="handleReplaceDescription">替换</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from "@/api/index.js";
import userStore from "@/store/user.js";
import ImageViewer from "@/components/common/ImageViewer.vue";
import Icon from "@/components/common/Icon.vue";

export default {
  name: "InspectionFormModal",
  components: {
    ImageViewer,
    Icon,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    editData: {
      type: Object,
      default: null,
    },
    // 智能录入预填数据
    prefillData: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      form: {
        id: "",
        planItemId: "",
        groupId: "",
        townshipId: "",
        sectionId: "",
        longitude: "",
        latitude: "",
        backgroundImage: "",
        problemImages: [],
        problemTypeId: "",
        problemSubtypeId: "",
        description: "",
        version: 0,
      },
      saving: false,
      planItemOptions: [],
      sectionOptions: [],
      problemTypeOptions: [],
      problemSubtypeOptions: [],
      // AI识别相关
      recognizing: false, // 是否正在识别
      recognizingIndex: -1, // 正在识别的图片索引
      recognizedDescription: "", // AI识别的问题描述
      recognizedProblemTypeName: "", // AI识别的大类
      recognizedProblemSubtypeName: "", // AI识别的小类
      recognizedProblemTypeId: "", // AI识别的大类ID
      recognizedProblemSubtypeId: "", // AI识别的小类ID
      showRecognitionModal: false, // 是否显示识别确认弹窗
      // #ifdef H5
      imageViewerVisible: false,
      imageViewerUrls: [],
      imageViewerCurrent: 0,
      // #endif
    };
  },
  computed: {
    isEdit() {
      return !!this.form.id;
    },
    selectedPlanItem() {
      return this.planItemOptions.find(item => item.planItemId === this.form.planItemId) || null;
    },
    // 是否为乡镇转管员（乡镇巡查人员）
    isTownInspector() {
      return userStore.getters.isTownInspector();
    }
  },
  watch: {
    async visible(val) {
      if (val) {
        await this.loadOptions();
        // 优先使用 prefillData（智能录入），其次 editData（编辑草稿）
        if (this.prefillData) {
          this.fillFromPrefill(this.prefillData);
        } else if (this.editData) {
          this.fillForm(this.editData);
        } else {
          this.resetForm();
        }
        // 数据加载完成后，检查经纬度是否为空，自动获取位置（仅非预填充模式）
        this.$nextTick(() => {
          if (!this.prefillData && !this.form.longitude || !this.form.latitude ||
            this.form.longitude === "0" || this.form.latitude === "0") {
            this.getLocation();
          }
        });
      }
    },
    "form.townshipId"(val) {
      if (val) {
        this.loadSections(val);
      } else {
        this.sectionOptions = [];
      }
    },
    "form.problemTypeId"(val) {
      if (val) {
        this.loadProblemSubtypes(val);
      } else {
        this.problemSubtypeOptions = [];
      }
    },
  },
  methods: {
    async loadOptions() {
      const options = await userStore.actions.loadOptions();
      this.problemTypeOptions = options?.problemTypes || [];
      this.planItemOptions = options?.planItems || [];
    },

    async loadSections(townshipId) {
      const sections = await userStore.actions.getSectionsByTownship(townshipId);
      this.sectionOptions = sections || [];
    },

    loadProblemSubtypes(parentId) {
      const subtypes = userStore.actions.getProblemSubtypes(parentId);
      this.problemSubtypeOptions = subtypes || [];
    },

    fillForm(data) {
      this.form.id = data.id || "";
      this.form.townshipId = data.townshipId || "";
      this.form.sectionId = data.sectionId || "";
      this.form.longitude = data.longitude?.toString() || "";
      this.form.latitude = data.latitude?.toString() || "";
      this.form.backgroundImage = data.backgroundImages?.[0] || "";
      this.form.problemImages = data.problemImages || [];
      this.form.problemTypeId = data.problemTypeId || "";
      this.form.problemSubtypeId = data.problemSubtypeId || "";
      this.form.description = data.description || "";
      this.form.version = data.version || 0;

      // 如果有 planItemId，直接使用
      if (data.planItemId) {
        this.form.planItemId = data.planItemId;
        this.form.groupId = data.groupId || "";
      } else if (data.townshipId) {
        // 否则根据 townshipId 匹配第一个计划项
        const matchedPlan = this.planItemOptions.find(item => item.townshipId === data.townshipId);
        if (matchedPlan) {
          this.form.planItemId = matchedPlan.planItemId || "";
          this.form.groupId = matchedPlan.groupId || "";
        }
      }

      // townshipId 变化时会通过 watch 自动加载河段列表，无需手动调用

      // 如果有 problemTypeId，加载对应的小类列表
      if (data.problemTypeId) {
        this.loadProblemSubtypes(data.problemTypeId);
      }
    },

    // 从智能录入预填数据填充表单
    fillFromPrefill(data) {
      this.resetForm();

      // 填充图片
      this.form.backgroundImage = data.backgroundImage || "";
      this.form.problemImages = data.problemImages || [];

      // 填充经纬度
      this.form.longitude = data.longitude?.toString() || "";
      this.form.latitude = data.latitude?.toString() || "";

      // 填充问题描述
      this.form.description = data.description || "";

      // 填充问题类型
      if (data.problemTypeId) {
        this.form.problemTypeId = data.problemTypeId;
        this.loadProblemSubtypes(data.problemTypeId);
        // 延迟设置小类，等待小类列表加载完成
        if (data.problemSubtypeId) {
          this.$nextTick(() => {
            this.form.problemSubtypeId = data.problemSubtypeId;
          });
        }
      }

      // 填充乡镇和河段
      if (data.townshipId) {
        this.form.townshipId = data.townshipId;
        // townshipId 变化时会通过 watch 自动加载河段列表，无需手动调用

        // 根据乡镇匹配计划项
        const matchedPlan = this.planItemOptions.find(item => item.townshipId === data.townshipId);
        if (matchedPlan) {
          this.form.planItemId = matchedPlan.planItemId || "";
          this.form.groupId = matchedPlan.groupId || "";
        }

        // 延迟设置河段，等待河段列表加载完成
        if (data.sectionId) {
          this.$nextTick(() => {
            this.form.sectionId = data.sectionId;
          });
        }
      }
    },

    resetForm() {
      this.form = {
        id: "",
        planItemId: "",
        groupId: "",
        townshipId: "",
        sectionId: "",
        longitude: "",
        latitude: "",
        backgroundImage: "",
        problemImages: [],
        problemTypeId: "",
        problemSubtypeId: "",
        description: "",
        version: 0,
      };
    },

    getPlanItemName() {
      const item = this.planItemOptions.find(p => p.planItemId === this.form.planItemId);
      return item ? `${item.townshipName}（${item.groupName}）` : "";
    },

    getSectionName() {
      return this.sectionOptions.find((item) => item.id === this.form.sectionId)?.name || "";
    },

    getProblemTypeName() {
      return this.problemTypeOptions.find((item) => item.id === this.form.problemTypeId)?.name || "";
    },

    getProblemSubtypeName() {
      return this.problemSubtypeOptions.find((item) => item.id === this.form.problemSubtypeId)?.name || "";
    },

    handlePlanItemChange(e) {
      const index = e.detail.value;
      const selectedItem = this.planItemOptions[index];
      if (selectedItem) {
        this.form.planItemId = selectedItem.planItemId || "";
        this.form.groupId = selectedItem.groupId || "";
        this.form.townshipId = selectedItem.townshipId || "";
        this.form.sectionId = "";
      }
    },

    handleSectionChange(e) {
      const index = e.detail.value;
      this.form.sectionId = this.sectionOptions[index]?.id || "";
    },

    handleProblemTypeChange(e) {
      const index = e.detail.value;
      this.form.problemTypeId = this.problemTypeOptions[index]?.id || "";
      if (this.recognizedProblemTypeId == this.form.problemTypeId) {
        this.form.problemSubtypeId = this.recognizedProblemSubTypeId
      } else {
        this.form.problemSubtypeId = "";
      }
    },

    handleProblemSubtypeChange(e) {
      const index = e.detail.value;
      this.form.problemSubtypeId = this.problemSubtypeOptions[index]?.id || "";
    },

    getLocation() {
      console.log("开始检查定位权限...");
      // 先检查授权状态
      uni.getSetting({
        success: (res) => {
          console.log("授权设置:", res.authSetting);
          const locationAuth = res.authSetting["scope.userLocation"];
          console.log("定位权限状态:", locationAuth);

          if (locationAuth === false) {
            // 用户已拒绝过，引导去设置页面开启
            uni.showModal({
              title: "定位权限未开启",
              content: "需要授权位置权限才能获取定位，请在设置中开启",
              confirmText: "去设置",
              success: (modalRes) => {
                if (modalRes.confirm) {
                  uni.openSetting({
                    success: (settingRes) => {
                      // 用户在设置页面开启了权限，重新获取定位
                      if (settingRes.authSetting["scope.userLocation"]) {
                        this.doGetLocation();
                      }
                    },
                  });
                }
              },
            });
          } else {
            // 未授权过或已授权，直接获取定位
            this.doGetLocation();
          }
        },
        fail: (err) => {
          console.error("获取授权设置失败:", err);
          // 获取设置失败，直接尝试获取定位
          this.doGetLocation();
        },
      });
    },

    doGetLocation() {
      console.log("开始获取定位...");
      uni.showLoading({ title: "获取位置中..." });

      // #ifdef H5
      // H5环境检查HTTPS
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        uni.hideLoading();
        uni.showModal({
          title: '定位提示',
          content: 'H5环境定位需要HTTPS协议，当前为HTTP。请手动输入经纬度坐标。',
          showCancel: false,
        });
        return;
      }
      // #endif

      uni.getLocation({
        type: "gcj02",
        success: async (res) => {
          console.log("定位成功:", res);
          uni.hideLoading();
          this.form.longitude = res.longitude.toFixed(6);
          this.form.latitude = res.latitude.toFixed(6);
          uni.showToast({ title: "定位成功", icon: "success" });

          // 根据经纬度匹配乡镇河段
          await this.matchTownshipAndSection();
        },
        fail: (err) => {
          console.error("定位失败:", err);
          uni.hideLoading();

          // 自动填充默认经纬度
          this.form.longitude = "118.293";
          this.form.latitude = "25.320";

          let errorMsg = "定位失败，已使用默认坐标（118.293, 25.320），您也可以手动修改";

          // #ifdef H5
          // H5环境详细错误提示
          if (err.errMsg && err.errMsg.includes("permission denied")) {
            errorMsg = "您拒绝了定位权限，请在浏览器设置中允许定位，或手动输入经纬度";
          } else if (err.errMsg && err.errMsg.includes("unavailable")) {
            errorMsg = "定位服务不可用，请手动输入经纬度坐标";
          }
          // #endif

          uni.showModal({
            title: "定位失败",
            content: errorMsg,
            showCancel: false,
          });
        },
      });
    },

    // 根据经纬度匹配乡镇河段
    async matchTownshipAndSection() {
      if (!this.form.longitude || !this.form.latitude) {
        return;
      }

      try {
        const result = await api.location.matchLocation({
          longitude: parseFloat(this.form.longitude),
          latitude: parseFloat(this.form.latitude),
        });

        const data = result.data;
        if (data) {
          // 匹配到乡镇和河段，自动回填
          if (data.townshipId) {
            this.form.townshipId = String(data.townshipId);

            // 根据乡镇匹配计划项
            const matchedPlan = this.planItemOptions.find(
              item => String(item.townshipId) === String(data.townshipId)
            );
            if (matchedPlan) {
              this.form.planItemId = matchedPlan.planItemId || "";
              this.form.groupId = matchedPlan.groupId || "";
            }

            // 加载河段列表
            if (data.townshipId && data.townshipId !== -1) {
              await this.loadSections(data.townshipId);
            }

            // 延迟设置河段，等待列表加载完成
            if (data.sectionId) {
              this.$nextTick(() => {
                this.form.sectionId = String(data.sectionId);
              });
            }
          }
          if (data.sectionName && data.townshipName) {
            uni.showToast({ title: "已匹配乡镇河段", icon: "success" });
          }

        } else {
          // 未匹配到，提示用户手动选择
          uni.showToast({ title: "未匹配到乡镇，请手动选择", icon: "none" });
        }
      } catch (error) {
        console.error("匹配乡镇河段失败:", error);
        uni.showToast({ title: "匹配失败，请手动选择", icon: "none" });
      }
    },

    async chooseImage(type) {
      uni.chooseImage({
        count: type === "problem" ? 9 - this.form.problemImages.length : 1,
        sizeType: ["compressed"],
        sourceType: ["camera", "album"],
        success: async (res) => {
          uni.showLoading({ title: "上传中..." });
          try {
            for (const filePath of res.tempFilePaths) {
              const link = await api.upload.uploadImage(filePath);
              if (type === "background") {
                this.form.backgroundImage = link;
              } else {
                this.form.problemImages.push(link);
              }
            }
          } catch (error) {
            uni.showToast({ title: "上传失败", icon: "none" });
          } finally {
            uni.hideLoading();
          }
        },
      });
    },

    previewImage(url) {
      const fullUrl = this.$img(url);
      // #ifdef H5
      // H5环境：使用自定义图片预览组件
      this.imageViewerUrls = [fullUrl];
      this.imageViewerCurrent = 0;
      this.imageViewerVisible = true;
      // #endif

      // #ifndef H5
      // 小程序环境：使用原生预览
      uni.previewImage({ urls: [fullUrl], current: fullUrl });
      // #endif
    },

    removeProblemImage(index) {
      this.form.problemImages.splice(index, 1);
    },

    // AI识别按钮点击
    async handleAiRecognize(index) {
      if (this.recognizing) return;

      const imageUrl = this.form.problemImages[index];
      if (!imageUrl) {
        uni.showToast({ title: "图片不存在", icon: "none" });
        return;
      }

      this.recognizing = true;
      this.recognizingIndex = index;

      try {
        const result = await api.inspection.recognizeImage({
          inspectionId: this.form.id || undefined,
          imageRef: imageUrl,
        });

        const aiDescription = result.data?.suggestedDescription || "";
        if (result.data?.suggestedSubtypeName == "无问题") {
          uni.showToast({ title: aiDescription, icon: "none" });
          return;
        }
        this.recognizedDescription = aiDescription;
        this.recognizedProblemTypeName = result.data?.suggestedTypeName || "";
        this.recognizedProblemSubtypeName = result.data?.suggestedSubtypeName || "";
        this.recognizedProblemTypeId = result.data?.suggestedTypeId || "";
        this.recognizedProblemSubTypeId = result.data?.suggestedSubtypeId || "";
        this.showRecognitionModal = true;
      } catch (error) {
        console.error("AI识别失败:", error);
        uni.showToast({ title: "识别失败", icon: "none" });
      } finally {
        this.recognizing = false;
        this.recognizingIndex = -1;
      }
    },

    // 替换问题描述
    handleReplaceDescription() {
      this.form.description = this.recognizedDescription;
      this.form.problemSubtypeId = this.recognizedProblemSubTypeId;
      this.form.problemTypeId = this.recognizedProblemTypeId;

      this.showRecognitionModal = false;
      uni.showToast({ title: "已替换", icon: "success" });
    },

    // 追加问题描述
    handleAppendDescription() {
      if (this.form.description.trim()) {
        this.form.description += "\n" + this.recognizedDescription;
      } else {
        this.form.description = this.recognizedDescription;
      }
      this.showRecognitionModal = false;
      uni.showToast({ title: "已追加", icon: "success" });
    },

    validateForm(isSubmit = false) {
      if (!this.form.planItemId) {
        uni.showToast({ title: "请选择巡查计划", icon: "none" });
        return false;
      }
      if (isSubmit && !this.form.backgroundImage) {
        uni.showToast({ title: "请上传背景图片", icon: "none" });
        return false;
      }
      if (isSubmit && this.form.problemImages.length === 0) {
        uni.showToast({ title: "请上传问题图片", icon: "none" });
        return false;
      }
      if (isSubmit && !this.form.problemTypeId) {
        uni.showToast({ title: "请选择问题类型", icon: "none" });
        return false;
      }
      if (isSubmit && !this.form.description.trim()) {
        uni.showToast({ title: "请填写问题描述", icon: "none" });
        return false;
      }
      return true;
    },

    async handleSaveDraft() {
      if (!this.validateForm(false)) return;
      if (this.saving) return;

      this.saving = true;
      try {
        const data = {
          id: this.form.id || undefined,
          planItemId: this.isTownInspector ? null : this.form.planItemId || undefined,
          townshipId: this.form.townshipId,
          sectionId: this.form.sectionId || undefined,
          longitude: this.form.longitude ? parseFloat(this.form.longitude) : undefined,
          latitude: this.form.latitude ? parseFloat(this.form.latitude) : undefined,
          backgroundImageRefs: this.form.backgroundImage ? [this.form.backgroundImage] : [],
          problemImageRefs: this.form.problemImages,
          problemTypeId: this.form.problemTypeId || undefined,
          problemSubtypeId: this.form.problemSubtypeId || undefined,
          description: this.form.description,
          version: this.form.id ? this.form.version : undefined,
        };

        const result = await api.inspection.saveDraft(data);
        this.form.id = result.data;
        this.form.version = 0;

        uni.showToast({ title: "保存成功", icon: "success" });
        userStore.actions.updateDraftBadge();
        this.$emit("success");
      } catch (error) {
        console.error("保存草稿失败:", error);
      } finally {
        this.saving = false;
      }
    },

    async handleSubmit() {
      if (!this.validateForm(true)) return;
      if (this.saving) return;
      this.saving = true;
      //有id，提交草稿到整改

      try {
        // if (this.form.id) {
        //   let data = {
        //     inspectionId: this.form.id || undefined,
        //     version: this.form.id ? this.form.version : undefined,
        //   };
        //   await api.inspection.submitInspection(data);
        //   uni.showToast({ title: "提交成功", icon: "success" });
        //   userStore.actions.updateDraftBadge();
        //   userStore.actions.updatePendingBadge();
        //   this.$emit("success");
        //   return;
        // }
        // 直接提交完整问题并创建整改任务
        const data = {
          inspectionId: this.form.id || undefined,
          planItemId: (this.isTownInspector ? null : this.form.planItemId) || undefined,
          version: this.form.id ? this.form.version : undefined,
          townshipId: this.form.townshipId,
          sectionId: this.form.sectionId || undefined,
          longitude: this.form.longitude ? parseFloat(this.form.longitude) : undefined,
          latitude: this.form.latitude ? parseFloat(this.form.latitude) : undefined,
          location: this.getSectionName() || this.selectedPlanItem?.townshipName || "",
          backgroundImageRefs: this.form.backgroundImage ? [this.form.backgroundImage] : [],
          problemImageRefs: this.form.problemImages,
          problemTypeId: this.form.problemTypeId,
          problemSubtypeId: this.form.problemSubtypeId || undefined,
          description: this.form.description,
        };
        await api.inspection.directSubmitInspection(data);
        uni.showToast({ title: "提交成功", icon: "success" });
        userStore.actions.updateDraftBadge();
        userStore.actions.updatePendingBadge();
        this.$emit("success");
      } catch (error) {
        console.error("提交失败:", error);
      } finally {
        this.saving = false;
      }
    },

    handleClose() {
      this.$emit("update:visible", false);
      this.resetForm();
    },

    handleOverlayClick() {
      // 不关闭
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal-container {
  width: 100%;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  border-bottom: 1rpx solid #e2e8f0;
  flex-shrink: 0;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 32rpx;
  color: #64748b;
}

.modal-body {
  flex: 1;
  padding: 24rpx 20rpx;
  overflow-y: auto;
  box-sizing: border-box;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #374151;
  margin-bottom: 16rpx;

  .required {
    color: #ef4444;
    margin-right: 4rpx;
  }
}

.plan-info {
  display: flex;
  gap: 24rpx;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #64748b;
}

.plan-group,
.plan-month {
  padding: 8rpx 16rpx;
  background: #f1f5f9;
  border-radius: 8rpx;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  border-radius: 16rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  font-size: 30rpx;
  color: #1e293b;

  &.picker {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .arrow {
      font-size: 20rpx;
      color: #94a3b8;
    }
  }

  &.disabled {
    background: #f1f5f9;
    color: #94a3b8;
  }
}

.coordinate-inputs {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.coord-input {
  flex: 1;
}

.location-btn {
  width: 88rpx;
  height: 88rpx;
  background: #eff6ff;
  border: 1rpx solid #3b82f6;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.form-textarea {
  width: 100%;
  height: 200rpx;
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  border-radius: 16rpx;
  padding: 24rpx;
  box-sizing: border-box;
  font-size: 30rpx;
  color: #1e293b;
}

.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.image-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;

  image {
    width: 100%;
    height: 100%;
  }

  .remove-btn {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 40rpx;
    height: 40rpx;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      color: #ffffff;
      font-size: 24rpx;
    }
  }
}

.ai-recognize-btn {
  width: 160rpx;
  height: 48rpx;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 22rpx;
    color: #ffffff;
  }

  &.recognizing {
    background: #94a3b8;
    opacity: 0.6;
  }
}

.upload-btn {
  width: 160rpx;
  height: 160rpx;
  background: #f8fafc;
  border: 2rpx dashed #cbd5e1;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;

  .plus {
    font-size: 48rpx;
    color: #94a3b8;
  }

  .text {
    font-size: 24rpx;
    color: #94a3b8;
  }
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 20rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom, 16rpx));
  border-top: 1rpx solid #e2e8f0;
  flex-shrink: 0;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &.btn-cancel {
    background: #f1f5f9;
    color: #64748b;
  }

  &.btn-draft {
    background: #fef3c7;
    color: #d97706;
  }

  &.btn-submit {
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

// AI识别结果弹窗样式
.recognition-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recognition-modal {
  width: 85%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;

  .modal-header {
    padding: 32rpx;
    border-bottom: 1rpx solid #e2e8f0;
  }

  .modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1e293b;
  }

  .modal-body {
    padding: 32rpx;
  }

  .label {
    display: block;
    font-size: 26rpx;
    color: #64748b;
    margin-bottom: 16rpx;
  }

  .label2 {
    font-size: 26rpx;
    color: #64748b;
    margin-bottom: 16rpx;
  }

  .description-box {
    background: #f8fafc;
    border: 1rpx solid #e2e8f0;
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 24rpx;
    max-height: 300rpx;
    overflow-y: auto;
  }

  .description-text {
    font-size: 28rpx;
    color: #1e293b;
    line-height: 1.6;
  }

  .tip {
    display: block;
    font-size: 24rpx;
    color: #94a3b8;
    text-align: center;
  }

  .modal-footer {
    display: flex;
    gap: 16rpx;
    padding: 24rpx 32rpx;
    border-top: 1rpx solid #e2e8f0;
  }

  .btn {
    flex: 1;
    height: 72rpx;
    border-radius: 12rpx;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
  }

  .btn-skip {
    background: #f1f5f9;
    color: #64748b;
  }

  .btn-append {
    background: #fef3c7;
    color: #d97706;
  }

  .btn-replace {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: #ffffff;
  }
}
</style>
