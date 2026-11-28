/**
 * @file src/modules/analytics/components/AnalyticsDashboardPanel.tsx
 * @purpose Rich Live Analytics Charts & Performance Breakdown: renders SVG Daily Revenue/Orders bar chart, Conversion Funnel ratios, Top Products, Top Zones, Payment Share, and UTM Attribution directly from Supabase data.
 */

"use client";

import { formatEgp } from "@shared/types/common";
import { BarChart3, CreditCard, MapPin, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";
import type { AnalyticsRegistry } from "../schema";

interface AnalyticsOrderInput {
  id: string;
  shippingZoneId: string;
  city: string;
  status: string;
  paymentMethod: string;
  discountAmount: number;
  total: number;
  createdAt: string;
}

interface AnalyticsOrderItemInput {
  orderId: string;
  titleSnapshot: string;
  quantity: number;
  lineTotal: number;
}

interface AnalyticsZoneInput {
  id: string;
  name: string;
}

interface AnalyticsDashboardPanelProps {
  lang: "ar" | "en";
  orders: AnalyticsOrderInput[];
  orderItems: AnalyticsOrderItemInput[];
  zones: AnalyticsZoneInput[];
  analyticsRegistry: AnalyticsRegistry;
}

export function AnalyticsDashboardPanel({
  lang,
  orders,
  orderItems,
  zones,
  analyticsRegistry,
}: AnalyticsDashboardPanelProps) {
  const validOrders = useMemo(
    () => orders.filter((o) => o.status !== "CANCELLED"),
    [orders]
  );

  // 1. 7-Day Daily Revenue & Orders Series (SVG Chart)
  const dailySeries = useMemo(() => {
    const days: Array<{ key: string; label: string; revenue: number; count: number }> = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push({
        key,
        label: key.slice(5),
        revenue: 0,
        count: 0,
      });
    }
    for (const o of validOrders) {
      const dayKey = o.createdAt.slice(0, 10);
      const slot = days.find((d) => d.key === dayKey);
      if (slot) {
        slot.revenue += o.total;
        slot.count += 1;
      }
    }
    return days;
  }, [validOrders]);

  const maxDailyRev = useMemo(
    () => Math.max(100, ...dailySeries.map((d) => d.revenue)),
    [dailySeries]
  );

  const avgOrderValue = useMemo(() => {
    if (validOrders.length === 0) return 0;
    const sum = validOrders.reduce((s, o) => s + o.total, 0);
    return Math.round(sum / validOrders.length);
  }, [validOrders]);

  // 2. Top Products by Order Items Revenue
  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; qty: number; revenue: number }>();
    for (const it of orderItems) {
      const cur = map.get(it.titleSnapshot) ?? {
        title: it.titleSnapshot,
        qty: 0,
        revenue: 0,
      };
      cur.qty += it.quantity;
      cur.revenue += it.lineTotal;
      map.set(it.titleSnapshot, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orderItems]);

  // 3. Payment Method Breakdown
  const paymentMix = useMemo(() => {
    const map = new Map<string, { method: string; count: number; total: number }>();
    for (const o of validOrders) {
      const cur = map.get(o.paymentMethod) ?? {
        method: o.paymentMethod,
        count: 0,
        total: 0,
      };
      cur.count += 1;
      cur.total += o.total;
      map.set(o.paymentMethod, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [validOrders]);

  // 4. Top Shipping Zones
  const topZones = useMemo(() => {
    const map = new Map<string, { name: string; count: number; total: number }>();
    for (const o of validOrders) {
      const zoneName =
        zones.find((z) => z.id === o.shippingZoneId)?.name ?? o.city;
      const cur = map.get(zoneName) ?? { name: zoneName, count: 0, total: 0 };
      cur.count += 1;
      cur.total += o.total;
      map.set(zoneName, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [validOrders, zones]);

  // 5. UTM Sources
  const utmBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of analyticsRegistry.events) {
      const src = ev.utmSource?.trim() || "Direct / Organic";
      map.set(src, (map.get(src) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [analyticsRegistry.events]);

  return (
    <div className="space-y-6">
      {/* KPI Performance Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-400/25 bg-[#0b0815] p-4">
          <p className="text-[11px] text-white/60">
            {lang === "ar" ? "متوسط قيمة الطلب (AOV)" : "Average Order Value"}
          </p>
          <p className="mt-1.5 font-serif text-2xl font-bold text-emerald-300">
            {formatEgp(avgOrderValue)}
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-400/25 bg-[#0b0815] p-4">
          <p className="text-[11px] text-white/60">
            {lang === "ar" ? "هدف المبيعات اليومي" : "Daily Revenue Goal"}
          </p>
          <p className="mt-1.5 font-serif text-2xl font-bold text-cyan-300">
            {formatEgp(analyticsRegistry.config.dailyRevenueGoal)}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-400/25 bg-[#0b0815] p-4">
          <p className="text-[11px] text-white/60">
            {lang === "ar" ? "الطلبات المؤهلة للإحصاء" : "Active Orders"}
          </p>
          <p className="mt-1.5 font-serif text-2xl font-bold text-amber-300">
            {validOrders.length}
          </p>
        </div>
        <div className="rounded-2xl border border-fuchsia-400/25 bg-[#0b0815] p-4">
          <p className="text-[11px] text-white/60">
            {lang === "ar" ? "الأحداث المسجلة" : "Tracked Events"}
          </p>
          <p className="mt-1.5 font-serif text-2xl font-bold text-fuchsia-300">
            {analyticsRegistry.events.length}
          </p>
        </div>
      </div>

      {/* 7-Day Revenue SVG Bar Chart */}
      <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-300" />
            <h3 className="font-serif text-base font-semibold">
              {lang === "ar"
                ? "مبيعات آخر 7 أيام (رسم بياني حي)"
                : "Last 7 Days Revenue Chart"}
            </h3>
          </div>
          <span className="text-[11px] text-white/50">EGP / Day</span>
        </div>

        <div className="grid grid-cols-7 items-end gap-2 pt-4" style={{ height: 180 }}>
          {dailySeries.map((day) => {
            const pct = Math.max(6, Math.round((day.revenue / maxDailyRev) * 100));
            return (
              <div
                key={day.key}
                className="flex h-full flex-col items-center justify-end gap-1.5"
              >
                <span className="font-mono text-[10px] text-emerald-300">
                  {day.revenue > 0 ? Math.round(day.revenue) : ""}
                </span>
                <div className="flex w-full flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-[38px] rounded-t-xl bg-gradient-to-t from-cyan-500/70 to-emerald-400 transition-all"
                    style={{ height: `${pct}%` }}
                    title={`${day.key}: ${formatEgp(day.revenue)} (${day.count} orders)`}
                  />
                </div>
                <span className="font-mono text-[10px] text-white/55">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products + Top Zones + Payment Mix + UTM */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0b0815] p-5 text-xs">
          <h3 className="flex items-center gap-2 font-serif text-base font-semibold">
            <BarChart3 className="h-4 w-4 text-indigo-300" />
            <span>{lang === "ar" ? "الأكثر مبيعاً (من order_items)" : "Top Selling Products"}</span>
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-white/45">No sales items recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p) => (
                <div
                  key={p.title}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5"
                >
                  <span className="font-semibold text-white">{p.title}</span>
                  <span className="font-mono text-emerald-300">
                    {p.qty}× • {formatEgp(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2.5 rounded-2xl border border-white/10 bg-[#0b0815] p-5 text-xs">
            <h3 className="flex items-center gap-2 font-serif text-base font-semibold">
              <MapPin className="h-4 w-4 text-cyan-300" />
              <span>{lang === "ar" ? "أكثر مناطق التوصيل طلباً" : "Top Cairo Zones"}</span>
            </h3>
            {topZones.length === 0 ? (
              <p className="text-white/45">No zone orders yet.</p>
            ) : (
              topZones.map((z) => (
                <div
                  key={z.name}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2"
                >
                  <span className="truncate">{z.name}</span>
                  <span className="font-mono text-cyan-300">
                    {z.count} orders • {formatEgp(z.total)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-2xl border border-white/10 bg-[#0b0815] p-4 text-xs">
              <p className="flex items-center gap-1.5 font-bold text-white/85">
                <CreditCard className="h-3.5 w-3.5 text-amber-300" />
                <span>{lang === "ar" ? "توزيع طرق الدفع" : "Payment Mix"}</span>
              </p>
              {paymentMix.map((pm) => (
                <div key={pm.method} className="flex justify-between text-white/70">
                  <span>{pm.method}</span>
                  <span className="font-mono font-bold text-white">{pm.count}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-[#0b0815] p-4 text-xs">
              <p className="flex items-center gap-1.5 font-bold text-white/85">
                <Users className="h-3.5 w-3.5 text-pink-300" />
                <span>{lang === "ar" ? "مصادر الزيارات (UTM)" : "Traffic Sources"}</span>
              </p>
              {utmBreakdown.map((u) => (
                <div key={u.source} className="flex justify-between text-white/70">
                  <span className="truncate">{u.source}</span>
                  <span className="font-mono font-bold text-white">{u.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
