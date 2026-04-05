import Conversation from "../schemas/Conversation.js";

export const getUserConversationsForSocketIO = async (userId) => {
    try {
        const conversations = await Conversation.find(
            {"participants.userId" : userId},
            {_id: 1}
        );

        return conversations.map((c) => c._id.toString());
    } catch (error) {
        console.error(`Lỗi khi fetch conversations ${error}`);
        return [];
    }
};
