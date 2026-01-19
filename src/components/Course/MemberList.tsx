'use client';

import { Users, Mail, MoreVertical, UserPlus } from 'lucide-react';
import { getMembersForCourse, getRoleBadgeStyles, getRoleLabel, Member } from '@/data/mockData';

interface MemberListProps {
  courseId: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(role: Member['role']): string {
  switch (role) {
    case 'owner':
      return 'bg-gradient-to-r from-purple-500 to-purple-600';
    case 'instructor':
      return 'bg-gradient-to-r from-blue-500 to-blue-600';
    case 'ta':
      return 'bg-gradient-to-r from-green-500 to-green-600';
    case 'external':
      return 'bg-gradient-to-r from-orange-500 to-orange-600';
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600';
  }
}

export default function MemberList({ courseId }: MemberListProps) {
  const members = getMembersForCourse(courseId);

  // Group members by role
  const owners = members.filter(m => m.role === 'owner');
  const instructors = members.filter(m => m.role === 'instructor');
  const tas = members.filter(m => m.role === 'ta');
  const externals = members.filter(m => m.role === 'external');

  const renderMemberCard = (member: Member) => (
    <div
      key={member.id}
      className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors group"
    >
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(member.role)}`}>
        {getInitials(member.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-medium truncate">{member.name}</h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getRoleBadgeStyles(member.role)}`}>
            {getRoleLabel(member.role)}
          </span>
        </div>
        <p className="text-sm text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
          <Mail size={12} />
          {member.email}
        </p>
      </div>

      {/* Actions */}
      <button
        className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        title="More options"
      >
        <MoreVertical size={18} />
      </button>
    </div>
  );

  const renderSection = (title: string, memberList: Member[]) => {
    if (memberList.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          {title} ({memberList.length})
        </h3>
        <div className="space-y-2">
          {memberList.map(renderMemberCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Invite Button */}
      <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
        <UserPlus size={18} />
        Invite Member
      </button>

      {/* Members by Role */}
      {members.length === 0 ? (
        <div className="p-8 text-center bg-gray-900 rounded-xl border border-gray-800">
          <Users size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No members yet</h3>
          <p className="text-gray-400">Invite team members to collaborate on this course.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {renderSection('Owners', owners)}
          {renderSection('Instructors', instructors)}
          {renderSection('Teaching Assistants', tas)}
          {renderSection('External Collaborators', externals)}
        </div>
      )}
    </div>
  );
}
