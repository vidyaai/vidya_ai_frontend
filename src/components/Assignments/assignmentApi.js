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

  // Submit an assignment (supports JSON or multipart with PDF file)
  async submitAssignment(assignmentId, submissionData, pdfFile = null) {
    // If PDF file is provided, build multipart/form-data to send the file
    if (pdfFile) {
      const formData = new FormData();
      // submission_method and time_spent
      formData.append('submission_method', 'pdf');
      formData.append('time_spent', submissionData?.time_spent ?? '0');
      // Frontend sends submitted_files metadata minimal; backend will fill from file
      if (submissionData?.submitted_files) {
        formData.append('submitted_files', JSON.stringify(submissionData.submitted_files));
      }
      // Answers can be empty; backend will extract from PDF
      formData.append('answers', JSON.stringify(submissionData?.answers ?? {}));
      // Attach the actual PDF file (key must align with backend expectation)
      formData.append('file', pdfFile, pdfFile.name);

      const response = await api.post(
        `/api/assignments/${assignmentId}/submit`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' } }
      );
      return response.data;
    }

    // Default JSON submission (in-app flow)
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
  },

  // Save assignment draft
  async saveDraft(assignmentId, draftData) {
    const response = await api.post(`/api/assignments/${assignmentId}/save-draft`, draftData, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Get assignment status for current user (includes submission status)
  async getAssignmentStatus(assignmentId) {
    try {
      const response = await api.get(`/api/assignments/${assignmentId}/status`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // No submission yet - return default status
        return {
          status: 'not_started',
          submission: null,
          progress: 0
        };
      }
      throw error;
    }
  },

  // Import assignment from document
  async importFromDocument(fileContent, fileName, fileType, generationOptions = null) {
    const importData = {
      file_content: fileContent,  // Base64 encoded file content
      file_name: fileName,
      file_type: fileType,
      generation_options: generationOptions
    };

    const response = await api.post('/api/assignments/import-document', importData, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Get available videos for assignment generation
  async getAvailableVideos() {
    const response = await api.get('/api/assignments/available-videos', {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Upload a diagram/image file for assignment questions
  async uploadDiagram(file, assignmentId = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = assignmentId 
      ? `/api/assignments/upload-diagram?assignment_id=${assignmentId}`
      : '/api/assignments/upload-diagram';

    const response = await api.post(url, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'ngrok-skip-browser-warning': 'true' 
      }
    });
    return response.data;
  },

  // Trigger AI grading for a submission
  async gradeSubmission(assignmentId, submissionId, options = null) {
    const payload = options ? { options } : {};
    const response = await api.post(`/api/assignments/${assignmentId}/submissions/${submissionId}/grade`, payload, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Trigger batch AI grading for multiple submissions (background processing)
  async batchGradeSubmissions(assignmentId, submissionIds, options = null) {
    const payload = {
      submission_ids: submissionIds,
      options: options || null
    };
    const response = await api.post(`/api/assignments/${assignmentId}/submissions/batch-grade`, payload, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Download a submitted file (PDF)
  async getSubmissionFileUrl(assignmentId, submissionId, fileId) {
    try {
      const response = await api.get(
        `/api/assignments/${assignmentId}/submissions/${submissionId}/files/${fileId}`,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting submission file URL:', error);
      throw error;
    }
  },


  // Get a diagram file URL using the s3_key via the storage presign endpoint
  async getDiagramUrl(s3Key, assignmentId = null) {
    try {
      const response = await api.get('/api/storage/presign', {
        params: { 
          key: s3Key,
          expires_in: 3600 // 1 hour expiry
        },
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });

      if (response.data && response.data.url) {
        return response.data.url;
      }

      throw new Error('No URL found in response');
    } catch (error) {
      console.error('Error getting presigned URL:', error);
      throw error;
    }
  },

  // Get a diagram file URL synchronously (for immediate display) - deprecated, use async version
  getDiagramUrlSync(fileId, assignmentId = null) {
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8000' 
      : '';
    
    const url = assignmentId
      ? `${baseUrl}/api/assignments/diagrams/${fileId}?assignment_id=${assignmentId}`
      : `${baseUrl}/api/assignments/diagrams/${fileId}`;
    
    return url;
  },

  // Delete a diagram file
  async deleteDiagram(fileId, assignmentId = null) {
    const url = assignmentId
      ? `/api/assignments/diagrams/${fileId}?assignment_id=${assignmentId}`
      : `/api/assignments/diagrams/${fileId}`;

    const response = await api.delete(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return response.data;
  },

  // Cleanup all diagrams for a specific assignment
  async cleanupAssignmentDiagrams(assignmentId) {
    if (!assignmentId) return { cleaned: 0, errors: [] };
    
    try {
      // This would require a backend endpoint for bulk cleanup
      // For now, we'll return success to indicate we attempted cleanup
      console.log(`Cleanup requested for assignment: ${assignmentId}`);
      return { cleaned: 0, message: 'Cleanup will be handled by backend when assignment is deleted' };
    } catch (error) {
      console.error('Error during diagram cleanup:', error);
      return { cleaned: 0, errors: [error.message] };
    }
  },

  // Extract all diagram file IDs from assignment questions
  extractDiagramFileIds(questions) {
    const fileIds = [];
    
    if (!questions || !Array.isArray(questions)) return fileIds;
    
    questions.forEach(question => {
      // Main diagram
      if (question.diagram?.file_id) {
        fileIds.push(question.diagram.file_id);
      }
      
      // Main diagram for multi-part questions
      if (question.mainDiagram?.file_id) {
        fileIds.push(question.mainDiagram.file_id);
      }
      
      // Subquestion diagrams
      if (question.subquestions) {
        question.subquestions.forEach(subq => {
          if (subq.diagram?.file_id) {
            fileIds.push(subq.diagram.file_id);
          }
          if (subq.subDiagram?.file_id) {
            fileIds.push(subq.subDiagram.file_id);
          }
        });
      }
    });
    
    return [...new Set(fileIds)]; // Remove duplicates
  },

  // Cleanup orphaned diagram files from questions
  async cleanupOrphanedDiagrams(oldQuestions, newQuestions, assignmentId = null) {
    const oldFileIds = this.extractDiagramFileIds(oldQuestions);
    const newFileIds = this.extractDiagramFileIds(newQuestions);
    
    // Find file IDs that are no longer used
    const orphanedFileIds = oldFileIds.filter(id => !newFileIds.includes(id));
    
    if (orphanedFileIds.length === 0) {
      return { cleaned: 0, errors: [] };
    }
    
    console.log(`Cleaning up ${orphanedFileIds.length} orphaned diagrams:`, orphanedFileIds);
    
    const results = { cleaned: 0, errors: [] };
    
    // Delete each orphaned file
    for (const fileId of orphanedFileIds) {
      try {
        await this.deleteDiagram(fileId, assignmentId);
        results.cleaned++;
        console.log(`Successfully deleted orphaned diagram: ${fileId}`);
      } catch (error) {
        console.error(`Failed to delete orphaned diagram ${fileId}:`, error);
        results.errors.push(`Failed to delete ${fileId}: ${error.message}`);
      }
    }
    
    return results;
  }
};

export default assignmentApi;
