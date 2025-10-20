/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getAvailableApiSites, getConfig } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getConfig();
    const apiSites = await getAvailableApiSites(authInfo.username);

    // 获取用户配置
    const userConfig = config.UserConfig.Users.find(u => u.username === authInfo.username);

    const debugInfo = {
      user: {
        username: authInfo.username,
        isOwner: authInfo.username === process.env.USERNAME,
        userConfig: userConfig ? {
          username: userConfig.username,
          role: userConfig.role,
          banned: userConfig.banned,
          enabledApis: userConfig.enabledApis,
          tags: userConfig.tags
        } : null
      },
      apiSites: {
        total: apiSites.length,
        sites: apiSites.map(site => ({
          key: site.key,
          name: site.name,
          api: site.api,
          detail: site.detail
        }))
      },
      config: {
        sourceConfig: {
          total: config.SourceConfig.length,
          enabled: config.SourceConfig.filter(s => !s.disabled).length,
          disabled: config.SourceConfig.filter(s => s.disabled).length,
          sources: config.SourceConfig.map(s => ({
            key: s.key,
            name: s.name,
            api: s.api,
            disabled: s.disabled
          }))
        },
        siteConfig: {
          disableYellowFilter: config.SiteConfig.DisableYellowFilter,
          searchDownstreamMaxPage: config.SiteConfig.SearchDownstreamMaxPage,
          siteInterfaceCacheTime: config.SiteConfig.SiteInterfaceCacheTime
        }
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('调试接口错误:', error);
    return NextResponse.json({ error: '调试接口错误' }, { status: 500 });
  }
}
