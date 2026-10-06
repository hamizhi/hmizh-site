const crypto = require('crypto');

// 幸运木回调参数
const notifyData = {
  pid: '10951',
  out_trade_no: 'GETGPT1791275280824557F0565', // 最新订单号
  money: '1.00', // 实际支付金额
  trade_no: 'XYM' + Date.now(), // 幸运木订单号
  trade_status: 'TRADE_SUCCESS', // 支付成功
};

// 生成签名（按照幸运木的签名规则）
const key = 'ctiJSLIZmAcCegg5LhGj'; // 你的密钥

// 1. 过滤并排序参数
const sortedParams = Object.keys(notifyData)
  .sort()
  .map(k => `${k}=${notifyData[k]}`)
  .join('&');

// 2. 拼接密钥（直接拼接，不是 &key=）
const signStr = `${sortedParams}${key}`;
console.log('🔐 签名字符串：', signStr);

// 3. MD5 加密
const sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex');

notifyData.sign = sign;
notifyData.sign_type = 'MD5';

console.log('\n📦 回调参数：');
console.log(JSON.stringify(notifyData, null, 2));
console.log('\n📡 发送回调请求...\n');

// 发送回调请求
fetch('http://localhost:3000/api/payment/notify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams(notifyData).toString(),
})
  .then(res => res.text())
  .then(data => {
    console.log('✅ 回调响应：', data);
    if (data === 'success') {
      console.log('\n🎉 支付成功！现在访问这个链接查看卡密：');
      console.log(`http://localhost:3000/pay?order_id=${notifyData.out_trade_no}`);
    } else {
      console.log('\n❌ 回调失败，请检查签名是否正确');
    }
  })
  .catch(err => {
    console.error('❌ 回调失败：', err.message);
  });
