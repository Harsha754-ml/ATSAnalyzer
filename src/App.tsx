import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import {
  Upload, Sparkles, AlertCircle, CheckCircle2,
  ArrowRight, Zap, FileText, Cpu, Globe,
  Moon, Sun, X, Lock, Building2, Mail, KeyRound,
} from 'lucide-react';
import {
  compareResume, uploadAtsTemplate, generateTemplate, AnalysisResult, TemplateStatus,
  login, register, logout, getCurrentUser, getInstitutions, Institution,
  getMyTemplate
} from './services/geminiService';
import { useTheme } from './context/ThemeContext';
import { Switch } from '../components/ui/material-design-3-switch';

import ThreeBackground from './components/ThreeBackground';
import {
  ScrollProgressBar,
  Reveal,
  MagneticButton,
  TiltCard3D,
  AnimatedCounter,
  FlipWords,
  ParallaxImage,
} from './components/AnimationLayer';

import AnalysisView from './components/AnalysisView';
import TemplateGenerator from './components/TemplateGenerator';
import ResumeViewer from './components/ResumeViewer';

// â”€â”€â”€ Unsplash image sources (free, no API key) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const IMAGES = {
  engineer1: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',  // woman engineer
  engineer2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',  // man professional
  engineer3: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',  // woman professional
  engineer4: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',  // man engineer
  engineer5: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',  // woman smiling
  engineer6: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',  // man smiling
  coding:    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',  // code on screen
  resume:    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',  // resume/document
  office:    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',  // modern office
  collab:    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',  // team working
};

// â”€â”€â”€ Tilt card with mouse tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TiltCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
);
};

// ───── Auth Modal Component ───────────────────────────────────────────────────────
const AuthModal = ({ isOpen, onClose, onAuthSuccess }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAuthSuccess: () => void;
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onAuthSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Register Institution'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Institution Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Acme Corp"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="admin@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="********"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ───── Header with toggles ───────────────────────────────────────────────────────
interface AuthUser {
  id: string;
  name: string;
  email: string;
}

const Header = ({ currentUser, onLogout, onLoginClick }: { 
  currentUser: AuthUser | null;
  onLogout: () => void;
  onLoginClick: () => void;
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 w-full glass-header z-50 px-6 py-3 flex justify-between items-center">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-200">
          AI
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
          ATS<span className="text-blue-600">Comparator</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
        <a href="#features"     className="hover:text-blue-600 transition-colors">Features</a>
        <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it works</a>
      </nav>

      {/* Controls */}
      <div className="flex items-center gap-3">

        {/* Dark / Light mode */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <Switch
            checked={isDark}
            onCheckedChange={toggleTheme}
            haptic="light"
            size="sm"
            checkedIcon={<Moon className="w-2.5 h-2.5 fill-current" />}
            uncheckedIcon={<Sun className="w-2.5 h-2.5" />}
          />
          <Moon className="w-3.5 h-3.5 text-blue-400" />
        </div>

        {/* Login / User */}
        {currentUser ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:block">
              {currentUser.name}
            </span>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-all flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="px-5 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 dark:hover:bg-blue-500 transition-all flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Upload Template
          </button>
        )}
      </div>
    </header>
  );
};

// â”€â”€â”€ Feature Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <TiltCard3D>
    <div className="saas-card p-10 space-y-6 h-full dark:bg-slate-900 dark:border-slate-700">
      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-bold text-xl text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm font-light">{desc}</p>
    </div>
  </TiltCard3D>
);

// â”€â”€â”€ Social proof avatars strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SocialProof = () => {
  const people = [
    { img: IMAGES.engineer1, name: 'Priya S.', role: 'ML Engineer' },
    { img: IMAGES.engineer2, name: 'James K.', role: 'Backend Dev' },
    { img: IMAGES.engineer3, name: 'Sofia M.', role: 'UX Designer' },
    { img: IMAGES.engineer4, name: 'Arjun R.', role: 'DevOps' },
    { img: IMAGES.engineer5, name: 'Emma L.', role: 'Frontend Dev' },
    { img: IMAGES.engineer6, name: 'Carlos T.', role: 'Full Stack' },
  ];

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="flex -space-x-3">
        {people.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ zIndex: 10, scale: 1.15, y: -4 }}
            className="relative group"
            style={{ zIndex: i }}
          >
            <img
              src={p.img}
              alt={p.name}
              className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-md"
            />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                <div className="font-bold">{p.name}</div>
                <div className="text-slate-400">{p.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="text-slate-500 text-sm font-medium">
        Joined by <span className="text-slate-900 font-bold"><AnimatedCounter target={2400} suffix="+" /></span> engineers & professionals
      </p>
    </div>
  );
};

// â”€â”€â”€ How it works step â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StepCard = ({
  step, icon: Icon, title, desc, img, reverse = false
}: {
  step: string; icon: any; title: string; desc: string; img: string; reverse?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.6 }}
    className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}
  >
    {/* Text */}
    <div className="flex-1 space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">{step}</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg font-light">{desc}</p>
    </div>

    {/* Image */}
    <div className="flex-1 shadow-xl border border-slate-100 rounded-3xl overflow-hidden">
      <ParallaxImage src={img} alt={title} />
    </div>
  </motion.div>
);

// â”€â”€â”€ Floating hero image grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HeroImageGrid = () => (
  <div className="relative w-full max-w-4xl mx-auto mt-20 h-80 md:h-96">
    {/* Large center image */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.7 }}
      whileHover={{ scale: 1.03, rotate: 0 }}
      className="absolute left-1/2 -translate-x-1/2 top-0 w-64 md:w-80 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 rotate-1 z-20"
    >
      <img src={IMAGES.coding} alt="Engineer coding" className="w-full h-52 object-cover" />
      <div className="bg-white dark:bg-slate-800 px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">ATS Report Ready</div>
          <div className="text-xs text-slate-400">2 seconds ago</div>
        </div>
      </div>
    </motion.div>

    {/* Left image */}
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.7 }}
      whileHover={{ scale: 1.05, rotate: 0 }}
      className="absolute left-0 md:left-8 top-8 w-44 md:w-56 rounded-2xl overflow-hidden shadow-xl border border-slate-100 -rotate-3 z-10"
    >
      <img src={IMAGES.resume} alt="Resume document" className="w-full h-36 object-cover" />
      <div className="bg-white dark:bg-slate-800 px-4 py-3">
        <div className="text-xs font-bold text-slate-900 dark:text-white">Resume Uploaded</div>
        <div className="text-xs text-slate-400">PDF â€¢ 2 pages</div>
      </div>
    </motion.div>

    {/* Right image */}
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.7 }}
      whileHover={{ scale: 1.05, rotate: 0 }}
      className="absolute right-0 md:right-8 top-8 w-44 md:w-56 rounded-2xl overflow-hidden shadow-xl border border-slate-100 rotate-3 z-10"
    >
      <img src={IMAGES.office} alt="Modern office" className="w-full h-36 object-cover" />
      <div className="bg-white dark:bg-slate-800 px-4 py-3">
        <div className="text-xs font-bold text-slate-900 dark:text-white">ATS Match Report</div>
        <div className="text-xs text-slate-400">82% match score</div>
      </div>
    </motion.div>

    {/* Floating badge */}
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg shadow-blue-200 z-30 whitespace-nowrap"
    >
      ATS Match in 2 seconds
    </motion.div>
  </div>
);

// â”€â”€â”€ Main App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function App() {
  const [view, setView] = useState<'home' | 'report'>('home');
  const [analyzing, setAnalyzing] = useState(false);
  const [templateUploading, setTemplateUploading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [templateStatus, setTemplateStatus] = useState<TemplateStatus | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isTemplateDragging, setIsTemplateDragging] = useState(false);
  const [isResumeDragging, setIsResumeDragging] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTemplateGenerator, setShowTemplateGenerator] = useState(false);
  const [showResumeViewer, setShowResumeViewer] = useState(false);
  const [resumeFilePath, setResumeFilePath] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCurrentUser());
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const templateInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInstitutions();
    if (currentUser) loadMyTemplate();
  }, []);

  const loadInstitutions = async () => {
    try {
      const insts = await getInstitutions();
      setInstitutions(insts);
    } catch (e) { console.error('Failed to load institutions'); }
  };

  const loadMyTemplate = async () => {
    if (!currentUser) return;
    try {
      const template = await getMyTemplate();
      if (template) setTemplateStatus(template);
    } catch (e) { console.error('Failed to load template'); }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setTemplateStatus(null);
  };

  const handleAuthSuccess = () => {
    setCurrentUser(getCurrentUser());
    loadMyTemplate();
  };

  const handleTemplateUpload = async (file: File) => {
    if (!currentUser) {
      setTemplateError('Please login to upload a template.');
      setShowAuthModal(true);
      return;
    }
    setTemplateUploading(true);
    setTemplateError(null);
    try {
      const template = await uploadAtsTemplate(file);
      setTemplateStatus(template);
      setResumeError(null);
    } catch (err) {
      console.error('Template upload error:', err);
      setTemplateError(err instanceof Error ? err.message : 'Failed to upload template. Please try again.');
    } finally {
      setTemplateUploading(false);
    }
  };

  const handleTemplateGenerated = async (data: {
    keywords: string[];
    sections: string[];
    config: {
      use_keywords: boolean;
      use_sections: boolean;
      use_formatting: boolean;
      strictness: 'low' | 'medium' | 'high';
    };
  }) => {
    setShowTemplateGenerator(false);
    setTemplateUploading(true);
    setTemplateError(null);
    try {
      const template = await generateTemplate(data);
      setTemplateStatus(template);
    } catch (err) {
      console.error('Template generation error:', err);
      setTemplateError(err instanceof Error ? err.message : 'Failed to generate template.');
    } finally {
      setTemplateUploading(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (!selectedInstitution) {
      setResumeError('Please select an institution/company first.');
      return;
    }
    setAnalyzing(true);
    setResumeError(null);
    try {
      const result = await compareResume(file, selectedInstitution);
      setResults(result);
      // Store file path for ResumeViewer
      if (result.resumeFilePath) {
        setResumeFilePath(result.resumeFilePath);
      } else {
        // Fallback: create object URL from file
        setResumeFilePath(URL.createObjectURL(file));
      }
      setView('report');
    } catch (err) {
      console.error('Resume compare error:', err);
      setResumeError(err instanceof Error ? err.message : 'Failed to compare. Please try another file.');
    } finally {
      setAnalyzing(false);
    }
  };

  // â”€â”€ Analysis Results View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === 'report' && results) {
    return (
      <>
        <AnalysisView
          results={results}
          onBack={() => setView('home')}
          onViewResume={() => setShowResumeViewer(true)}
        />
        <AnimatePresence>
          {showResumeViewer && (
            <ResumeViewer
              filePath={resumeFilePath || ''}
              fileName={results.resumeFileName || 'resume.pdf'}
              annotations={(results as any).annotations || (results as any).scribbleAnnotations || []}
              matchedKeywords={results.matchedKeywords}
              missingKeywords={results.missingKeywords}
              scribblePositions={(results as any).scribblePositions || []}
              onClose={() => setShowResumeViewer(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // â”€â”€ Home View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] transition-colors duration-300">      <ScrollProgressBar />
      <ThreeBackground />
      <Header 
          currentUser={currentUser}
          onLogout={handleLogout}
          onLoginClick={() => setShowAuthModal(true)}
        />

      <main>
        {/* Hero */}
        <section id="hero" className="section-padding pt-48 text-center max-w-5xl mx-auto space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.05]">
              <FlipWords text="Compare Your Resume" /><br />
              <span className="text-gradient">
                <FlipWords text="With ATS Template" />
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
              Upload the ATS ideal template, then compare student resumes to see match percentage, missing skills, and improvement tips.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-6">
              <MagneticButton>
                <button
                  onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-primary px-10 h-16 text-lg"
                >
                  Check ATS Match <ArrowRight className="w-5 h-5" />
                </button>
              </MagneticButton>
              <MagneticButton>
                <button className="btn-secondary px-10 h-16 text-lg">
                  View Sample Report
                </button>
              </MagneticButton>
            </div>
          </motion.div>

          {/* Floating image grid */}
          <HeroImageGrid />

          {/* Social proof */}
          <SocialProof />
        </section>

        {/* Features */}
        <section id="features" className="section-padding max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Everything you need</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-light">Built for engineers, designers, and every professional in between.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            <Reveal delay={0.1}>
              <FeatureCard
                icon={Zap}
                title="ATS Template Matching"
                desc="Compare resumes against the admin ATS template and get an instant match score."
              />
            </Reveal>
            <Reveal delay={0.2}>
              <FeatureCard
                icon={Sparkles}
                title="Keyword Gap Finder"
                desc="Highlight missing skills and keywords recruiters actually scan for."
              />
            </Reveal>
            <Reveal delay={0.3}>
              <FeatureCard
                icon={CheckCircle2}
                title="Actionable Suggestions"
                desc="Get clear steps to improve ATS compatibility and raise your score."
              />
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 md:py-32 px-8 max-w-6xl mx-auto space-y-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">How it works</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-light">Three steps from ATS template to match report.</p>
          </motion.div>

            <StepCard
              step="Step 01"
              icon={FileText}
              title="Admin uploads ATS template"
              desc="Upload the ideal ATS-friendly resume format that defines structure and required keywords."
              img={IMAGES.resume}
            />
            <StepCard
              step="Step 02"
              icon={Cpu}
              title="Student uploads resume"
              desc="Students submit their resume to compare against the ATS template and keywords."
              img={IMAGES.collab}
              reverse
            />
            <StepCard
              step="Step 03"
              icon={Globe}
              title="Get the ATS report"
              desc="Receive match percentage, missing skills, and tailored suggestions to improve ATS compatibility."
              img={IMAGES.coding}
            />
        </section>

        {/* Wall of fame â€” engineer photos */}
        <section className="py-20 px-8 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14 space-y-3"
            >
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Wall of Fame</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-light">Students who improved their ATS match scores.</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {[
                { img: IMAGES.engineer1, name: 'Priya S.',  role: 'ML Engineer',   company: 'Google' },
                { img: IMAGES.engineer2, name: 'James K.',  role: 'Backend Dev',   company: 'Stripe' },
                { img: IMAGES.engineer3, name: 'Sofia M.',  role: 'UX Designer',   company: 'Figma' },
                { img: IMAGES.engineer4, name: 'Arjun R.',  role: 'DevOps',        company: 'AWS' },
                { img: IMAGES.engineer5, name: 'Emma L.',   role: 'Frontend Dev',  company: 'Vercel' },
                { img: IMAGES.engineer6, name: 'Carlos T.', role: 'Full Stack',    company: 'Shopify' },
              ].map((person, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 text-center border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="relative mx-auto w-16 h-16 mb-4">
                    <img
                      src={person.img}
                      alt={person.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 group-hover:border-blue-200 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{person.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{person.role}</div>
                  <div className="mt-2 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-full px-3 py-1 inline-block">
                    {person.company}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Upload */}
        <section id="upload-section" className="section-padding">
          <div className="max-w-3xl mx-auto w-full">
            <Reveal className="text-center mb-12 space-y-4">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Compare Your Resume</h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-light">
                Select the company you're applying to, then upload your resume to get an ATS match report.
              </p>
            </Reveal>

            {currentUser && !templateStatus && (
              <div
                className={`
                  saas-card min-h-[160px] flex flex-col items-center justify-center p-6 text-center border-2 border-dashed mb-4
                  ${isTemplateDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-200 hover:border-blue-400'}
                  ${templateUploading ? 'pointer-events-none opacity-50' : ''}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsTemplateDragging(true); }}
                onDragLeave={() => setIsTemplateDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsTemplateDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleTemplateUpload(file);
                }}
              >
                {templateUploading ? (
                  <div className="space-y-4">
                    <div className="relative w-10 h-10 mx-auto">
                      <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                      <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                    </div>
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] animate-pulse">
                      Processing Template...
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-blue-600 mb-2" />
                    <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-white">
                      Upload Your ATS Template
                    </h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-2">
                      Upload your company's ATS template
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => templateInputRef.current?.click()}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        Choose File
                      </button>
                      <span className="text-sm text-slate-400">or</span>
                      <button
                        onClick={() => setShowTemplateGenerator(true)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        Generate Template
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      ref={templateInputRef}
                      onChange={(e) => e.target.files?.[0] && handleTemplateUpload(e.target.files[0])}
                    />
                  </>
                )}
              </div>
            )}

            {templateStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-green-700 text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Template loaded ({templateStatus.keywordCount} keywords)
              </motion.div>
            )}

            {templateError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {templateError}
              </motion.div>
            )}

            <div
              className={`
                saas-card min-h-[360px] flex flex-col items-center justify-center p-10 text-center border-2 border-dashed
                ${isResumeDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-200 hover:border-blue-400'}
                ${analyzing ? 'pointer-events-none opacity-50' : ''}
              `}
              onDragOver={(e) => { e.preventDefault(); setIsResumeDragging(true); }}
              onDragLeave={() => setIsResumeDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsResumeDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleResumeUpload(file);
              }}
            >
              {analyzing ? (
                <div className="space-y-8">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.3em] animate-pulse">
                    Comparing Resume...
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6">
                    <Upload className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight text-slate-900 dark:text-white uppercase">
                    Upload Your Resume
                  </h3>
                  <p className="text-slate-400 dark:text-slate-500 mb-4 font-light">
                    Select the company/institution you're applying to, then upload your resume.
                  </p>
                  <select
                    value={selectedInstitution}
                    onChange={(e) => setSelectedInstitution(e.target.value)}
                    className="w-full mb-4 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-0 outline-none transition-colors cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                  >
                    <option value="" disabled>Select Institution...</option>
                    {institutions.filter(i => i.hasTemplate).map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={!selectedInstitution}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Compare Resume
                  </button>
                  <input
                    type="file"
                    className="hidden"
                    ref={resumeInputRef}
                    onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
                  />
                </>
              )}
            </div>

            {resumeError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 text-sm font-medium"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {resumeError}
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <Reveal>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
                Build ATS-ready <br /> resumes with confidence.
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="text-slate-500 dark:text-slate-400 text-xl font-light max-w-2xl mx-auto leading-relaxed">
                Join students who are improving their ATS scores with clear keyword gaps and structure fixes.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <MagneticButton className="mx-auto">
                <button
                  onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-primary px-16 text-xl h-16"
                >
                  Start ATS Comparison
                </button>
              </MagneticButton>
            </Reveal>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.4em]">
              No credit card required - Get feedback fast
            </p>
          </div>
        </section>
      </main>

      <footer className="py-16 px-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-[10px]">
            AI
          </div>
          <span className="font-bold tracking-tight text-slate-900 dark:text-white uppercase text-sm tracking-widest">ATS Comparator</span>
        </div>
        <div className="flex gap-10 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Help</a>
        </div>
        <div className="text-slate-400 text-[10px] font-medium tracking-[0.2em] font-mono">
          (c) 2026 ATS RESUME COMPARATOR
        </div>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <AnimatePresence>
        {showTemplateGenerator && (
          <TemplateGenerator
            onGenerated={handleTemplateGenerated}
            onCancel={() => setShowTemplateGenerator(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
