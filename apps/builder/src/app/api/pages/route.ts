import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PageService } from '@/services/page.service';

/**
 * GET /api/pages - 获取页面列表
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // TODO: 从session或header获取当前租户ID
        const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant';
        const appId = request.nextUrl.searchParams.get('appId');

        const pages = await PageService.getPages(
            tenantId,
            appId || undefined
        );

        return NextResponse.json(pages);
    } catch (error) {
        console.error('Failed to get pages:', error);
        return NextResponse.json(
            { error: 'Failed to get pages' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/pages - 创建页面
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

        const page = await PageService.createPage({
            tenantId,
            appId: body.appId,
            name: body.name,
            path: body.path,
            title: body.title,
            description: body.description,
            schema: body.schema,
            createdBy: userId,
        });

        return NextResponse.json(page, { status: 201 });
    } catch (error) {
        console.error('Failed to create page:', error);
        return NextResponse.json(
            { error: 'Failed to create page' },
            { status: 500 }
        );
    }
}
