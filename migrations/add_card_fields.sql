-- 添加导入来源字段
ALTER TABLE cards ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'manual' CHECK (import_source IN ('manual', 'auto'));

-- 添加兑换状态字段
ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_redeemed INTEGER DEFAULT 0 CHECK (is_redeemed IN (0, 1));

-- 为现有数据设置默认值
UPDATE cards SET import_source = 'manual' WHERE import_source IS NULL;
UPDATE cards SET is_redeemed = 0 WHERE is_redeemed IS NULL;

-- 添加注释
COMMENT ON COLUMN cards.import_source IS '导入来源: manual=手动导入, auto=自动导入(在线发放CDK后导入)';
COMMENT ON COLUMN cards.is_redeemed IS '兑换状态: 0=未兑换, 1=已兑换';
