import api from './api';

const API_URL = '/api/admin';

const API_URL_FACULTY = '/api/faculty';

const API_URL_HOD = '/api/HOD';

const getCourses = async (termId) => {
  const query = termId ? `?termId=${termId}` : '';
  const response = await api.get(`${API_URL_FACULTY}/courses${query}`);
  return response.data;
};

const getFacultyStats = async (termId) => {
  const query = termId ? `?termId=${termId}` : '';
  const response = await api.get(`${API_URL_FACULTY}/stats${query}`);
  return response.data;
};

const getAssessments = async (courseId, termId) => {
  const query = termId ? `&termId=${termId}` : '';
  const response = await api.get(`${API_URL_FACULTY}/assignments?courseId=${courseId}${query}`);
  return response.data;
};

const getSetsForAssessment = async (assessmentId) => {
  const response = await api.get(`${API_URL_FACULTY}/sets/${assessmentId}`);
  console.log(response.data);
  return response.data;

};

const getQuestionsForSet = async (assessmentId, setName) => {
  const response = await api.get(`${API_URL_FACULTY}/questions/${assessmentId}/${setName}`);
  console.log(response);
  return response;
};

const createQuestion = async (questionData) => {
  const formData = new FormData();

  // Handle normal fields
  Object.keys(questionData).forEach(key => {
    if (Array.isArray(questionData[key])) {
      // Append each option separately
      questionData[key].forEach(value => formData.append(key, value));
    } else {
      formData.append(key, questionData[key]);
    }
  });

  const response = await api.post(`${API_URL_FACULTY}/create-question`, formData);

  return response.data;
};

const register = async (userData) => {
  const response = await api.post(`${API_URL}/register`, userData);
  return response.data;
};

const assignRole = async (userId, role) => {
  const response = await api.post(`${API_URL}/assign-role`, { userId, role });
  return response.data;
};

const deleteQuestion = async (questionId) => {
  const response = await api.delete(`${API_URL_FACULTY}/delete-question/${questionId}`);
  return response.data;
};

const editQuestion = async (questionId, questionData) => {
  const response = await api.put(`${API_URL_FACULTY}/edit-question/${questionId}`, questionData);
  return response.data;
};

const downloadAssessment = async (assessmentId, setName, templateNumber) => {
  const response = await api.get(`${API_URL_FACULTY}/download-assessment/${assessmentId}/${setName}/${templateNumber}`, {
    responseType: 'blob'
  });
  return response.data;
};

const downloadSolution = async (assessmentId, setName, templateNumber) => {
  const response = await api.get(`${API_URL_FACULTY}/download-solution/${assessmentId}/${setName}/${templateNumber}`, {
    responseType: 'blob'
  });
  return response.data;
};

const downloadRandomApprovedQuestions = async (assessmentId, numberOfQuestions, setName) => {
  const response = await api.post(`${API_URL_FACULTY}/download-random-questions`, {
    assessmentId,
    numberOfQuestions,
    setName
  }, {
    responseType: 'blob'
  });
  return response.data;
};

const createSetForAssessment = async (assessmentId, setName) => {
  const response = await api.post(`${API_URL_FACULTY}/create-set`, { assessmentId, setName });
  return response.data;
};

const deleteSetForAssessment = async (assessmentId, facultyId, setName) => {
  const response = await api.delete(`${API_URL_FACULTY}/delete-set/${assessmentId}/${facultyId}/${setName}`);
  return response.data;
};

const submitAssessment = async (assessmentId, setName) => {
  const response = await api.post(
    `${API_URL_FACULTY}/submit-assessment`,
    { assessmentId, setName }
  );
  return response.data;
};

const getFacultiesByDepartment = async () => {
  const response = await api.get(`${API_URL_HOD}/faculties/department`);
  return response.data;
};

const getFaculties = async () => {
  const response = await api.get(`${API_URL_HOD}/faculties`);
  return response.data;
};

const getCoursesByDepartment = async (termId) => {
  const query = termId ? `?termId=${termId}` : '';
  const response = await api.get(`${API_URL_HOD}/courses${query}`);
  console.log(response);
  return response.data;
};

const createCourse = async (courseData) => {
  const response = await api.post(`${API_URL_HOD}/create-course`, courseData);
  return response.data;
};

const assignCourseToFaculty = async (facultyId, courseId) => {
  const response = await api.post(`${API_URL_HOD}/assign-course`, { facultyId, courseId });
  return response.data;
};

const appointCoordinator = async (facultyId, courseId, termId) => {
  const response = await api.post(`${API_URL_HOD}/appoint-coordinator`, { facultyId, courseId, termId });
  return response.data;
};

const removeCourseFromFaculty = async (facultyId, courseId) => {
  const response = await api.post(`${API_URL_HOD}/deallocate-course`, { facultyId, courseId });
  return response.data;
};

const getCoursesByFaculty = async (facultyId, termId) => {
  const query = termId ? `?termId=${termId}` : '';
  const response = await api.get(`${API_URL_HOD}/faculties/${facultyId}/courses${query}`);
  return response.data;
};

const createAssessment = async (courseId, assignmentData) => {
  const response = await api.post(`${API_URL_HOD}/create-assessment`, { courseId, ...assignmentData });
  return response.data;
};

const getSetsForAssessmentByHOD = async (facultyId, assessmentId) => {
  const response = await api.get(`${API_URL_HOD}/get-sets/${facultyId}/${assessmentId}`);
  return response.data;
};

const deleteQuestionByHod = async (questionId) => {
  const response = await api.delete(`${API_URL_HOD}/delete-question/${questionId}`);
  return response.data;
};

const editQuestionByHod = async (questionId, questionData) => {
  const response = await api.put(`${API_URL_HOD}/edit-question/${questionId}`, questionData);
  console.log(questionData);
  console.log(questionId);
  return response.data;
};

const approveAssessment = async (assessmentId, facultyId, setName, status, remarks) => {
  console.log(assessmentId, facultyId, setName, status, remarks)
  const response = await api.post(
    `${API_URL_HOD}/approve-assessment/${assessmentId}/faculty/${facultyId}/set/${setName}`,
    { status, remarks }
  );
  return response.data;
};

const getPendingAssessmentSets = async (termId) => {
  const query = termId ? `?termId=${termId}` : '';
  const response = await api.get(`${API_URL_HOD}/pending-assessment-sets${query}`);
  return response.data;
};

const deleteCourse = async (courseId, termId) => {
  const query = termId ? `?termId=${termId}` : '';
  const response = await api.delete(`${API_URL_HOD}/course/${courseId}${query}`);
  return response.data;
};

const getAssessmentsByCourse = async (courseId, termId) => {
  const query = termId ? `?termId=${termId}` : '';
  const response = await api.get(`${API_URL_HOD}/assessments/course/${courseId}${query}`);
  return response.data;
};

const editAssessment = async (assessmentId, assessmentData) => {
  const response = await api.put(`${API_URL_HOD}/assessment/${assessmentId}`, assessmentData);
  return response.data;
};

const deleteAssessment = async (assessmentId) => {
  const response = await api.delete(`${API_URL_HOD}/assessment/${assessmentId}`);
  return response.data;
};

const updateSetDetails = async (assessmentId, setName, details) => {
  const response = await api.put(`${API_URL_FACULTY}/update-set-details/${assessmentId}/${setName}`, details);
  return response.data;
};

const getSetDetails = async (assessmentId, setName) => {
  const response = await api.get(`${API_URL_FACULTY}/sets/${assessmentId}/${setName}`);
  return response.data;
};

const getNotifications = async () => {
  const response = await api.get(`${API_URL_FACULTY}/notifications`);
  return response.data;
};

const markNotificationsRead = async () => {
  const response = await api.post(`${API_URL_FACULTY}/notifications/read`, {});
  return response.data;
};



const downloadQuestions = async (params) => {
  try {
    const response = await api.get(`${API_URL_HOD}/download-questions`, {
      params,
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'questions_and_solution.zip');

    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error downloading questions and solutions:', error);
  }
};




const API_URL_ADMIN = '/api/admin';

const getSystemConfig = async () => {
  const response = await api.get(`${API_URL_ADMIN}/system/config`);
  return response.data;
};

const switchTerm = async (newTerm) => {
  const response = await api.post(`${API_URL_ADMIN}/switch-term`, { newTerm });
  return response.data;
};

const getArchivedTerms = async () => {
  const response = await api.get(`${API_URL_ADMIN}/terms/archived`);
  return response.data;
};

const restoreTerm = async (termId) => {
  const response = await api.post(`${API_URL_ADMIN}/terms/restore`, { termId });
  return response.data;
};

const getDepartments = async (schoolId) => {
  const query = schoolId ? `?schoolId=${schoolId}` : '';
  const response = await api.get(`${API_URL_ADMIN}/departments${query}`);
  return response.data;
};

const createDepartment = async (name, schoolId) => {
  const response = await api.post(`${API_URL_ADMIN}/departments`, { name, schoolId });
  return response.data;
};

const renameDepartment = async (id, name) => {
  const response = await api.put(`${API_URL_ADMIN}/departments`, { id, name });
  return response.data;
};

const getUsersByDepartment = async (department) => {
  const response = await api.get(`${API_URL_ADMIN}/users/${department}`);
  return response.data;
};

const deleteUser = async (userId) => {
  const response = await api.delete(`${API_URL_ADMIN}/users/${userId}`);
  return response.data;
};

const updateUser = async (user) => {
  const response = await api.put(`${API_URL_ADMIN}/users/${user._id}`, user);
  return response.data;
};

const bulkRegister = async (users) => {
  const response = await api.post(`${API_URL_ADMIN}/bulk-register`, { users });
  return response.data;
};

const getOrganization = async () => {
  const response = await api.get(`${API_URL_ADMIN}/organization`);
  return response.data;
};

const createSchool = async (name, universityId) => {
  const response = await api.post(`${API_URL_ADMIN}/school`, { name, universityId });
  return response.data;
};

const renameSchool = async (id, name) => {
  const response = await api.put(`${API_URL_ADMIN}/school`, { id, name });
  return response.data;
};

const userService = {
  register,
  assignRole,
  getFacultyStats,
  getCourses,
  getAssessments,
  getSetsForAssessment,
  getQuestionsForSet,
  createQuestion,
  deleteQuestion,
  editQuestion,
  downloadAssessment,
  downloadSolution,
  createSetForAssessment,
  submitAssessment,
  getCoursesByDepartment,
  getFacultiesByDepartment,
  getFaculties,
  createCourse,
  assignCourseToFaculty,
  appointCoordinator,
  removeCourseFromFaculty,
  getCoursesByFaculty,
  createAssessment,
  getSetsForAssessmentByHOD,
  deleteSetForAssessment,
  downloadRandomApprovedQuestions,
  deleteQuestionByHod,
  editQuestionByHod,
  approveAssessment,
  getPendingAssessmentSets,
  deleteCourse,
  getAssessmentsByCourse,
  editAssessment,
  deleteAssessment,
  updateSetDetails,
  getSetDetails,
  getNotifications,
  downloadQuestions,
  markNotificationsRead,
  getSystemConfig,
  switchTerm,
  getArchivedTerms,
  restoreTerm,
  getDepartments,
  createDepartment,
  renameDepartment,
  getUsersByDepartment,
  deleteUser,
  updateUser,
  bulkRegister,
  getOrganization,
  createSchool,
  renameSchool,
  masterFilterQuestions: async (params) => {
    const response = await api.get(`${API_URL_HOD}/master-filter`, {
      params
    });
    return response.data;
  },

  getDashboardStats: async (termId) => {
    const response = await api.get(`${API_URL_HOD}/stats`, {
      params: { termId }
    });
    return response.data;
  },

  getCatalogCourses: async (termId) => {
    const query = termId ? `?termId=${termId}` : '';
    const response = await api.get(`${API_URL_HOD}/catalog-courses${query}`);
    return response.data;
  },

  activateCourse: async (courseId, termId) => {
    const response = await api.post(`${API_URL_HOD}/activate-course`, { courseId, termId });
    return response.data;
  },

  downloadImportTemplate: async () => {
    const response = await api.get(`${API_URL_FACULTY}/download-template`, {
      responseType: 'blob'
    });
    return response.data;
  },

  bulkImportQuestions: async (formData) => {
    const response = await api.post(`${API_URL_FACULTY}/bulk-import`, formData);
    return response.data;
  },

  undoBulkImport: async (assessmentId, setName) => {
    const response = await api.post(`${API_URL_FACULTY}/undo-bulk-import`, { assessmentId, setName });
    return response.data;
  },

  syncRoles: async () => {
    const response = await api.post(`${API_URL_ADMIN}/sync-roles`);
    return response.data;
  },

  downloadPendencyReport: async (termId) => {
    try {
      const response = await api.get(`${API_URL_HOD}/pendency-report`, {
        params: { termId },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Pendency_Report_${termId || 'Current'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading pendency report:', error);
      throw error;
    }
  }
};

export default userService;
