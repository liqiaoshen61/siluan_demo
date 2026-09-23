<template>
  <view class="page-container">
    <!-- 顶部导航 -->
    <TopNav @formSuccess="handleFormSuccess" />

    <!-- 统计类型选择 -->
    <view class="stats-type-selector">
      <view
        v-for="type in statsTypes"
        :key="type.value"
        class="type-item"
        :class="{ active: statsType === type.value }"
        @click="handleTypeChange(type.value)"
      >
        <text>{{ type.label }}</text>
      </view>
    </view>

    <!-- 时间选择器 -->
    <view class="time-selector">
      <!-- 按月：月份选择器 -->
      <view v-if="statsType === 'month'" class="month-info">
        <text class="time-label">统计月份</text>
        <picker mode="date" fields="month" :value="selectedMonth" @change="handleMonthChange">
          <view class="picker-value">
            <text>{{ formatMonth(selectedMonth) }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>

      <!-- 按半年：年份+半年选择 -->
      <view v-else-if="statsType === 'halfYear'" class="halfyear-selector">
        <view class="year-picker-wrapper">
          <text class="time-label">统计年份</text>
          <picker mode="date" fields="year" :value="selectedYear" @change="handleYearChange">
            <view class="picker-value">
              <text>{{ selectedYear }}年</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="halfyear-tabs">
          <view
            class="halfyear-tab"
            :class="{ active: currentHalfYear === 'H1' }"
            @click="handleHalfYearChange('H1')"
          >上半年</view>
          <view
            class="halfyear-tab"
            :class="{ active: currentHalfYear === 'H2' }"
            @click="handleHalfYearChange('H2')"
          >下半年</view>
        </view>
      </view>

      <!-- 按年：年份选择器 -->
      <view v-else class="month-info">
        <text class="time-label">统计年份</text>
        <picker mode="date" fields="year" :value="selectedYear" @change="handleYearChange">
          <view class="picker-value">
            <text>{{ selectedYear }}年度</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content-container" scroll-y>
      <!-- 汇总卡片 -->
      <view class="summary-card">
        <view class="summary-title">{{ getSummaryTitle() }}</view>
        <view class="summary-stats">
          <view class="stat-item">
            <text class="stat-value">{{ statsData.summary.totalProblems }}</text>
            <text class="stat-label">下发问题</text>
          </view>
          <view class="stat-item">
            <text class="stat-value success">{{ statsData.summary.totalRectified }}</text>
            <text class="stat-label">已整改</text>
          </view>
          <view class="stat-item">
            <text class="stat-value warning">{{ statsData.summary.totalRectRate }}%</text>
            <text class="stat-label">整改率</text>
          </view>
          <view class="stat-item">
            <text class="stat-value danger">{{ statsData.summary.totalOverdue }}</text>
            <text class="stat-label">超时</text>
          </view>
        </view>
      </view>

      <!-- 整改率排名图表 -->
      <view class="chart-card">
        <view class="chart-header">
          <text class="chart-title">乡镇整改率排名</text>
          <text class="chart-subtitle">TOP 5</text>
        </view>
        <view class="chart-container">
          <view v-for="(item, index) in statsData.topTownships" :key="index" class="column-item">
            <view class="column-wrapper">
              <text class="column-value" :class="getRateClass(item.rectRate)">{{ item.rectRate }}%</text>
              <view class="column-bar">
                <view class="column-fill" :class="getBarClass(item.rectRate)" :style="{ height: item.rectRate + '%' }">
                </view>
              </view>
            </view>
            <text class="column-name">{{ item.township }}</text>
          </view>
        </view>
        <view class="chart-legend">
          <view class="legend-item">
            <view class="legend-dot green"></view>
            <text class="legend-text">≥80%</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot yellow"></view>
            <text class="legend-text">50-80%</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot red"></view>
            <text class="legend-text">≤50%</text>
          </view>
        </view>
      </view>

      <!-- 详细列表 -->
      <view class="detail-section">
        <text class="section-title">各乡镇详情</text>
        <view v-for="(item, index) in statsData.records" :key="index" class="detail-card">
          <view class="detail-header">
            <text class="detail-name">{{ item.township }}</text>
            <text class="detail-rate" :class="getRateClass(item.rectRate)">
              整改率 {{ item.rectRate }}%
            </text>
          </view>
          <view class="detail-stats">
            <view class="detail-stat">
              <text class="detail-value">{{ item.problemCount }}</text>
              <text class="detail-label">下发问题</text>
            </view>
            <view class="detail-stat">
              <text class="detail-value">{{ item.townshipInspectorReportedCount }}</text>
              <text class="detail-label">乡镇上报</text>
            </view>
            <view class="detail-stat">
              <text class="detail-value success">{{ item.rectCount }}</text>
              <text class="detail-label">已整改</text>
            </view>
            <view class="detail-stat">
              <text class="detail-value warning">{{ item.rectRate }}%</text>
              <text class="detail-label">整改率</text>
            </view>
            <view class="detail-stat">
              <text class="detail-value danger">{{ item.overdueCount }}</text>
              <text class="detail-label">超时</text>
            </view>
            <view class="detail-stat">
              <text class="detail-value">{{ item.aiRejectedCount }}</text>
              <text class="detail-label">驳回</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 自定义TabBar -->
    <CustomTabBar current-tab="stats" />
  </view>
</template>

<script>
import TopNav from "@/components/common/TopNav.vue";
import CustomTabBar from "@/components/common/CustomTabBar.vue";
import api from "@/api/index.js";
import userStore from "@/store/user.js";

export default {
  components: {
    TopNav,
    CustomTabBar,
  },
  data() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return {
      statsType: 'month', // 'month' | 'halfYear' | 'year'
      statsTypes: [
        { label: '按月', value: 'month' },
        { label: '按半年', value: 'halfYear' },
        { label: '按年', value: 'year' },
      ],
      selectedMonth: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
      selectedYear: `${currentYear}`,
      selectedHalfYear: `${currentYear}-${currentMonth <= 6 ? 'H1' : 'H2'}`,
      statsData: {
        summary: {
          month: currentMonth,
          totalProblems: 0,
          totalRectified: 0,
          totalRectRate: "0",
          totalOverdue: 0,
        },
        topTownships: [],
        records: [],
      },
    };
  },
  computed: {
    currentHalfYear() {
      return this.selectedHalfYear.split('-')[1]; // 'H1' 或 'H2'
    },
  },
  onLoad() {

  },
  onShow() {
    userStore.actions.updateBadges();
    this.loadStats();
  },
  methods: {
    async loadStats() {
      try {
        const { from, to } = this.getTimeRange();
        const result = await api.stats.getStatistics({ from, to });
        this.statsData = result;
      } catch (error) {
        console.error("加载统计数据失败:", error);
        this.generateMockData();
      }
    },

    generateMockData() {
      const townships = [
        "桃城镇", "五里街镇", "东关镇", "东平镇", "达埔镇",
        "吾峰镇", "石鼓镇", "蓬壶镇", "坑仔口镇", "玉斗镇",
        "锦斗镇", "桂洋镇", "下洋镇", "湖洋镇", "岵山镇",
        "仙夹镇", "一都镇", "横口乡", "外山乡", "介福乡",
        "呈祥乡", "苏坑镇",
      ];

      const records = townships.map((town) => {
        const problemCount = Math.floor(Math.random() * 15) + 1;
        const rectCount = Math.floor(Math.random() * problemCount);
        const overdueCount = Math.floor(Math.random() * (problemCount - rectCount));
        const rectRate = problemCount > 0 ? ((rectCount / problemCount) * 100).toFixed(1) : "0";

        return {
          township: town,
          problemCount,
          rectCount,
          rectRate,
          overdueCount,
          overdueRate: problemCount > 0 ? ((overdueCount / problemCount) * 100).toFixed(1) : "0",

        };
      });

      const totalProblems = records.reduce((sum, r) => sum + r.problemCount, 0);
      const totalRectified = records.reduce((sum, r) => sum + r.rectCount, 0);
      const totalOverdue = records.reduce((sum, r) => sum + r.overdueCount, 0);

      this.statsData.summary = {
        month: new Date().getMonth() + 1,
        totalProblems,
        totalRectified,
        totalRectRate: totalProblems > 0 ? ((totalRectified / totalProblems) * 100).toFixed(1) : "0",
        totalOverdue,
      };

      this.statsData.topTownships = records
        .filter((r) => r.problemCount > 0)
        .sort((a, b) => parseFloat(b.rectRate) - parseFloat(a.rectRate))
        .slice(0, 5);

      this.statsData.records = records.sort(
        (a, b) => parseFloat(b.rectRate) - parseFloat(a.rectRate)
      );
    },

    handleMonthChange(e) {
      this.selectedMonth = e.detail.value;
      this.loadStats();
    },

    handleYearChange(e) {
      this.selectedYear = e.detail.value;
      if (this.statsType === 'halfYear') {
        const half = this.currentHalfYear;
        this.selectedHalfYear = `${this.selectedYear}-${half}`;
      }
      this.loadStats();
    },

    handleTypeChange(type) {
      this.statsType = type;
      this.loadStats();
    },

    handleHalfYearChange(half) {
      this.selectedHalfYear = `${this.selectedYear}-${half}`;
      this.loadStats();
    },

    getTimeRange() {
      let from, to;

      switch (this.statsType) {
        case 'month':
          const [year, mon] = this.selectedMonth.split('-');
          from = `${year}-${mon}-01`;
          const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
          to = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;
          break;

        case 'halfYear':
          const [hYear, half] = this.selectedHalfYear.split('-');
          if (half === 'H1') {
            from = `${hYear}-01-01`;
            to = `${hYear}-06-30`;
          } else {
            from = `${hYear}-07-01`;
            to = `${hYear}-12-31`;
          }
          break;

        case 'year':
          from = `${this.selectedYear}-01-01`;
          to = `${this.selectedYear}-12-31`;
          break;
      }

      return { from, to };
    },

    getSummaryTitle() {
      switch (this.statsType) {
        case 'month':
          const [, mon] = this.selectedMonth.split('-');
          return `${parseInt(mon)}月度汇总`;
        case 'halfYear':
          const hYear = this.selectedYear;
          const halfText = this.currentHalfYear === 'H1' ? '上半年' : '下半年';
          return `${hYear}年${halfText}汇总`;
        case 'year':
          return `${this.selectedYear}年度汇总`;
        default:
          return '月度汇总';
      }
    },

    formatMonth(month) {
      if (!month) return "";
      const [year, m] = month.split("-");
      return `${year}年${parseInt(m)}月`;
    },

    getRateClass(rate) {
      const r = parseFloat(rate);
      if (r >= 80) return "success";
      if (r >= 50) return "warning";
      return "danger";
    },

    getBarClass(rate) {
      const r = parseFloat(rate);
      if (r >= 80) return "bar-green";
      if (r >= 50) return "bar-yellow";
      return "bar-red";
    },

    // 新增暗访成功（刷新红点）
    handleFormSuccess() {
      userStore.actions.updateBadges();
    },
  },
};
</script>

<style lang="scss" scoped>
.page-container {
  height: 100vh;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  /* #ifndef H5 */
  /* 非H5环境（小程序、APP）padding */
  padding-bottom: 168rpx;
  /* #endif */

  /* #ifdef H5 */
  /* H5环境无padding */
  padding-bottom: 128rpx;
  /* #endif */

}

.stats-type-selector {
  display: flex;
  gap: 16rpx;
  background: #ffffff;
  padding: 20rpx;
  border-bottom: 1rpx solid #e2e8f0;
}

.type-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  background: #f1f5f9;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #64748b;
  transition: all 0.2s;

  &.active {
    background: #1e40af;
    color: #ffffff;
    font-weight: 600;
  }
}

.time-selector {
  background: #ffffff;
  padding: 20rpx;
  border-bottom: 1rpx solid #e2e8f0;
}

.month-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.time-label {
  font-size: 28rpx;
  color: #64748b;
}

.picker-value {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 30rpx;
  color: #1e293b;

  .arrow {
    font-size: 20rpx;
    color: #94a3b8;
  }
}

.halfyear-selector {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.year-picker-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.halfyear-tabs {
  display: flex;
  gap: 16rpx;
}

.halfyear-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  background: #f1f5f9;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #64748b;
  transition: all 0.2s;

  &.active {
    background: #3b82f6;
    color: #ffffff;
    font-weight: 600;
  }
}


.content-container {
  flex: auto;
  padding: 24rpx 20rpx;
  box-sizing: border-box;
  overflow-y: auto;
}

.summary-card {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
}

.summary-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 24rpx;
}

.summary-stats {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 48rpx;
  font-weight: 600;
  color: #ffffff;

  &.success {
    color: #86efac;
  }

  &.warning {
    color: #fde047;
  }

  &.danger {
    color: #fca5a5;
  }
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.chart-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.chart-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1e293b;
}

.chart-subtitle {
  font-size: 24rpx;
  color: #94a3b8;
}

.chart-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 360rpx;
  padding: 20rpx 10rpx 0;
  gap: 12rpx;
}

.column-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.column-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 300rpx;
}

.column-value {
  font-size: 22rpx;
  font-weight: 600;
  margin-bottom: 8rpx;

  &.success {
    color: #059669;
  }

  &.warning {
    color: #d97706;
  }

  &.danger {
    color: #dc2626;
  }
}

.column-bar {
  flex: 1;
  width: 48rpx;
  background: #f1f5f9;
  border-radius: 8rpx 8rpx 0 0;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.column-fill {
  width: 100%;
  border-radius: 8rpx 8rpx 0 0;
  transition: height 0.3s ease;

  &.bar-green {
    background: linear-gradient(180deg, #34d399 0%, #059669 100%);
  }

  &.bar-yellow {
    background: linear-gradient(180deg, #fbbf24 0%, #d97706 100%);
  }

  &.bar-red {
    background: linear-gradient(180deg, #f87171 0%, #dc2626 100%);
  }
}

.column-name {
  font-size: 22rpx;
  color: #64748b;
  margin-top: 12rpx;
  text-align: center;
  max-width: 100rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 32rpx;
  margin-top: 24rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 4rpx;

  &.green {
    background: #059669;
  }

  &.yellow {
    background: #d97706;
  }

  &.red {
    background: #dc2626;
  }
}

.legend-text {
  font-size: 22rpx;
  color: #64748b;
}

.detail-section {
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16rpx;
}

.detail-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.detail-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #1e293b;
}

.detail-rate {
  font-size: 24rpx;

  &.success {
    color: #059669;
  }

  &.warning {
    color: #d97706;
  }

  &.danger {
    color: #dc2626;
  }
}

.detail-stats {
  display: flex;
  justify-content: space-between;
}

.detail-stat {
  text-align: center;
}

.detail-value {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #1e293b;

  &.success {
    color: #059669;
  }

  &.warning {
    color: #d97706;
  }

  &.danger {
    color: #dc2626;
  }
}

.detail-label {
  display: block;
  font-size: 22rpx;
  color: #64748b;
  margin-top: 4rpx;
}
</style>
