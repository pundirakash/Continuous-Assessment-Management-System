import api from './api';

const chatService = {
    getCourseMessages: async (courseId, termId = null) => {
        const query = termId ? `?termId=${termId}` : '';
        const response = await api.get(`/api/chat/${courseId}${query}`);
        return response.data;
    },

    sendMessage: async (courseId, message) => {
        const response = await api.post(`/api/chat/send`, { courseId, message });
        return response.data;
    },

    markAsRead: async (courseId) => {
        try {
            await api.post(`/api/chat/mark-read`, { courseId });
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    },

    getUnreadCounts: async (courseIds) => {
        try {
            const response = await api.post(`/api/chat/unread-counts`, { courses: courseIds });
            return response.data;
        } catch (error) {
            console.error("Error fetching unread counts:", error);
            return {};
        }
    }
};

export default chatService;
