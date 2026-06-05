// src/components/Courses/MaterialSummaryPanel.jsx
// Functional clone of the gallery InteractivePanel's "summary" view but
// targeted at /api/material-chat/summary. Three states: loading (staged
// progress bar), error (retry), and ready (markdown text + Download PDF).
import { useEffect, useState } from 'react';
import { Loader, Download, AlertCircle } from 'lucide-react';
import { materialChatApi } from './materialChatApi';
import { parseMarkdownWithMath } from '../generic/utils.jsx';

const MaterialSummaryPanel = ({ isOpen, material, onClose }) => {
  const [stage, setStage] = useState(''); // 'Analyzing…', 'Researching…', 'Ready'
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const runSummarize = async (force = false) => {
    if (!material?.id) return;
    setBusy(true);
    setError(null);
    setData(null);
    setStage('Analyzing the material…');
    setProgress(15);
    try {
      // Sneaky staged-progress so the user sees movement during the long
      // server call. Backend response is what flips us to 100%.
      const tick1 = setTimeout(() => { setStage('Synthesizing key points…'); setProgress(45); }, 1500);
      const tick2 = setTimeout(() => { setStage('Drafting the summary…'); setProgress(75); }, 6000);
      const resp = await materialChatApi.generateSummary(material.id, force);
      clearTimeout(tick1); clearTimeout(tick2);
      setStage('Summary ready');
      setProgress(100);
      setData(resp);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || 'Failed to generate summary';
      setError(detail);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    runSummarize(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, material?.id]);

  const handleDownloadPDF = async () => {
    if (!data?.summary_id) return;
    try {
      const blob = await materialChatApi.downloadSummary(data.summary_id);
      const blobObj = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blobObj);
      const link = document.createElement('a');
      link.href = url;
      const cleanTitle = (material?.title || 'material')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      link.download = `${cleanTitle}_Summary.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'PDF download failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      {busy ? (
        <div className="flex flex-col items-center justify-center h-full space-y-5 py-10">
          <Loader className="animate-spin text-teal-400" size={36} />
          <div className="text-center space-y-1">
            <p className="text-white font-medium text-sm">{stage}</p>
            <p className="text-gray-500 text-xs">{progress}% complete</p>
          </div>
          <div className="w-full max-w-xs bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4 py-10 px-2">
          <div className="flex items-center gap-2 text-red-300">
            <AlertCircle size={16} />
            <p className="text-sm text-center">{error}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => runSummarize(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-teal-600 hover:bg-teal-500 text-white transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-md transition-colors"
            >
              Back to chat
            </button>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {data.summary_metadata?.key_topics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.summary_metadata.key_topics.slice(0, 8).map((t, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-[11px] text-gray-300">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="text-sm text-gray-100 leading-relaxed">
            {parseMarkdownWithMath(data.summary)}
          </div>
          <div className="pt-3 border-t border-gray-800">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md
                         bg-teal-600 hover:bg-teal-500 text-white transition-colors"
            >
              <Download size={14} />
              Download PDF
            </button>
            <button
              onClick={() => runSummarize(true)}
              className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 border border-gray-700 hover:border-gray-500 rounded-md transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 text-sm">No summary yet.</div>
      )}
    </div>
  );
};

export default MaterialSummaryPanel;
