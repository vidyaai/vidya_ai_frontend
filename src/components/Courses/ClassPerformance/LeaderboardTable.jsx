import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const fmt = (v) => (v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toFixed(1));

const LeaderboardTable = ({ students, assignments, weightages, weightedTotals }) => {
  const [sortKey, setSortKey] = useState('total');
  const [sortDir, setSortDir] = useState('desc');

  const rows = useMemo(() => {
    const out = students.map((s, i) => ({
      ...s,
      total: weightedTotals[i] ?? 0,
    }));
    out.sort((a, b) => {
      let av, bv;
      if (sortKey === 'name') {
        av = (a.name || '').toLowerCase();
        bv = (b.name || '').toLowerCase();
      } else if (sortKey === 'total') {
        av = a.total ?? -Infinity;
        bv = b.total ?? -Infinity;
      } else {
        av = a.scores?.[sortKey] ?? -Infinity;
        bv = b.scores?.[sortKey] ?? -Infinity;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return out;
  }, [students, weightedTotals, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const SortHeader = ({ k, children, className }) => (
    <th
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 cursor-pointer select-none hover:text-teal-300 ${className || ''}`}
      onClick={() => toggleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortKey === k && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </span>
    </th>
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h4 className="text-base font-semibold text-white mb-3">Per-student leaderboard</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="border-b border-gray-800">
            <tr>
              <SortHeader k="name" className="text-left">Student</SortHeader>
              {assignments.map((a) => (
                <SortHeader key={a.id} k={a.id} className="text-right">
                  <span title={a.title}>
                    {a.title.length > 14 ? `${a.title.slice(0, 13)}…` : a.title}
                    <span className="ml-1 text-[10px] text-gray-500">
                      ({Math.round((weightages[a.id] || 0) * 100)}%)
                    </span>
                  </span>
                </SortHeader>
              ))}
              <SortHeader k="total" className="text-right">Weighted Total</SortHeader>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id || r.email} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                <td className="px-3 py-2 text-sm text-gray-200">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.email}</div>
                </td>
                {assignments.map((a) => {
                  const v = r.scores?.[a.id];
                  return (
                    <td key={a.id} className="px-3 py-2 text-right font-mono text-sm text-gray-300">
                      {v === null || v === undefined ? <span className="text-gray-600">—</span> : fmt(v)}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right font-mono text-sm font-semibold text-teal-300">
                  {fmt(r.total)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={assignments.length + 2} className="px-3 py-6 text-center text-sm text-gray-500">
                  No enrolled students with submissions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;
