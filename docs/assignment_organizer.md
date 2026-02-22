# Assignment Organizer: Course-Based System Design

## Executive Summary

This document outlines the comprehensive plan to transform the Vidya AI assignment management system from a flat, unorganized structure into a Canvas-like course-based organization system. The redesign will allow professors to create courses, manage student enrollments, upload course materials, and organize assignments by course, while providing students with a structured view of their enrolled courses.

---

## Table of Contents

1. [Current System Overview](#current-system-overview)
2. [Proposed System Architecture](#proposed-system-architecture)
3. [Database Design](#database-design)
4. [Backend API Design](#backend-api-design)
5. [Frontend UI/UX Design](#frontend-uiux-design)
6. [File Upload & Processing](#file-upload--processing)
7. [Migration Strategy](#migration-strategy)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Technical Considerations](#technical-considerations)

---

## 1. Current System Overview

### 1.1 Existing Structure

**Professor Side (MyAssignments.jsx):**
- All created assignments displayed in a flat grid (no hierarchy)
- Statistics dashboard (total, published, draft, students reached)
- Assignment cards with CRUD operations
- Sharing modal for distributing assignments to students via email
- No concept of courses or grouping

**Student Side (AssignedToMe.jsx):**
- All shared assignments displayed in a flat grid
- Status tracking (not started, in progress, submitted, graded)
- Statistics dashboard (total, completed, in progress, overdue)
- No course organization

**Current Backend Database:**
- `assignments` table - Assignment data
- `assignment_submissions` table - Student submissions
- `shared_links` table - Sharing mechanism
- `shared_link_access` table - User access control
- **No course model exists**

### 1.2 Pain Points

❌ Assignments are scattered and hard to organize for professors teaching multiple courses
❌ No way to group students by class/section
❌ No centralized place for course materials (lecture notes, videos)
❌ Students see all assignments in one flat list
❌ No context about which class an assignment belongs to
❌ Difficult to manage large student rosters

---

## 2. Proposed System Architecture

### 2.1 Core Concepts

**Course** - Central organizational unit containing:
- Student enrollment roster
- Course materials (lecture notes, videos, readings)
- Course-specific assignments
- Course metadata (title, code, semester, description)

**Open Assignments** - Assignments not tied to any course (legacy assignments, one-off assignments)

**Course Materials** - Files and videos uploaded/linked to a course:
- Lecture notes (PDF, DOCX)
- Videos (uploaded or linked from video library)
- Readings and supplementary materials

**Enrollment** - Student membership in courses:
- Supports bulk upload via CSV/Excel
- Individual email invitation
- Pending enrollments for unregistered users

### 2.2 User Workflows

#### **Professor Workflow:**
```
1. Create Course
2. Add Students (via CSV upload or email invite)
3. Upload Materials (lecture notes, videos)
4. Create Assignments (linked to course)
5. Share Assignments (defaults to course students)
6. Grade Submissions
```

#### **Student Workflow:**
```
1. View Enrolled Courses
2. Browse Course Materials
3. View Course-Specific Assignments
4. Complete Assignments
5. Track Progress by Course
```

### 2.3 Information Architecture

**Professor View:**
```
My Assignments
├── Courses
│   ├── CS101 - Introduction to Algorithms
│   │   ├── Students (25 enrolled)
│   │   ├── Materials (10 items)
│   │   └── Assignments (5 items)
│   ├── CS102 - Data Structures
│   │   ├── Students (30 enrolled)
│   │   ├── Materials (8 items)
│   │   └── Assignments (4 items)
│   └── [+ Create New Course]
└── Open Assignments (12 items)
```

**Student View:**
```
Assigned to Me
├── My Courses
│   ├── CS101 - Introduction to Algorithms
│   │   ├── Materials (10 items)
│   │   └── Assignments (5 items)
│   └── CS102 - Data Structures
│       ├── Materials (8 items)
│       └── Assignments (4 items)
└── Open Assignments (3 items)
```

---

## 3. Database Design

### 3.1 New Tables

#### **courses**
Primary table for course information.

| Column | Type | Description |
|--------|------|-------------|
| id | String (PK) | UUID |
| user_id | String (FK) | Course creator (professor) |
| title | String | Course name (e.g., "Introduction to Algorithms") |
| description | Text | Course description |
| course_code | String | Course code (e.g., "CS101") |
| semester | String | Semester (e.g., "Fall 2026") |
| is_active | Boolean | Active or archived |
| enrollment_code | String | Optional code for self-enrollment |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last updated timestamp |

**Relationships:**
- One-to-many with `course_enrollments`
- One-to-many with `course_materials`
- One-to-many with `assignments`

#### **course_enrollments**
Junction table for course-student relationships.

| Column | Type | Description |
|--------|------|-------------|
| id | String (PK) | UUID |
| course_id | String (FK) | References courses.id |
| user_id | String | Firebase UID or "pending_<email>" |
| email | String | Email for pending enrollments |
| role | String | "student", "ta", "instructor" |
| status | String | "active", "dropped", "pending" |
| enrolled_at | DateTime | Enrollment timestamp |
| updated_at | DateTime | Last updated timestamp |

**Design Notes:**
- Uses same pattern as `shared_link_access` for pending users
- `user_id` stores Firebase UID for registered users
- `user_id` stores `"pending_<email>"` for unregistered users
- `email` field stores actual email for pending invitations

#### **course_materials**
Storage for course materials (files, videos, links).

| Column | Type | Description |
|--------|------|-------------|
| id | String (PK) | UUID |
| course_id | String (FK) | References courses.id |
| title | String | Material title |
| description | Text | Optional description |
| material_type | String | "lecture_notes", "video", "reading", "other" |
| s3_key | String | S3 key for uploaded files |
| video_id | String (FK) | References videos.id (if linked video) |
| external_url | String | External link (if applicable) |
| file_name | String | Original filename |
| file_size | String | File size in bytes |
| mime_type | String | MIME type (e.g., application/pdf) |
| order | Integer | Display order |
| folder | String | Optional folder/section name |
| created_at | DateTime | Upload timestamp |
| updated_at | DateTime | Last updated timestamp |

**Design Notes:**
- Supports three storage methods:
  1. S3-uploaded files (`s3_key` not null)
  2. Linked videos (`video_id` not null)
  3. External links (`external_url` not null)
- Flexible organization with `folder` field

### 3.2 Modified Tables

#### **assignments**
Add foreign key to link assignments to courses.

**New Column:**
- `course_id` (String, nullable, FK to courses.id)

**Migration Strategy:**
- All existing assignments have `course_id = NULL` (representing "Open Assignments")
- New course-specific assignments set `course_id`
- On course deletion, assignments set `course_id = NULL` (become open assignments)

### 3.3 Entity Relationship Diagram

```
┌─────────────┐
│   courses   │
│  (id, ...)  │
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│course_enrollments│              │course_materials │
│ (id, user_id)   │              │  (id, s3_key)   │
└─────────────────┘              └─────────────────┘
       │
       ▼
┌─────────────┐
│ assignments │
│(id,course_id)│
└──────┬──────┘
       │
       ▼
┌───────────────────┐
│assignment_submiss.│
└───────────────────┘
```

---

## 4. Backend API Design

### 4.1 Course Management

#### Create Course
```http
POST /api/courses
Content-Type: application/json

{
  "title": "Introduction to Algorithms",
  "description": "Learn fundamental algorithms and data structures",
  "course_code": "CS101",
  "semester": "Fall 2026"
}

Response: 201 Created
{
  "id": "uuid",
  "user_id": "professor_uid",
  "title": "Introduction to Algorithms",
  "course_code": "CS101",
  "semester": "Fall 2026",
  "is_active": true,
  "enrollment_count": 0,
  "assignment_count": 0,
  "material_count": 0,
  "created_at": "2026-02-08T10:00:00Z",
  "updated_at": "2026-02-08T10:00:00Z"
}
```

#### List Courses
```http
GET /api/courses?role=instructor&is_active=true

Response: 200 OK
[
  {
    "id": "uuid",
    "title": "Introduction to Algorithms",
    "course_code": "CS101",
    "semester": "Fall 2026",
    "enrollment_count": 25,
    "assignment_count": 5,
    "material_count": 10,
    ...
  },
  ...
]
```

**Query Parameters:**
- `role`: "instructor" (courses I teach) or "student" (courses I'm enrolled in)
- `is_active`: Filter by active/archived status

#### Get Course Details
```http
GET /api/courses/{course_id}

Response: 200 OK
{
  "id": "uuid",
  "title": "Introduction to Algorithms",
  "description": "...",
  "course_code": "CS101",
  "semester": "Fall 2026",
  "is_active": true,
  "enrollment_count": 25,
  "assignment_count": 5,
  "material_count": 10,
  "enrollments": [...],
  "recent_assignments": [...]
}
```

#### Update Course
```http
PUT /api/courses/{course_id}
Content-Type: application/json

{
  "title": "Advanced Algorithms",
  "description": "Updated description",
  "is_active": false
}

Response: 200 OK
```

#### Delete Course
```http
DELETE /api/courses/{course_id}

Response: 204 No Content
```

**Behavior:**
- Cascade deletes enrollments and materials
- Sets `assignments.course_id = NULL` (moves to open assignments)
- Retains assignment data

### 4.2 Student Enrollment

#### Enroll Students Individually
```http
POST /api/courses/{course_id}/enroll
Content-Type: application/json

{
  "students": [
    {"email": "student1@example.com"},
    {"email": "student2@example.com"},
    {"email": "student3@example.com"}
  ],
  "role": "student",
  "send_email": true
}

Response: 200 OK
{
  "enrolled": 2,
  "pending": 1,
  "failed": [],
  "enrollments": [
    {
      "id": "uuid",
      "course_id": "course_uuid",
      "user_id": "firebase_uid",  // or "pending_<email>"
      "email": "student1@example.com",
      "role": "student",
      "status": "active",
      "enrolled_at": "2026-02-08T10:00:00Z"
    },
    ...
  ]
}
```

**Logic:**
1. Look up each email in Firebase
2. If registered → create enrollment with Firebase UID
3. If not registered → create enrollment with `"pending_<email>"` and store email
4. Return detailed results

#### Enroll Students from CSV
```http
POST /api/courses/{course_id}/enroll-csv
Content-Type: multipart/form-data

file: students.csv

Response: 200 OK
{
  "enrolled": 23,
  "pending": 2,
  "failed": ["invalid@"],
  "enrollments": [...]
}
```

**CSV Format:**
```csv
email,name
student1@example.com,John Doe
student2@example.com,Jane Smith
student3@example.com,Bob Johnson
```

**Supported Column Names:**
- `email`, `Email`, `EMAIL`, `e-mail` (required)
- `name`, `Name` (optional, for display only)

**Processing:**
1. Parse CSV with pandas
2. Extract emails (flexible column name matching)
3. Validate email format
4. Bulk enroll using same logic as individual enrollment
5. Return summary with success/pending/failed counts

#### List Enrollments
```http
GET /api/courses/{course_id}/enrollments?status=active&role=student

Response: 200 OK
[
  {
    "id": "uuid",
    "user_id": "firebase_uid",
    "email": "student1@example.com",
    "role": "student",
    "status": "active",
    "enrolled_at": "2026-02-08T10:00:00Z"
  },
  ...
]
```

#### Remove Student
```http
DELETE /api/courses/{course_id}/enrollments/{enrollment_id}

Response: 204 No Content
```

### 4.3 Course Materials

#### Upload Material
```http
POST /api/courses/{course_id}/materials
Content-Type: multipart/form-data

file: lecture1.pdf
title: "Lecture 1: Introduction"
description: "Course introduction and syllabus"
material_type: "lecture_notes"
folder: "Week 1"

Response: 201 Created
{
  "id": "uuid",
  "course_id": "course_uuid",
  "title": "Lecture 1: Introduction",
  "description": "Course introduction and syllabus",
  "material_type": "lecture_notes",
  "s3_key": "courses/{course_id}/materials/{uuid}_lecture1.pdf",
  "file_name": "lecture1.pdf",
  "file_size": "2457600",
  "mime_type": "application/pdf",
  "folder": "Week 1",
  "created_at": "2026-02-08T10:00:00Z"
}
```

**Supported File Types:**
- PDF (application/pdf)
- DOCX (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- Maximum size: 50MB

**S3 Storage:**
- Key format: `courses/{course_id}/materials/{uuid}_{original_filename}`
- Uses same S3 bucket as assignment diagrams

#### Link Video to Course
```http
POST /api/courses/{course_id}/materials/link-video
Content-Type: application/json

{
  "video_id": "existing_video_uuid",
  "title": "Lecture 2: Big O Notation",
  "description": "Understanding time complexity",
  "folder": "Week 1"
}

Response: 201 Created
{
  "id": "uuid",
  "course_id": "course_uuid",
  "video_id": "existing_video_uuid",
  "title": "Lecture 2: Big O Notation",
  "material_type": "video",
  "folder": "Week 1",
  "created_at": "2026-02-08T10:00:00Z"
}
```

#### List Materials
```http
GET /api/courses/{course_id}/materials?material_type=lecture_notes&folder=Week 1

Response: 200 OK
[
  {
    "id": "uuid",
    "title": "Lecture 1: Introduction",
    "material_type": "lecture_notes",
    "file_name": "lecture1.pdf",
    "file_size": "2457600",
    "folder": "Week 1",
    "created_at": "2026-02-08T10:00:00Z"
  },
  ...
]
```

#### Download Material
```http
GET /api/courses/{course_id}/materials/{material_id}/download

Response: 200 OK
{
  "download_url": "https://s3.amazonaws.com/bucket/path?X-Amz-Expires=3600&...",
  "expires_at": "2026-02-08T11:00:00Z"
}
```

Returns presigned S3 URL valid for 1 hour.

#### Delete Material
```http
DELETE /api/courses/{course_id}/materials/{material_id}

Response: 204 No Content
```

Deletes from S3 and database.

### 4.4 Course-Specific Assignments

#### Create Assignment with Course
```http
POST /api/assignments
Content-Type: application/json

{
  "title": "Homework 1: Sorting Algorithms",
  "description": "Implement quicksort and mergesort",
  "course_id": "course_uuid",  // NEW FIELD
  "due_date": "2026-02-15T23:59:59Z",
  "questions": [...],
  ...
}

Response: 201 Created
```

**Note:** If `course_id` is null, it's an "Open Assignment"

#### List Course Assignments
```http
GET /api/courses/{course_id}/assignments

Response: 200 OK
[
  {
    "id": "uuid",
    "title": "Homework 1: Sorting Algorithms",
    "due_date": "2026-02-15T23:59:59Z",
    "total_points": "100",
    "total_questions": "5",
    "status": "published",
    "shared_count": "25",
    ...
  },
  ...
]
```

#### Modify Existing Assignment Endpoint
```http
GET /api/assignments?course_id=null  // Open assignments
GET /api/assignments?course_id={course_id}  // Course-specific
```

### 4.5 Authorization Rules

**Courses:**
- Create: Any authenticated user
- Read: Owner or enrolled student
- Update: Owner only
- Delete: Owner only

**Enrollments:**
- Create: Course owner only
- Read: Course owner or enrolled student
- Delete: Course owner only

**Materials:**
- Create: Course owner only
- Read: Course owner or enrolled student
- Delete: Course owner only

**Assignments:**
- Associate with course: Course owner only
- View course assignments: Course owner or enrolled student

---

## 5. Frontend UI/UX Design

### 5.1 Professor View Redesign

#### MyAssignments.jsx - New Layout

```
┌────────────────────────────────────────────────────────────┐
│  My Assignments                                 [+ Create] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐                                     │
│  │  My Courses      │                                     │
│  │  [+ New Course]  │                                     │
│  ├──────────────────┤                                     │
│  │                  │  CS101 - Intro to Algorithms       │
│  │ ● CS101          │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  │   CS102          │                                     │
│  │   Open Assign.   │  ┌────────────┐ ┌────────────┐     │
│  │                  │  │ HW1        │ │ HW2        │     │
│  └──────────────────┘  │ Published  │ │ Draft      │     │
│                        │ 25 students│ │ 8 questions│     │
│                        │ [Edit]     │ │ [Edit]     │     │
│                        └────────────┘ └────────────┘     │
│                                                            │
│                        ┌────────────┐ ┌────────────┐     │
│                        │ Quiz 1     │ │ Lab 1      │     │
│                        │ Published  │ │ Published  │     │
│                        │ 25 students│ │ 20 students│     │
│                        │ [Edit]     │ │ [Edit]     │     │
│                        └────────────┘ └────────────┘     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Courses Sidebar:** List all courses + "Open Assignments" option
- **Active Course Indicator:** Visual indicator (●) for selected course
- **Filtered Assignments:** Only show assignments for selected course
- **Course Statistics:** Show enrollment count, assignment count
- **Create Course Button:** Opens modal for course creation

#### CourseDetailView.jsx - New Component

```
┌────────────────────────────────────────────────────────────┐
│  ← Back to Courses     CS101 - Introduction to Algorithms │
├────────────────────────────────────────────────────────────┤
│  [Overview] [Students] [Assignments] [Materials]           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Students Tab                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                            │
│  Current Students (25 enrolled)           [+ Add Student] │
│                                          [↑ Upload CSV]   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Name              Email                    [Remove]│   │
│  ├────────────────────────────────────────────────────┤   │
│  │ John Doe          john@example.com        [Remove]│   │
│  │ Jane Smith        jane@example.com        [Remove]│   │
│  │ Bob Johnson       bob@example.com         [Remove]│   │
│  │ 🕒 Alice Pending  alice@example.com       [Remove]│   │
│  │                   (Pending invitation)             │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Tabs:**

**1. Overview Tab:**
- Course metadata (title, code, semester, description)
- Edit button
- Quick stats (students, assignments, materials)
- Recent activity

**2. Students Tab:**
- Current students table with name, email, remove button
- Add student by email (search registered users or invite new)
- Upload CSV button (drag-and-drop zone)
- Pending enrollments with visual indicator (🕒)
- CSV format guide/tooltip

**3. Assignments Tab:**
- Course-specific assignments
- Create assignment button (pre-fills course_id)
- Same card layout as MyAssignments

**4. Materials Tab:**
- Materials list grouped by folder/week
- Upload file button (PDF, DOCX)
- Link existing video button
- Material cards with:
  - Icon based on type (📄 PDF, 📹 Video)
  - Title and description
  - Download button
  - Delete button
  - Folder/section label

#### CreateCourseModal.jsx - New Component

```
┌──────────────────────────────────────────┐
│  Create New Course                   [×] │
├──────────────────────────────────────────┤
│                                          │
│  Course Title *                          │
│  ┌────────────────────────────────────┐  │
│  │ Introduction to Algorithms         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Course Code (optional)                  │
│  ┌────────────────────────────────────┐  │
│  │ CS101                              │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Semester (optional)                     │
│  ┌────────────────────────────────────┐  │
│  │ Fall 2026                          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Description (optional)                  │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │ Learn fundamental algorithms...    │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│              [Cancel]  [Create Course]   │
│                                          │
└──────────────────────────────────────────┘
```

### 5.2 Student View Redesign

#### AssignedToMe.jsx - New Layout

```
┌────────────────────────────────────────────────────────────┐
│  Assigned to Me                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  My Courses                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │ CS101        │ │ CS102        │ │ Open         │      │
│  │ Intro to Alg.│ │ Data Struct. │ │ Assignments  │      │
│  │              │ │              │ │              │      │
│  │ 5 Assignments│ │ 3 Assignments│ │ 2 Assignments│      │
│  │ 3 Materials  │ │ 5 Materials  │ │              │      │
│  │              │ │              │ │              │      │
│  │ [View →]     │ │ [View →]     │ │ [View →]     │      │
│  └──────────────┘ └──────────────┘ └──────────────┘      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Course Cards:** Show enrolled courses as cards/tiles
- **Assignment Count:** Display number of assignments per course
- **Material Count:** Display number of materials
- **Quick Access:** Click card to view course details
- **Open Assignments:** Separate card for directly-shared assignments

#### StudentCourseView.jsx - New Component

```
┌────────────────────────────────────────────────────────────┐
│  ← Back to Courses     CS101 - Introduction to Algorithms │
├────────────────────────────────────────────────────────────┤
│  [Materials] [Assignments]                                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Materials Tab                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                            │
│  Week 1                                                    │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 📄 Lecture 1: Introduction       [Download PDF]   │   │
│  │    Course introduction and syllabus                │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ 📹 Lecture 2: Big O Notation      [Watch Video]   │   │
│  │    Understanding time complexity                   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  Week 2                                                    │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 📄 Lecture 3: Sorting            [Download PDF]   │   │
│  │    Quicksort and mergesort algorithms              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Tabs:**

**1. Materials Tab:**
- Materials grouped by folder/week
- File type icons (📄 PDF, 📹 Video, 📝 Reading)
- Download buttons for files
- Video player for linked videos
- Clean, scannable layout

**2. Assignments Tab:**
- Course-specific assignments
- Same card layout as current AssignedToMe
- Status badges (not started, in progress, submitted, graded)
- Start/continue buttons

### 5.3 Modified Components

#### AssignmentBuilder.jsx - Course Selection

Add at the top of the builder form:

```
┌────────────────────────────────────────────────────────────┐
│  Create Assignment                                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Associate with Course (optional)                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Select course ▼                                    │   │
│  │ ┌────────────────────────────────────────────────┐ │   │
│  │ │ Open Assignment (No Course)                    │ │   │
│  │ │ CS101 - Introduction to Algorithms             │ │   │
│  │ │ CS102 - Data Structures                        │ │   │
│  │ └────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  Assignment Title *                                        │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Homework 1: Sorting Algorithms                     │   │
│  └────────────────────────────────────────────────────┘   │
│  ...                                                       │
└────────────────────────────────────────────────────────────┘
```

#### AssignmentSharingModal.jsx - Course Integration

If assignment has course_id, show enrolled students:

```
┌────────────────────────────────────────────────────────────┐
│  Share Assignment - HW1 (CS101)                        [×] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Course Students (25 enrolled)                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ ☑ Share with all enrolled students                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  Additional Recipients                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Add students not in the course...                   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  Current Recipients (25)                                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ John Doe <john@example.com>               [Remove] │  │
│  │ Jane Smith <jane@example.com>             [Remove] │  │
│  │ ...                                                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│                           [Cancel]  [Share Assignment]    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.4 Component Architecture

**New Components:**
- `CourseCard.jsx` - Reusable course card (professor & student views)
- `CreateCourseModal.jsx` - Course creation form
- `CourseDetailView.jsx` - Professor's course management page
- `StudentCourseView.jsx` - Student's course view page
- `StudentEnrollmentManager.jsx` - Student roster management
- `CourseMaterialsSection.jsx` - Materials upload and display
- `courseApi.js` - API client for course operations

**Modified Components:**
- `MyAssignments.jsx` - Add courses sidebar, filter by course
- `AssignedToMe.jsx` - Add course cards grid
- `AssignmentBuilder.jsx` - Add course selection dropdown
- `AssignmentSharingModal.jsx` - Show course students

### 5.5 Navigation Flow

```
Professor Flow:
MyAssignments
  → Click "Create Course" → CreateCourseModal → Course Created
  → Click Course → CourseDetailView
      → Students Tab → Add/Remove Students, Upload CSV
      → Materials Tab → Upload Files, Link Videos
      → Assignments Tab → Create Assignment → AssignmentBuilder (pre-filled course_id)
  → Click "Open Assignments" → Show course_id = NULL assignments

Student Flow:
AssignedToMe
  → View Enrolled Courses (cards)
  → Click Course Card → StudentCourseView
      → Materials Tab → Download files, watch videos
      → Assignments Tab → Start/Continue assignments
  → Click "Open Assignments" → Show directly-shared assignments
```

---

## 6. File Upload & Processing

### 6.1 CSV Student List Upload

#### Frontend Implementation

**Component:** StudentEnrollmentManager.jsx

**UI Features:**
- Drag-and-drop zone using `react-dropzone`
- File validation (CSV, XLSX, max 10MB)
- Upload progress indicator
- Result summary (enrolled, pending, failed)
- Error handling with user-friendly messages

**Code Flow:**
```javascript
const handleCsvUpload = async (file) => {
  // Validate file type
  if (!['text/csv', 'application/vnd.ms-excel'].includes(file.type)) {
    toast.error('Please upload a CSV file');
    return;
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast.error('File size must be less than 10MB');
    return;
  }

  try {
    setUploading(true);
    const response = await courseApi.enrollStudentsCSV(courseId, file);

    // Show success notification
    toast.success(`Enrolled ${response.enrolled} students successfully`);

    // Show pending notification
    if (response.pending > 0) {
      toast.info(`${response.pending} students invited (pending registration)`);
    }

    // Show errors
    if (response.failed.length > 0) {
      toast.warning(`Failed to enroll: ${response.failed.join(', ')}`);
    }

    // Refresh enrollment list
    loadEnrollments();
  } catch (error) {
    toast.error('Failed to process CSV file');
  } finally {
    setUploading(false);
  }
};
```

#### Backend Implementation

**File:** routes/courses.py

**Libraries:**
- `pandas` - CSV parsing
- `io` - In-memory file handling

**Code Flow:**
```python
import pandas as pd
import io
import re

@router.post("/api/courses/{course_id}/enroll-csv")
async def enroll_students_csv(
    course_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # 1. Verify course ownership
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course or course.user_id != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # 2. Parse CSV
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))

    # 3. Find email column (flexible matching)
    email_column = None
    for col in ['email', 'Email', 'EMAIL', 'e-mail', 'E-mail']:
        if col in df.columns:
            email_column = col
            break

    if not email_column:
        raise HTTPException(
            status_code=400,
            detail="CSV must have 'email' column"
        )

    # 4. Extract and validate emails
    emails = df[email_column].dropna().unique().tolist()

    # 5. Enroll students
    enrolled = []
    pending = []
    failed = []

    for email in emails:
        # Validate email format
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            failed.append(email)
            continue

        # Check if user exists in Firebase
        try:
            user_record = auth.get_user_by_email(email)
            user_id = user_record.uid
            status = "active"
        except auth.UserNotFoundError:
            user_id = f"pending_{email}"
            status = "pending"

        # Check for duplicate enrollment
        existing = db.query(CourseEnrollment).filter(
            and_(
                CourseEnrollment.course_id == course_id,
                or_(
                    CourseEnrollment.user_id == user_id,
                    CourseEnrollment.email == email
                )
            )
        ).first()

        if existing:
            continue  # Skip duplicates

        # Create enrollment
        enrollment = CourseEnrollment(
            course_id=course_id,
            user_id=user_id,
            email=email,
            role="student",
            status=status
        )

        db.add(enrollment)

        if status == "active":
            enrolled.append(enrollment)
        else:
            pending.append(enrollment)

    db.commit()

    # 6. Return results
    return {
        "enrolled": len(enrolled),
        "pending": len(pending),
        "failed": failed,
        "enrollments": enrolled + pending
    }
```

**Supported CSV Formats:**

Format 1: Email only
```csv
email
student1@example.com
student2@example.com
student3@example.com
```

Format 2: Email + Name
```csv
email,name
student1@example.com,John Doe
student2@example.com,Jane Smith
student3@example.com,Bob Johnson
```

Format 3: Excel export (multiple columns)
```csv
Email,Name,Student ID,Phone
student1@example.com,John Doe,12345,555-1234
student2@example.com,Jane Smith,12346,555-5678
```

### 6.2 Lecture Notes Upload (PDF, DOCX)

#### Frontend Implementation

**Component:** CourseMaterialsSection.jsx

**UI Features:**
- File picker with drag-and-drop
- File type validation (PDF, DOCX only)
- File size validation (max 50MB)
- Upload progress bar
- Material metadata form (title, description, folder)

**Code Flow:**
```javascript
const handleFileUpload = async (file, metadata) => {
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    toast.error('Only PDF and DOCX files are supported');
    return;
  }

  // Validate file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    toast.error('File size must be less than 50MB');
    return;
  }

  try {
    setUploading(true);

    // Upload with progress tracking
    const response = await courseApi.uploadMaterial(
      courseId,
      file,
      metadata.title || file.name,
      metadata.description,
      'lecture_notes',
      metadata.folder,
      (progressEvent) => {
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        setUploadProgress(progress);
      }
    );

    toast.success('Material uploaded successfully');
    loadMaterials();
  } catch (error) {
    toast.error('Failed to upload material');
  } finally {
    setUploading(false);
    setUploadProgress(0);
  }
};
```

#### Backend Implementation

**File:** routes/courses.py

**Libraries:**
- `boto3` - AWS S3 client
- `uuid` - Unique file identifiers

**Code Flow:**
```python
@router.post("/api/courses/{course_id}/materials")
async def upload_course_material(
    course_id: str,
    file: UploadFile = File(...),
    title: str = Form(...),
    material_type: str = Form("lecture_notes"),
    description: str = Form(None),
    folder: str = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # 1. Verify course ownership
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course or course.user_id != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # 2. Validate file type
    allowed_types = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # 3. Read file content
    file_content = await file.read()

    # 4. Validate file size (max 50MB)
    if len(file_content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    # 5. Generate S3 key
    file_uuid = str(uuid.uuid4())
    s3_key = f"courses/{course_id}/materials/{file_uuid}_{file.filename}"

    # 6. Upload to S3
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=file_content,
            ContentType=file.content_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="S3 upload failed")

    # 7. Create material record
    material = CourseMaterial(
        course_id=course_id,
        title=title,
        description=description,
        material_type=material_type,
        s3_key=s3_key,
        file_name=file.filename,
        file_size=str(len(file_content)),
        mime_type=file.content_type,
        folder=folder
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    return material
```

**S3 Storage Structure:**
```
s3://vidya-ai-bucket/
└── courses/
    └── {course_id}/
        └── materials/
            ├── {uuid1}_lecture1.pdf
            ├── {uuid2}_slides.pdf
            └── {uuid3}_reading.docx
```

### 6.3 Video Upload and Linking

#### Option 1: Link Existing Video

**Frontend:**
```javascript
// Open video picker modal
const handleLinkVideo = async (videoId, title, description, folder) => {
  try {
    const response = await courseApi.linkVideo(
      courseId,
      videoId,
      title,
      description,
      folder
    );

    toast.success('Video linked to course');
    loadMaterials();
  } catch (error) {
    toast.error('Failed to link video');
  }
};
```

**Backend:**
```python
@router.post("/api/courses/{course_id}/materials/link-video")
async def link_video_to_course(
    course_id: str,
    data: CourseMaterialLinkVideo,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Verify course ownership
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course or course.user_id != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Verify video exists and belongs to user
    video = db.query(Video).filter(
        and_(Video.id == data.video_id, Video.user_id == current_user["uid"])
    ).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Create material record
    material = CourseMaterial(
        course_id=course_id,
        video_id=data.video_id,
        title=data.title,
        description=data.description,
        material_type="video",
        folder=data.folder
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    return material
```

#### Option 2: Upload New Video

Reuse existing video upload infrastructure and automatically create CourseMaterial record after successful upload.

---

## 7. Migration Strategy

### 7.1 Database Migration (Alembic)

**File:** alembic/versions/XXX_add_course_system.py

**Migration Steps:**

1. Create `courses` table with indexes
2. Create `course_enrollments` table with foreign keys and indexes
3. Create `course_materials` table with foreign keys and indexes
4. Add nullable `course_id` column to `assignments` table
5. Create foreign key from `assignments.course_id` to `courses.id` with `ON DELETE SET NULL`

**Key Design Decision:**
- `course_id` is nullable on assignments
- Existing assignments default to NULL (representing "Open Assignments")
- When course is deleted, assignments are not deleted - they become open assignments

### 7.2 Data Integrity

**No data migration needed:**
- All existing assignments remain intact
- `course_id = NULL` represents "Open Assignments"
- No breaking changes to existing functionality

**Backward Compatibility:**
- Old API calls continue to work (course_id is optional)
- Existing shared assignments still accessible
- Student submissions unaffected

### 7.3 Deployment Checklist

**Pre-Deployment:**
1. ✅ Backup production database
2. ✅ Test migration on staging environment
3. ✅ Verify all API endpoints with Postman
4. ✅ Test frontend flows end-to-end
5. ✅ Review S3 permissions and bucket policies

**Deployment:**
1. ✅ Put application in maintenance mode (optional)
2. ✅ Run Alembic migration: `alembic upgrade head`
3. ✅ Verify tables created: `\d courses`, `\d course_enrollments`, `\d course_materials`
4. ✅ Deploy backend code
5. ✅ Deploy frontend code
6. ✅ Clear CDN cache
7. ✅ Remove maintenance mode

**Post-Deployment:**
1. ✅ Monitor error logs for 24 hours
2. ✅ Test course creation flow
3. ✅ Test student enrollment via CSV
4. ✅ Test material upload
5. ✅ Verify existing assignments still accessible
6. ✅ Gather user feedback

### 7.4 Rollback Plan

**Database Rollback:**
```bash
# Rollback migration
alembic downgrade -1

# Verify rollback
psql vidya_ai_db -c "\d assignments"  # Should not have course_id
```

**Application Rollback:**
```bash
# Redeploy previous version
git checkout <previous-commit>
docker build -t backend:previous .
docker deploy backend:previous

# Or restore from backup
psql vidya_ai_db < backup_before_courses.sql
```

**No Data Loss:**
- All existing data preserved
- New course data can be re-imported if needed
- S3 files remain accessible

---

## 8. Implementation Roadmap

### Phase 1: Backend Foundation (Week 1)

**Goal:** Create database schema and core API endpoints

**Tasks:**
- [ ] Design and review database schema
- [ ] Create SQLAlchemy models (Course, CourseEnrollment, CourseMaterial)
- [ ] Create Pydantic schemas for validation
- [ ] Write Alembic migration file
- [ ] Test migration on dev database
- [ ] Create routes/courses.py with Course CRUD endpoints
- [ ] Write unit tests for course endpoints
- [ ] Test with Postman

**Deliverables:**
- ✅ Database tables created
- ✅ Course CRUD API working
- ✅ Postman collection for testing

### Phase 2: Backend Enrollment & Materials (Week 2)

**Goal:** Implement student enrollment and materials management

**Tasks:**
- [ ] Implement enrollment endpoints (individual + bulk)
- [ ] Add CSV parsing logic with pandas
- [ ] Implement pending enrollment handling
- [ ] Add material upload endpoints (S3 integration)
- [ ] Add video linking endpoint
- [ ] Implement presigned URL generation for downloads
- [ ] Modify assignment endpoints to support course_id
- [ ] Write unit tests for all new endpoints
- [ ] Test CSV upload with various formats

**Deliverables:**
- ✅ Enrollment API working (email + CSV)
- ✅ Materials API working (upload + link)
- ✅ Assignment API updated with course support

### Phase 3: Frontend Core Components (Week 3)

**Goal:** Create reusable course components and API client

**Tasks:**
- [ ] Create courseApi.js with all API methods
- [ ] Create CourseCard.jsx component
- [ ] Create CreateCourseModal.jsx component
- [ ] Create CourseDetailView.jsx (professor view)
- [ ] Create StudentCourseView.jsx (student view)
- [ ] Add routing for new components
- [ ] Test course creation flow end-to-end
- [ ] Add error handling and loading states

**Deliverables:**
- ✅ Course creation working
- ✅ Course list display working
- ✅ Course detail view working

### Phase 4: Frontend Enrollment & Materials (Week 4)

**Goal:** Build student enrollment and materials management UI

**Tasks:**
- [ ] Create StudentEnrollmentManager.jsx
- [ ] Implement CSV upload UI with react-dropzone
- [ ] Add CSV format guide/tooltip
- [ ] Create CourseMaterialsSection.jsx
- [ ] Implement file upload UI with progress bar
- [ ] Implement video linking UI with video picker modal
- [ ] Add download functionality for materials
- [ ] Test enrollment and material management
- [ ] Add success/error notifications

**Deliverables:**
- ✅ Student enrollment working (email + CSV)
- ✅ Materials upload working
- ✅ Video linking working
- ✅ Download functionality working

### Phase 5: Integration & Restructuring (Week 5)

**Goal:** Integrate courses into existing assignment workflows

**Tasks:**
- [ ] Restructure MyAssignments.jsx with courses sidebar
- [ ] Add "Open Assignments" section to MyAssignments
- [ ] Restructure AssignedToMe.jsx with course cards
- [ ] Add "Open Assignments" card to AssignedToMe
- [ ] Update AssignmentBuilder.jsx with course selection
- [ ] Update AssignmentSharingModal.jsx for course integration
- [ ] Test complete professor workflow
- [ ] Test complete student workflow
- [ ] Fix navigation and routing issues

**Deliverables:**
- ✅ MyAssignments restructured
- ✅ AssignedToMe restructured
- ✅ End-to-end workflows tested

### Phase 6: Polish & Testing (Week 6)

**Goal:** Refine UI/UX and ensure quality

**Tasks:**
- [ ] Add loading states to all components
- [ ] Implement error boundaries
- [ ] Add toast notifications for all actions
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness testing (iOS, Android)
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] User acceptance testing with beta users
- [ ] Bug fixes based on feedback

**Deliverables:**
- ✅ UI polished
- ✅ Error handling complete
- ✅ Mobile responsive
- ✅ Performance optimized
- ✅ Accessibility compliant

### Phase 7: Deployment & Monitoring (Week 7)

**Goal:** Deploy to production and monitor

**Tasks:**
- [ ] Backup production database
- [ ] Deploy database migration to production
- [ ] Deploy backend changes to production
- [ ] Deploy frontend changes to production
- [ ] Verify deployment successful
- [ ] Monitor error logs and metrics
- [ ] Gather user feedback
- [ ] Create support documentation
- [ ] Fix critical bugs if any
- [ ] Plan next iteration improvements

**Deliverables:**
- ✅ Production deployment complete
- ✅ Monitoring in place
- ✅ User feedback collected
- ✅ Documentation created

---

## 9. Technical Considerations

### 9.1 Security

**Authentication & Authorization:**
- Verify course ownership before any modifications
- Check enrollment status before allowing course access
- Validate user permissions for materials and assignments
- Use Firebase Auth for user identity verification

**File Security:**
- Validate file types (whitelist: PDF, DOCX, CSV)
- Validate file sizes (max 50MB for materials, 10MB for CSV)
- Sanitize filenames to prevent path traversal
- Use presigned URLs with 1-hour expiry
- Store files in private S3 bucket (not public)

**Data Validation:**
- Validate email format with regex
- Prevent SQL injection with parameterized queries
- Sanitize user input (XSS prevention)
- Validate course_id existence before associations

**CORS & API Security:**
- Configure CORS for file uploads
- Rate limiting on upload endpoints
- API authentication on all endpoints

### 9.2 Performance

**Database Optimization:**
- Index on course_id, user_id, email columns
- Composite index on (course_id, user_id) for enrollments
- Query optimization for course listing (eager loading)
- Pagination for large result sets (20 items per page)

**Frontend Optimization:**
- Lazy loading for course components
- Code splitting by route
- Caching course data (5-minute TTL)
- Optimistic UI updates
- Debounced search inputs

**File Handling:**
- Stream large files instead of loading in memory
- Use multipart upload for large files
- Compress responses (gzip)
- CDN for S3 content delivery (CloudFront)

**API Optimization:**
- Batch API requests where possible
- GraphQL for complex queries (future consideration)
- Response caching with Redis (future consideration)

### 9.3 Error Handling

**Backend Error Handling:**
- Return meaningful HTTP status codes (400, 403, 404, 500)
- Provide detailed error messages
- Log errors with stack traces
- Graceful degradation on S3 failures

**Frontend Error Handling:**
- Toast notifications for user feedback
- Error boundaries for React components
- Retry logic for network failures (3 attempts)
- Offline detection and messaging
- Form validation with clear error messages

**CSV Upload Errors:**
- Show which emails failed to enroll
- Provide reasons for failures (invalid format, duplicate, etc.)
- Allow partial success (enroll successful ones, report failures)
- Download error report as CSV

**File Upload Errors:**
- Progress bar with cancel option
- Clear error messages (file too large, invalid type, etc.)
- Automatic retry on network failure
- Fallback to chunked upload for large files

### 9.4 User Experience (UX)

**Loading States:**
- Skeleton screens for course loading
- Progress bars for file uploads
- Spinners for API requests
- Disable buttons during operations

**Empty States:**
- Friendly "No courses yet" message
- Call-to-action buttons (Create Course, Add Students)
- Helpful illustrations or icons
- Onboarding tips for first-time users

**Feedback & Notifications:**
- Success toasts (green, auto-dismiss in 3s)
- Error toasts (red, manual dismiss)
- Info toasts (blue, auto-dismiss in 5s)
- Warning toasts (yellow, manual dismiss)

**Search & Filtering:**
- Search courses by name or code
- Filter by semester
- Filter by active/archived status
- Sort by name, date, enrollment count

**Drag & Drop:**
- Visual feedback on drag hover
- Upload progress during drop
- Support multiple file selection
- Clear instructions ("Drag CSV here or click to browse")

**Breadcrumbs & Navigation:**
- Clear navigation path (Courses > CS101 > Materials)
- Back buttons to previous views
- Consistent header across views
- Active tab indicators

### 9.5 Scalability

**Database Scalability:**
- Partition large tables by date or user
- Archive old courses (is_active = false)
- Implement soft deletes for data recovery
- Regular vacuum and analyze operations

**File Storage Scalability:**
- Use S3 lifecycle policies (archive old files to Glacier)
- Implement CDN for global distribution
- Compress files before upload
- Deduplication for identical files

**API Scalability:**
- Horizontal scaling with load balancer
- Connection pooling for database
- Caching layer (Redis) for frequent queries
- Background job queue for heavy operations (batch grading)

**Frontend Scalability:**
- Lazy load course data (load on demand)
- Virtual scrolling for long lists
- Pagination for large datasets
- Service worker for offline support

---

## Summary

This comprehensive plan provides a detailed blueprint for transforming the Vidya AI assignment management system into a Canvas-like course-based organization. The design is:

✅ **User-Centric** - Intuitive UI based on familiar Canvas patterns
✅ **Scalable** - Course-based architecture supports unlimited growth
✅ **Maintainable** - Clean separation of concerns, modular components
✅ **Backward Compatible** - Existing assignments preserved as "Open Assignments"
✅ **Secure** - Proper authorization, file validation, S3 presigned URLs
✅ **Well-Tested** - Comprehensive testing strategy at each phase
✅ **Production-Ready** - Includes deployment, monitoring, and rollback plans

The implementation can proceed in 7 phases over 7 weeks, with each phase delivering working functionality that can be tested and validated before moving to the next phase.
