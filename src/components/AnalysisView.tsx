import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Lightbulb,
  ListChecks,
  Target,
  TrendingUp,
  Sparkles,
  Eye,
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
  const scoreBg = score >= 80 ? 'from-green-50 to-emerald-50' : score >= 60 ? 'from-amber-50 to-orange-50' : 'from-red-50 to-rose-50';
  const scoreLabel = score >= 80 ? 'Excellent Match!' : score >= 60 ? 'Good, but room to improve' : 'Needs significant work';

  const totalKeywords = results.template.keywordCount;
  const matchedCount = results.matchedKeywords.length;
  const missingCount = results.missingKeywords.length;
  const missingSectionsCount = results.missingSections.length;
  const matchRate = totalKeywords > 0 ? Math.round((matchedCount / totalKeywords) * 100) : 0;

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

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20 relative z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${scoreBg} dark:from-slate-900 dark:to-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm`}
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-36 h-36 shrink-0">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="12" className="dark:stroke-slate-700" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className={scoreStroke}
                  strokeDasharray={`${score * 3.266} 326.6`}
                  style={{ transition: 'stroke-dasharray 1.2s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${scoreColor}`}>{score}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Match</span>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{scoreLabel}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-light mt-1">
                  {score >= 80 ? "Your resume strongly aligns with this job's requirements!" : 
                   score >= 60 ? "You're on the right track. Here's what to improve." :
                   "Focus on the key improvements below to boost your chances."}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {matchedCount} matched
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 px-4 py-2 rounded-full">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {missingCount} missing
                  </span>
                </div>
                {missingSectionsCount > 0 && (
                  <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 px-4 py-2 rounded-full">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {missingSectionsCount} missing sections
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Keywords', value: totalKeywords, icon: FileText, c: 'text-blue-600 bg-blue-50 dark:bg-blue-900/15' },
            { label: 'Matched', value: matchedCount, icon: CheckCircle2, c: 'text-green-600 bg-green-50 dark:bg-green-900/15' },
            { label: 'Missing', value: missingCount, icon: XCircle, c: 'text-red-500 bg-red-50 dark:bg-red-900/15' },
            { label: 'Missing Sections', value: missingSectionsCount, icon: AlertCircle, c: 'text-amber-600 bg-amber-50 dark:bg-amber-900/15' },
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

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Matched Keywords (What You Have)</h2>
          </div>
          <div className="flex flex-wrap gap-2 p-5 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-900/30">
            {results.matchedKeywords.length > 0 ? (
              results.matchedKeywords.map((keyword, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.02 }}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-sm"
                >
                  {keyword}
                </motion.span>
              ))
            ) : (
              <span className="text-slate-500 dark:text-slate-400 italic">No keywords matched. Add relevant skills to your resume.</span>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Missing Keywords (What You Need)</h2>
          </div>
          <div className="flex flex-wrap gap-2 p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30">
            {results.missingKeywords.length > 0 ? (
              results.missingKeywords.map((keyword, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.02 }}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-sm"
                >
                  {keyword}
                </motion.span>
              ))
            ) : (
              <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> All template keywords found in your resume!
              </span>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-amber-500" /> Missing Sections
          </h2>
          {results.missingSections.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {results.missingSections.map((section, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" /> {section}
                </motion.span>
              ))}
            </div>
          ) : (
            <div className="p-5 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-900/30">
              <p className="text-green-700 dark:text-green-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> All required sections from the ATS template are present!
              </p>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> Action Plan
          </h2>
          <div className="space-y-3">
            {results.suggestions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                className={`p-5 rounded-2xl border-2 bg-white dark:bg-slate-900 ${
                  s.impact === 'high' 
                    ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' 
                    : s.impact === 'medium' 
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10' 
                    : 'border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {s.category}
                  </span>
                  <span
                    className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                      s.impact === 'high'
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                        : s.impact === 'medium'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                        : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                    }`}
                  >
                    {s.impact} priority
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{s.message}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
<div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Resume Scribbles</h2>
          </div>
          
          {/* Handle string annotations from new backend */}
          {(results as any).annotations?.length > 0 ? (
            <div className="space-y-3">
              {(results as any).annotations.map((ann: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    ann.includes('[MISSING]') || ann.includes('[ARROW]') || ann.includes('[STRIKE]')
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700' 
                      : 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700'
                  }`}
                >
                  <p className="font-mono text-sm font-bold text-red-600 dark:text-red-400">
                    {ann}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (results as any).scribbleAnnotations?.length > 0 ? (
            <div className="space-y-3">
              {(results as any).scribbleAnnotations.map((ann: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    ann.type === 'missing_keyword' 
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700' 
                      : 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${ann.type === 'missing_keyword' ? 'text-red-600' : 'text-amber-600'}`}>{ann.mark}</span>
                      <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
                        {ann.type === 'missing_keyword' ? `Missing: ${ann.keyword}` : ann.section}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {ann.type === 'missing_keyword' 
                      ? `Found in resume but not matching template: "${ann.keyword}"`
                      : `${ann.section} section needs improvement`}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : results.resumeText ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-slate-900 dark:text-white">Full Resume</span>
                </div>
                <span className="text-green-600 font-bold">{score}% Match</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-8 max-h-48 overflow-y-auto">
                {results.resumeText}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Upload a resume to see scribble analysis.
              </p>
            </div>
)}
        </motion.section>
      </div>

      <footer className="py-10 border-t border-slate-100 dark:border-slate-800 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 font-mono">(c) 2026 ATS RESUME COMPARATOR</div>
      </footer>
    </div>
  );
}