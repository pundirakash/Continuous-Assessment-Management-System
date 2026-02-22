import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import userService from '../../services/userService';
import EditQuestionModal from './EditQuestionModal';
import CreateQuestionModal from './CreateQuestionModal';
import BulkImportModal from './BulkImportModal';
import RandomAssessmentDownloadModal from './RandomAssessmentDownloadModal';
import AIReviewModal from './AIReviewModal';
import { FaEdit, FaTrash, FaPlus, FaCloudDownloadAlt, FaCheck, FaSearch, FaExclamationCircle, FaFileImport, FaHistory, FaMagic, FaCheckDouble, FaEllipsisV, FaChartLine, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaStar, FaListUl, FaBrain, FaCrosshairs, FaRobot, FaInfoCircle, FaPaperPlane } from 'react-icons/fa';
import '../../css/QuestionList.css';

const QuestionsList = ({ assessment, setName, onDeleteSet }) => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [assessmentType, setAssessmentType] = useState('');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [hodStatus, setHodStatus] = useState('');
  const [hodRemarks, setHodRemarks] = useState('');
  const [activityLog, setActivityLog] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [showRandomDownloadModal, setShowRandomDownloadModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [reviewerMetadata, setReviewerMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showAnswers, setShowAnswers] = useState({}); // Tracking which non-MCQ answers are shown

  // AI Review State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [rawAIData, setRawAIData] = useState(null);
  const [aiFixFeedback, setAiFixFeedback] = useState(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await userService.getQuestionsForSet(assessment._id, setName);
      setQuestions(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSetDetails = async () => {
      try {
        const response = await userService.getSetsForAssessment(assessment._id);
        const currentSet = response.find(set => set.setName === setName);
        if (currentSet) {
          setHodStatus(currentSet.hodStatus);
          setHodRemarks(currentSet.hodRemarks);
          setActivityLog(currentSet.activityLog || []);
          setReviewerMetadata(currentSet.reviewerMetadata || null);
          if (currentSet.aiReviewData) {
            setRawAIData(currentSet.aiReviewData);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (assessment && setName) {
      const fetchAll = async () => {
        setLoading(true);
        try {
          const response = await userService.getQuestionsForSet(assessment._id, setName);
          setQuestions(response.data);
          await fetchSetDetails();
          setAssessmentType(assessment.type);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchAll();
    }
  }, [assessment, setName]);

  // Load Saved AI Data
  useEffect(() => {
    if (questions.length > 0 && rawAIData && !aiResponse) {
      const result = JSON.parse(JSON.stringify(rawAIData));
      if (result && result.reviews) {
        if (result.summary && result.summary.qualityScore !== undefined) {
          result.summary.alignmentScore = result.summary.qualityScore;
        }
        result.reviews = result.reviews.map(review => {
          // Robust index handling: Use questionIndex if available, else originalIndex (legacy)
          const indexToUse = review.questionIndex !== undefined ? review.questionIndex :
            (review.originalIndex !== undefined ? (review.originalIndex > 0 ? review.originalIndex - 1 : 0) : 0);

          const originalQuestion = questions[indexToUse];
          const queryText = originalQuestion ? originalQuestion.text : "";
          const status = review.status || ((review.issues && review.issues.length > 0) ? 'Needs Improvement' : 'Approved');
          const critique = review.critique || (review.issues && review.issues.length > 0
            ? `${review.issues.join('. ')} ${review.suggestion ? `\nSuggestion: ${review.suggestion}` : ''}`
            : review.suggestion || "No issues found.");
          const suggestedFix = {
            text: (review.suggestedFix && review.suggestedFix.text) ? review.suggestedFix.text : (review.revisedQuestion || queryText),
            options: (review.suggestedFix && review.suggestedFix.options) ? review.suggestedFix.options : (review.revisedOptions || (originalQuestion ? originalQuestion.options : [])),
            solution: (review.suggestedFix && review.suggestedFix.solution) ? review.suggestedFix.solution : (review.revisedSolution || (originalQuestion ? originalQuestion.solution : "")),
            bloomLevel: (review.suggestedFix && review.suggestedFix.bloomLevel) ? review.suggestedFix.bloomLevel : ((review.bloomDetails && review.bloomDetails.actual) ? review.bloomDetails.actual : (originalQuestion ? originalQuestion.bloomLevel : "")),
            courseOutcome: (review.suggestedFix && review.suggestedFix.courseOutcome) ? review.suggestedFix.courseOutcome : ((review.coDetails && review.coDetails.actual) ? review.coDetails.actual : (originalQuestion ? originalQuestion.courseOutcome : "")),
            difficultyLevel: (review.suggestedFix && review.suggestedFix.difficultyLevel) ? review.suggestedFix.difficultyLevel : (review.difficultyLevel || (originalQuestion ? originalQuestion.difficultyLevel : "Easy"))
          };
          return {
            ...review,
            questionIndex: indexToUse,
            originalText: queryText,
            status: status,
            critique: critique,
            suggestedFix: suggestedFix
          };
        });

        // Consistent Score Calculation: (Approved / Total) * 100
        const approvedCount = result.reviews.filter(r => r.status === 'Approved').length;
        const totalReviews = result.reviews.length;
        const strictScore = totalReviews > 0 ? Math.round((approvedCount / totalReviews) * 100) : 0;

        if (result.summary) {
          result.summary.alignmentScore = strictScore;
        }

        setAiResponse(result);
      }
    }
  }, [questions, rawAIData, aiResponse]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredQuestions(questions);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredQuestions(questions.filter(q => {
        const textMatch = (q.text || "").toLowerCase().includes(lowerQuery);
        const optionsMatch = q.options && q.options.some(opt =>
          ((opt && opt.text) || "").toLowerCase().includes(lowerQuery)
        );
        return textMatch || optionsMatch;
      }));
    }
  }, [searchQuery, questions]);

  const handleCreateQuestion = async () => {
    try {
      await fetchQuestions(); // Refresh list to show the newly created question
      setShowCreateQuestion(false);
    } catch (error) {
      console.error("Error refreshing after question creation:", error);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await userService.deleteQuestionFromSet(assessment._id, setName, questionId);
      await fetchQuestions(); // Refresh with full documents
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
  };

  const handleSaveEdit = async (updatedQuestion) => {
    try {
      await userService.updateQuestionInSet(assessment._id, setName, updatedQuestion._id, updatedQuestion);
      await fetchQuestions(); // Refresh with full documents
      setEditingQuestion(null);
    } catch (error) {
      console.error("Error updating question:", error);
      alert("Failed to update question");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedQuestions(filteredQuestions.map(q => q._id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedQuestions(prev => {
      if (prev.includes(id)) return prev.filter(q => q !== id);
      return [...prev, id];
    });
  };


  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedQuestions.length} questions?`)) return;
    try {
      await userService.deleteMultipleQuestions(assessment._id, setName, selectedQuestions);
      await fetchQuestions(); // Refresh with full documents
      setSelectedQuestions([]);
    } catch (err) {
      console.error(err);
      alert("Failed to delete questions");
    }
  };

  const handleSubmit = async () => {
    try {
      await userService.submitAssessment(assessment._id, setName);
      setShowSubmitConfirmation(false);
      window.location.reload();
    } catch (error) {
      console.error("Submit failed", error);
      alert("Failed to submit assessment");
    }
  };

  const handleAIReview = async () => {
    setIsAILoading(true);
    setShowAIModal(true);
    try {
      const res = await userService.reviewQuestionsWithAI(assessment._id, setName, questions);
      const result = res.aiReviewData;

      // Strict Score Calculation Consistency
      if (result && result.reviews) {
        const approvedCount = result.reviews.filter(r => r.status === 'Approved').length;
        const totalReviews = result.reviews.length;
        const strictScore = totalReviews > 0 ? Math.round((approvedCount / totalReviews) * 100) : 0;

        if (result.summary) {
          result.summary.alignmentScore = strictScore;
        }
      }

      // Map original question text for sidebar visibility
      if (result && result.reviews) {
        result.reviews = result.reviews.map(r => ({
          ...r,
          originalText: questions[r.questionIndex]?.text || ""
        }));
      }

      setAiResponse(result);
      // Clear isManuallyFixed flags — re-analysis produces fresh suggestions, old "applied" state is stale
      setQuestions(prev => prev.map(q => ({ ...q, isManuallyFixed: false })));
      setIsAILoading(false);
    } catch (error) {
      console.error("AI Review failed", error);
      setIsAILoading(false);

      if (error.response?.status === 503 || error.response?.status === 429) {
        alert("The AI Service is currently unavailable due to high demand on our Free API Tier. Please wait a moment and click 'Re-analyze' to try again.");
      } else {
        alert(error.response?.data?.message || "AI Analysis failed to complete all chunks. Your previous report has been preserved. Please try re-analyzing.");
      }
    }
  };

  const handleApplyAIFix = async (index, fix) => {
    if (!questions[index]) return;
    const q = questions[index];

    // Construct updated question with all suggested fields
    const updated = {
      ...q,
      text: fix.text || q.text,
      options: (q.type === 'MCQ' && fix.options && fix.options.length > 0) ? fix.options : q.options,
      solution: fix.solution || q.solution,
      bloomLevel: fix.bloomLevel || q.bloomLevel,
      courseOutcome: fix.courseOutcome || q.courseOutcome,
      difficultyLevel: fix.difficultyLevel || q.difficultyLevel,
      isManuallyFixed: true // Mark as manually fixed
    };

    console.log(`[AI Fix] Applying fix for Q${index + 1}:`, updated);
    setIsAILoading(true);
    await handleSaveEdit(updated); // This saves to backend and refreshes questions

    // DO NOT MUTATE THE AI REPORT (keeps historical accuracy)

    setIsAILoading(false);

    setAiFixFeedback(`Optimized Question ${index + 1} successfully.`);
    setTimeout(() => setAiFixFeedback(null), 3000);
  };

  const toggleAnswerVisibility = (id) => {
    setShowAnswers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleApplyAllFixes = async () => {
    if (!aiResponse || !aiResponse.reviews) return;
    const fixesapply = aiResponse.reviews.filter(r => r.status !== 'Approved');
    if (fixesapply.length === 0) { alert("No remaining fixes."); return; }

    setIsAILoading(true);
    let successIndices = [];

    console.log(`[AI Bulk Fix] Starting for ${fixesapply.length} questions.`);

    // We iterate over raw reviews and try to find matching questions in the current state
    for (const review of fixesapply) {
      try {
        // Robust Mapping: Try index first, then text match if needed
        let targetQuestion = questions[review.questionIndex];

        if (!targetQuestion || (review.originalQuestion && targetQuestion.text !== review.originalQuestion)) {
          // Attempt to find by text if index is out of sync
          targetQuestion = questions.find(q => q.text === review.originalQuestion);
        }

        if (!targetQuestion || !targetQuestion._id || !review.suggestedFix) continue;

        const updated = {
          ...targetQuestion,
          text: review.suggestedFix.text || targetQuestion.text,
          options: (targetQuestion.type === 'MCQ' && review.suggestedFix.options && review.suggestedFix.options.length > 0) ? review.suggestedFix.options : targetQuestion.options,
          solution: review.suggestedFix.solution || targetQuestion.solution,
          bloomLevel: review.suggestedFix.bloomLevel || targetQuestion.bloomLevel,
          courseOutcome: review.suggestedFix.courseOutcome || targetQuestion.courseOutcome,
          difficultyLevel: review.suggestedFix.difficultyLevel || targetQuestion.difficultyLevel,
          isManuallyFixed: true // Mark as manually fixed
        };

        await userService.updateQuestionInSet(assessment._id, setName, targetQuestion._id, updated);
        successIndices.push({ index: review.questionIndex, fix: review.suggestedFix });
      } catch (e) {
        console.error(`Failed to apply bulk fix:`, e);
      }
    }

    await fetchQuestions(); // Refresh with full documents

    // DO NOT MUTATE THE AI REPORT (keeps historical 50/100 accuracy)
    // The "isManuallyFixed" flag on the questions themselves will act as the source of truth
    // for whether the fix was applied, rather than faking the AI's report.

    setIsAILoading(false);
    setAiFixFeedback(`Success: Optimized ${successIndices.length} questions.`);
    setTimeout(() => setAiFixFeedback(null), 5000);
  };

  const handleDownloadAssessment = async (templateNumber) => {
    try {
      const blob = await userService.downloadAssessment(assessment._id, setName, templateNumber);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a'); link.href = url; link.download = 'assessment.docx'; link.click();
    } catch (e) { console.error(e); }
  };

  const handleDownloadSolution = async (templateNumber) => {
    try {
      const blob = await userService.downloadSolution(assessment._id, setName, templateNumber);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a'); link.href = url; link.download = 'solution.docx'; link.click();
    } catch (e) { console.error('Solution download error', e); }
  };

  return (
    <div>
      <div className='p-2 p-md-4'>
        <div className="bg-white p-3 rounded-4 shadow-sm mb-3 border">
          <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
            {/* Left: Search Bar */}
            {questions.length > 0 && (
              <div className="position-relative" style={{ minWidth: '180px', maxWidth: '240px', flex: '1 1 180px' }}>
                <FaSearch className="position-absolute text-muted small" style={{ top: '50%', left: '18px', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search questions..."
                  className="form-control rounded-pill border bg-light py-2 ps-5 shadow-none focus-bg-white transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            )}

            {/* Desktop Actions */}
            <div className="d-none d-md-flex align-items-center gap-2 order-2 order-md-3 ms-auto">

              {(!['Approved', 'Submitted'].includes(hodStatus)) && (
                <button
                  className="btn btn-light btn-sm fw-bold text-secondary border d-flex align-items-center gap-2 transition-all hover-shadow rounded-pill px-3"
                  onClick={() => setShowBulkImportModal(true)}
                  style={{ backgroundColor: '#f8f9fa' }}
                >
                  <FaFileImport /> Import
                </button>
              )}

              {questions.length > 0 && aiResponse && (
                <>
                  <button
                    className="btn btn-outline-secondary btn-sm fw-bold d-flex align-items-center gap-2 shadow-sm transition-all rounded-pill px-3"
                    onClick={() => setShowAIModal(true)}
                    style={{ borderWidth: '1.5px' }}
                  >
                    <FaChartLine size={16} /> Analysis Report
                  </button>
                </>
              )}

              {!aiResponse && questions.length > 0 && (
                <button
                  className="btn btn-outline-primary btn-sm fw-bold d-flex align-items-center gap-2 shadow-sm transition-all rounded-pill px-3"
                  onClick={handleAIReview}
                  style={{ borderWidth: '1.5px' }}
                >
                  <FaMagic /> AI Review
                </button>
              )}

              {/* Primary Download Button for Approved Sets */}
              {(hodStatus === 'Approved' || hodStatus === 'Approved with Remarks') && (
                <div className="dropdown">
                  <button
                    className="btn btn-primary btn-sm fw-bold text-white d-flex align-items-center gap-2 shadow-sm px-4 rounded-pill hover-scale dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
                  >
                    <FaCloudDownloadAlt /> Download
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2 mt-2">
                    <li><h6 className="dropdown-header text-uppercase small fw-bold opacity-50 ls-1">Export Formats</h6></li>
                    <li>
                      <button className="dropdown-item py-2 rounded-2 d-flex align-items-center gap-2" onClick={() => handleDownloadAssessment(1)}>
                        <FaFileImport className="text-primary" /> Course File Format
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item py-2 rounded-2 d-flex align-items-center gap-2" onClick={() => handleDownloadAssessment(assessment.type === 'MCQ' || (questions.length > 0 && questions[0].type === 'MCQ') ? 3 : 4)}>
                        <FaListUl className="text-success" /> Compact Format
                      </button>
                    </li>
                    <li><hr className="dropdown-divider opacity-10" /></li>
                    <li>
                      <button className="dropdown-item py-2 rounded-2 d-flex align-items-center gap-2" onClick={() => handleDownloadSolution(5)}>
                        <FaCheckDouble className="text-info" /> Download Solution
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item py-2 rounded-2 d-flex align-items-center gap-2" onClick={() => setShowRandomDownloadModal(true)}>
                        <FaMagic className="text-warning" /> Random Set Generator
                      </button>
                    </li>
                  </ul>
                </div>
              )}

              {/* Submit Button Visibility Logic: MCQ >= 30, Subjective >= 1, or Rejected/Remarks */}
              {['Pending', 'Rejected', 'Approved with Remarks'].includes(hodStatus) &&
                (assessment.type === 'MCQ' ? questions.length >= 30 : questions.length >= 1) ? (
                <button
                  className={`btn btn-sm fw-bold text-white d-flex align-items-center gap-2 shadow-sm px-4 rounded-pill transition-all ${['Rejected', 'Approved with Remarks'].includes(hodStatus) ? 'btn-info' : 'btn-primary'}`}
                  onClick={() => setShowSubmitConfirmation(true)}
                >
                  <FaCheck /> {['Rejected', 'Approved with Remarks'].includes(hodStatus) ? 'Update & Resubmit' : 'Submit Assessment'}
                </button>
              ) : ['Pending', 'Rejected', 'Approved with Remarks'].includes(hodStatus) && (
                <div className="d-flex align-items-center gap-2 px-3 py-1.5 bg-primary bg-opacity-10 rounded-pill border border-primary border-opacity-25" style={{ fontSize: '13px' }}>
                  <FaInfoCircle className="text-primary" />
                  <span className="text-primary fw-bold" style={{ letterSpacing: '0.2px' }}>
                    Need {assessment.type === 'MCQ' ? 30 - questions.length : 1 - questions.length} more {assessment.type === 'MCQ' ? 'questions' : 'question'} to submit
                  </span>
                </div>
              )}

              <div className="dropdown">
                <button className="btn btn-light btn-sm rounded-circle border shadow-sm width-40 height-40 d-flex align-items-center justify-content-center hover-bg-gray-100" data-bs-toggle="dropdown"><FaEllipsisV /></button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                  <li><button className="dropdown-item small" onClick={() => setShowHistoryModal(true)}><FaHistory className="me-2" /> History</button></li>
                  {onDeleteSet && !['Approved', 'Approved with Remarks'].includes(hodStatus) && (
                    <li><button className="dropdown-item small text-danger" onClick={onDeleteSet}><FaTrash className="me-2" /> Delete Set</button></li>
                  )}
                </ul>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="d-flex d-md-none align-items-center gap-2 order-2">
              {(!['Approved', 'Submitted'].includes(hodStatus)) && selectedQuestions.length > 0 && (
                <button
                  className="btn btn-danger btn-sm rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px' }}
                  onClick={handleBulkDelete}
                  title={`Delete ${selectedQuestions.length} selected`}
                >
                  <FaTrash size={14} />
                </button>
              )}

              {['Pending', 'Rejected', 'Approved with Remarks'].includes(hodStatus) &&
                ((assessment.type === 'MCQ' ? questions.length >= 30 : questions.length >= 1) ||
                  ['Rejected', 'Approved with Remarks'].includes(hodStatus)) && (
                  <button
                    className="btn btn-primary btn-sm fw-bold text-white shadow-sm d-flex align-items-center gap-2"
                    onClick={() => setShowSubmitConfirmation(true)}
                  >
                    <FaCheck /> Submit
                  </button>
                )}

              {questions.length > 0 && aiResponse && (
                <button className="btn btn-light text-success btn-sm rounded-circle border" onClick={() => setShowAIModal(true)} title="Analysis Report"><FaChartLine /></button>
              )}

              <div className="dropdown">
                <button className="btn btn-light btn-sm rounded-circle border shadow-sm" data-bs-toggle="dropdown">
                  <FaEllipsisV />
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2">
                  {(!['Approved', 'Submitted'].includes(hodStatus)) && (
                    <li><button className="dropdown-item py-2 rounded-2" onClick={() => setShowBulkImportModal(true)}><FaFileImport className="me-2 text-primary" /> Bulk Import</button></li>
                  )}
                  {!aiResponse && questions.length > 0 && (
                    <li><button className="dropdown-item py-2 rounded-2" onClick={handleAIReview}><FaMagic className="me-2 text-warning" /> AI Review</button></li>
                  )}

                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item py-2 rounded-2" onClick={() => setShowHistoryModal(true)}><FaHistory className="me-2 text-muted" /> History</button></li>
                  {onDeleteSet && !['Approved', 'Approved with Remarks'].includes(hodStatus) && (
                    <li><button className="dropdown-item py-2 rounded-2 text-danger" onClick={onDeleteSet}><FaTrash className="me-2" /> Delete Set</button></li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {showRandomDownloadModal && (
          <RandomAssessmentDownloadModal
            assessmentId={assessment._id}
            setName={setName}
            totalQuestions={questions.length}
            onClose={() => setShowRandomDownloadModal(false)}
          />
        )}

        {showBulkImportModal && (
          <BulkImportModal
            assessmentId={assessment._id}
            setName={setName}
            onClose={() => setShowBulkImportModal(false)}
            onImportSuccess={() => {
              fetchQuestions();
            }}
          />
        )}

        {['Rejected', 'Approved with Remarks', 'Approved', 'Submitted'].includes(hodStatus) && (
          <div className={`alert py-3 px-4 mb-4 small d-flex align-items-center gap-3 rounded-4 shadow-sm border ${hodStatus === 'Approved' ? 'bg-success bg-opacity-10 border-success text-success' :
            hodStatus === 'Submitted' ? 'bg-primary bg-opacity-10 border-primary text-primary' :
              hodStatus === 'Rejected' ? 'bg-danger bg-opacity-10 border-danger text-danger' :
                'bg-warning bg-opacity-10 border-warning text-dark'
            }`}>
            {hodStatus === 'Approved' ? <FaCheckCircle className="fs-5" /> :
              hodStatus === 'Submitted' ? <FaPaperPlane className="fs-5" /> :
                hodStatus === 'Rejected' ? <FaTimesCircle className="fs-5" /> :
                  <FaExclamationTriangle className="fs-5" />}

            <div className="flex-grow-1 d-flex flex-column gap-0">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <span className="fw-bold text-uppercase ls-1" style={{ color: hodStatus === 'Submitted' ? '#0d6efd' : '' }}>
                  {hodStatus === 'Submitted' ? 'Under Review' : hodStatus}
                </span>

                {/* Attribution Logic */}
                {hodStatus === 'Submitted' ? (
                  reviewerMetadata && (
                    <>
                      <span className="mx-2 opacity-50 d-none d-sm-inline">|</span>
                      <span className="small fw-bold opacity-75">
                        Sent to: {[reviewerMetadata.coordinator?.name, reviewerMetadata.hod?.name].filter(Boolean).join(' & ') || 'HOD/CC'}
                      </span>
                    </>
                  )
                ) : (
                  activityLog && activityLog.length > 0 && (
                    <>
                      {(() => {
                        const lastAction = [...activityLog].reverse().find(log =>
                          (hodStatus === 'Approved' && log.action.includes('Approved')) ||
                          (hodStatus === 'Rejected' && log.action.includes('Rejected')) ||
                          (hodStatus === 'Approved with Remarks' && log.action.includes('Approved with Remarks'))
                        );
                        return lastAction && (lastAction.userName || lastAction.userUID) ? (
                          <>
                            <span className="mx-2 opacity-50 d-none d-sm-inline">|</span>
                            <span className="small fw-bold opacity-75">
                              {lastAction.userName || 'Reviewer'} {lastAction.userUID ? `(${lastAction.userUID})` : ''}
                            </span>
                          </>
                        ) : null;
                      })()}
                    </>
                  )
                )}
              </div>

              <div className="mt-1">
                <span className="fw-medium opacity-75" style={{ color: hodStatus === 'Submitted' ? '#0d6efd' : '', fontSize: '13px' }}>
                  {hodStatus === 'Submitted'
                    ? "This set has been submitted and is awaiting approval."
                    : (hodRemarks || "No remarks provided.")}
                </span>
              </div>
            </div>
          </div>
        )}


        <div className="questions-container p-1" style={{ paddingBottom: '120px' }}>
          {(!loading && filteredQuestions.length > 0 && !['Approved', 'Submitted'].includes(hodStatus)) && (
            <div className={`d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 border transition-all ${selectedQuestions.length > 0 ? 'bg-danger bg-opacity-10 border-danger border-opacity-25' : 'bg-light border-light-subtle'}`}>
              <div className="d-flex align-items-center gap-3">
                <input
                  type="checkbox"
                  className={`form-check-input mt-0 ${selectedQuestions.length > 0 ? 'border-danger' : 'border-secondary'}`}
                  style={{ width: '1.4em', height: '1.4em', cursor: 'pointer' }}
                  checked={selectedQuestions.length > 0 && selectedQuestions.length === filteredQuestions.length}
                  onChange={handleSelectAll}
                  id="selectAllQuestions"
                />
                <div className="d-flex flex-column">
                  <label htmlFor="selectAllQuestions" className={`fw-bold small mb-0 ${selectedQuestions.length > 0 ? 'text-danger' : 'text-secondary'}`} style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                    Select All for Deletion
                  </label>
                  {selectedQuestions.length === 0 && (
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>Use checkboxes to bulk-delete accidental imports.</span>
                  )}
                </div>
              </div>

              {/* Contextual Bulk Action Clarification */}
              {selectedQuestions.length > 0 && (
                <div className="d-flex align-items-center gap-3 animate-fade-in pe-2">
                  <span className="text-danger small fw-bold">
                    {selectedQuestions.length} selected to delete
                  </span>
                  <button
                    className="btn btn-danger btn-sm text-white shadow-sm d-flex align-items-center gap-2 fw-bold px-4 py-2 rounded-pill hover-scale"
                    onClick={handleBulkDelete}
                  >
                    <FaTrash /> Delete {selectedQuestions.length > 1 ? 'Questions' : 'Question'}
                  </button>
                </div>
              )}
            </div>
          )}
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="mb-4 border-0 shadow-sm bg-white p-4 rounded-4 animate-pulse">
                <div className="d-flex justify-content-between mb-3">
                  <div className="d-flex gap-2">
                    <div className="bg-light rounded-circle" style={{ width: 40, height: 40 }}></div>
                    <div className="bg-light rounded-pill" style={{ width: 100, height: 20 }}></div>
                  </div>
                  <div className="d-flex gap-2">
                    <div className="bg-light rounded-pill" style={{ width: 60, height: 24 }}></div>
                    <div className="bg-light rounded-pill" style={{ width: 80, height: 24 }}></div>
                  </div>
                </div>
                <div className="bg-light rounded-3 mb-3" style={{ width: '100%', height: 20 }}></div>
                <div className="bg-light rounded-3 mb-4" style={{ width: '60%', height: 20 }}></div>
              </div>
            ))
          ) : (
            filteredQuestions.map((q, index) => (
              <div key={q._id || index} className="question-card mb-4 border-0 shadow-sm bg-white" style={{ borderRadius: '16px', overflow: 'hidden', transition: 'transform 0.2s' }}>
                <div className="q-header px-4 py-3 bg-light bg-opacity-50 border-bottom d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    {(!['Approved', 'Submitted'].includes(hodStatus)) && (
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        style={{ width: '1.4em', height: '1.4em', cursor: 'pointer' }}
                        checked={selectedQuestions.includes(q._id)}
                        onChange={() => handleCheckboxChange(q._id)}
                      />
                    )}

                    <div className="bg-white border rounded-circle d-flex align-items-center justify-content-center shadow-sm text-secondary fw-bold" style={{ width: '40px', height: '40px' }}>
                      {index + 1}
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className="badge bg-white text-primary border border-primary border-opacity-10 rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-bold shadow-sm">
                        <FaStar size={10} className="mb-0.5" /> {q.marks} Mark{q.marks > 1 ? 's' : ''}
                      </span>
                      <span className="badge bg-white text-purple-600 border border-purple-200 rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-bold shadow-sm" style={{ color: '#9333ea', borderColor: '#e9d5ff' }}>
                        <FaListUl size={10} className="mb-0.5" /> {q.type}
                      </span>
                      <span className="badge bg-white rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-bold shadow-sm border" style={{
                        color: (q.bloomLevel || "").toLowerCase().includes('remember') ? '#16a34a' : // Green-600
                          (q.bloomLevel || "").toLowerCase().includes('understand') ? '#d97706' : // Amber-600
                            '#dc2626', // Red-600
                        borderColor: (q.bloomLevel || "").toLowerCase().includes('remember') ? '#bbf7d0' : // Green-200
                          (q.bloomLevel || "").toLowerCase().includes('understand') ? '#fde68a' : // Amber-200
                            '#fecaca' // Red-200
                      }}>
                        <FaBrain size={10} className="mb-0.5" /> {q.bloomLevel}
                      </span>
                      <span className="badge bg-white text-secondary border border-secondary border-opacity-10 rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-bold shadow-sm">
                        <FaCrosshairs size={10} className="mb-0.5" /> {q.courseOutcome}
                      </span>

                      {/* AI Review Status Indicator */}
                      {aiResponse && aiResponse.reviews && aiResponse.reviews.find(r => r.questionIndex === index) && (
                        <div
                          className={`badge rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-bold shadow-sm cursor-pointer transition-all hover-scale`}
                          style={{
                            backgroundColor: aiResponse.reviews.find(r => r.questionIndex === index).status === 'Approved' ? '#f0fdf4' : '#fff7ed',
                            color: aiResponse.reviews.find(r => r.questionIndex === index).status === 'Approved' ? '#16a34a' : '#c2410c',
                            border: `1px solid ${aiResponse.reviews.find(r => r.questionIndex === index).status === 'Approved' ? '#bbf7d0' : '#fdba74'}`,
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingQuestion(null); // Ensure no other modal interferes
                            setShowAIModal(true);
                            // We don't have a direct way to set active tab in AI Modal from here, 
                            // but opening it is a good start. 
                            // Actually, AIReviewModal might need a prop for initial tab.
                          }}
                          title={aiResponse.reviews.find(r => r.questionIndex === index).status === 'Approved' ? "AI Approved" : "AI Suggestions Available"}
                        >
                          <FaRobot size={12} />
                          {aiResponse.reviews.find(r => r.questionIndex === index).status === 'Approved' ? 'AI Verified' : 'AI Feedback'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="q-body p-4">
                  <p className="q-text text-dark fw-medium lh-lg mb-4" style={{ fontSize: '1.05rem', color: '#2d3748' }}>{q.text}</p>

                  {q.image && (
                    <div className="mb-4 p-2 bg-light rounded-3 border d-inline-block">
                      <img src={q.image} alt="Question" className="rounded-2" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                    </div>
                  )}

                  {q.options && q.options.length > 0 && (
                    <div className="q-options-grid d-grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                      {q.options.map((opt, i) => {
                        const isCorrect = q.type === 'MCQ' && q.solution === opt;
                        return (
                          <div key={i} className={`p-3 border rounded-3 d-flex align-items-start gap-2 ${isCorrect ? 'bg-success bg-opacity-10 border-success shadow-sm' : 'bg-light'}`} style={{ transition: 'all 0.2s' }}>
                            <span className={`fw-bold ${isCorrect ? 'text-success' : 'text-primary'}`}>{String.fromCharCode(97 + i)}.</span>
                            <span className={isCorrect ? 'text-dark fw-bold' : 'text-secondary'}>{opt}</span>
                            {isCorrect && <FaCheck className="ms-auto text-success mt-1" size={14} />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type !== 'MCQ' && q.solution && (
                    <div className="mt-3">
                      <button
                        className="btn btn-sm btn-link text-decoration-none p-0 fw-bold d-flex align-items-center gap-1 opacity-75 hover-opacity-100"
                        onClick={() => toggleAnswerVisibility(q._id)}
                      >
                        {showAnswers[q._id] ? 'Hide Answer' : 'View Answer'}
                      </button>

                      {showAnswers[q._id] && (
                        <div className="mt-3 p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 animate-zoom-in">
                          <div className="text-success fw-bold small text-uppercase mb-2 d-flex align-items-center gap-2">
                            <FaCheck size={12} /> Answer Key
                          </div>
                          <div className="text-dark opacity-75 small">{q.solution}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === 'MCQ' && !q.options?.length && q.solution && (
                    <div className="mt-4 p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25">
                      <div className="text-success fw-bold small text-uppercase mb-2 d-flex align-items-center gap-2">
                        <FaCheck size={12} /> Answer Key
                      </div>
                      <div className="text-dark opacity-75 small">{q.solution}</div>
                    </div>
                  )}
                </div>

                {(hodStatus === 'Pending' || hodStatus === 'Rejected' || hodStatus === 'Approved with Remarks') && (
                  <div className="q-actions-footer px-4 py-3 bg-gray-50 border-top d-flex gap-2 justify-content-end bg-light">
                    <button className="btn btn-sm btn-white border text-primary hover-shadow transition-all rounded-pill px-4 fw-medium" onClick={() => handleEditQuestion(q)}>
                      <FaEdit className="me-2" /> Edit
                    </button>
                    {(hodStatus === 'Pending' || hodStatus === 'Rejected') && (
                      <button className="btn btn-sm btn-white border text-danger hover-shadow transition-all rounded-pill px-4 fw-medium" onClick={() => handleDeleteQuestion(q._id)}>
                        <FaTrash className="me-2" /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {!loading && questions.length === 0 && (
            <div className="text-center py-5 animate-zoom-in d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
              <div className="mb-4 position-relative">
                <div className="bg-primary bg-opacity-10 rounded-circle p-4 d-inline-flex align-items-center justify-content-center mb-3 position-relative" style={{ width: '100px', height: '100px' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                    <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H12.01M12 15H12.01M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="position-absolute top-0 end-0 bg-white rounded-circle p-1 shadow-sm" style={{ transform: 'translate(10%, -10%)' }}>
                    <FaPlus className="text-success" size={16} />
                  </div>
                </div>
              </div>
              <h4 className="fw-bold text-dark mb-2">Let's Create Your First Question!</h4>
              <p className="text-secondary mb-4" style={{ maxWidth: '450px' }}>
                This set is currently empty. Kickstart your assessment by adding a new question manually or importing from a file.
              </p>
              <div className="d-flex gap-3">
                <button
                  className="btn btn-vibrant-primary btn-lg rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center gap-2"
                  onClick={() => setShowCreateQuestion(true)}
                >
                  <FaPlus /> Create Question
                </button>
                <button
                  className="btn btn-light btn-lg rounded-pill px-4 py-3 fw-bold border hover-shadow d-flex align-items-center gap-2 text-secondary"
                  onClick={() => setShowBulkImportModal(true)}
                >
                  <FaFileImport /> Import
                </button>
              </div>
            </div>
          )}

          {!loading && questions.length > 0 && filteredQuestions.length === 0 && (
            <div className="text-center py-5 animate-zoom-in d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
              <div className="bg-light rounded-circle p-4 d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px' }}>
                <FaSearch className="text-secondary opacity-50" size={40} />
              </div>
              <h4 className="fw-bold text-dark mb-2">No Matching Questions Found</h4>
              <p className="text-secondary mb-4">
                We couldn't find any questions matching "<strong>{searchQuery}</strong>". <br />
                Try searching for something else or clear the search.
              </p>
              <button
                className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm"
                onClick={() => setSearchQuery('')}
              >
                Clear Search Results
              </button>
            </div>
          )}
        </div>

        <style>{`
          .animate-pulse {
            animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
          .animate-zoom-in {
            animation: zoomIn 0.3s ease-out;
          }
          @keyframes zoomIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {showCreateQuestion && (
          <CreateQuestionModal
            assessmentId={assessment._id}
            setName={setName}
            assessmentType={assessment.type}
            onQuestionCreated={handleCreateQuestion}
            onClose={() => setShowCreateQuestion(false)}
          />
        )}

        {editingQuestion && (
          <EditQuestionModal
            question={editingQuestion}
            onClose={() => setEditingQuestion(null)}
            onSave={handleSaveEdit}
          />
        )}

        {showSubmitConfirmation && ReactDOM.createPortal(
          <div className="modal-backdrop-custom d-flex align-items-center justify-content-center"
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', zIndex: 2000 }}>

            <div className="bg-white rounded-4 shadow-lg overflow-hidden d-flex flex-column"
              style={{
                width: '450px',
                animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: 'transform, opacity'
              }}>

              {/* Header */}
              <div className="p-4 text-white d-flex align-items-center justify-content-between text-left"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <FaCheck size={20} />
                  </div>
                  <div>
                    <h5 className="m-0 fw-bold">Confirm Submission</h5>
                    <p className="m-0 small opacity-75">Submit Set {setName} for review</p>
                  </div>
                </div>
                <button onClick={() => setShowSubmitConfirmation(false)} className="btn-close btn-close-white opacity-100 shadow-none"></button>
              </div>

              {/* Body */}
              <div className="p-4 text-center">
                <div className="bg-success bg-opacity-10 text-success p-3 rounded-4 mb-4 d-inline-block">
                  <FaExclamationCircle size={48} />
                </div>
                <h5 className="fw-bold text-dark mb-2">Ready to Submit?</h5>
                <p className="text-secondary small mb-4">
                  Once submitted, you won't be able to edit these questions unless the HOD or Coordinator requests changes.
                </p>

                <div className="d-flex gap-3 justify-content-center pt-2">
                  <button
                    className="btn btn-light px-4 fw-bold rounded-pill"
                    onClick={() => setShowSubmitConfirmation(false)}
                  >
                    Not Yet
                  </button>
                  <button
                    className="btn btn-vibrant-success text-white px-5 fw-bold shadow-sm rounded-pill"
                    onClick={handleSubmit}
                  >
                    Submit Now
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        <AIReviewModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          aiResponse={aiResponse}
          questions={questions}
          loading={isAILoading}
          onApplyFix={handleApplyAIFix}
          onApplyAllFixes={handleApplyAllFixes}
          onReRun={handleAIReview}
          feedback={aiFixFeedback}
        />

        {showHistoryModal && ReactDOM.createPortal(
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
            padding: '1rem'
          }} onClick={() => setShowHistoryModal(false)}>
            <div className="modal-content border-0 shadow-2xl bg-white overflow-hidden"
              style={{ width: '100%', maxWidth: '600px', borderRadius: '24px', animation: 'zoomIn 0.3s' }}
              onClick={e => e.stopPropagation()}>

              <div className="p-4 text-white d-flex align-items-center justify-content-between"
                style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                    <FaHistory size={20} />
                  </div>
                  <div>
                    <h5 className="m-0 fw-bold">Activity History</h5>
                    <p className="m-0 small opacity-75">Audit log for Set {setName}</p>
                  </div>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="btn-close btn-close-white opacity-100 shadow-none"></button>
              </div>

              <div className="p-4 overflow-auto" style={{ maxHeight: '60vh' }}>
                {activityLog && activityLog.length > 0 ? (
                  <div className="activity-timeline">
                    {activityLog.slice().reverse().map((log, i) => (
                      <div key={i} className="d-flex gap-3 mb-4 last-mb-0 position-relative">
                        <div className="flex-shrink-0 d-flex flex-column align-items-center">
                          <div className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0 ${log.action.includes('Approved') ? 'bg-success' :
                            log.action.includes('Rejected') ? 'bg-danger' :
                              log.action.includes('Submitted') ? 'bg-primary' : 'bg-secondary'
                            } text-white`} style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', zIndex: 2 }}>
                            {log.action.includes('Approved') ? <FaCheck size={12} /> :
                              log.action.includes('Submitted') ? <FaCheckDouble size={12} /> :
                                <FaHistory size={12} />}
                          </div>
                          {i !== activityLog.length - 1 && (
                            <div className="h-100 border-start mt-1" style={{ borderStyle: 'dashed', opacity: 0.3 }}></div>
                          )}
                        </div>
                        <div className="flex-grow-1 pt-1 pb-3">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div>
                              <h6 className="fw-bold text-dark m-0">{log.action}</h6>
                              {(log.userName || log.userUID) && (
                                <div className="text-muted x-small fw-bold mt-1">
                                  by {log.userName || 'Unknown'} {log.userUID ? `(${log.userUID})` : ''}
                                </div>
                              )}
                            </div>
                            <span className="text-muted x-small fw-medium" style={{ fontSize: '11px' }}>
                              {new Date(log.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p className="text-secondary small m-0 lh-base">{log.details || 'No details specified.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                      <FaHistory size={40} className="text-muted opacity-50" />
                    </div>
                    <h6 className="fw-bold text-dark">No history yet</h6>
                    <p className="text-secondary small m-0">Activity log for this set will appear here.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-light text-center">
                <button className="btn btn-dark rounded-pill px-5 fw-bold shadow-sm" onClick={() => setShowHistoryModal(false)}>Close Log</button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {(!['Approved', 'Submitted'].includes(hodStatus)) && questions.length > 0 && (
          <button
            className="btn btn-floating-add text-white"
            style={{
              position: 'fixed',
              bottom: '2.5rem',
              right: '2.5rem',
              zIndex: 1050,
              height: '52px',
              padding: '0 28px',
              borderRadius: '26px'
            }}
            onClick={() => setShowCreateQuestion(true)}
          >
            <FaPlus size={18} className="me-2" />
            <span className="fw-bold fs-6">Create Question</span>
          </button>
        )}

      </div>
    </div >
  );
};

export default QuestionsList;
