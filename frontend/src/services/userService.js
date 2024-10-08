import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BASE_URL}/api/admin`;

const API_URL_FACULTY = `${process.env.REACT_APP_BASE_URL}/api/faculty`;

const API_URL_HOD=`${process.env.REACT_APP_BASE_URL}/api/HOD`;

const getCourses = async () => {
  const response = await axios.get(`${API_URL_FACULTY }/courses`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const getAssessments = async (courseId) => {
  const response = await axios.get(`${API_URL_FACULTY }/assignments`, {
    params: { courseId },
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const getSetsForAssessment = async (assessmentId) => {
  const response = await axios.get(`${API_URL_FACULTY }/sets/${assessmentId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  console.log(response.data);
  return response.data;
  
};

const getQuestionsForSet = async (assessmentId, setName) => {
  const response = await axios.get(`${API_URL_FACULTY }/questions/${assessmentId}/${setName}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
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

  const response = await axios.post(`${API_URL_FACULTY}/create-question`, formData, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const assignRole = async (userId, role) => {
  const response = await axios.post(`${API_URL}/assign-role`, { userId, role }, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const deleteQuestion = async (questionId) => {
  const response = await axios.delete(`${API_URL_FACULTY}/delete-question/${questionId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const editQuestion = async (questionId, questionData) => {
  const response = await axios.put(`${API_URL_FACULTY}/edit-question/${questionId}`, questionData, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

const downloadAssessment = async (assessmentId, setName, templateNumber) => {
  const response = await axios.get(`${API_URL_FACULTY}/download-assessment/${assessmentId}/${setName}/${templateNumber}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    responseType: 'blob'
  });
  return response.data;
};

const downloadSolution = async (assessmentId, setName, templateNumber) => {
  const response = await axios.get(`${API_URL_FACULTY}/download-solution/${assessmentId}/${setName}/${templateNumber}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    responseType: 'blob'
  });
  return response.data;
};

const downloadRandomApprovedQuestions = async (assessmentId, numberOfQuestions, setName) => {
  const response = await axios.post(`${API_URL_FACULTY}/download-random-questions`, {
    assessmentId,
    numberOfQuestions,
    setName
  }, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    responseType: 'blob'
  });
  return response.data;
};

const createSetForAssessment = async (assessmentId, setName) => {
  const response = await axios.post(`${API_URL_FACULTY}/create-set`, { assessmentId, setName }, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

const deleteSetForAssessment = async (assessmentId, facultyId, setName) => {
  const response = await axios.delete(`${API_URL_FACULTY}/delete-set/${assessmentId}/${facultyId}/${setName}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

const submitAssessment = async (assessmentId, setName) => {
  const response = await axios.post(
    `${API_URL_FACULTY}/submit-assessment`,
    { assessmentId, setName },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.data;
};

const getFacultiesByDepartment = async () => {
  const response = await axios.get(`${API_URL_HOD}/faculties/department`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const getCoursesByDepartment = async () => {
  const response = await axios.get(`${API_URL_HOD}/courses`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  console.log(response);
  return response.data;
};

const createCourse = async (courseData) => {
  const response = await axios.post(`${API_URL_HOD}/create-course`, courseData, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const assignCourseToFaculty = async (facultyId, courseId) => {
  const response = await axios.post(`${API_URL_HOD}/assign-course`, { facultyId, courseId }, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const removeCourseFromFaculty = async (facultyId, courseId) => {
  const response = await axios.post(`${API_URL_HOD}/deallocate-course`, { facultyId, courseId }, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const getCoursesByFaculty = async (facultyId) => {
  const response = await axios.get(`${API_URL_HOD}/faculties/${facultyId}/courses`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const createAssessment = async (courseId, assignmentData) => {
  const response = await axios.post(`${API_URL_HOD}/create-assessment`, { courseId, ...assignmentData }, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const getSetsForAssessmentByHOD = async (facultyId, assessmentId) => {
  const response = await axios.get(`${API_URL_HOD}/get-sets/${facultyId}/${assessmentId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const deleteQuestionByHod = async (questionId) => {
  const response = await axios.delete(`${API_URL_HOD}/delete-question/${questionId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

const editQuestionByHod = async (questionId, questionData) => {
  const response = await axios.put(`${API_URL_HOD}/edit-question/${questionId}`, questionData, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });
  console.log(questionData);
  console.log(questionId);
  return response.data;
};

const approveAssessment = async (assessmentId, facultyId, setName, status, remarks) => {
  console.log(assessmentId,facultyId,setName, status, remarks)
  const response = await axios.post(
    `${API_URL_HOD}/approve-assessment/${assessmentId}/faculty/${facultyId}/set/${setName}`,
    { status, remarks },
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

const getPendingAssessmentSets = async () => {
  const response = await axios.get(`${API_URL_HOD }/pending-assessment-sets`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const deleteCourse = async (courseId) => {
  const response = await axios.delete(`${API_URL_HOD}/course/${courseId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const getAssessmentsByCourse = async (courseId) => {
  const response = await axios.get(`${API_URL_HOD}/assessments/course/${courseId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const editAssessment = async (assessmentId, assessmentData) => {
  const response = await axios.put(`${API_URL_HOD}/assessment/${assessmentId}`, assessmentData, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

const deleteAssessment = async (assessmentId) => {
  const response = await axios.delete(`${API_URL_HOD}/assessment/${assessmentId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const updateSetDetails = async (assessmentId, setName, details) => {
  const response = await axios.put(`${API_URL_FACULTY}/update-set-details/${assessmentId}/${setName}`, details, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const getSetDetails = async (assessmentId, setName) => {
    const response = await axios.get(`${API_URL_FACULTY}/sets/${assessmentId}/${setName}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
};

const getNotifications = async () => {
  const response = await axios.get(`${API_URL_FACULTY}/notifications`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

const downloadQuestions = async (params) => {
  try {
    const response = await axios.get(`${API_URL_HOD}/download-questions`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
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




const userService = {
  register,
  assignRole,
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
  createCourse,
  assignCourseToFaculty,
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
  downloadQuestions
};

export default userService;



