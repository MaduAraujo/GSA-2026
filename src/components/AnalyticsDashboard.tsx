import React, { useId, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { Certificate, GeminiPost } from '../types';
import { certHoursDecimal, formatTotalHoursDecimal } from '../utils/duration';

interface AnalyticsDashboardProps {
  certificates: Certificate[];
  posts: GeminiPost[];
}

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const PLATFORM_COLORS: Record<string, string> = {
  LinkedIn: '#0077B5',
  Instagram: '#E1306C',
  'WhatsApp / Comunidade': '#34A853',
};
const STATUS_COLORS: Record<string, string> = {
  Publicado: '#34A853',
  Agendado: '#1A73E8',
  Rascunho: '#FBBC04',
};

function parseIssueYearMonth(iso: string): { year: number; month: number } | null {
  const [year, month] = iso.split('-').map(Number);
  if (!year || !month) return null;
  return { year, month: month - 1 };
}

function lastMonths(count: number): { key: string; label: string }[] {
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_SHORT[d.getMonth()] });
  }
  return months;
}

const BarChart: React.FC<{ data: { label: string; value: number }[]; color: string; formatValue?: (v: number) => string }> = ({
  data,
  color,
  formatValue = (v) => String(v),
}) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="relative h-40 pt-6">
      <div className="absolute inset-0 top-6 flex flex-col justify-between pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-full border-t border-dashed border-gray-100" />
        ))}
      </div>

      <div className="relative flex items-end gap-2.5 h-full">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
            <span
              className={`text-[10px] font-bold transition-colors ${
                d.value > 0 ? 'text-gray-700' : 'text-transparent'
              }`}
            >
              {formatValue(d.value)}
            </span>
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t-lg transition-all duration-500 ease-out hover:brightness-110 hover:-translate-y-0.5"
                style={{
                  height: `${Math.max(3, (d.value / max) * 100)}%`,
                  background: `linear-gradient(180deg, ${color}, ${color}99)`,
                  opacity: d.value === 0 ? 0.12 : 1,
                }}
                title={`${d.label}: ${formatValue(d.value)}`}
              />
            </div>
            <span className="text-[10px] font-semibold text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AreaLineChart: React.FC<{ data: { label: string; value: number }[]; color: string; formatValue?: (v: number) => string }> = ({
  data,
  color,
  formatValue = (v) => String(v),
}) => {
  const gradientId = useId();
  const width = 100;
  const height = 40;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((d, i) => ({
    x: i * stepX,
    y: height - (d.value / max) * (height - 4) - 2,
    value: d.value,
    label: d.label,
  }));

  const smoothPath = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const midX = (prev.x + p.x) / 2;
      return `C ${midX} ${prev.y}, ${midX} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(' ');
  const areaPath = `${smoothPath} L ${width} ${height} L 0 ${height} Z`;
  const last = points[points.length - 1];

  return (
    <div className="space-y-2">
      <div className="relative">
        {last && (
          <div
            className="absolute -translate-y-full px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
            style={{ right: 0, top: `${(last.y / height) * 100}%`, backgroundColor: color, marginTop: '-6px' }}
          >
            {formatValue(last.value)}
          </div>
        )}
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-28 overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={width} y1={height * f} y2={height * f} stroke="#F1F3F4" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
          ))}
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path d={smoothPath} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 2 : 1.3} fill="white" stroke={color} strokeWidth={1.2} vectorEffect="non-scaling-stroke">
              <title>{`${p.label}: ${formatValue(p.value)}`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="flex justify-between px-0.5">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] font-semibold text-gray-400">{d.label}</span>
        ))}
      </div>
    </div>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ certificates, posts }) => {
  const months = useMemo(() => lastMonths(6), []);

  const certsByMonth = useMemo(() => {
    const counts = new Map(months.map((m) => [m.key, 0]));
    certificates.forEach((c) => {
      const parsed = parseIssueYearMonth(c.issueDate);
      if (!parsed) return;
      const key = `${parsed.year}-${parsed.month}`;
      if (counts.has(key)) counts.set(key, (counts.get(key) || 0) + 1);
    });
    return months.map((m) => ({ label: m.label, value: counts.get(m.key) || 0 }));
  }, [certificates, months]);

  const cumulativeHours = useMemo(() => {
    const [firstYear, firstMonth] = months[0].key.split('-').map(Number);
    const hoursByMonth = new Map(months.map((m) => [m.key, 0]));

    let running = 0;
    certificates.forEach((c) => {
      const parsed = parseIssueYearMonth(c.issueDate);
      if (!parsed) return;
      const isBeforeWindow =
        parsed.year < firstYear || (parsed.year === firstYear && parsed.month < firstMonth);
      if (isBeforeWindow) {
        running += certHoursDecimal(c);
        return;
      }
      const key = `${parsed.year}-${parsed.month}`;
      if (hoursByMonth.has(key)) hoursByMonth.set(key, (hoursByMonth.get(key) || 0) + certHoursDecimal(c));
    });

    return months.map((m) => {
      running += hoursByMonth.get(m.key) || 0;
      return { label: m.label, value: running };
    });
  }, [certificates, months]);

  const postsByPlatform = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => counts.set(p.platform, (counts.get(p.platform) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const postsByStatus = useMemo(() => {
    const counts = { Publicado: 0, Agendado: 0, Rascunho: 0 } as Record<string, number>;
    posts.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [posts]);

  const totalPosts = posts.length || 1;

  return (
    <div className="space-y-6">
      <div className="pt-15">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-[#1A73E8]" />
          <span>Analytics</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Certificados por mês</h3>
          <p className="text-xs text-gray-500 mb-2">Últimos 6 meses</p>
          <BarChart data={certsByMonth} color="#1A73E8" />
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Horas de estudo acumuladas</h3>
          <p className="text-xs text-gray-500 mb-2">Evolução ao longo do tempo</p>
          <AreaLineChart data={cumulativeHours} color="#34A853" formatValue={formatTotalHoursDecimal} />
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Posts por plataforma</h3>
          {postsByPlatform.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">Nenhum post criado ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {postsByPlatform.map(([platform, count]) => {
                const platformColor = PLATFORM_COLORS[platform] || '#9AA0A6';
                return (
                  <div key={platform} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600 w-32 truncate shrink-0">{platform}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${(count / totalPosts) * 100}%`,
                          background: `linear-gradient(90deg, ${platformColor}99, ${platformColor})`,
                        }}
                        title={`${platform}: ${count}`}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-900 w-6 text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Posts por status</h3>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex mb-3">
            {Object.entries(postsByStatus).map(([status, count]) =>
              count > 0 ? (
                <div
                  key={status}
                  className="h-full transition-all duration-500 ease-out first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${(count / totalPosts) * 100}%`,
                    background: `linear-gradient(90deg, ${STATUS_COLORS[status]}99, ${STATUS_COLORS[status]})`,
                  }}
                  title={`${status}: ${count}`}
                />
              ) : null
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {Object.entries(postsByStatus).map(([status, count]) => (
              <span key={status} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                {status}: <strong className="text-gray-900">{count}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};