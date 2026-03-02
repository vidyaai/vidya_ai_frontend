// Mock data for Course Structure UI proof-of-concept

export type Role = 'owner' | 'instructor' | 'ta' | 'external';

export interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  description: string;
  memberCount: number;
  assignmentCount: number;
  myRole: Role;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'draft' | 'published';
}

export interface Invitation {
  id: string;
  email?: string;
  courseName?: string;
  courseCode?: string;
  fromName?: string;
  role: Role;
  sentAt?: string;
  courseId?: string;
}

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    name: 'Introduction to Electrical Engineering',
    code: 'ECE 101',
    semester: 'Spring 2026',
    description: 'Fundamentals of circuits, signals, and systems',
    memberCount: 4,
    assignmentCount: 8,
    myRole: 'owner',
  },
  {
    id: 'course-2',
    name: 'VLSI Design',
    code: 'ECE 445',
    semester: 'Spring 2026',
    description: 'Advanced VLSI circuit design and implementation',
    memberCount: 3,
    assignmentCount: 5,
    myRole: 'instructor',
  },
  {
    id: 'course-3',
    name: 'Digital Signal Processing',
    code: 'ECE 310',
    semester: 'Fall 2025',
    description: 'Fourier transforms, filtering, and spectral analysis',
    memberCount: 2,
    assignmentCount: 12,
    myRole: 'owner',
  }
];

export const mockMembers: Record<string, Member[]> = {
  'course-1': [
    { id: 'm1', name: 'Dr. Sarah Chen', email: 'sarah@university.edu', role: 'owner' },
    { id: 'm2', name: 'Mike Johnson', email: 'mike@university.edu', role: 'ta' },
    { id: 'm3', name: 'Lisa Wang', email: 'lisa@university.edu', role: 'ta' },
    { id: 'm4', name: 'VidyaAI Support', email: 'support@vidyaai.co', role: 'external' },
  ],
  'course-2': [
    { id: 'm5', name: 'Dr. Sarah Chen', email: 'sarah@university.edu', role: 'instructor' },
    { id: 'm6', name: 'James Park', email: 'james@university.edu', role: 'ta' },
    { id: 'm7', name: 'Emily Davis', email: 'emily@university.edu', role: 'ta' },
  ],
  'course-3': [
    { id: 'm8', name: 'Dr. Sarah Chen', email: 'sarah@university.edu', role: 'owner' },
    { id: 'm9', name: 'Robert Kim', email: 'robert@university.edu', role: 'ta' },
  ],
};

export const mockAssignments: Record<string, Assignment[]> = {
  'course-1': [
    { id: 'a1', title: 'Circuit Analysis Basics', description: 'Analyze basic resistor circuits using Ohm\'s Law', dueDate: '2026-01-20', status: 'published' },
    { id: 'a2', title: 'Ohm\'s Law Lab Report', description: 'Document your lab findings on resistance measurements', dueDate: '2026-01-22', status: 'published' },
    { id: 'a3', title: 'Kirchhoff\'s Laws Problem Set', description: 'Apply KVL and KCL to complex circuits', dueDate: '2026-01-25', status: 'published' },
    { id: 'a4', title: 'RC Circuit Analysis', description: 'Time-domain analysis of RC circuits', dueDate: '2026-01-30', status: 'draft' },
  ],
  'course-2': [
    { id: 'a5', title: 'CMOS Inverter Design', description: 'Design and simulate a CMOS inverter', dueDate: '2026-01-21', status: 'published' },
    { id: 'a6', title: 'Layout Design Project', description: 'Create layout for a simple logic gate', dueDate: '2026-01-28', status: 'published' },
    { id: 'a7', title: 'Timing Analysis', description: 'Analyze timing characteristics of your design', dueDate: '2026-02-05', status: 'draft' },
  ],
  'course-3': [
    { id: 'a8', title: 'DFT Implementation', description: 'Implement Discrete Fourier Transform from scratch', dueDate: '2026-01-19', status: 'published' },
    { id: 'a9', title: 'FFT Optimization', description: 'Optimize your DFT using FFT algorithm', dueDate: '2026-01-23', status: 'published' },
    { id: 'a10', title: 'Filter Design', description: 'Design a low-pass FIR filter', dueDate: '2026-01-27', status: 'published' },
    { id: 'a11', title: 'Spectral Analysis Project', description: 'Analyze real-world signals using spectral methods', dueDate: '2026-02-01', status: 'draft' },
  ],
};

export const mockInvitations = {
  sent: [
    { id: 'inv-1', email: 'alex@uni.edu', role: 'ta' as Role, sentAt: '2026-01-15', courseId: 'course-1' },
    { id: 'inv-2', email: 'taylor@uni.edu', role: 'ta' as Role, sentAt: '2026-01-16', courseId: 'course-2' },
  ],
  received: [
    { id: 'inv-3', courseName: 'Machine Learning Fundamentals', courseCode: 'CS 229', fromName: 'Prof. Andrew Lee', role: 'ta' as Role },
    { id: 'inv-4', courseName: 'Computer Architecture', courseCode: 'ECE 411', fromName: 'Prof. Maria Santos', role: 'instructor' as Role },
  ]
};

// Helper functions
export function getCourseById(id: string): Course | undefined {
  return mockCourses.find(c => c.id === id);
}

export function getMembersForCourse(courseId: string): Member[] {
  return mockMembers[courseId] || [];
}

export function getAssignmentsForCourse(courseId: string): Assignment[] {
  return mockAssignments[courseId] || [];
}

export function getRoleBadgeStyles(role: Role): string {
  switch (role) {
    case 'owner':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'instructor':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'ta':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'external':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'instructor':
      return 'Instructor';
    case 'ta':
      return 'TA';
    case 'external':
      return 'External';
    default:
      return role;
  }
}
