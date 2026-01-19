'use client';

import { useState } from 'react';
import { Save, Mail, Clock, Check, X, Send, UserPlus } from 'lucide-react';
import { getCourseById, mockInvitations, getRoleBadgeStyles, getRoleLabel } from '@/data/mockData';

interface CourseSettingsProps {
  courseId: string;
}

type SettingsTab = 'general' | 'invitations';

export default function CourseSettings({ courseId }: CourseSettingsProps) {
  const course = getCourseById(courseId);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [formData, setFormData] = useState({
    name: course?.name || '',
    code: course?.code || '',
    semester: course?.semester || '',
    description: course?.description || '',
  });

  if (!course) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">Course not found</p>
      </div>
    );
  }

  const sentInvitations = mockInvitations.sent.filter(inv => inv.courseId === courseId);
  const receivedInvitations = mockInvitations.received;

  const tabs = [
    { id: 'general' as const, label: 'General' },
    { id: 'invitations' as const, label: 'Invitations', count: receivedInvitations.length },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* Course Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Course Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Course Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
            Course Code
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Semester */}
        <div>
          <label htmlFor="semester" className="block text-sm font-medium text-gray-300 mb-2">
            Semester
          </label>
          <select
            id="semester"
            name="semester"
            value={formData.semester}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="Spring 2026">Spring 2026</option>
            <option value="Fall 2025">Fall 2025</option>
            <option value="Summer 2025">Summer 2025</option>
            <option value="Spring 2025">Spring 2025</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
          <Save size={18} />
          Save Changes
        </button>
      </div>
    </div>
  );

  const renderInvitationsTab = () => (
    <div className="space-y-8">
      {/* Invite New Member */}
      <div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
          <UserPlus size={18} />
          Invite Member
        </button>
      </div>

      {/* Pending Invitations Sent */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Pending Invitations ({sentInvitations.length})
        </h3>

        {sentInvitations.length === 0 ? (
          <p className="text-gray-400 text-sm">No pending invitations</p>
        ) : (
          <div className="space-y-3">
            {sentInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{invitation.email}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className={`px-1.5 py-0.5 text-xs rounded border ${getRoleBadgeStyles(invitation.role)}`}>
                        {getRoleLabel(invitation.role)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Sent {invitation.sentAt}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5">
                    <Send size={14} />
                    Resend
                  </button>
                  <button className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invitations Received */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Invitations You Received ({receivedInvitations.length})
        </h3>

        {receivedInvitations.length === 0 ? (
          <p className="text-gray-400 text-sm">No invitations received</p>
        ) : (
          <div className="space-y-3">
            {receivedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800"
              >
                <div>
                  <p className="text-white font-medium">
                    {invitation.courseName}
                    <span className="text-gray-500 ml-2">({invitation.courseCode})</span>
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <span>From: {invitation.fromName}</span>
                    <span className={`px-1.5 py-0.5 text-xs rounded border ${getRoleBadgeStyles(invitation.role)}`}>
                      {getRoleLabel(invitation.role)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
                    <Check size={14} />
                    Accept
                  </button>
                  <button className="px-4 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5">
                    <X size={14} />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'text-teal-400 border-teal-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-teal-500/20 text-teal-400 rounded">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && renderGeneralTab()}
      {activeTab === 'invitations' && renderInvitationsTab()}
    </div>
  );
}
