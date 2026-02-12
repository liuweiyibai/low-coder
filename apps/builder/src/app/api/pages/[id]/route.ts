import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PageService } from '@/services/page.service';

/**
 * GET /api/pages/[id] - 获取页面详情
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant';
        const page = await PageService.getPageById(params.id, tenantId);

        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        return NextResponse.json(page);
    } catch (error) {
        console.error('Failed to get page:', error);
        return NextResponse.json(
            { error: 'Failed to get page' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/pages/[id] - 更新页面
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant';
        const body = await request.json();

        const page = await PageService.updatePage(params.id, tenantId, body);

        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        return NextResponse.json(page);
    } catch (error) {
        console.error('Failed to update page:', error);
        return NextResponse.json(
            { error: 'Failed to update page' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/pages/[id] - 删除页面
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant';
        await PageService.deletePage(params.id, tenantId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete page:', error);
        return NextResponse.json(
            { error: 'Failed to delete page' },
            { status: 500 }
        );
    }
}
