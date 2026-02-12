-- 更新 admin 用户的密码哈希
-- 默认密码: admin
-- 注意：如果数据库中已有 admin 用户但密码为空，此脚本会更新它

UPDATE users 
SET 
    password_hash = '$2a$10$0N0avZgQmTAxDgaXp.rvYeUcAV.j94lsGxI99LM/1wOokMoJS/qdm',
    updated_at = NOW()
WHERE username = 'admin' AND password_hash IS NULL;

-- 显示结果
SELECT 
    id, 
    username, 
    email, 
    CASE 
        WHEN password_hash IS NULL THEN '未设置密码'
        ELSE '已设置密码'
    END as password_status,
    status,
    email_verified
FROM users 
WHERE username = 'admin';
