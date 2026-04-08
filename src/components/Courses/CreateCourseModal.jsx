// src/components/Courses/CreateCourseModal.jsx
import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { courseApi } from './courseApi';

const DISCIPLINE_OPTIONS = {
  engineering: [
    { value: 'electrical', label: 'Electrical Engineering' },
    { value: 'mechanical', label: 'Mechanical Engineering' },
    { value: 'civil', label: 'Civil Engineering' },
    { value: 'computer_eng', label: 'Computer Engineering' },
    { value: 'cs', label: 'Computer Science' },
  ],
  pcm: [
    { value: 'math', label: 'Mathematics' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
  ],
  medical: [
    { value: 'anatomy', label: 'Anatomy' },
    { value: 'physiology', label: 'Physiology' },
    { value: 'biochemistry', label: 'Biochemistry' },
    { value: 'pharmacology', label: 'Pharmacology' },
    { value: 'pathology', label: 'Pathology' },
    { value: 'microbiology', label: 'Microbiology' },
    { value: 'surgery', label: 'Surgery (Clinical)' },
    { value: 'medicine', label: 'Medicine (Clinical)' },
    { value: 'obgyn', label: 'OB/GYN (Clinical)' },
  ],
};

const CreateCourseModal = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState('');
  const [description, setDescription] = useState('');
  const [subjectCategory, setSubjectCategory] = useState('engineering');
  const [engineeringLevel, setEngineeringLevel] = useState('');
  const [engineeringDiscipline, setEngineeringDiscipline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleCategoryChange = (cat) => {
    setSubjectCategory(cat);
    setEngineeringLevel('');
    setEngineeringDiscipline('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const course = await courseApi.createCourse({
        title: title.trim(),
        course_code: courseCode.trim() || null,
        semester: semester.trim() || null,
        description: description.trim() || null,
        subject_category: subjectCategory,
        engineering_level: engineeringLevel || null,
        engineering_discipline: engineeringDiscipline || null,
      });
      onCreated?.(course);
      onClose();
    } catch (err) {
      console.error('Failed to create course:', err);
      setError('Failed to create course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Create New Course</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Course Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Algorithms"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Course Code <span className="text-gray-500">(optional)</span>
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS101"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Semester <span className="text-gray-500">(optional)</span>
              </label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. Fall 2026"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Description <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your course..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors resize-none"
            />
          </div>

          {/* Subject Configuration */}
          <div className="border-t border-gray-800 pt-4 space-y-4">
            <p className="text-sm font-medium text-gray-300">Subject Configuration</p>

            {/* Subject Category */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">Subject Category</label>
              <div className="flex gap-2">
                {[
                  { value: 'engineering', label: '⚙️ Engineering' },
                  { value: 'pcm', label: '🔬 PCM' },
                  { value: 'medical', label: '🩺 Medical' },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoryChange(cat.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 font-medium text-xs transition-all duration-200 ${
                      subjectCategory === cat.value
                        ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Academic Level */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  Academic Level <span className="text-gray-600">(optional)</span>
                </label>
                <select
                  value={engineeringLevel}
                  onChange={(e) => setEngineeringLevel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="">None</option>
                  {subjectCategory === 'medical' ? (
                    <>
                      <option value="pre_med">Pre-Med</option>
                      <option value="mbbs_preclinical">MBBS Pre-Clinical (Year 1–2)</option>
                      <option value="mbbs_clinical">MBBS Clinical (Year 3–5)</option>
                      <option value="md">MD / Postgraduate</option>
                    </>
                  ) : (
                    <>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="graduate">Graduate</option>
                    </>
                  )}
                </select>
              </div>

              {/* Subject Area */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  Subject Area <span className="text-gray-600">(optional)</span>
                </label>
                <select
                  value={engineeringDiscipline}
                  onChange={(e) => setEngineeringDiscipline(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="">None</option>
                  {(DISCIPLINE_OPTIONS[subjectCategory] || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors rounded-lg"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourseModal;
