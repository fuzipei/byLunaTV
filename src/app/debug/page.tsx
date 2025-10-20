'use client';

import { useEffect, useState } from 'react';

interface DebugInfo {
  user: {
    username: string;
    isOwner: boolean;
    userConfig: any;
  };
  apiSites: {
    total: number;
    sites: Array<{
      key: string;
      name: string;
      api: string;
      detail?: string;
    }>;
  };
  config: {
    sourceConfig: {
      total: number;
      enabled: number;
      disabled: number;
      sources: Array<{
        key: string;
        name: string;
        api: string;
        disabled: boolean;
      }>;
    };
    siteConfig: {
      disableYellowFilter: boolean;
      searchDownstreamMaxPage: number;
      siteInterfaceCacheTime: number;
    };
  };
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/debug/search').then(res => res.json()),
      fetch('/api/debug/auth').then(res => res.json())
    ])
      .then(([searchData, authData]) => {
        if (searchData.error) {
          setError(searchData.error);
        } else {
          setDebugInfo(searchData);
        }
        if (authData.error) {
          console.error('认证调试错误:', authData.error);
        } else {
          setAuthInfo(authData);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">错误: {error}</div>;
  }

  if (!debugInfo) {
    return <div className="p-8">无调试信息</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">搜索调试信息</h1>

      <div className="space-y-6">
        {/* 认证调试信息 */}
        {authInfo && (
          <div className="bg-red-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-red-800">认证调试信息</h2>
            <div className="space-y-2">
              <div>
                <h3 className="font-semibold">环境变量</h3>
                <p>存储类型: {authInfo.environment?.storageType}</p>
                <p>有密码: {authInfo.environment?.hasPassword ? '是' : '否'}</p>
                <p>有用户名: {authInfo.environment?.hasUsername ? '是' : '否'}</p>
                <p>密码长度: {authInfo.environment?.passwordLength}</p>
                <p>用户名: {authInfo.environment?.username}</p>
              </div>
              <div>
                <h3 className="font-semibold">Cookie 信息</h3>
                <p>总 Cookie 数: {authInfo.cookies?.total}</p>
                <p>认证 Cookie: {authInfo.cookies?.authCookie ? '存在' : '不存在'}</p>
                {authInfo.cookies?.authCookie && (
                  <p>认证 Cookie 值: {authInfo.cookies.authCookie.value.substring(0, 100)}...</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold">解析的认证信息</h3>
                {authInfo.authInfo ? (
                  <div className="space-y-1">
                    <p>有用户名: {authInfo.authInfo.hasUsername ? '是' : '否'}</p>
                    <p>有密码: {authInfo.authInfo.hasPassword ? '是' : '否'}</p>
                    <p>有签名: {authInfo.authInfo.hasSignature ? '是' : '否'}</p>
                    <p>有时间戳: {authInfo.authInfo.hasTimestamp ? '是' : '否'}</p>
                    <p>用户名: {authInfo.authInfo.username || '无'}</p>
                    <p>密码长度: {authInfo.authInfo.passwordLength}</p>
                    <p>签名长度: {authInfo.authInfo.signatureLength}</p>
                    <p>时间戳: {authInfo.authInfo.timestamp || '无'}</p>
                  </div>
                ) : (
                  <p className="text-red-600">无法解析认证信息</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 用户信息 */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">用户信息</h2>
          <div className="space-y-1">
            <p><strong>用户名:</strong> {debugInfo.user.username}</p>
            <p><strong>是否站长:</strong> {debugInfo.user.isOwner ? '是' : '否'}</p>
            {debugInfo.user.userConfig && (
              <div className="ml-4">
                <p><strong>角色:</strong> {debugInfo.user.userConfig.role}</p>
                <p><strong>是否被封禁:</strong> {debugInfo.user.userConfig.banned ? '是' : '否'}</p>
                <p><strong>启用的API:</strong> {debugInfo.user.userConfig.enabledApis?.join(', ') || '无'}</p>
                <p><strong>标签:</strong> {debugInfo.user.userConfig.tags?.join(', ') || '无'}</p>
              </div>
            )}
          </div>
        </div>

        {/* API 站点信息 */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">可用 API 站点 ({debugInfo.apiSites.total})</h2>
          {debugInfo.apiSites.sites.length === 0 ? (
            <p className="text-red-500">没有可用的 API 站点！</p>
          ) : (
            <div className="space-y-2">
              {debugInfo.apiSites.sites.map((site, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <p><strong>名称:</strong> {site.name}</p>
                  <p><strong>键值:</strong> {site.key}</p>
                  <p><strong>API地址:</strong> {site.api}</p>
                  {site.detail && <p><strong>详情地址:</strong> {site.detail}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 配置信息 */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">配置信息</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">数据源配置</h3>
              <p>总数: {debugInfo.config.sourceConfig.total}</p>
              <p>启用: {debugInfo.config.sourceConfig.enabled}</p>
              <p>禁用: {debugInfo.config.sourceConfig.disabled}</p>
              <div className="mt-2">
                <h4 className="font-medium">所有数据源:</h4>
                <div className="space-y-1">
                  {debugInfo.config.sourceConfig.sources.map((source, index) => (
                    <div key={index} className={`p-2 rounded ${source.disabled ? 'bg-red-100' : 'bg-green-100'}`}>
                      <span className="font-mono">{source.key}</span> - {source.name}
                      {source.disabled && <span className="text-red-600 ml-2">(已禁用)</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold">站点配置</h3>
              <p>禁用黄词过滤: {debugInfo.config.siteConfig.disableYellowFilter ? '是' : '否'}</p>
              <p>搜索最大页数: {debugInfo.config.siteConfig.searchDownstreamMaxPage}</p>
              <p>缓存时间: {debugInfo.config.siteConfig.siteInterfaceCacheTime}秒</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
