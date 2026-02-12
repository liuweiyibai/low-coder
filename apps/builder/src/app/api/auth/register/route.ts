import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getDb } from '@/lib/db';
import { users } from '@low-coder/database/schemas';

/**
 * POST /api/auth/register - 用户注册（已禁用）
 */
export async function POST(request: NextRequest) {
    // 注册功能已禁用
    return NextResponse.json(
        { error: '注册功能已禁用，请使用默认账号登录（admin/admin）' },
        { status: 403 }
    );
}
