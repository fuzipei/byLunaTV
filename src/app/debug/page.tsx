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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/debug/search')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setDebugInfo(data);
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
