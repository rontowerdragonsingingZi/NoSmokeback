/**
 * 獲取今日日期字符串 YYYY-MM-DD
 * @returns {String}
 */
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * 計算兩個日期之間的天數差
 * @param {Date|String} startDate 開始日期
 * @param {Date|String} endDate 結束日期（默認今天）
 * @returns {Number} 天數差
 */
function getDaysDifference(startDate, endDate = new Date()) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDifference = end - start;
  return Math.floor(timeDifference / (1000 * 60 * 60 * 24));
}

/**
 * 格式化日期為 YYYY-MM-DD HH:mm:ss
 * @param {Date} date 
 * @returns {String}
 */
function formatDateTime(date = new Date()) {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * 獲取指定月份的天數
 * @param {Number} year 年份
 * @param {Number} month 月份（1-12）
 * @returns {Number} 該月天數
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * 生成日期範圍數組
 * @param {String} startDate 開始日期 YYYY-MM-DD
 * @param {String} endDate 結束日期 YYYY-MM-DD
 * @returns {Array} 日期字符串數組
 */
function getDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    dates.push(current.toISOString().split('T')[0]);
  }
  
  return dates;
}

module.exports = {
  getTodayString,
  getDaysDifference,
  formatDateTime,
  getDaysInMonth,
  getDateRange
};

