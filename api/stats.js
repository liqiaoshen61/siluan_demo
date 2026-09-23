/**
 * 统计相关接口
 * 接口文档：接口对接文档.md 第11节
 */
import { get } from "@/http/riverRequest.js";

/**
 * 通用筛选参数
 * @param {Object} params
 * @param {string} params.from 开始日期 yyyy-MM-dd，默认本月1日
 * @param {string} params.to 结束日期 yyyy-MM-dd，默认当天
 * @param {string} params.townshipId 乡镇ID
 * @param {string} params.problemTypeId 问题大类ID
 */

/**
 * 获取统计总览
 * GET /river/openapi/v1/statistics/overview
 * @param {Object} params 筛选参数
 * @param {string} params.from 开始日期 yyyy-MM-dd
 * @param {string} params.to 结束日期 yyyy-MM-dd
 * @param {string} params.townshipId 乡镇ID（县级用户可筛选）
 * @param {string} params.problemTypeId 问题大类ID
 * @returns {Promise<{issuedCount, completedCount, overdueCount, rectificationRate, overdueRate}>}
 */
export function getStatisticsOverview(params = {}) {
  return get("/statistics/overview", params);
}

/**
 * 获取乡镇汇总
 * GET /river/openapi/v1/statistics/township-summary
 * @param {Object} params 筛选参数
 * @returns {Promise<Array<{townshipId, townshipName, issuedCount, completedCount, overdueCount, rectificationRate, overdueRate}>>}
 */
export function getTownshipSummary(params = {}) {
  // return get("/statistics/township-summary", params);
  return get("/statistics/township-monthly-ranking", params);
}

/**
 * 获取月度趋势
 * GET /river/openapi/v1/statistics/trend
 * @param {Object} params 筛选参数
 * @returns {Promise<Array<{month, issuedCount, completedCount}>>}
 */
export function getStatisticsTrend(params = {}) {
  return get("/statistics/trend", params);
}

/**
 * 获取问题类型分布
 * GET /river/openapi/v1/statistics/problem-distribution
 * @param {Object} params 筛选参数
 * @returns {Promise<Array<{problemTypeId, problemTypeName, problemCount}>>}
 */
export function getProblemDistribution(params = {}) {
  return get("/statistics/problem-distribution", params);
}

/**
 * 获取逾期问题明细
 * GET /river/openapi/v1/statistics/overdue-cases
 * @param {Object} params 筛选参数
 * @param {number} params.limit 返回条数，默认50，范围1-200
 * @returns {Promise<Array<{inspectionId, rectificationId, townshipName, location, deadlineAt, completedAt}>>}
 */
export function getOverdueCases(params = {}) {
  return get("/statistics/overdue-cases", params);
}

/**
 * 获取月度计划进度
 * GET /river/openapi/v1/statistics/plan-progress
 * @param {Object} params 筛选参数
 * @param {string} params.month 月份 yyyy-MM，默认当前月
 * @param {string} params.townshipId 乡镇ID
 * @returns {Promise<{planMonth, totalCount, completedCount, completionRate}>}
 */
export function getPlanProgress(params = {}) {
  return get("/statistics/plan-progress", params);
}

/**
 * 根据时间范围推导乡镇排名接口的周期参数
 * @param {string} from 开始日期 yyyy-MM-dd
 * @param {string} to 结束日期 yyyy-MM-dd
 * @returns {Object} { month?, year?, half? }
 */
function deriveRankingParams(from, to) {
  const [fromYear, fromMonth, fromDay] = from.split('-');
  const [toYear, toMonth] = to.split('-');

  // 判断是否为整月（from是1号，to是该月最后一天）
  const lastDayOfMonth = new Date(parseInt(toYear), parseInt(toMonth), 0).getDate();
  const isFullMonth = fromDay === '01' &&
    to === `${toYear}-${toMonth}-${String(lastDayOfMonth).padStart(2, '0')}`;

  // 判断是否为整年
  const isFullYear = from === `${fromYear}-01-01` && to === `${fromYear}-12-31`;

  // 判断是否为上半年
  const isH1 = from === `${fromYear}-01-01` && to === `${fromYear}-06-30`;

  // 判断是否为下半年
  const isH2 = from === `${fromYear}-07-01` && to === `${fromYear}-12-31`;

  if (isFullMonth && fromYear === toYear && fromMonth === toMonth) {
    // 按月
    return { month: `${fromYear}-${fromMonth}` };
  } else if (isFullYear) {
    // 按年
    return { year: fromYear };
  } else if (isH1) {
    // 上半年
    return { year: fromYear, half: 1 };
  } else if (isH2) {
    // 下半年
    return { year: fromYear, half: 2 };
  }

  // 无法推导，默认用 month 参数
  return { month: from.substring(0, 7) };
}

/**
 * 获取统计数据（支持月/半年/年统计）
 * @param {Object} params
 * @param {string} params.from 开始日期 yyyy-MM-dd
 * @param {string} params.to 结束日期 yyyy-MM-dd
 * @param {string} params.month 月份 yyyy-MM（兼容旧调用方式）
 * @returns {Promise}
 */
export async function getStatistics(params) {
  let from, to;

  // 兼容旧调用方式：传入 month 字符串
  if (typeof params === 'string') {
    const [year, mon] = params.split('-');
    from = `${year}-${mon}-01`;
    const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
    to = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;
  } else {
    // 新调用方式：传入 { from, to } 或 { month }
    if (params.month) {
      const [year, mon] = params.month.split('-');
      from = `${year}-${mon}-01`;
      const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
      to = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;
    } else {
      from = params.from;
      to = params.to;
    }
  }

  try {
    // 根据时间范围推导乡镇排名参数
    const rankingParams = deriveRankingParams(from, to);

    // 并行请求多个统计接口
    const [overview, townshipSummary, problemDistribution] = await Promise.all([
      getStatisticsOverview({ from, to }),
      getTownshipSummary(rankingParams),
      getProblemDistribution({ from, to }),
    ]);

    // 构建兼容旧接口的数据结构
    const summary = {
      totalProblems: overview.data?.issuedCount || 0,
      totalRectified: overview.data?.completedCount || 0,
      totalRectRate: overview.data?.rectificationRate || "0",
      totalOverdue: overview.data?.overdueCount || 0,
      totalOverdueRate: overview.data?.overdueRate || "0",
    };

    const records = (townshipSummary.data || []).map((item) => ({
      township: item.townshipName,
      townshipId: item.townshipId,
      problemCount: item.issuedCount,
      rectCount: item.completedCount,
      rectRate: item.rectificationRate?.toString() || "0",
      overdueCount: item.overdueCount,
      overdueRate: item.overdueRate?.toString() || "0",
      aiRejectedCount: item.aiRejectedCount || 0,
      townshipInspectorReportedCount: item.townshipInspectorReportedCount || 0,
    }));

    return {
      month: from.substring(0, 7),
      summary,
      records,
      topTownships: records
        .filter((r) => r.problemCount > 0)
        .sort((a, b) => parseFloat(b.rectRate) - parseFloat(a.rectRate))
        .slice(0, 5),
      problemDistribution: problemDistribution.data || [],
      rawOverview: overview.data,
    };
  } catch (error) {
    console.error("获取统计数据失败:", error);
    // 返回空数据结构
    return {
      month: from.substring(0, 7),
      summary: {
        totalProblems: 0,
        totalRectified: 0,
        totalRectRate: "0",
        totalOverdue: 0,
        totalOverdueRate: "0",
      },
      records: [],
      topTownships: [],
      problemDistribution: [],
    };
  }
}

/**
 * 获取整改率排名
 * @param {string} month 月份
 * @param {number} limit 返回条数
 * @returns {Promise}
 */
export async function getRectRateRanking(month, limit = 5) {
  const data = await getStatistics(month);
  return data.records
    .filter((r) => r.problemCount > 0)
    .sort((a, b) => parseFloat(b.rectRate) - parseFloat(a.rectRate))
    .slice(0, limit);
}

export default {
  getStatisticsOverview,
  getTownshipSummary,
  getStatisticsTrend,
  getProblemDistribution,
  getOverdueCases,
  getPlanProgress,
  getStatistics,
  getRectRateRanking,
};
