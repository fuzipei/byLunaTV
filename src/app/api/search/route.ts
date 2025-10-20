/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getAvailableApiSites, getCacheTime, getConfig } from '@/lib/config';
import { searchFromApi } from '@/lib/downstream';
import { yellowWords } from '@/lib/yellow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    console.log('搜索接口: 用户未认证');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  console.log('搜索接口: 用户', authInfo.username, '搜索关键词', query);

  if (!query) {
    const cacheTime = await getCacheTime();
    console.log('搜索接口: 搜索关键词为空');
    return NextResponse.json(
      { results: [] },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Netlify-Vary': 'query',
        },
      }
    );
  }

  const config = await getConfig();
  const apiSites = await getAvailableApiSites(authInfo.username);

  console.log('搜索接口: 可用 API 站点数量', apiSites.length);
  console.log('搜索接口: API 站点列表', apiSites.map(s => ({ key: s.key, name: s.name, api: s.api })));

  // 添加超时控制和错误处理，避免慢接口拖累整体响应
  const searchPromises = apiSites.map((site) =>
    Promise.race([
      searchFromApi(site, query),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${site.name} timeout`)), 20000)
      ),
    ]).catch((err) => {
      console.warn(`搜索失败 ${site.name}:`, err.message);
      return []; // 返回空数组而不是抛出错误
    })
  );

  try {
    const results = await Promise.allSettled(searchPromises);
    console.log('搜索接口: 所有搜索任务完成', results.length);

    const successResults = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<any>).value);

    console.log('搜索接口: 成功的搜索任务数量', successResults.length);
    console.log('搜索接口: 各站点搜索结果数量', successResults.map((results, index) => ({
      site: apiSites[index]?.name || 'unknown',
      count: results.length
    })));

    let flattenedResults = successResults.flat();
    console.log('搜索接口: 合并后结果数量', flattenedResults.length);

    if (!config.SiteConfig.DisableYellowFilter) {
      const beforeFilter = flattenedResults.length;
      flattenedResults = flattenedResults.filter((result) => {
        const typeName = result.type_name || '';
        return !yellowWords.some((word: string) => typeName.includes(word));
      });
      console.log('搜索接口: 黄词过滤后结果数量', flattenedResults.length, '(过滤前:', beforeFilter, ')');
    }

    const cacheTime = await getCacheTime();

    if (flattenedResults.length === 0) {
      console.log('搜索接口: 最终结果为空');
      // no cache if empty
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    console.log('搜索接口: 返回结果数量', flattenedResults.length);
    return NextResponse.json(
      { results: flattenedResults },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Netlify-Vary': 'query',
        },
      }
    );
  } catch (error) {
    console.error('搜索接口: 搜索过程出错', error);
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}
