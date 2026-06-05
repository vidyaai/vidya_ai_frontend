import { useEffect, useMemo, useState } from 'react';
import { Loader2, Download, BarChart3, CheckCircle2, AlertTriangle } from 'lucide-react';
import { courseApi } from '../courseApi';
import {
  AssignmentScoreHistogram,
  SubmissionRateChart,
  ClassTrendChart,
  WeightedTotalHistogram,
} from './PerformanceCharts';
import LeaderboardTable from './LeaderboardTable';

const ClassPerformanceSection = ({ courseId, course }) => {
  const [assignments, setAssignments] = useState([]);          // all course assignments (for selector)
  const [selectedIds, setSelectedIds] = useState([]);
  const [weightages, setWeightages] = useState({});            // {id: percent (0-100)}
  const [data, setData] = useState(null);                      // performance payload
  const [loadingList, setLoadingList] = useState(true);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // Load all course assignments once for the selector
  useEffect(() => {
    let alive = true;
    setLoadingList(true);
    courseApi
      .listCourseAssignments(courseId)
      .then((list) => {
        if (!alive) return;
        const eligible = (list || []).filter((a) => a.status === 'published' || a.status === 'archived');
        setAssignments(eligible);
        const initial = eligible.slice(0, Math.min(3, eligible.length)).map((a) => a.id);
        setSelectedIds(initial);
        setWeightages(equalize(initial));
      })
      .catch((e) => setError(e?.response?.data?.detail || 'Failed to load assignments'))
      .finally(() => alive && setLoadingList(false));
    return () => { alive = false; };
  }, [courseId]);

  // Re-fetch performance whenever selection changes
  useEffect(() => {
    if (!selectedIds.length) {
      setData(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError('');
    courseApi
      .getClassPerformance(courseId, selectedIds)
      .then((res) => alive && setData(res))
      .catch((e) => alive && setError(e?.response?.data?.detail || 'Failed to load performance data'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [courseId, selectedIds]);

  const toggleAssignment = (id) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setWeightages(equalize(next));
      return next;
    });
  };

  const setWeight = (id, value) => {
    const num = Math.max(0, Math.min(100, Number(value) || 0));
    setWeightages((prev) => ({ ...prev, [id]: num }));
  };

  const normalize = () => setWeightages(equalize(selectedIds));

  const weightSum = useMemo(
    () => selectedIds.reduce((s, id) => s + (Number(weightages[id]) || 0), 0),
    [selectedIds, weightages],
  );
  const weightsValid = Math.abs(weightSum - 100) < 0.5 && selectedIds.length > 0;

  // Normalized fractional weights — used for both UI total and as request payload
  const fractionalWeights = useMemo(() => {
    if (!selectedIds.length) return {};
    if (weightSum <= 0) {
      const eq = 1 / selectedIds.length;
      return Object.fromEntries(selectedIds.map((id) => [id, eq]));
    }
    return Object.fromEntries(selectedIds.map((id) => [id, (Number(weightages[id]) || 0) / weightSum]));
  }, [selectedIds, weightages, weightSum]);

  // Recompute weighted totals client-side whenever weights or data change
  const weightedTotals = useMemo(() => {
    if (!data) return [];
    return data.students.map((s) => {
      let total = 0;
      for (const id of selectedIds) {
        const v = s.scores?.[id];
        if (v !== null && v !== undefined) total += v * (fractionalWeights[id] || 0);
      }
      return total;
    });
  }, [data, selectedIds, fractionalWeights]);

  const handleExport = async () => {
    if (!weightsValid) return;
    setExporting(true);
    try {
      const wholePctWeights = Object.fromEntries(
        selectedIds.map((id) => [id, Number(weightages[id]) || 0]),
      );
      const res = await courseApi.exportClassPerformance(courseId, selectedIds, wholePctWeights);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeCode = (course?.course_code || course?.title || 'course').replace(/\s+/g, '_');
      link.download = `${safeCode}_class_performance.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to export XLSX');
    } finally {
      setExporting(false);
    }
  };

  if (loadingList) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading assignments…
      </div>
    );
  }

  if (!assignments.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <BarChart3 className="mx-auto mb-3 text-gray-600" size={36} />
        <p className="text-gray-300">No published assignments yet.</p>
        <p className="text-sm text-gray-500 mt-1">Publish assignments to see class performance analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="text-teal-400" />
          <h2 className="text-2xl font-bold text-white">Class Performance</h2>
        </div>
        <p className="text-sm text-gray-400">
          Pick assignments and assign weightages to analyze and export class-wide performance.
        </p>
      </div>

      {/* Control bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
        {/* Assignment chips */}
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Assignments</div>
          <div className="flex flex-wrap gap-2">
            {assignments.map((a) => {
              const selected = selectedIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAssignment(a.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    selected
                      ? 'bg-teal-500/15 border-teal-400 text-teal-200 ring-1 ring-teal-400/40'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                  title={a.title}
                >
                  {selected && <CheckCircle2 size={14} className="inline mr-1 -mt-0.5" />}
                  {a.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weightage editor */}
        {selectedIds.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wide text-gray-500">Weightages (%)</div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono ${weightsValid ? 'text-teal-300' : 'text-red-400'}`}>
                  Sum: {weightSum.toFixed(1)}%
                  {!weightsValid && <AlertTriangle size={12} className="inline ml-1 -mt-0.5" />}
                </span>
                <button
                  type="button"
                  onClick={normalize}
                  className="text-xs text-teal-300 hover:text-teal-200 underline underline-offset-2"
                >
                  Normalize
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {selectedIds.map((id) => {
                const a = assignments.find((x) => x.id === id);
                if (!a) return null;
                return (
                  <div key={id} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
                    <span className="text-sm text-gray-200 truncate flex-1" title={a.title}>{a.title}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={weightages[id] ?? 0}
                      onChange={(e) => setWeight(id, e.target.value)}
                      className="w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-right text-sm text-teal-200 font-mono focus:outline-none focus:border-teal-400"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={!weightsValid || loading || exporting}
            onClick={handleExport}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition"
          >
            {exporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            {exporting ? 'Building XLSX…' : 'Download XLSX'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-950/40 border border-red-700/50 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Loader2 className="animate-spin mr-2" /> Crunching numbers…
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !selectedIds.length && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-400">
          Select one or more assignments above to begin analysis.
        </div>
      )}

      {/* Charts */}
      {!loading && data && selectedIds.length > 0 && (
        <>
          <WeightedTotalHistogram totals={weightedTotals} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubmissionRateChart assignments={data.assignments} />
            <ClassTrendChart trend={data.trend} />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Per-assignment score distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.assignments.map((a) => (
                <AssignmentScoreHistogram key={a.id} assignment={a} />
              ))}
            </div>
          </div>

          <LeaderboardTable
            students={data.students}
            assignments={data.assignments}
            weightages={fractionalWeights}
            weightedTotals={weightedTotals}
          />
        </>
      )}
    </div>
  );
};

// Equal-split weightages summing to 100
const equalize = (ids) => {
  if (!ids.length) return {};
  const each = +(100 / ids.length).toFixed(2);
  const obj = Object.fromEntries(ids.map((id) => [id, each]));
  const drift = +(100 - each * ids.length).toFixed(2);
  if (Math.abs(drift) > 0.001) obj[ids[0]] = +(obj[ids[0]] + drift).toFixed(2);
  return obj;
};

export default ClassPerformanceSection;
