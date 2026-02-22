# Course Organization System Implementation Plan

## Context

The current assignment management system displays all assignments in a flat structure without any organizational hierarchy. This plan transforms the system into a Canvas-like course-based organization where assignments, materials, and students are organized by courses. The goal is to:

1. Group assignments under courses for better organization
2. Allow professors to manage course rosters, materials, and assignments in one place
3. Provide students with a structured view of their enrolled courses
4. Maintain backward compatibility by moving existing assignments to "Open Assignments"

## Database Schema Changes

### New Tables

**courses**
- Links to creator (user_id)
- Contains course metadata (title, code, semester, description)
- Tracks active/archived status
- One-to-many with assignments, enrollments, and materials

**course_enrollments**
- Links students to courses (many-to-many through junction table)
- Supports pending enrollments via "pending_<email>" pattern (mirroring current shared_links system)
- Tracks enrollment status and role (student/TA/instructor)

**course_materials**
- Stores course materials (lecture notes, videos, readings)
- Supports S3-uploaded files and linked videos
- Organizes materials by type and folder

### Modified Tables

**assignments**
- Add nullable `course_id` foreign key
- Existing assignments have NULL (representing "Open Assignments")
- New assignments can be associated with courses

## Backend Implementation

### New API Endpoints (routes/courses.py)

**Course CRUD:**
- POST /api/courses - Create course
- GET /api/courses - List courses (filtered by role)
- GET /api/courses/{id} - Get course details
- PUT /api/courses/{id} - Update course
- DELETE /api/courses/{id} - Delete course (sets assignments to NULL)

**Enrollment:**
- POST /api/courses/{id}/enroll - Add students individually
- POST /api/courses/{id}/enroll-csv - Bulk upload from CSV/Excel
- GET /api/courses/{id}/enrollments - List enrolled students
- DELETE /api/courses/{id}/enrollments/{id} - Remove student

**Materials:**
- POST /api/courses/{id}/materials - Upload file (PDF, DOCX)
- POST /api/courses/{id}/materials/link-video - Link existing video
- GET /api/courses/{id}/materials - List materials
- GET /api/courses/{id}/materials/{id}/download - Get presigned S3 URL
- DELETE /api/courses/{id}/materials/{id} - Delete material

**Course-Specific Assignments:**
- GET /api/courses/{id}/assignments - List course assignments
- Modify POST /api/assignments to accept optional course_id

### CSV Processing
- Parse CSV files with pandas
- Support multiple column formats (email, Email, e-mail)
- Handle registered users (Firebase lookup) vs pending invitations
- Return detailed results (enrolled count, pending count, failed emails)

## Frontend Implementation

### Restructured Components

**MyAssignments.jsx (Professor View)**
- Add courses sidebar/section showing all courses
- Add "Open Assignments" option (course_id = NULL)
- Filter assignments by selected course
- Add "Create Course" button

**AssignedToMe.jsx (Student View)**
- Display enrolled courses as cards/grid
- Show assignment count per course
- Add "Open Assignments" card for directly-shared assignments
- Click course to view course details

### New Components

**CourseCard.jsx** - Reusable course card with stats
**CreateCourseModal.jsx** - Form for creating courses
**CourseDetailView.jsx** - Professor view with tabs (Students, Assignments, Materials)
**StudentCourseView.jsx** - Student view of course (Materials, Assignments)
**StudentEnrollmentManager.jsx** - UI for adding students (email search + CSV upload)
**CourseMaterialsSection.jsx** - Upload files and link videos
**courseApi.js** - API client for all course operations

### Modified Components

**AssignmentBuilder.jsx**
- Add course selection dropdown at top
- Allow choosing "Open Assignment" or specific course

**AssignmentSharingModal.jsx**
- Show enrolled students as default recipients for course assignments
- Add "Share with entire course" option

## File Upload Handling

### CSV Student Lists
- Support CSV/Excel with email column (flexible column names)
- Drag-and-drop UI with react-dropzone
- Parse with pandas on backend
- Show detailed upload results (success/pending/failed)
- Email validation and duplicate checking

### Lecture Notes Upload
- Accept PDF and DOCX files (max 50MB)
- Upload to S3 with key format: `courses/{course_id}/materials/{uuid}_{filename}`
- Store metadata in course_materials table
- Generate presigned URLs for downloads (1-hour expiry)

### Video Linking
- Option 1: Link existing videos from user's video library
- Option 2: Upload new video (reuse existing video upload infrastructure)
- Store video_id foreign key in course_materials

## Migration Strategy

### Database Migration
- Alembic migration creates 3 new tables
- Adds nullable course_id column to assignments
- All existing assignments default to NULL (Open Assignments)
- No data migration needed - fully backward compatible

### Deployment Steps
1. Backup database
2. Run Alembic migration
3. Deploy backend with new routes
4. Deploy frontend with new components
5. Monitor for errors

### Rollback Plan
- Alembic downgrade removes new tables
- Restore from backup if needed
- Existing assignments unaffected

## Critical Files to Modify

### Backend
- [models.py](../../vidya_ai_backend/src/models.py) - Add Course, CourseEnrollment, CourseMaterial models
- [schemas.py](../../vidya_ai_backend/src/schemas.py) - Add Pydantic schemas
- [routes/courses.py](../../vidya_ai_backend/src/routes/courses.py) - NEW FILE - All course endpoints
- [routes/assignments.py](../../vidya_ai_backend/src/routes/assignments.py) - Add course_id support
- [alembic/versions/XXX_add_course_system.py](../../vidya_ai_backend/alembic/versions/) - NEW FILE - Migration

### Frontend
- [MyAssignments.jsx](src/components/Assignments/MyAssignments.jsx) - Restructure with courses
- [AssignedToMe.jsx](src/components/Assignments/AssignedToMe.jsx) - Add course grid
- [AssignmentBuilder.jsx](src/components/Assignments/AssignmentBuilder.jsx) - Add course selector
- [AssignmentSharingModal.jsx](src/components/Assignments/AssignmentSharingModal.jsx) - Course integration
- [Courses/courseApi.js](src/components/Courses/courseApi.js) - NEW FILE - API client
- [Courses/CourseCard.jsx](src/components/Courses/CourseCard.jsx) - NEW FILE
- [Courses/CourseDetailView.jsx](src/components/Courses/CourseDetailView.jsx) - NEW FILE
- [Courses/StudentCourseView.jsx](src/components/Courses/StudentCourseView.jsx) - NEW FILE
- [Courses/CreateCourseModal.jsx](src/components/Courses/CreateCourseModal.jsx) - NEW FILE
- [Courses/StudentEnrollmentManager.jsx](src/components/Courses/StudentEnrollmentManager.jsx) - NEW FILE
- [Courses/CourseMaterialsSection.jsx](src/components/Courses/CourseMaterialsSection.jsx) - NEW FILE

## Verification

### Backend Testing
1. Create course via POST /api/courses
2. Upload CSV with student emails
3. Verify enrollments created (check pending vs registered)
4. Upload PDF lecture notes
5. Link video to course
6. Create assignment with course_id
7. Verify course visible to enrolled students

### Frontend Testing
1. Create new course via UI
2. Upload student CSV (test drag-and-drop)
3. Upload lecture notes
4. Link video
5. Create course-specific assignment
6. Verify student sees course in their view
7. Verify existing assignments appear in "Open Assignments"

### End-to-End Flow
1. Professor creates course "CS101"
2. Professor uploads CSV with 25 students
3. Professor uploads 3 lecture PDFs
4. Professor links 2 videos
5. Professor creates 2 assignments for course
6. Student logs in and sees CS101 course card
7. Student clicks course and sees materials + assignments
8. Student completes assignment within course context

## Implementation Phases

**Phase 1: Backend Foundation** - Database models, migrations, Course CRUD API
**Phase 2: Backend Enrollment & Materials** - CSV parsing, material uploads, assignment integration
**Phase 3: Frontend Core** - Course cards, creation modal, API client
**Phase 4: Frontend Enrollment & Materials** - Student manager, file uploads
**Phase 5: Integration** - Restructure existing components with course support
**Phase 6: Polish** - Error handling, loading states, mobile responsiveness
**Phase 7: Deployment** - Production rollout, monitoring, user feedback
