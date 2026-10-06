const crypto = require('crypto');
const { Pool } = require('pg');

// 数据库连接
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const key = 'ctiJSLIZmAcCegg5LhGj';

// 触发回调
async function triggerCallback(orderId) {
  const notifyData = {
    pid: '10951',
    out_trade_no: orderId,
    money: '1.00',
    trade_no: 'XYM' + Date.now(),
    trade_status: 'TRADE_SUCCESS',
  };

  // 生成签名
  const sortedParams = Object.keys(notifyData)
    .sort()
    .map(k => `${k}=${notifyData[k]}`)
    .join('&');
  const signStr = `${sortedParams}${key}`;
  const sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex');

  notifyData.sign = sign;
  notifyData.sign_type = 'MD5';

  console.log(`\n📡 触发回调：${orderId}`);

  try {
    const response = await fetch('http://localhost:3000/api/payment/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(notifyData).toString(),
    });

    const result = await response.text();
    if (result === 'success') {
      console.log(`✅ 回调成功！订单 ${orderId} 已完成`);
      return true;
    } else {
      console.log(`❌ 回调失败：${result}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ 回调错误：${err.message}`);
    return false;
  }
}

// 检查待处理订单
async function checkPendingOrders() {
  try {
    const result = await pool.query(
      `SELECT order_id, plan_name FROM orders
       WHERE status = 'pending' AND plan_name LIKE 'ChatGPT Go%'
       ORDER BY created_at DESC
       LIMIT 5`
    );

    if (result.rows.length > 0) {
      console.log(`\n🔍 发现 ${result.rows.length} 个待处理的 Go 订单`);

      for (const order of result.rows) {
        await triggerCallback(order.order_id);
        // 等待一下，避免并发
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (err) {
    console.error('❌ 查询失败：', err.message);
  }
}

// 主循环
async function main() {
  console.log('🚀 自动回调脚本启动');
  console.log('📝 每 10 秒检查一次待处理订单');
  console.log('⚠️  这是临时方案，建议部署到 Vercel 永久解决\n');

  // 立即执行一次
  await checkPendingOrders();

  // 每 10 秒检查一次
  setInterval(async () => {
    await checkPendingOrders();
  }, 10000);
}

main();
