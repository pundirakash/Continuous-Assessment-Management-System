import axios from 'axios';

const API_URL = 'http://localhost:3002/api/admin';

const API_URL_FACULTY = 'http://localhost:3002/api/faculty';

const API_URL_HOD='http://localhost:3002/api/HOD';

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
  Object.keys(questionData).forEach(key => formData.append(key, questionData[key]));
  const response = await axios.post(`${API_URL_FACULTY }/create-question`, formData, {
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

const downloadRandomApprovedQuestions = async (assessmentId, numberOfQuestions) => {
  const response = await axios.post(`${API_URL_FACULTY}/download-random-questions`, {
    assessmentId,
    numberOfQuestions
  }, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    responseType: 'blob'
  });
  console.log(response);
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
  editQuestionByHod
};

export default userService;



