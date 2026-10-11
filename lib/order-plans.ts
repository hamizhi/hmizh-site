export const ORDER_PLANS = {
  go: { title: "ChatGPT Go / 月", price: 50 },
  plus: { title: "ChatGPT Plus 一键升级 / 月", price: 149 },
  "pro-5x": { title: "ChatGPT Pro 充值 (5x / 20x)", price: 720 },
  "pro-10x": { title: "ChatGPT Pro 充值 (10x / 20x)", price: 1350 },
  "pro-25x": { title: "ChatGPT Pro 充值 (25x / 20x)", price: 3500 },
  pro: { title: "ChatGPT Pro 充值 (5x / 20x)", price: 720 },
  account: { title: "ChatGPT Plus 成品号", price: 159 },
} as const;

export type OrderPlanId = keyof typeof ORDER_PLANS;
