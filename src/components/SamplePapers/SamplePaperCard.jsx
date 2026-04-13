'use client';

import { Download, Eye, FileText } from 'lucide-react';

import { getDifficultyColor, getPaperAccent } from './samplePapersData';

const SamplePaperCard = ({ paper, expanded, onToggle, className = '' }) => {
  const accent = getPaperAccent(paper.color);

  return (
    <div
      className={`cursor-pointer rounded-[28px] border p-6 transition-all duration-300 ${
        expanded
          ? `bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] ${accent.selected}`
          : 'border-[#182842] bg-[#0d1a33] hover:-translate-y-1 hover:border-[#30496f] hover:shadow-[0_24px_70px_rgba(0,0,0,0.22)]'
      } ${className}`}
      onClick={onToggle}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-[18px] border p-3 transition-colors ${accent.icon}`}>
          <FileText className="h-6 w-6" />
        </div>
        <span
          className={`rounded-full border px-2 py-1 text-xs font-medium ${getDifficultyColor(
            paper.difficulty,
          )}`}
        >
          {paper.difficulty}
        </span>
      </div>

      <h3 className="mb-2 text-xl font-semibold text-white">{paper.title}</h3>
      <p className="mb-3 text-sm font-medium text-[#43ead6]">{paper.subject}</p>
      <p className="mb-4 text-sm leading-relaxed text-slate-300">{paper.description}</p>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {paper.topics.slice(0, 3).map((topic, idx) => (
            <span key={idx} className={`rounded-md border px-2 py-1 text-xs ${accent.chip}`}>
              {topic}
            </span>
          ))}
          {paper.topics.length > 3 && (
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
              +{paper.topics.length - 3} more
            </span>
          )}
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4 animate-in fade-in duration-300">
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-200">All Topics Covered:</p>
            <div className="flex flex-wrap gap-1.5">
              {paper.topics.map((topic, idx) => (
                <span key={idx} className={`rounded-md border px-2 py-1 text-xs ${accent.chip}`}>
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex gap-3">
        <a
          href={paper.assignmentFile}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#43ead6] px-4 py-2.5 text-sm font-medium text-[#051224] transition hover:bg-[#43ead6]/90"
        >
          <Eye className="h-4 w-4" />
          View
        </a>
        <a
          href={paper.solutionFile}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/14 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Solution
        </a>
      </div>
    </div>
  );
};

export default SamplePaperCard;
