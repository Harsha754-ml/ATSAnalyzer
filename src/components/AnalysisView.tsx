import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  Lightbulb,
  ListChecks,
  Target,
} from 'lucide-react';
import type { AnalysisResult } from '../services/geminiService';
import ThreeBackground from './ThreeBackground';

interface Props {
  results: AnalysisResult;
  onBack: () => void;
}

export default function AnalysisView({ results, onBack }: Props) {
  const score = results.matchPercentage;
  const scoreColor = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  const scoreStroke = score >= 80 ? 'stroke-green-500' : score >= 60 ? 'stroke-amber-500' : 'stroke-red-500';
  const scoreLabel = score >= 80 ? 'Strong Match' : score >= 60 ? 'Moderate Match' : 'Needs Improvement';

  const totalKeywords = results.template.keywordCount;
  const matchedCount = results.matchedKeywords.length;
  const missingCount = results.missingKeywords.length;
  const missingSectionsCount = results.missingSections.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0d1117] dark:to-[#0d1117] transition-colors duration-300">
      <ThreeBackground />

      <button
        onClick={onBack}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group"
      >
        <ArrowRight className="w-4 h-4 text-slate-400 rotate-180 group-hover:text-blue-600 transition-colors" />
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-300 group-hover:text-blue-600 transition-colors">Back</span>
      </button>

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20 relative z-10 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="relative w-32 h-32 shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" className="dark:stroke-slate-700" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                className={scoreStroke}
                strokeDasharray={`${score * 3.14} 314`}
                style={{ transition: 'stroke-dasharray 1.2s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black ${scoreColor}`}>{score}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{scoreLabel}</span>
            </div>
          </div>
          <div className="text-center md:text-left flex-1 space-y-2">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">ATS Match Report</h1>
            <p className="text-slate-500 dark:text-slate-400 font-light">
              Matched {matchedCount} of {totalKeywords} template keywords.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start">
              {results.template.sections.length > 0 ? (
                results.template.sections.map((section, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full"
                  >
                    {section}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full">
                  No required sections detected
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Template Keywords', value: totalKeywords, icon: FileText, c: 'text-blue-600 bg-blue-50 dark:bg-blue-900/15' },
            { label: 'Matched', value: matchedCount, icon: CheckCircle2, c: 'text-green-600 bg-green-50 dark:bg-green-900/15' },
            { label: 'Missing Skills', value: missingCount, icon: Target, c: 'text-amber-600 bg-amber-50 dark:bg-amber-900/15' },
            { label: 'Missing Sections', value: missingSectionsCount, icon: AlertCircle, c: 'text-red-600 bg-red-50 dark:bg-red-900/15' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-center"
            >
              <div className={`w-9 h-9 rounded-xl ${s.c} flex items-center justify-center mx-auto mb-2`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" /> Improvement Suggestions
          </h2>
          <div className="space-y-2">
            {results.suggestions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.03 }}
                className={`p-4 rounded-xl border-l-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${
                  s.impact === 'high' ? 'border-l-red-500' : s.impact === 'medium' ? 'border-l-amber-500' : 'border-l-green-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{s.category}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      s.impact === 'high'
                        ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                        : s.impact === 'medium'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
                        : 'bg-green-50 text-green-600 dark:bg-green-900/20'
                    }`}
                  >
                    {s.impact}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{s.message}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-purple-600" /> Missing Sections
          </h2>
          {results.missingSections.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {results.missingSections.map((section, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  {section}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm italic p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              All required sections from the ATS template are present.
            </p>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" /> Missing Skills / Keywords
          </h2>
          {results.missingKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {results.missingKeywords.map((keyword, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm italic p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              Great job. All template keywords were found in your resume.
            </p>
          )}
        </section>
      </div>

      <footer className="py-10 border-t border-slate-100 dark:border-slate-800 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 font-mono">(c) 2026 ATS RESUME COMPARATOR</div>
      </footer>
    </div>
  );
}
