// Assignment API utility functions
import { api } from '../generic/utils.jsx';

export const assignmentApi = {
  // Get all assignments created by the user
  async getMyAssignments(statusFilter = null, sortBy = 'created_at', sortOrder = 'desc') {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    params.append('sort_by', sortBy);
    params.append('sort_order', sortOrder);
    
    const response = await api.get(`/api/assignments?${params.toString()}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Get assignments shared with the user
  async getSharedAssignments(statusFilter = null) {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    
    const queryString = params.toString();
    const url = `/api/assignments/shared-with-me${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Alias for getting assignments assigned to the user (same as shared assignments)
  async getAssignedToMeAssignments(statusFilter = null) {
    return this.getSharedAssignments(statusFilter);
  },

  // Get a specific assignment by ID
  async getAssignment(assignmentId) {
    const response = await api.get(`/api/assignments/${assignmentId}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Create a new assignment
  async createAssignment(assignmentData) {
    const response = await api.post('/api/assignments', assignmentData, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Update an existing assignment
  async updateAssignment(assignmentId, updateData) {
    const response = await api.put(`/api/assignments/${assignmentId}`, updateData, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Delete an assignment
  async deleteAssignment(assignmentId) {
    const response = await api.delete(`/api/assignments/${assignmentId}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Share an assignment with other users
  async shareAssignment(assignmentId, shareData) {
    const response = await api.post(`/api/assignments/${assignmentId}/share`, shareData, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Update an existing shared assignment link
  async updateSharedAssignment(assignmentId, shareId, shareData) {
    const response = await api.put(`/api/assignments/${assignmentId}/share/${shareId}`, shareData, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Delete a shared assignment link
  async deleteSharedAssignment(assignmentId, shareId) {
    const response = await api.delete(`/api/assignments/${assignmentId}/share/${shareId}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Remove a user from a shared assignment link
  async removeUserFromSharedAssignment(shareId, userId) {
    const response = await api.delete(`/api/assignments/share/${shareId}/users`, {
      data: { user_id: userId },
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Search users by email (using the sharing endpoint)
  async searchUsers(query) {
    const response = await api.post('/api/sharing/search-users', { query }, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Get existing shared assignment link data
  async getSharedAssignmentLink(assignmentId) {
    try {
      const response = await api.get(`/api/assignments/${assignmentId}/share`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      return response.data;
    } catch (error) {
      // If 404, it means no shared link exists yet
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching shared assignment link:', error);
      return null;
    }
  },

  // Generate an assignment using AI
  async generateAssignment(generateData) {
    const response = await api.post('/api/assignments/generate', generateData, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Get submissions for an assignment (assignment owner only)
  async getAssignmentSubmissions(assignmentId) {
    const response = await api.get(`/api/assignments/${assignmentId}/submissions`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Submit an assignment
  async submitAssignment(assignmentId, submissionData) {
    const response = await api.post(`/api/assignments/${assignmentId}/submit`, submissionData, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Get current user's submission for an assignment
  async getMySubmission(assignmentId) {
    const response = await api.get(`/api/assignments/${assignmentId}/my-submission`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Get user details by UIDs
  async getUsersByIds(userIds) {
    const response = await api.post('/api/sharing/users-by-ids', { user_ids: userIds }, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  }
};

export default assignmentApi;
