/**
 * 響應格式化中間件
 */
module.exports = async (ctx, next) => {
  await next();
  
  // 如果已經設置了響應體，則不處理
  if (ctx.body && typeof ctx.body === 'object' && ctx.body.code !== undefined) {
    return;
  }
  
  // 成功響應格式化
  if (ctx.status >= 200 && ctx.status < 300) {
    const data = ctx.body || null;
    ctx.body = {
      code: 200,
      message: 'success',
      data: data,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
};

