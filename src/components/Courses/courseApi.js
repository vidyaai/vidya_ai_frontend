// src/components/Courses/courseApi.js
// API client for all course-related operations
import { api } from '../generic/utils.jsx';

const HEADERS = { 'ngrok-skip-browser-warning': 'true' };

export const courseApi = {
  // ── Course CRUD ──────────────────────────────────────────────────────

  async createCourse(data) {
    const response = await api.post('/api/courses', data, { headers: HEADERS });
    return response.data;
  },

  async listCourses(role = null, isActive = null) {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (isActive !== null) params.append('is_active', isActive);
    const response = await api.get(`/api/courses?${params.toString()}`, { headers: HEADERS });
    return response.data;
  },

  async getCourse(courseId) {
    const response = await api.get(`/api/courses/${courseId}`, { headers: HEADERS });
    return response.data;
  },

  async updateCourse(courseId, data) {
    const response = await api.put(`/api/courses/${courseId}`, data, { headers: HEADERS });
    return response.data;
  },

  async deleteCourse(courseId) {
    const response = await api.delete(`/api/courses/${courseId}`, { headers: HEADERS });
    return response.data;
  },

  // ── Enrollment ────────────────────────────────────────────────────────

  async enrollStudents(courseId, students, role = 'student') {
    const response = await api.post(
      `/api/courses/${courseId}/enroll`,
      { students, role },
      { headers: HEADERS }
    );
    return response.data;
  },

  async enrollStudentsCSV(courseId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/courses/${courseId}/enroll-csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data', ...HEADERS },
    });
    return response.data;
  },

  async listEnrollments(courseId, status = null, role = null) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (role) params.append('role', role);
    const response = await api.get(
      `/api/courses/${courseId}/enrollments?${params.toString()}`,
      { headers: HEADERS }
    );
    return response.data;
  },

  async removeEnrollment(courseId, enrollmentId) {
    const response = await api.delete(
      `/api/courses/${courseId}/enrollments/${enrollmentId}`,
      { headers: HEADERS }
    );
    return response.data;
  },

  // ── Materials ─────────────────────────────────────────────────────────

  async uploadMaterial(courseId, file, title, description, materialType, folder, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('material_type', materialType || 'lecture_notes');
    if (folder) formData.append('folder', folder);
    const response = await api.post(`/api/courses/${courseId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data', ...HEADERS },
      onUploadProgress,
    });
    return response.data;
  },

  async linkVideo(courseId, videoId, title, description, folder) {
    const response = await api.post(
      `/api/courses/${courseId}/materials/link-video`,
      { video_id: videoId, title, description, folder },
      { headers: HEADERS }
    );
    return response.data;
  },

  async listMaterials(courseId, materialType = null, folder = null) {
    const params = new URLSearchParams();
    if (materialType) params.append('material_type', materialType);
    if (folder) params.append('folder', folder);
    const response = await api.get(
      `/api/courses/${courseId}/materials?${params.toString()}`,
      { headers: HEADERS }
    );
    return response.data;
  },

  async downloadMaterial(courseId, materialId) {
    const response = await api.get(
      `/api/courses/${courseId}/materials/${materialId}/download`,
      { headers: HEADERS }
    );
    return response.data;
  },

  async deleteMaterial(courseId, materialId) {
    const response = await api.delete(
      `/api/courses/${courseId}/materials/${materialId}`,
      { headers: HEADERS }
    );
    return response.data;
  },

  // ── Course Assignments ────────────────────────────────────────────────

  async listCourseAssignments(courseId) {
    const response = await api.get(`/api/courses/${courseId}/assignments`, { headers: HEADERS });
    return response.data;
  },

  // ── Teaching Assistants ───────────────────────────────────────────────

  async listTAs(courseId) {
    const response = await api.get(
      `/api/courses/${courseId}/enrollments?role=ta`,
      { headers: HEADERS }
    );
    return response.data;
  },

  async addTA(courseId, email) {
    const response = await api.post(
      `/api/courses/${courseId}/enroll`,
      { students: [{ email }], role: 'ta' },
      { headers: HEADERS }
    );
    return response.data;
  },

  async removeTA(courseId, enrollmentId) {
    const response = await api.delete(
      `/api/courses/${courseId}/enrollments/${enrollmentId}`,
      { headers: HEADERS }
    );
    return response.data;
  },

  // ── Videos (materials of type video) ──────────────────────────────────

  async listVideos(courseId) {
    const response = await api.get(
      `/api/courses/${courseId}/materials?material_type=video`,
      { headers: HEADERS }
    );
    return response.data;
  },

  // ── Lecture Notes (materials of type lecture_notes) ────────────────────

  async listLectureNotes(courseId) {
    const response = await api.get(
      `/api/courses/${courseId}/materials?material_type=lecture_notes`,
      { headers: HEADERS }
    );
    return response.data;
  },
};

export default courseApi;
