<template>
  <view v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <view class="modal-container" @click.stop>
      <!-- 头部 -->
      <view class="modal-header">
        <text class="modal-title">智能录入</text>
        <view class="close-btn" @click="handleClose">
          <Icon name="close" color="#64748b" size="28rpx" />
        </view>
      </view>

      <!-- 内容区域 -->
      <scroll-view class="modal-body" scroll-y>
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
              <text class="text">上传背景图</text>
            </view>
          </view>
        </view>

        <!-- 问题图片 -->
        <view class="form-item">
          <text class="form-label"><text class="required">*</text>问题图片</text>
          <view class="image-upload">
            <view v-if="form.problemImage" class="image-item">
              <image :src="$img(form.problemImage)" mode="aspectFill" @click="previewImage(form.problemImage)" />
              <view class="remove-btn" @click="removeProblemImage">
                <Icon name="close" color="#ffffff" size="24rpx" />
              </view>
            </view>
            <view v-else class="upload-btn" @click="chooseImage('problem')">
              <Icon name="plus" color="#94a3b8" size="48rpx" />
              <text class="text">上传问题图</text>
            </view>
          </view>
          <!-- 图片识别状态 -->
          <view v-if="form.problemImage" class="recognition-status">
            <!-- 识别中 -->
            <view v-if="imageRecognizing" class="status-row">
              <Icon name="refresh" color="#3b82f6" size="32rpx" class="rotating" />
              <text class="status-text recognizing">AI识别中...</text>
            </view>
            <!-- 识别成功 -->
            <view v-else-if="imageRecognitionSuccess" class="status-success">
              <view class="status-row">
                <Icon name="check" color="#10b981" size="32rpx" />
                <text class="status-text success">已识别：{{ imageResult.problemTypeName }} - {{
                  imageResult.problemSubtypeName }}</text>
              </view>
              <text class="status-desc">问题描述：{{ imageResult.description || '暂无' }}</text>
              <view class="retry-btn" @click="retryImageRecognition"><text>重新识别</text></view>
            </view>
            <!-- 识别失败 -->
            <view v-else-if="imageRecognitionError" class="status-error">
              <view class="status-row">
                <Icon name="close" color="#ef4444" size="32rpx" />
                <text class="status-text error">识别失败</text>
              </view>
              <view class="retry-btn" @click="retryImageRecognition"><text>重新识别</text></view>
            </view>
            <!-- 初始状态：未识别 -->
            <view v-else class="status-row">
              <text class="status-text">等待识别...</text>
            </view>
          </view>
        </view>

        <!-- 经纬度 -->
        <view class="form-item">
          <text class="form-label"><text class="required">*</text>经纬度</text>
          <view class="coordinate-inputs">
            <input class="form-input coord-input" type="digit" v-model="form.longitude" placeholder="经度"
              placeholder-class="placeholder" @blur="onCoordinateChange" />
            <input class="form-input coord-input" type="digit" v-model="form.latitude" placeholder="纬度"
              placeholder-class="placeholder" @blur="onCoordinateChange" />
            <view class="location-btn" @click="getLocation">
              <Icon v-if="locating" name="refresh" color="#3b82f6" size="36rpx" class="rotating" />
              <Icon v-else name="location" color="#3b82f6" size="36rpx" />
            </view>
          </view>
          <!-- 经纬度识别按钮和状态 -->
          <view v-if="form.longitude && form.latitude" class="location-recognition">
            <!-- 识别中 -->
            <view v-if="locationRecognizing" class="status-row">
              <Icon name="refresh" color="#3b82f6" size="32rpx" class="rotating" />
              <text class="status-text recognizing">识别位置中...</text>
            </view>
            <!-- 识别成功 -->
            <view v-else-if="locationResult.townshipId && locationResult.townshipId > 0" class="status-success">
              <view class="status-row">
                <Icon name="check" color="#10b981" size="32rpx" />
                <text class="status-text success">乡镇：{{ locationResult.townshipName }}</text>
              </view>
              <view class="status-row">
                <text class="status-text success">河段：{{ locationResult.sectionName || '暂无' }}</text>
              </view>
              <view class="retry-btn" @click="recognizeLocation"><text>重新识别</text></view>
            </view>
            <!-- 识别失败 -->
            <view v-else-if="locationRecognitionError" class="status-error">
              <view class="status-row">
                <Icon name="close" color="#ef4444" size="32rpx" />
                <text class="status-text error">识别失败，请手动选择或重试</text>
              </view>
              <view class="retry-btn" @click="recognizeLocation"><text>重新识别</text></view>
            </view>
            <!-- 初始状态：点击识别按钮 -->
            <view v-else class="recognize-location-btn" @click="recognizeLocation">
              <Icon name="location" color="#ffffff" size="32rpx" />
              <text>识别位置</text>
            </view>
          </view>
        </view>

        <!-- 识别结果汇总 -->
        <view v-if="showResultSummary" class="result-summary">
          <text class="summary-title">识别结果汇总</text>
          <view class="summary-grid">
            <view class="summary-item">
              <text class="summary-label">问题类型：</text>
              <text class="summary-value">
                {{ imageResult.problemTypeName || '-' }}
                <text v-if="imageResult.problemSubtypeName"> - {{ imageResult.problemSubtypeName }}</text>
              </text>
              <Icon v-if="imageRecognitionSuccess" name="check" color="#10b981" size="28rpx" />
              <Icon v-else-if="imageRecognitionError" name="close" color="#ef4444" size="28rpx" />
            </view>
            <view class="summary-item">
              <text class="summary-label">问题描述：</text>
              <text class="summary-value">{{ imageResult.description || '-' }}</text>
            </view>
            <view class="summary-item">
              <text class="summary-label">乡镇：</text>
              <text class="summary-value">{{ locationResult.townshipName || '-' }}</text>
              <Icon v-if="locationResult.townshipId" name="check" color="#10b981" size="28rpx" />
              <Icon v-else-if="locationRecognitionError" name="close" color="#ef4444" size="28rpx" />
            </view>
            <view class="summary-item">
              <text class="summary-label">河段：</text>
              <text class="summary-value">{{ locationResult.sectionName || '-' }}</text>
              <Icon v-if="locationResult.sectionId" name="check" color="#10b981" size="28rpx" />
            </view>
          </view>
          <view v-if="hasRecognitionError" class="summary-tip">
            <Icon name="warning" color="#d97706" size="28rpx" />
            <text>部分识别失败，进入表单后需手动补充</text>
          </view>
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="modal-footer">
        <button class="btn btn-cancel" @click="handleClose">取消</button>
        <button class="btn btn-confirm" :disabled="!canContinue" @click="handleConfirm">
          <text>继续录入</text>
          <Icon name="right" color="#ffffff" size="28rpx" />
        </button>
      </view>

      <!-- H5 图片预览 -->
      <!-- #ifdef H5 -->
      <ImageViewer :visible="imageViewerVisible" :urls="imageViewerUrls" :current="imageViewerCurrent"
        @update:visible="imageViewerVisible = $event" />
      <!-- #endif -->
    </view>
  </view>
</template>

<script>
import api from "@/api/index.js";
import ImageViewer from "@/components/common/ImageViewer.vue";
import Icon from "@/components/common/Icon.vue";

export default {
  name: "SmartInputModal",
  components: {
    ImageViewer,
    Icon,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:visible", "success"],
  data() {
    return {
      form: {
        backgroundImage: "",
        problemImage: "",
        longitude: "",
        latitude: "",
      },
      // 定位状态
      locating: false,
      // 图片识别状态
      imageRecognizing: false,
      imageRecognitionSuccess: false,
      imageRecognitionError: false,
      imageResult: {
        problemTypeId: "",
        problemTypeName: "",
        problemSubtypeId: "",
        problemSubtypeName: "",
        description: "",
      },
      // 位置识别状态
      locationRecognizing: false,
      locationRecognitionError: false,
      locationResult: {
        townshipId: "",
        townshipName: "",
        sectionId: "",
        sectionName: "",
      },
      // 图片预览
      imageViewerVisible: false,
      imageViewerUrls: [],
      imageViewerCurrent: 0,
    };
  },
  computed: {
    // 是否可以继续
    canContinue() {
      return this.form.backgroundImage && this.form.problemImage && this.form.longitude && this.form.latitude;
    },
    // 是否显示结果汇总
    showResultSummary() {
      return this.form.problemImage && this.form.longitude && this.form.latitude;
    },
    // 是否有识别错误
    hasRecognitionError() {
      return this.imageRecognitionError || this.locationRecognitionError;
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.resetForm();
        // 自动获取定位
        this.$nextTick(() => {
          this.getLocation();
        });
      }
    },
  },
  methods: {
    // 从图片EXIF中读取GPS坐标（手动解析，不依赖第三方库）
    getGpsFromImage(filePath) {
      return new Promise((resolve) => {
        // #ifdef MP-WEIXIN
        uni.getFileSystemManager().readFile({
          filePath,
          success: (res) => {
            try {
              const dataView = new DataView(res.data);

              // 检查是否为 JPEG 文件
              if (dataView.getUint8(0) !== 0xFF || dataView.getUint8(1) !== 0xD8) {
                resolve(null);
                return;
              }

              // 查找 EXIF 数据段
              let offset = 2;
              const length = res.data.byteLength;

              while (offset < length) {
                if (dataView.getUint8(offset) !== 0xFF) {
                  resolve(null);
                  return;
                }

                const marker = dataView.getUint8(offset + 1);

                // APP1 标记 (0xE1)
                if (marker === 0xE1) {
                  const exifOffset = offset + 4;

                  // 检查 EXIF 标识符
                  const exifIdentifier = String.fromCharCode(
                    dataView.getUint8(exifOffset),
                    dataView.getUint8(exifOffset + 1),
                    dataView.getUint8(exifOffset + 2),
                    dataView.getUint8(exifOffset + 3),
                    dataView.getUint8(exifOffset + 4),
                    dataView.getUint8(exifOffset + 5)
                  );

                  if (exifIdentifier === "Exif\x00\x00") {
                    const tiffOffset = exifOffset + 6;

                    // 解析 TIFF 头，确定字节序
                    const littleEndian = dataView.getUint16(tiffOffset) === 0x4949;

                    // 解析 IFD
                    const gpsData = this.parseExifGps(dataView, tiffOffset, littleEndian);
                    if (gpsData) {
                      // WGS84 转 GCJ02
                      const { lng, lat } = this.wgs84ToGcj02(gpsData.longitude, gpsData.latitude);
                      resolve({ longitude: lng, latitude: lat });
                    } else {
                      resolve(null);
                    }
                  } else {
                    resolve(null);
                  }
                  return;
                } else {
                  // 跳过其他标记
                  offset += 2 + dataView.getUint16(offset + 2);
                }
              }

              resolve(null);
            } catch (error) {
              console.error("解析EXIF失败:", error);
              resolve(null);
            }
          },
          fail: (err) => {
            console.error("读取文件失败:", err);
            resolve(null);
          }
        });
        // #endif

        // #ifdef H5
        // H5环境暂不支持图片GPS提取
        resolve(null);
        // #endif
      });
    },

    // 解析 EXIF GPS 信息
    parseExifGps(dataView, tiffOffset, littleEndian) {
      // 读取 IFD0 偏移量
      const ifd0Offset = tiffOffset + dataView.getUint32(tiffOffset + 4, littleEndian);

      // 读取 IFD0 条目数
      const ifd0Count = dataView.getUint16(ifd0Offset, littleEndian);

      // 查找 GPS IFD 偏移量
      let gpsIfdOffset = null;
      for (let i = 0; i < ifd0Count; i++) {
        const entryOffset = ifd0Offset + 2 + i * 12;
        const tag = dataView.getUint16(entryOffset, littleEndian);

        // GPS IFD 指针标签 (0x8825)
        if (tag === 0x8825) {
          gpsIfdOffset = tiffOffset + dataView.getUint32(entryOffset + 8, littleEndian);
          break;
        }
      }

      if (!gpsIfdOffset) {
        return null;
      }

      // 读取 GPS IFD 条目
      const gpsCount = dataView.getUint16(gpsIfdOffset, littleEndian);

      let latitude = null;
      let longitude = null;
      let latitudeRef = "N";
      let longitudeRef = "E";

      for (let i = 0; i < gpsCount; i++) {
        const entryOffset = gpsIfdOffset + 2 + i * 12;
        const tag = dataView.getUint16(entryOffset, littleEndian);
        const type = dataView.getUint16(entryOffset + 2, littleEndian);
        const count = dataView.getUint32(entryOffset + 4, littleEndian);
        const valueOffset = entryOffset + 8;

        // 如果值长度超过4字节，valueOffset 存储的是偏移量
        const actualValueOffset = this.getValueOffset(dataView, type, count, valueOffset, tiffOffset, littleEndian);

        switch (tag) {
          case 0x0001: // GPSLatitudeRef
            latitudeRef = String.fromCharCode(dataView.getUint8(actualValueOffset));
            break;
          case 0x0002: // GPSLatitude
            latitude = this.readGpsCoordinate(dataView, actualValueOffset, littleEndian);
            break;
          case 0x0003: // GPSLongitudeRef
            longitudeRef = String.fromCharCode(dataView.getUint8(actualValueOffset));
            break;
          case 0x0004: // GPSLongitude
            longitude = this.readGpsCoordinate(dataView, actualValueOffset, littleEndian);
            break;
        }
      }

      if (latitude !== null && longitude !== null) {
        // 转换为十进制度
        let lat = this.convertDMSToDD(latitude);
        let lng = this.convertDMSToDD(longitude);

        // 根据方向调整正负
        if (latitudeRef === "S") lat = -lat;
        if (longitudeRef === "W") lng = -lng;

        return { latitude: lat, longitude: lng };
      }

      return null;
    },

    // 获取值的实际偏移量
    getValueOffset(dataView, type, count, valueOffset, tiffOffset, littleEndian) {
      const typeSizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8, 12: 8 };
      const typeSize = typeSizes[type] || 1;
      const totalSize = typeSize * count;

      if (totalSize <= 4) {
        // 值存储在条目中
        return valueOffset;
      } else {
        // 值存储在其他位置，valueOffset 存储的是偏移量
        return tiffOffset + dataView.getUint32(valueOffset, littleEndian);
      }
    },

    // 读取 GPS 坐标（度分秒格式）
    readGpsCoordinate(dataView, offset, littleEndian) {
      // GPS 坐标由3个 RATIONAL (类型5) 组成，每个 RATIONAL 占8字节
      const degrees = dataView.getUint32(offset, littleEndian) / dataView.getUint32(offset + 4, littleEndian);
      const minutes = dataView.getUint32(offset + 8, littleEndian) / dataView.getUint32(offset + 12, littleEndian);
      const seconds = dataView.getUint32(offset + 16, littleEndian) / dataView.getUint32(offset + 20, littleEndian);

      return [degrees, minutes, seconds];
    },

    // EXIF GPS 度分秒 转 十进制度
    convertDMSToDD(dms) {
      if (!dms || dms.length < 3) return 0;
      const degrees = dms[0];
      const minutes = dms[1];
      const seconds = dms[2];
      return degrees + minutes / 60 + seconds / 3600;
    },

    // WGS84 转 GCJ02（火星坐标）
    wgs84ToGcj02(lng, lat) {
      const PI = 3.14159265358979324;
      const a = 6378245.0;
      const ee = 0.00669342162296594323;

      let dLat = this.transformLat(lng - 105.0, lat - 35.0);
      let dLng = this.transformLng(lng - 105.0, lat - 35.0);
      const radLat = lat / 180.0 * PI;
      let magic = Math.sin(radLat);
      magic = 1 - ee * magic * magic;
      const sqrtMagic = Math.sqrt(magic);
      dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
      dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
      return { lng: lng + dLng, lat: lat + dLat };
    },

    transformLat(x, y) {
      const PI = 3.14159265358979324;
      let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
      ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
      ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
      return ret;
    },

    transformLng(x, y) {
      const PI = 3.14159265358979324;
      let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
      ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
      ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
      return ret;
    },

    resetForm() {
      this.form = {
        backgroundImage: "",
        problemImage: "",
        longitude: "",
        latitude: "",
      };
      this.imageRecognizing = false;
      this.imageRecognitionSuccess = false;
      this.imageRecognitionError = false;
      this.imageResult = {
        problemTypeId: "",
        problemTypeName: "",
        problemSubtypeId: "",
        problemSubtypeName: "",
        description: "",
      };
      this.locating = false;
      this.locationRecognizing = false;
      this.locationRecognitionError = false;
      this.locationResult = {
        townshipId: "",
        townshipName: "",
        sectionId: "",
        sectionName: "",
      };
    },

    // 选择图片
    async chooseImage(type) {
      uni.chooseImage({
        count: 1,
        sizeType: ["original", "compressed"], // 优先原图以保留EXIF
        sourceType: ["camera", "album"],
        success: async (res) => {
          const filePath = res.tempFilePaths[0];
          uni.showLoading({ title: "上传中..." });
          try {
            const link = await api.upload.uploadImage(filePath);
            if (type === "background") {
              this.form.backgroundImage = link;
              uni.hideLoading();
            } else {
              this.form.problemImage = link;
              // 尝试从图片EXIF读取GPS
              const gpsData = await this.getGpsFromImage(filePath);

              uni.hideLoading();

              if (gpsData) {
                // 延迟一下确保 hideLoading 完成
                setTimeout(() => {
                  uni.showModal({
                    title: '位置信息',
                    content: `检测到图片包含位置信息：\n经度：${gpsData.longitude.toFixed(6)}\n纬度：${gpsData.latitude.toFixed(6)}\n\n是否使用图片中的经纬度？`,
                    confirmText: '使用',
                    cancelText: '取消',
                    success: (modalRes) => {
                      if (modalRes.confirm) {
                        // 用户确认替换
                        this.form.longitude = gpsData.longitude.toFixed(6);
                        this.form.latitude = gpsData.latitude.toFixed(6);
                        // 重新识别乡镇河段
                        this.recognizeLocation();
                      }
                      // 用户取消，保持原有经纬度不变
                    }
                  });
                  // 弹窗显示后再进行图片识别
                  setTimeout(() => {
                    this.doImageRecognition(link);
                  }, 300);
                }, 100);
              } else {
                // 无GPS数据，直接进行图片识别
                this.doImageRecognition(link);
              }
            }
          } catch (error) {
            console.error("上传失败:", error);
            uni.hideLoading();
            uni.showToast({ title: "上传失败", icon: "none" });
          }
        },
        fail: (err) => {
          console.error("选择图片失败:", err);
          if (err.errMsg && !err.errMsg.includes("cancel")) {
            uni.showToast({ title: "选择图片失败", icon: "none" });
          }
        },
      });
    },

    // 预览图片
    previewImage(url) {
      const fullUrl = this.$img(url);
      // #ifdef H5
      this.imageViewerUrls = [fullUrl];
      this.imageViewerCurrent = 0;
      this.imageViewerVisible = true;
      // #endif

      // #ifndef H5
      uni.previewImage({ urls: [fullUrl], current: fullUrl });
      // #endif
    },

    // 移除问题图片
    removeProblemImage() {
      this.form.problemImage = "";
      this.imageRecognitionSuccess = false;
      this.imageRecognitionError = false;
      this.imageResult = {
        problemTypeId: "",
        problemTypeName: "",
        problemSubtypeId: "",
        problemSubtypeName: "",
        description: "",
      };
    },

    // 图片识别
    async doImageRecognition(imageUrl) {
      if (!imageUrl) return;

      this.imageRecognizing = true;
      this.imageRecognitionSuccess = false;
      this.imageRecognitionError = false;
      console.log("开始图片识别...", imageUrl);

      try {
        const result = await api.inspection.recognizeImage({
          imageRef: imageUrl,
        });

        console.log("图片识别结果:", result);

        if (result && result.data) {
          this.imageResult = {
            problemTypeId: result.data.suggestedTypeId || "",
            problemTypeName: result.data.suggestedTypeName || "",
            problemSubtypeId: result.data.suggestedSubtypeId || "",
            problemSubtypeName: result.data.suggestedSubtypeName || "",
            description: result.data.suggestedDescription || "",
          };
          this.imageRecognitionSuccess = true;
        } else {
          this.imageRecognitionError = true;
        }
      } catch (error) {
        console.error("图片识别失败:", error);
        this.imageRecognitionError = true;
      } finally {
        this.imageRecognizing = false;
        console.log("图片识别结束, imageRecognizing:", this.imageRecognizing, "success:", this.imageRecognitionSuccess, "error:", this.imageRecognitionError);
      }
    },

    // 重新识别图片
    retryImageRecognition() {
      if (this.form.problemImage) {
        this.doImageRecognition(this.form.problemImage);
      }
    },

    // 获取定位
    getLocation() {
      if (this.locating) return;
      this.doGetLocation();
    },

    // 实际执行定位
    doGetLocation() {
      if (this.locating) return;
      this.locating = true;
      uni.showLoading({ title: "获取位置中..." });

      // 超时兜底：防止隐私授权流程中断或回调不触发导致永久卡在"获取位置中"
      let settled = false;
      const locationTimer = setTimeout(() => {
        if (settled) return;
        settled = true;
        console.warn("定位超时，主动复位状态");
        uni.hideLoading();
        this.locating = false;
        uni.showToast({ title: "定位超时，请重试或手动输入", icon: "none" });
      }, 12000);

      uni.getLocation({
        type: "gcj02",
        isHighAccuracy: true,
        highAccuracyExpireTime: 10000,
        success: (res) => {
          settled = true;
          clearTimeout(locationTimer);
          console.log("定位成功:", res);
          uni.hideLoading();
          this.form.longitude = res.longitude.toFixed(6);
          this.form.latitude = res.latitude.toFixed(6);
          uni.showToast({ title: "定位成功", icon: "success" });
          // 定位成功后自动识别位置
          this.recognizeLocation();
        },
        fail: (err) => {
          settled = true;
          clearTimeout(locationTimer);
          console.error("定位失败:", err);
          uni.hideLoading();

          // 自动填充默认经纬度
          this.form.longitude = "118.293";
          this.form.latitude = "25.320";

          let errorMsg = "定位失败，已使用默认坐标（118.293, 25.320），您也可以手动修改";

          // #ifdef H5
          if (err.errMsg && err.errMsg.includes("permission denied")) {
            errorMsg = "您拒绝了定位权限，请在浏览器设置中允许定位，或手动输入经纬度";
          } else if (err.errMsg && err.errMsg.includes("unavailable")) {
            errorMsg = "定位服务不可用，请手动输入经纬度坐标";
          }
          // #endif

          // #ifdef MP-WEIXIN
          if (err.errMsg) {
            if (err.errMsg.includes("auth deny") || err.errMsg.includes("authorize")) {
              errorMsg = "您拒绝了定位权限，请在小程序右上角「...」→设置中开启位置权限";
            } else if (err.errMsg.includes("no data") || err.errMsg.includes("invalid")) {
              errorMsg = "无法获取位置信息，请确保手机GPS已开启";
            }
          }
          // 隐私协议拒绝：错误码 103
          // 用户拒绝隐私协议后，10 秒内重复调用隐私接口会直接返回 103，不弹窗
          if (err.errCode === 103 || (err.errMsg && err.errMsg.includes("103"))) {
            errorMsg = "您拒绝了隐私协议，无法获取定位。请稍后重试，并在隐私弹窗中选择「同意」，或手动输入经纬度";
          }
          // #endif

          uni.showModal({
            title: "定位失败",
            content: errorMsg,
            showCancel: false,
          });
        },
        complete: () => {
          if (!settled) {
            settled = true;
            clearTimeout(locationTimer);
          }
          this.locating = false;
        },
      });
    },

    // 经纬度变化时重置位置识别结果
    onCoordinateChange() {
      this.locationResult = {
        townshipId: "",
        townshipName: "",
        sectionId: "",
        sectionName: "",
      };
      this.locationRecognitionError = false;
    },

    // 识别位置
    async recognizeLocation() {
      if (!this.form.longitude || !this.form.latitude) {
        uni.showToast({ title: "请先获取或输入经纬度", icon: "none" });
        return;
      }

      this.locationRecognizing = true;
      this.locationRecognitionError = false;
      console.log("开始位置识别...", this.form.longitude, this.form.latitude);

      try {
        const result = await api.location.matchLocation({
          longitude: parseFloat(this.form.longitude),
          latitude: parseFloat(this.form.latitude),
        });

        console.log("位置识别结果:", result);

        if (result && result.data && result.data.townshipId && result.data.townshipId > 0) {
          // 匹配成功，townshipId 是有效的正数
          this.locationResult = {
            townshipId: result.data.townshipId || "",
            townshipName: result.data.townshipName || "",
            sectionId: result.data.sectionId || "",
            sectionName: result.data.sectionName || "",
          };
        } else {
          // townshipId 为 -1 或空，表示未匹配到
          this.locationRecognitionError = true;
          this.locationResult = {
            townshipId: "",
            townshipName: "",
            sectionId: "",
            sectionName: "",
          };
          uni.showToast({ title: "未匹配到乡镇，请手动选择", icon: "none" });
        }
      } catch (error) {
        console.error("位置识别失败:", error);
        this.locationRecognitionError = true;
        uni.showToast({ title: "识别失败，请重试", icon: "none" });
      } finally {
        this.locationRecognizing = false;
        console.log("位置识别结束, locationRecognizing:", this.locationRecognizing);
      }
    },

    // 确认继续录入
    handleConfirm() {
      if (!this.canContinue) return;

      const data = {
        // 图片
        backgroundImage: this.form.backgroundImage,
        problemImages: this.form.problemImage ? [this.form.problemImage] : [],
        // 经纬度
        longitude: this.form.longitude ? parseFloat(this.form.longitude) : undefined,
        latitude: this.form.latitude ? parseFloat(this.form.latitude) : undefined,
        // 图片识别结果
        problemTypeId: this.imageResult.problemTypeId,
        problemTypeName: this.imageResult.problemTypeName,
        problemSubtypeId: this.imageResult.problemSubtypeId,
        problemSubtypeName: this.imageResult.problemSubtypeName,
        description: this.imageResult.description,
        // 位置识别结果
        townshipId: this.locationResult.townshipId,
        townshipName: this.locationResult.townshipName,
        sectionId: this.locationResult.sectionId,
        sectionName: this.locationResult.sectionName,
      };

      this.$emit("success", data);
      this.handleClose();
    },

    handleClose() {
      this.$emit("update:visible", false);
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

.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
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

.upload-btn {
  width: 200rpx;
  height: 200rpx;
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

// 识别状态样式
.recognition-status,
.location-recognition {
  margin-top: 16rpx;
  padding: 16rpx;
  background: #f8fafc;
  border-radius: 12rpx;
}

.status-text {
  font-size: 26rpx;

  &.recognizing {
    color: #3b82f6;
  }

  &.success {
    color: #10b981;
  }

  &.error {
    color: #ef4444;
  }
}

.status-success,
.status-error {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.status-desc {
  font-size: 24rpx;
  color: #64748b;
  margin-top: 8rpx;
}

.retry-btn {
  margin-top: 12rpx;
  padding: 8rpx 20rpx;
  background: #eff6ff;
  border-radius: 8rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 24rpx;
    color: #3b82f6;
  }
}

.recognize-location-btn {
  padding: 16rpx 24rpx;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 28rpx;
    color: #ffffff;
  }
}

// 经纬度输入
.coordinate-inputs {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.form-input {
  flex: 1;
  height: 88rpx;
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  border-radius: 16rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  font-size: 30rpx;
  color: #1e293b;

  &.coord-input {
    flex: 1;
  }
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

// 结果汇总
.result-summary {
  margin-top: 32rpx;
  padding: 20rpx;
  background: #f5f3ff;
  border: 1rpx solid #ddd6fe;
  border-radius: 16rpx;
}

.summary-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #7c3aed;
  margin-bottom: 16rpx;
}

.summary-grid {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.summary-label {
  font-size: 26rpx;
  color: #64748b;
  min-width: 140rpx;
}

.summary-value {
  font-size: 26rpx;
  color: #1e293b;
  flex: 1;
}

.status-icon {
  font-size: 24rpx;

  &.success {
    color: #10b981;
  }

  &.error {
    color: #ef4444;
  }
}

.summary-tip {
  margin-top: 16rpx;
  padding: 12rpx;
  background: #fef3c7;
  border-radius: 8rpx;

  text {
    font-size: 24rpx;
    color: #92400e;
  }
}

// 底部按钮
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

  &.btn-confirm {
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    color: #ffffff;

    &[disabled] {
      opacity: 0.5;
    }
  }
}

.placeholder {
  color: #94a3b8;
}

// 状态行（图标+文字）
.status-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

// 旋转动画
.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
