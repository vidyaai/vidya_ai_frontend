'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { getCourseById } from '@/data/mockData';

interface NewAssignmentFormProps {
  courseId: string;
}

interface AttachedFile {
  id: string;
  name: string;
  size: string;
}

export default function NewAssignmentForm({ courseId }: NewAssignmentFormProps) {
  const router = useRouter();
  const course = getCourseById(courseId);

  const [formData, setFormData] = useState({
    title: '',
    instructions: '',
    dueDate: '',
  });
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = () => {
    // Simulate file upload
    const mockFile: AttachedFile = {
      id: `file-${Date.now()}`,
      name: 'rubric.pdf',
      size: '245 KB',
    };
    setAttachedFiles(prev => [...prev, mockFile]);
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async (asDraft: boolean) => {
    setIsDraft(asDraft);
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Redirect back to course assignments
    router.push(`/courses/${courseId}`);
  };

  const isFormValid = formData.title.trim();

  if (!course) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">Course not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/courses/${courseId}`}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-sm text-gray-500">Back to {course.code}</p>
            <h1 className="text-2xl font-bold text-white">New Assignment</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit(true)}
            disabled={!isFormValid || isSubmitting}
            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting && isDraft ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={!isFormValid || isSubmitting}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting && !isDraft ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Problem Set 4: Fourier Transforms"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg"
            autoFocus
          />
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-2">
            Instructions
          </label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            rows={8}
            placeholder="Describe the assignment, requirements, and any specific instructions for students..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Attachments
          </label>
          <div className="space-y-3">
            {/* Attached Files */}
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded">
                    <FileText size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {/* Upload Button */}
            <button
              type="button"
              onClick={handleFileUpload}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors"
            >
              <Upload size={20} />
              <span>Add files (rubric, reference materials)</span>
            </button>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-2">
            Due Date <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            className="w-full max-w-xs px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
