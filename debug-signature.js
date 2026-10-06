const crypto = require('crypto');

// 模拟回调参数
const params = {
  pid: '10951',
  out_trade_no: 'GETGPT179127471990672F2FE1',
  money: '1.00',
  trade_no: 'XYM1791274889114',
  trade_status: 'TRADE_SUCCESS',
  sign: 'c162a3dd3809ed6be832390269ff4bc8',
  sign_type: 'MD5'
};

const key = 'ctiJSLIZmAcCegg5LhGj';

// 按照代码中的签名逻辑
function signLuckywoodParams(params, key) {
  const content = Object.entries(params)
    .filter(
      ([name, value]) =>
        value !== undefined &&
        value !== null &&
        String(value) !== "" &&
        name !== "sign" &&
        name !== "sign_type",
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${String(value)}`)
    .join("&");

  console.log('🔍 过滤后的参数字符串：', content);
  const signStr = `${content}${key}`;
  console.log('🔐 签名字符串：', signStr);

  const hash = crypto.createHash("md5")
    .update(signStr, "utf8")
    .digest("hex");

  console.log('✅ 计算出的签名：', hash);
  console.log('📦 收到的签名：', params.sign);
  console.log('🔍 签名匹配：', hash === params.sign.toLowerCase());

  return hash;
}

signLuckywoodParams(params, key);
