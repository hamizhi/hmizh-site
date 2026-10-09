-- 添加导入来源字段
ALTER TABLE card_keys ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'manual';

-- 添加兑换状态字段
ALTER TABLE card_keys ADD COLUMN IF NOT EXISTS is_redeemed INTEGER DEFAULT 0;

-- 为现有数据设置默认值
UPDATE card_keys SET import_source = 'manual' WHERE import_source IS NULL;
UPDATE card_keys SET is_redeemed = 0 WHERE is_redeemed IS NULL;

-- 添加检查约束
ALTER TABLE card_keys ADD CONSTRAINT card_keys_import_source_check CHECK (import_source IN ('manual', 'auto'));
ALTER TABLE card_keys ADD CONSTRAINT card_keys_is_redeemed_check CHECK (is_redeemed IN (0, 1));
