import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { getDb } from './db';
import { users } from '@low-coder/database/schemas';
import { eq, or } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const db = getDb();

                    // 从数据库查找用户（支持邮箱或用户名登录）
                    const [user] = await db
                        .select()
                        .from(users)
                        .where(
                            or(
                                eq(users.email, credentials.email),
                                eq(users.username, credentials.email)
                            )
                        )
                        .limit(1);

                    if (!user) {
                        console.log('用户不存在');
                        return null;
                    }

                    // 检查用户状态
                    if (user.status !== 'active') {
                        console.log('用户账号未激活');
                        return null;
                    }

                    // 验证密码
                    if (!user.passwordHash) {
                        console.log('用户未设置密码');
                        return null;
                    }

                    const isPasswordValid = await compare(
                        credentials.password,
                        user.passwordHash
                    );

                    if (!isPasswordValid) {
                        console.log('密码错误');
                        return null;
                    }

                    // 认证成功，返回用户信息
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.displayName || user.username || '用户',
                    };
                } catch (error) {
                    console.error('认证失败:', error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
