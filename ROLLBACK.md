# 网站回退说明

服务器项目目录：

```bash
/home/yzlsdysy/hmizh
```

## 网站打不开时

先连接服务器：

```bash
gcloud compute ssh yzlsdysy@instance-20260710-070909 --zone=us-west1-b
```

进入项目目录并执行自动回退：

```bash
cd /home/yzlsdysy/hmizh
bash scripts/rollback-server.sh
```

脚本会自动完成：

1. 选择最近一次发布前保存的正常版本
2. 恢复 `.next-build`
3. 重启 PM2 的 `hmizh` 服务
4. 检查 `http://127.0.0.1:3000/` 是否恢复

## 查看可回退版本

```bash
cd /home/yzlsdysy/hmizh
bash scripts/rollback-server.sh --list
```

回退到指定版本：

```bash
bash scripts/rollback-server.sh 20261009192701
```

## 注意

代码回退不会撤销已经执行的 Supabase 数据库迁移。涉及数据库结构的改动，需要先确认对应的数据库回退方案，再恢复网站代码。
