// src/components/Courses/StudentEnrollmentManager.jsx
import { useState, useEffect, useRef } from 'react';
import { Upload, UserPlus, Trash2, Loader2, Clock, Users, AlertTriangle, FileText } from 'lucide-react';
import { courseApi } from './courseApi';

const StudentEnrollmentManager = ({ courseId, isOwner }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadEnrollments();
  }, [courseId]);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const data = await courseApi.listEnrollments(courseId);
      setEnrollments(data);
    } catch (err) {
      console.error('Failed to load enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddByEmail = async (e) => {
    e.preventDefault();
    const emails = emailInput
      .split(/[,;\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) return;

    try {
      setEnrolling(true);
      setMessage(null);
      const result = await courseApi.enrollStudents(
        courseId,
        emails.map((email) => ({ email }))
      );
      setMessage({
        type: 'success',
        text: `Enrolled ${result.enrolled}, pending ${result.pending}${
          result.failed.length ? `, failed: ${result.failed.join(', ')}` : ''
        }`,
      });
      setEmailInput('');
      loadEnrollments();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to enroll students. Please try again.' });
    } finally {
      setEnrolling(false);
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Please upload a CSV file.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File must be under 10 MB.' });
      return;
    }

    try {
      setUploading(true);
      setMessage(null);
      const result = await courseApi.enrollStudentsCSV(courseId, file);
      setMessage({
        type: 'success',
        text: `CSV processed: ${result.enrolled} enrolled, ${result.pending} pending${
          result.failed.length ? `, ${result.failed.length} failed` : ''
        }`,
      });
      loadEnrollments();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to process CSV file.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (enrollmentId) => {
    if (!window.confirm('Remove this student from the course?')) return;
    try {
      await courseApi.removeEnrollment(courseId, enrollmentId);
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
    } catch (err) {
      alert('Failed to remove student.');
    }
  };

  const activeCount = enrollments.filter((e) => e.status === 'active').length;
  const pendingCount = enrollments.filter((e) => e.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center space-x-6 text-sm text-gray-400">
        <span className="flex items-center space-x-1">
          <Users size={14} />
          <span>{activeCount} active</span>
        </span>
        {pendingCount > 0 && (
          <span className="flex items-center space-x-1 text-yellow-400">
            <Clock size={14} />
            <span>{pendingCount} pending</span>
          </span>
        )}
      </div>

      {/* Add students (owner only) */}
      {isOwner && (
        <div className="space-y-4">
          {/* Email input */}
          <form onSubmit={handleAddByEmail} className="flex gap-2">
            <input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter emails (comma or line separated)"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 text-sm"
            />
            <button
              type="submit"
              disabled={enrolling || !emailInput.trim()}
              className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm disabled:opacity-50 transition-colors"
            >
              {enrolling ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              <span className="ml-1.5">Add</span>
            </button>
          </form>

          {/* CSV upload */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Upload size={16} className="mr-1.5" />}
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>
            <span className="text-xs text-gray-500">CSV with "email" column</span>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`text-sm px-4 py-2 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-900/20 border-green-500/30 text-green-400'
              : 'bg-red-900/20 border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Enrollment list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="text-teal-500 animate-spin" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users size={32} className="mx-auto mb-2 opacity-50" />
          <p>No students enrolled yet</p>
        </div>
      ) : (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Role</th>
                <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Status</th>
                {isOwner && <th className="text-right px-4 py-2.5 text-gray-400 font-medium">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 text-white">
                    {enrollment.email || enrollment.user_id.replace('pending_', '')}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 capitalize">{enrollment.role}</td>
                  <td className="px-4 py-2.5">
                    {enrollment.status === 'pending' ? (
                      <span className="inline-flex items-center space-x-1 text-yellow-400 text-xs">
                        <Clock size={12} />
                        <span>Pending</span>
                      </span>
                    ) : (
                      <span className="text-green-400 text-xs">Active</span>
                    )}
                  </td>
                  {isOwner && (
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleRemove(enrollment.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentEnrollmentManager;
