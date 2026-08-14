'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe2,
  Smartphone,
  Laptop,
  Download,
  Star,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Activity,
  ChevronDown,
  Trash2,
  Database,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useToast } from '@/components/Toast';

interface AdminAnalyticsProps {
  passcode: string;
}

export function AdminAnalytics({ passcode }: AdminAnalyticsProps) {
  const { showToast } = useToast();
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [selectedAppSlug, setSelectedAppSlug] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statsData, setStatsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'app_locations' | 'activities'>('overview');
  const [appSearch, setAppSearch] = useState<string>('');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [activitySearch, setActivitySearch] = useState<string>('');

  const fetchStats = useCallback(async (range = timeRange, appSlug = selectedAppSlug) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics/stats?range=${range}&appSlug=${appSlug}`, {
        headers: {
          'x-admin-key': passcode,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      } else {
        showToast('Failed to load analytics data', 'error');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      showToast('Error connecting to analytics engine', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [passcode, timeRange, selectedAppSlug, showToast]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/analytics/stats?range=${timeRange}&appSlug=${selectedAppSlug}`, {
          headers: {
            'x-admin-key': passcode,
          },
        });
        if (res.ok && !ignore) {
          const data = await res.json();
          setStatsData(data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [timeRange, selectedAppSlug, passcode]);

  const handleAction = async (action: 'seed' | 'clear') => {
    try {
      const res = await fetch('/api/analytics/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': passcode,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Action executed successfully', 'success');
        fetchStats(timeRange);
      } else {
        showToast(data.error || 'Action failed', 'error');
      }
    } catch {
      showToast('Error performing analytics action', 'error');
    }
  };

  const kpis = statsData?.kpis || {
    totalPageViews: 0,
    uniqueVisitors: 0,
    totalSessions: 0,
    completedTasks: 0,
    taskCompletionRate: 0,
    earlyExits: 0,
    bounceRate: 0,
    activeRightNow: 0,
    avgDurationFormatted: '0m 0s',
  };

  const recentActivities = (statsData?.recentActivity || []).filter((item: any) => {
    if (activityFilter === 'completed_only' && !item.isTaskCompleted) return false;
    if (activityFilter === 'downloads' && item.eventType !== 'app_download') return false;
    if (activityFilter === 'reviews' && item.eventType !== 'review_submit') return false;
    if (activityFilter === 'early_exits' && item.eventType !== 'early_exit') return false;
    if (activityFilter === 'page_views' && item.eventType !== 'page_view') return false;

    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();
      const matchDetails = item.details?.toLowerCase().includes(q);
      const matchCountry = item.country?.toLowerCase().includes(q);
      const matchCity = item.city?.toLowerCase().includes(q);
      const matchApp = item.appName?.toLowerCase().includes(q);
      const matchPath = item.path?.toLowerCase().includes(q);
      return matchDetails || matchCountry || matchCity || matchApp || matchPath;
    }
    return true;
  });

  const COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Visitor Traffic & Location Intelligence
                </h2>
                {kpis.activeRightNow > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {kpis.activeRightNow} Live Now
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Track visitor count, origin countries & cities per app, visiting hours, and task completions.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: App Filter, Time Range & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* App Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-bold">
            <Smartphone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <select
              value={selectedAppSlug}
              onChange={(e) => {
                setSelectedAppSlug(e.target.value);
              }}
              className="bg-transparent text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
            >
              <option value="all">All Apps (Storewide)</option>
              {statsData?.availableApps?.map((app: any) => (
                <option key={app.slug} value={app.slug}>
                  {app.name} ({app.totalEvents} events)
                </option>
              ))}
            </select>
            {selectedAppSlug !== 'all' && (
              <button
                onClick={() => setSelectedAppSlug('all')}
                className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 font-black hover:bg-purple-300"
                title="Reset to All Apps"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-bold">
            {(['today', '7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                }}
                className={`px-3 py-1 rounded-xl transition-all ${
                  timeRange === range
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {range === 'today' ? 'Today' : range === '7d' ? '7D' : range === '30d' ? '30D' : 'All'}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchStats(timeRange, selectedAppSlug)}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-100 dark:hover:bg-purple-950/60 text-zinc-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 border border-zinc-200/80 dark:border-zinc-700/60 transition-all"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          {/* Generate Traffic Data */}
          <button
            onClick={() => handleAction('seed')}
            className="px-3.5 py-2 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40 text-xs font-bold hover:bg-purple-100 transition-colors flex items-center gap-1.5"
            title="Seed realistic sample visitors & activity stream"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Traffic Data</span>
          </button>
        </div>
      </div>

      {/* Main View Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Overview & Traffic Trends
        </button>

        <button
          onClick={() => setActiveTab('app_locations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'app_locations'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          App Visitor Locations & Origins
          {statsData?.appLocations?.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-black">
              {statsData.appLocations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'activities'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          Live User Activity Log
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-black">
            {recentActivities.length}
          </span>
        </button>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Visits */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Views</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 min-h-[32px] flex items-center">
              {isLoading ? (
                <div className="w-16 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              ) : (
                kpis.totalPageViews.toLocaleString()
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Active
              </span>
              <span>across all pages</span>
            </p>
          </div>
        </div>

        {/* Card 2: Unique Visitors */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Unique Visitors</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 min-h-[32px] flex items-center">
              {isLoading ? (
                <div className="w-16 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              ) : (
                kpis.uniqueVisitors.toLocaleString()
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span>{kpis.totalSessions} total sessions</span>
            </p>
          </div>
        </div>

        {/* Card 3: Completed Tasks */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Completed Tasks</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 min-h-[32px] flex items-center">
              {isLoading ? (
                <div className="w-16 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 animate-pulse" />
              ) : (
                kpis.completedTasks.toLocaleString()
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{kpis.taskCompletionRate}%</span>
              <span>completion rate</span>
            </p>
          </div>
        </div>

        {/* Card 4: Early Exit / Bounces */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Early Exits</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 min-h-[32px] flex items-center">
              {isLoading ? (
                <div className="w-16 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              ) : (
                kpis.earlyExits.toLocaleString()
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span className="font-bold text-rose-500">{kpis.bounceRate}%</span>
              <span>exit without action</span>
            </p>
          </div>
        </div>

        {/* Card 5: Avg Duration */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Avg Session Time</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 min-h-[32px] flex items-center">
              {isLoading ? (
                <div className="w-20 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              ) : (
                kpis.avgDurationFormatted
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Time spent exploring apps
            </p>
          </div>
        </div>

        {/* Card 6: Countries Reached */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Locations</span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 min-h-[32px] flex items-center">
              {isLoading ? (
                <div className="w-12 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              ) : (
                statsData?.locations?.countries?.length || 1
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Countries & regions visited
            </p>
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & TRAFFIC TRENDS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Main Analytical Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Traffic & Activity Trend Timeline (Spans 2 columns) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Traffic & Task Completion Timeline
                    {selectedAppSlug !== 'all' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-200 dark:border-purple-800/40">
                        {selectedAppSlug}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Daily visitor trends, total page views, and completed goals (downloads & reviews)
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                    <span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span> Page Views
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-500">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Unique Visitors
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-500">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Completed Tasks
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                {statsData?.timeline?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '16px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#9333ea" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
                      <Area type="monotone" dataKey="uniqueVisitors" name="Unique Visitors" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
                      <Area type="monotone" dataKey="completedTasks" name="Completed Tasks" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTasks)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-xs">
                    No timeline data recorded yet
                  </div>
                )}
              </div>
            </div>

            {/* Visitor Locations by Country */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Globe2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    Visitor Locations
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Top countries & regions visiting your store</p>
                </div>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {statsData?.locations?.countries?.length > 0 ? (
                  statsData.locations.countries.map((c: any, idx: number) => (
                    <div key={c.code || idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                          <span className="text-base">{c.flag || '🌐'}</span>
                          <span className="truncate max-w-[140px]">{c.country}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-zinc-900 dark:text-zinc-100">{c.count} visits</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">
                            {c.percentage}%
                          </span>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                          style={{ width: `${Math.max(c.percentage, 5)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    No location data yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hourly Visiting Times & Conversion Funnel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visiting Hours (00:00 to 23:00) */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Visiting Time Distribution
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Which hours of the day users visit</p>
                </div>
              </div>

              <div className="h-60 w-full pt-2">
                {statsData?.hourly?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.hourly} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} interval={3} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="visits" name="Visits" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>

            {/* Task Completion & User Conversion Funnel */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-500" />
                    Task Completion Funnel
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Progression from landing to completed goal</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-2">
                {statsData?.funnel?.map((step: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        {step.step}
                      </span>
                      <span className="font-black text-zinc-900 dark:text-zinc-100">
                        {step.count} ({step.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(step.percentage, 8)}%`,
                          backgroundColor: step.color || '#9333ea',
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Apps Explored & Downloaded */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Top Performing Apps
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Apps with the highest views and downloads</p>
                </div>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {statsData?.topApps?.length > 0 ? (
                  statsData.topApps.map((app: any, idx: number) => (
                    <div
                      key={app.slug || idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate max-w-[150px]">
                          {app.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-2">
                          <span>{app.views} views</span>
                          <span>•</span>
                          <span>{app.reviews} reviews</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedAppSlug(app.slug);
                            setActiveTab('app_locations');
                          }}
                          className="px-2 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-[10px] font-bold hover:bg-purple-100"
                        >
                          Origins →
                        </button>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[10px] font-bold">
                          <Download className="w-3 h-3" />
                          <span>{app.downloads} APKs</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    No app activity logged yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APP VISITOR LOCATIONS & ORIGINS INTELLIGENCE */}
      {activeTab === 'app_locations' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                <Globe2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                App Visitor Origins & Location Intelligence
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                See exactly which countries and cities are visiting each app, APK download conversion per region, and active hours.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search app or country..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-600 w-56 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* App Location Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(statsData?.appLocations || [])
              .filter((app: any) => {
                if (!appSearch.trim()) return true;
                const q = appSearch.toLowerCase();
                const matchName = app.name?.toLowerCase().includes(q);
                const matchSlug = app.slug?.toLowerCase().includes(q);
                const matchCountry = app.countries?.some((c: any) => c.country?.toLowerCase().includes(q));
                const matchCity = app.cities?.some((c: any) => c.city?.toLowerCase().includes(q));
                return matchName || matchSlug || matchCountry || matchCity;
              })
              .map((app: any) => (
                <div
                  key={app.slug}
                  className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:border-purple-500/60 transition-all space-y-5"
                >
                  {/* Card Top: App Header & Key Counters */}
                  <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                            {app.name}
                          </h4>
                          <span className="text-[11px] font-mono text-zinc-400">
                            /apps/{app.slug}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedAppSlug(app.slug);
                          showToast(`Filtered analytics to ${app.name}`, 'info');
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          selectedAppSlug === app.slug
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {selectedAppSlug === app.slug ? '✓ Focused' : 'Focus App'}
                      </button>
                      <span className="text-[10px] text-zinc-400">
                        Active {app.lastActiveAgo}
                      </span>
                    </div>
                  </div>

                  {/* App Stats Counters */}
                  <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block">Visits</span>
                      <span className="font-black text-zinc-900 dark:text-zinc-100 text-sm">
                        {app.totalVisits}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block">Visitors</span>
                      <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                        {app.uniqueVisitors}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block">APKs</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {app.downloads}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block">Conv Rate</span>
                      <span className="font-black text-purple-600 dark:text-purple-400 text-sm">
                        {app.conversionRate}%
                      </span>
                    </div>
                  </div>

                  {/* Countries Visiting this App */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <Globe2 className="w-3.5 h-3.5 text-purple-500" />
                        Top Visitor Countries
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {app.countries?.length || 0} regions
                      </span>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {app.countries?.map((c: any, cIdx: number) => (
                        <div key={c.code || cIdx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                              <span className="text-base">{c.flag || '🌐'}</span>
                              <span className="font-bold">{c.country}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                                {c.visits} visits
                              </span>
                              {c.downloads > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold">
                                  {c.downloads} dl
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {c.percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-purple-500"
                              style={{ width: `${Math.max(c.percentage, 6)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Cities for this App */}
                  {app.cities?.length > 0 && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-500 block mb-2">
                        Top Origin Cities:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {app.cities.map((city: any, ctIdx: number) => (
                          <span
                            key={ctIdx}
                            className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold flex items-center gap-1.5"
                          >
                            <span>{city.flag || '📍'}</span>
                            <span>{city.city}</span>
                            <span className="text-[10px] text-zinc-400 font-bold">
                              ({city.visits})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE USER ACTIVITY STREAM & AUDIT LOG */}
      {activeTab === 'activities' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Live User Activity Stream
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-200 dark:border-purple-800/40">
                  {recentActivities.length} Events
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Real-time audit log of every visitor action, app visited, location, and task completion status
              </p>
            </div>

            {/* Activity Filters and Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search activity, country, app..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-600 w-48 sm:w-56"
                />
              </div>

              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="all">All Activities</option>
                <option value="completed_only">Completed Goals Only</option>
                <option value="downloads">APK Downloads</option>
                <option value="reviews">Review Submissions</option>
                <option value="early_exits">Early Exits (Bounces)</option>
                <option value="page_views">Page Views</option>
              </select>
            </div>
          </div>

          {/* Activity Stream List */}
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {recentActivities.length > 0 ? (
              recentActivities.map((ev: any, idx: number) => {
                const isEarlyExit = ev.eventType === 'early_exit';

                return (
                  <div
                    key={ev.id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-purple-500/60 transition-all"
                  >
                    {/* Left: Location Flag + Activity Details */}
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5" title={ev.country}>
                        {ev.flag || '🌐'}
                      </span>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {ev.details}
                          </span>

                          {/* App Badge if available */}
                          {ev.appName && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-200 dark:border-purple-800/40 flex items-center gap-1">
                              <Smartphone className="w-2.5 h-2.5" />
                              {ev.appName}
                            </span>
                          )}

                          {/* Status Badge */}
                          {ev.isTaskCompleted ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Task Completed
                            </span>
                          ) : isEarlyExit ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-black border border-rose-200 dark:border-rose-800/40 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Early Exit
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-200 dark:border-blue-800/40">
                              Active Session
                            </span>
                          )}
                        </div>

                        {/* Subtitle with Location & Device */}
                        <div className="text-[11px] text-zinc-500 flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {ev.city ? `${ev.city}, ${ev.country}` : ev.country}
                          </span>
                          <span>•</span>
                          <span>{ev.device} ({ev.os} / {ev.browser})</span>
                          {ev.durationSeconds > 0 && (
                            <>
                              <span>•</span>
                              <span>{ev.durationSeconds}s spent</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="font-mono text-[10px] text-zinc-400">{ev.ip}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Timestamp */}
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                        {ev.relativeTime}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-zinc-400 text-xs">
                No matching activity events found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
