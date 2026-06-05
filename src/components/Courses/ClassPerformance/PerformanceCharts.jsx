// Recharts presentational components for Class Performance.
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const AXIS_COLOR = '#9ca3af';        // gray-400
const GRID_COLOR = '#1f2937';        // gray-800
const TEAL = '#2dd4bf';              // teal-400
const TEAL_DEEP = '#0d9488';         // teal-600
const AMBER = '#f59e0b';
const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid #1f2937',
  borderRadius: '8px',
  color: '#e5e7eb',
};

export const AssignmentScoreHistogram = ({ assignment }) => {
  const data = (assignment.histogram || []).map((b) => ({ bucket: b.bucket, count: b.count }));
  const stats = assignment.stats || {};
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-base font-semibold text-white truncate" title={assignment.title}>
          {assignment.title}
        </h4>
        <span className="text-xs text-gray-400 shrink-0 ml-3">n = {stats.count ?? 0}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs text-gray-300 mb-4">
        <StatPill label="Mean" value={fmtPct(stats.mean)} />
        <StatPill label="Median" value={fmtPct(stats.median)} />
        <StatPill label="σ" value={fmtPct(stats.stdev)} />
        <StatPill label="Q1–Q3" value={`${fmtPct(stats.q1)}–${fmtPct(stats.q3)}`} />
      </div>
      <div style={{ width: '100%', height: 180 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tick={{ fill: AXIS_COLOR, fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(45,212,191,0.08)' }} />
            <Bar dataKey="count" fill={TEAL} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const SubmissionRateChart = ({ assignments }) => {
  const data = assignments.map((a) => ({
    name: truncate(a.title, 18),
    submission: a.submission_rate ?? 0,
    on_time: a.on_time_rate ?? 0,
  }));
  return (
    <ChartCard title="Submission & on-time rate per assignment">
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -10 }}>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: AXIS_COLOR, fontSize: 11 }} unit="%" />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(45,212,191,0.05)' }} />
            <Legend wrapperStyle={{ color: '#d1d5db', fontSize: 12 }} />
            <Bar dataKey="submission" name="Submitted" fill={TEAL_DEEP} radius={[4, 4, 0, 0]} />
            <Bar dataKey="on_time" name="On time" fill={AMBER} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export const ClassTrendChart = ({ trend }) => {
  const data = trend.map((t) => ({
    name: truncate(t.title, 18),
    mean: t.mean_pct ?? 0,
  }));
  return (
    <ChartCard title="Class average over time (by due date)">
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -10 }}>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: AXIS_COLOR, fontSize: 11 }} unit="%" />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="mean"
              name="Class mean"
              stroke={TEAL}
              strokeWidth={3}
              dot={{ fill: TEAL, r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export const WeightedTotalHistogram = ({ totals }) => {
  const buckets = bucketize(totals, 10);
  const meanVal = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  return (
    <ChartCard
      title="Weighted total — class distribution"
      right={<span className="text-xs text-gray-400">Mean: {fmtPct(meanVal)}</span>}
    >
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={buckets} margin={{ top: 8, right: 16, bottom: 4, left: -10 }}>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tick={{ fill: AXIS_COLOR, fontSize: 11 }} />
            <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(245,158,11,0.08)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {buckets.map((b, i) => (
                <Cell key={i} fill={i >= 7 ? TEAL : i >= 4 ? TEAL_DEEP : AMBER} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

// ── helpers ────────────────────────────────────────────────────────────

const ChartCard = ({ title, right, children }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-base font-semibold text-white">{title}</h4>
      {right}
    </div>
    {children}
  </div>
);

const StatPill = ({ label, value }) => (
  <div className="bg-gray-800/60 border border-gray-700 rounded-md px-2 py-1.5">
    <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
    <div className="text-sm font-mono text-teal-300">{value}</div>
  </div>
);

const fmtPct = (v) => (v === null || v === undefined || Number.isNaN(v) ? '—' : `${Number(v).toFixed(1)}%`);

const truncate = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s);

const bucketize = (values, binSize = 10) => {
  const bucketCount = Math.floor(100 / binSize);
  const counts = new Array(bucketCount).fill(0);
  values.forEach((v) => {
    if (v === null || v === undefined || Number.isNaN(v)) return;
    let idx = Math.floor(v / binSize);
    if (idx >= bucketCount) idx = bucketCount - 1;
    if (idx < 0) idx = 0;
    counts[idx] += 1;
  });
  return counts.map((c, i) => ({ bucket: `${i * binSize}-${(i + 1) * binSize}`, count: c }));
};
