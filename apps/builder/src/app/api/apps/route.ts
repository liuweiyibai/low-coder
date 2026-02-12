import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppService } from '@/services/app.service';

/**
 * GET /api/apps - 获取应用列表
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant';
        const apps = await AppService.getApps(tenantId);

        return NextResponse.json(apps);
    } catch (error) {
        console.error('Failed to get apps:', error);
        return NextResponse.json(
            { error: 'Failed to get apps' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/apps - 创建应用
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant';
        const userId = (session.user as any).id;

        const body = await request.json();

        const app = await AppService.createApp({
            tenantId,
            name: body.name,
            slug: body.slug,
            description: body.description,
            icon: body.icon,
            type: body.type,
            createdBy: userId,
        });

        return NextResponse.json(app, { status: 201 });
    } catch (error) {
        console.error('Failed to create app:', error);
        return NextResponse.json(
            { error: 'Failed to create app' },
            { status: 500 }
        );
    }
}
