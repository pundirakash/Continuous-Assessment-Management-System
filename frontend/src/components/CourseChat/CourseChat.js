import React, { useState, useEffect, useRef } from 'react';
import chatService from '../../services/chatService';
import LoadingSpinner from '../LoadingSpinner';
import { FaPaperPlane, FaTimes, FaRobot, FaUserTie, FaUserGraduate, FaUsers, FaArrowRight } from 'react-icons/fa';

const CourseChat = ({ course, currentUser, onClose, termId }) => {
    const [messages, setMessages] = useState([]);
    const [courseData, setCourseData] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const courseId = course?._id;

    useEffect(() => {
        if (!courseId) return;

        const fetchInitialData = async () => {
            try {
                const data = await chatService.getCourseMessages(courseId, termId);
                setMessages(data.messages || []);
                if (data.course) {
                    setCourseData(data.course);
                }
                setLoading(false);
                chatService.markAsRead(courseId); // Mark as read when opened
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                setLoading(false);
            }
        };

        const pollMessages = async () => {
            try {
                const data = await chatService.getCourseMessages(courseId, termId);
                setMessages(data.messages || []);
            } catch (error) {
                console.error("Failed to poll messages", error);
            }
        };

        fetchInitialData();
        const interval = setInterval(pollMessages, 5000);
        return () => clearInterval(interval);
    }, [courseId, termId]);

    useEffect(() => {
        if (!loading) {
            scrollToBottom();
        }
    }, [messages, loading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const sentMessage = await chatService.sendMessage(courseId, newMessage);
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setSending(false);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'HOD': return <FaRobot className="text-danger" />;
            case 'CourseCoordinator': return <FaUserTie className="text-primary" />;
            default: return <FaUserGraduate className="text-secondary" />;
        }
    };

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'HOD': return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }; // Red-100 bg, Red-800 text
            case 'CourseCoordinator': return { backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #a5b4fc' }; // Indigo-100 bg, Indigo-800 text
            default: return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }; // Gray-100 bg, Gray-800 text
        }
    };

    // Use participants from API if available, otherwise calculate from prop/data
    const getParticipants = () => {
        if (courseData?.participants) return courseData.participants;

        const active = courseData || course;
        if (!active) return [];

        const list = [
            ...(active.coordinator ? [{ ...active.coordinator, role: 'CourseCoordinator' }] : []),
            ...(active.faculties || []).map(f => (typeof f === 'object' ? { ...f, role: 'Faculty' } : null))
        ].filter(p => p !== null);

        // Filter duplicates by ID
        return Array.from(new Map(list.map(item => [item._id || item, item])).values());
    };

    const activeCourse = courseData || course;
    const participants = getParticipants();

    return (
        <div className="course-chat-sidebar d-flex flex-column h-100 bg-white shadow-2xl animate-chat-slide"
            style={{
                width: '450px',
                position: 'fixed',
                right: 0,
                top: 0,
                bottom: 0,
                zIndex: 1100,
                borderLeft: '1px solid rgba(0,0,0,0.05)'
            }}>

            {/* 🌟 Header */}
            <div className="p-4 text-white position-relative overflow-hidden"
                style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>

                <div className="d-flex justify-content-between align-items-start position-relative" style={{ zIndex: 2 }}>
                    <div>
                        <div className="text-xs text-primary fw-bold text-uppercase tracking-widest mb-1">
                            Course Discussion
                        </div>
                        <h5 className="m-0 fw-bold">{activeCourse?.name || 'Loading...'}</h5>
                        <div className="d-flex align-items-center gap-2 mt-2">
                            <span className="badge bg-white bg-opacity-10 text-white font-monospace small px-2 py-1 border border-white border-opacity-25 shadow-sm">
                                {activeCourse?.code || activeCourse?.courseCode || 'N/A'}
                            </span>
                            <div className="text-xs opacity-50">• {participants.length} Members</div>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <button
                            className={`btn btn-sm btn-icon rounded-circle ${showParticipants ? 'bg-primary' : 'bg-white bg-opacity-10'} text-white border-0 transition-all`}
                            onClick={() => setShowParticipants(!showParticipants)}
                            title="View Participants"
                        >
                            <FaUsers size={16} />
                        </button>
                        <button
                            className="btn btn-sm btn-icon rounded-circle bg-white bg-opacity-10 text-white border-0 hover-bg-danger transition-all"
                            onClick={onClose}
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>
                </div>

                <div className="position-absolute" style={{ top: -30, right: -30, width: 120, height: 120, background: 'rgba(79, 70, 229, 0.15)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
            </div>

            {/* Participants View Overlay */}
            {showParticipants && (
                <div className="participants-view position-absolute w-100 bg-white shadow-lg animate-fade-in"
                    style={{ top: '120px', bottom: 0, zIndex: 10, overflowY: 'auto' }}>
                    <div className="p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h6 className="fw-bold m-0 d-flex align-items-center gap-2 text-dark">
                                <FaUsers className="text-primary" /> Member List
                            </h6>
                            <button className="btn btn-sm text-primary p-0 text-xs fw-bold" onClick={() => setShowParticipants(false)}>
                                Back to Chat
                            </button>
                        </div>

                        <div className="d-flex flex-column gap-2">
                            {participants.map((participant, idx) => (
                                <div key={participant._id || idx} className="d-flex align-items-center gap-3 p-3 rounded-4 bg-light border border-white hover-shadow transition-all">
                                    <div className="p-2 bg-white rounded-circle shadow-sm">
                                        {getRoleIcon(participant.role)}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="fw-bold text-dark small">{participant.name}</div>
                                        <div className="text-xs text-muted">{participant.role}</div>
                                    </div>
                                    <div className="dot rounded-circle bg-success" style={{ width: 8, height: 8 }}></div>
                                </div>
                            ))}
                            {participants.length === 0 && (
                                <div className="text-center py-5 text-muted small opacity-50">
                                    No members found for this term.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-grow-1 overflow-auto p-4 bg-slate-50" style={{ scrollBehavior: 'smooth' }}>
                {loading ? (
                    <div className="h-100 d-flex align-items-center justify-content-center">
                        <LoadingSpinner />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center opacity-40">
                        <div className="p-4 bg-white rounded-circle mb-4 shadow-sm">
                            <FaPaperPlane size={40} className="text-primary" />
                        </div>
                        <h6 className="fw-bold">No discussions yet</h6>
                        <p className="small text-center px-5">Start a conversation with the coordinator and faculties assigned for this term.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMine = msg.sender?._id === currentUser?._id;
                        const isFirstInGroup = index === 0 || messages[index - 1]?.sender?._id !== msg.sender?._id;

                        return (
                            <div key={msg._id || index} className={`mb-3 d-flex flex-column ${isMine ? 'align-items-end' : 'align-items-start'}`}>
                                {isFirstInGroup && !isMine && (
                                    <div className="d-flex align-items-center gap-2 mb-1 px-1">
                                        <span className="text-xs fw-bold text-dark">{msg.sender?.name || 'Unknown'}</span>
                                        <span
                                            className="px-2 py-0.5 rounded-pill text-xs fw-bold"
                                            style={getRoleBadgeStyle(msg.sender?.role)}
                                        >
                                            {msg.sender?.role || '...'}
                                        </span>
                                    </div>
                                )}
                                <div className={`position-relative p-3 rounded-4 shadow-sm ${isMine ? 'bg-primary text-white rounded-tr-0' : 'bg-white text-dark rounded-tl-0 border border-light'
                                    }`}
                                    style={{ maxWidth: '85%', fontSize: '0.925rem', lineHeight: '1.5' }}>
                                    {msg.message}
                                    <div className={`mt-1 text-end ${isMine ? 'text-primary-light opacity-75' : 'text-muted'}`}
                                        style={{ fontSize: '0.65rem' }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-top shadow-lg">
                <form onSubmit={handleSendMessage} className="d-flex gap-2">
                    <div className="flex-grow-1 position-relative">
                        <input
                            type="text"
                            className="form-control rounded-4 border-0 bg-light px-4 py-3 shadow-none text-dark"
                            placeholder="Message the team..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending}
                            style={{ fontSize: '0.95rem' }}
                        />
                    </div>
                    <button
                        type="submit"
                        className={`btn btn-primary rounded-4 px-4 d-flex align-items-center justify-content-center shadow-sm hover-scale transition-all ${!newMessage.trim() || sending ? 'opacity-50' : 'hover-glow'}`}
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending ? <LoadingSpinner size="sm" /> : <FaArrowRight size={16} />}
                    </button>
                </form>
            </div>

            <style>{`
                @keyframes chatSlide {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-chat-slide { animation: chatSlide 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
                .bg-slate-50 { background-color: #f8fafc; }
                .btn-icon { width: 36px; height: 36px; padding: 0 !important; display: flex; align-items: center; justify-content: center; }
                .hover-bg-danger:hover { background-color: #ef4444 !important; }
                .rounded-tr-0 { border-top-right-radius: 0 !important; }
                .rounded-tl-0 { border-top-left-radius: 0 !important; }
                .text-xs { font-size: 0.725rem; }
                .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
                .no-focus-ring:focus { border-color: transparent !important; box-shadow: none !important; }
                .text-primary-light { color: #c7d2fe; }
                .hover-glow:hover { box-shadow: 0 0 15px rgba(79, 70, 229, 0.4); }
                .tracking-widest { letter-spacing: 0.1em; }
            `}</style>
        </div>
    );
};

export default CourseChat;
