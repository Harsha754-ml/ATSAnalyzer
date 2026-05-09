import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wand2, Check, X, ChevronRight, ChevronLeft,
  FileText, ListChecks, Sparkles, Loader2
} from 'lucide-react';

interface GeneratedTemplate {
  keywords: string[];
  sections: string[];
  config: {
    use_keywords: boolean;
    use_sections: boolean;
    use_formatting: boolean;
    strictness: 'low' | 'medium' | 'high';
  };
}

interface Props {
  onGenerated: (template: GeneratedTemplate) => void;
  onCancel: () => void;
}

const SKILL_CATEGORIES = [
  {
    name: 'Programming Languages',
    icon: '💻',
    skills: [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
      'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB'
    ]
  },
  {
    name: 'Frontend Development',
    icon: '🎨',
    skills: [
      'React', 'Angular', 'Vue.js', 'Next.js', 'Nuxt.js', 'Svelte', 'HTML5', 'CSS3',
      'Tailwind CSS', 'SASS/SCSS', 'Bootstrap', 'Material UI', 'Redux', 'GraphQL'
    ]
  },
  {
    name: 'Backend Development',
    icon: '⚙️',
    skills: [
      'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
      'ASP.NET', 'Ruby on Rails', 'Laravel', 'REST API', 'Microservices'
    ]
  },
  {
    name: 'Database & Storage',
    icon: '🗄️',
    skills: [
      'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
      'DynamoDB', 'Cassandra', 'Firebase', 'Oracle', 'SQLite'
    ]
  },
  {
    name: 'Cloud & DevOps',
    icon: '☁️',
    skills: [
      'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Jenkins',
      'CI/CD', 'Terraform', 'Ansible', 'Linux', 'Git', 'GitHub Actions'
    ]
  },
  {
    name: 'Data Science & ML',
    icon: '📊',
    skills: [
      'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas',
      'NumPy', 'Scikit-learn', 'NLP', 'Computer Vision', 'Data Analysis'
    ]
  },
  {
    name: 'Mobile Development',
    icon: '📱',
    skills: [
      'React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin',
      'Xamarin', 'Ionic', 'Expo'
    ]
  },
  {
    name: 'Soft Skills & Tools',
    icon: '🤝',
    skills: [
      'Project Management', 'Agile/Scrum', 'Communication', 'Leadership',
      'Problem Solving', 'Team Collaboration', 'JIRA', 'Figma', 'UX Design'
    ]
  }
];

const REQUIRED_SECTIONS = [
  { id: 'summary', label: 'Professional Summary', description: 'A brief overview of qualifications and career goals' },
  { id: 'experience', label: 'Work Experience', description: 'Employment history with roles and responsibilities' },
  { id: 'education', label: 'Education', description: 'Academic qualifications and degrees' },
  { id: 'skills', label: 'Skills', description: 'Technical and professional competencies' },
  { id: 'projects', label: 'Projects', description: 'Notable projects and achievements' },
  { id: 'certifications', label: 'Certifications', description: 'Professional certifications and licenses' },
];

export default function TemplateGenerator({ onGenerated, onCancel }: Props) {
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set(['experience', 'education', 'skills']));
  const [strictness, setStrictness] = useState<'low' | 'medium' | 'high'>('medium');
  const [includeFormatting, setIncludeFormatting] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(SKILL_CATEGORIES[0].name);

  const toggleSkill = (skill: string) => {
    const newSkills = new Set(selectedSkills);
    if (newSkills.has(skill)) {
      newSkills.delete(skill);
    } else {
      newSkills.add(skill);
    }
    setSelectedSkills(newSkills);
  };

  const toggleSection = (section: string) => {
    const newSections = new Set(selectedSections);
    if (newSections.has(section)) {
      newSections.delete(section);
    } else {
      newSections.add(section);
    }
    setSelectedSections(newSections);
  };

  const handleGenerate = async () => {
    setGenerating(true);

    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    const template: GeneratedTemplate = {
      keywords: Array.from(selectedSkills),
      sections: Array.from(selectedSections),
      config: {
        use_keywords: true,
        use_sections: selectedSections.size > 0,
        use_formatting: includeFormatting,
        strictness,
      }
    };

    setGenerating(false);
    onGenerated(template);
  };

  const canProceed = step === 1
    ? selectedSkills.size >= 3
    : selectedSections.size >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Template Generator</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Create your ATS template from scratch</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${step >= s ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {s === 1 ? 'Skills' : s === 2 ? 'Sections' : 'Config'}
                  </span>
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-0.5 ${step > s ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Select Required Skills</h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
                    {selectedSkills.size} selected
                  </span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Choose the skills that candidates should have. Select at least 3 skills.
                </p>

                <div className="space-y-3">
                  {SKILL_CATEGORIES.map((category) => (
                    <div key={category.name} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                        className="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="text-xl">{category.icon}</span>
                        <span className="font-bold text-slate-900 dark:text-white flex-1 text-left">{category.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {category.skills.filter(s => selectedSkills.has(s)).length}/{category.skills.length}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedCategory === category.name ? 'rotate-90' : ''}`} />
                      </button>

                      {expandedCategory === category.name && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex flex-wrap gap-2">
                            {category.skills.map((skill) => (
                              <button
                                key={skill}
                                onClick={() => toggleSkill(skill)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                  selectedSkills.has(skill)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900'
                                }`}
                              >
                                {selectedSkills.has(skill) && <Check className="w-3 h-3 inline mr-1" />}
                                {skill}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ListChecks className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Select Required Sections</h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
                    {selectedSections.size} selected
                  </span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Choose the resume sections that candidates must include. Select at least 2 sections.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {REQUIRED_SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => toggleSection(section.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedSections.has(section.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          selectedSections.has(section.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          {selectedSections.has(section.id) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{section.label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{section.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Configuration</h3>
                </div>

                {/* Strictness */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Matching Strictness
                  </label>
                  <div className="flex gap-3">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setStrictness(level)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                          strictness === level
                            ? level === 'low'
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : level === 'medium'
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                              : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className={`text-2xl font-black mb-1 ${
                          strictness === level
                            ? level === 'low'
                              ? 'text-green-600'
                              : level === 'medium'
                              ? 'text-amber-600'
                              : 'text-red-600'
                            : 'text-slate-400'
                        }`}>
                          {level.toUpperCase()}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {level === 'low' && 'Flexible matching, higher pass rate'}
                          {level === 'medium' && 'Balanced strictness, recommended'}
                          {level === 'high' && 'Exact matching, lower pass rate'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formatting Check */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFormatting}
                      onChange={(e) => setIncludeFormatting(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Check Resume Formatting</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Verify bullet points, consistent styling, and proper structure
                      </p>
                    </div>
                  </label>
                </div>

                {/* Summary */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">Template Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Skills:</span>
                      <span className="font-bold text-slate-900 dark:text-white ml-2">{selectedSkills.size}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Sections:</span>
                      <span className="font-bold text-slate-900 dark:text-white ml-2">{selectedSections.size}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Strictness:</span>
                      <span className="font-bold text-slate-900 dark:text-white ml-2 capitalize">{strictness}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Formatting:</span>
                      <span className="font-bold text-slate-900 dark:text-white ml-2">{includeFormatting ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {step === 1 ? 'Cancel' : (
              <>
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Back
              </>
            )}
          </button>

          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleGenerate()}
            disabled={!canProceed || generating}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
              !canProceed
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : step === 3 ? (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Template
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}