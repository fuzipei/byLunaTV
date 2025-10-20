/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
    const hasPassword = !!process.env.PASSWORD;
    const hasUsername = !!process.env.USERNAME;

    // 获取所有 cookies
    const allCookies = request.cookies.getAll();

    const debugInfo = {
      environment: {
        storageType,
        hasPassword,
        hasUsername,
        passwordLength: process.env.PASSWORD?.length || 0,
        username: process.env.USERNAME || 'not set'
      },
      cookies: {
        total: allCookies.length,
        authCookie: allCookies.find(c => c.name === 'auth'),
        allCookies: allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' }))
      },
      authInfo: authInfo ? {
        hasUsername: !!authInfo.username,
        hasPassword: !!authInfo.password,
        hasSignature: !!authInfo.signature,
        hasTimestamp: !!authInfo.timestamp,
        username: authInfo.username,
        passwordLength: authInfo.password?.length || 0,
        signatureLength: authInfo.signature?.length || 0,
        timestamp: authInfo.timestamp
      } : null,
      rawAuthCookie: request.cookies.get('auth')?.value || null
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('认证调试接口错误:', error);
    return NextResponse.json({
      error: '认证调试接口错误',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
