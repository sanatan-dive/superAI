// lib/api-client.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ConversationData {
  id: string;
  title?: string;
  userId: string;
  createdAt: string;
  _count?: {
    prompts: number;
  };
}

// User API functions
export const userApi = {
  // Create a new user
  async createUser(email: string, name?: string): Promise<ApiResponse<UserData>> {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Failed to create user' };
    }
  },

  // Get user by email or ID
  async getUser(emailOrId: string, isId: boolean = false): Promise<ApiResponse<UserData>> {
    try {
      const param = isId ? `userId=${emailOrId}` : `email=${emailOrId}`;
      const response = await fetch(`/api/users?${param}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching user:', error);
      return { success: false, error: 'Failed to fetch user' };
    }
  },

  // Update user
  async updateUser(userId: string, updates: { name?: string; email?: string }): Promise<ApiResponse<UserData>> {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...updates,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Failed to update user' };
    }
  },

  // Delete user
  async deleteUser(userId: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`/api/users?userId=${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Failed to delete user' };
    }
  },
};



export interface PromptData {
  id: string;
  content: string;
  conversationId: string;
  finalAnswer?: string;
  createdAt: string;
  responses: ResponseData[];
}

export interface ResponseData {
  id: string;
  modelName: string;
  output: string;
  promptId: string;
  createdAt: string;
}

export interface UserData {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  _count?: {
    conversations: number;
  };
}

export interface CreatePromptRequest {
  userId: string;
  conversationId: string;
  content: string;
  responses?: {
    modelName: string;
    output: string;
  }[];
  finalAnswer?: string;
}

// Chat API functions
export const chatApi = {
  // Create a new prompt with responses
  async createPrompt(data: CreatePromptRequest): Promise<ApiResponse<{
    prompt: PromptData;
    responses: ResponseData[];
  }>> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating prompt:', error);
      return { success: false, error: 'Failed to create prompt' };
    }
  },

  // Get prompts for a conversation
  async getPrompts(conversationId: string, userId: string): Promise<ApiResponse<PromptData[]>> {
    try {
      const response = await fetch(
        `/api/chat?conversationId=${conversationId}&userId=${userId}`
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching prompts:', error);
      return { success: false, error: 'Failed to fetch prompts' };
    }
  },

  // Update prompt's final answer
  async updateFinalAnswer(promptId: string, finalAnswer: string, userId: string): Promise<ApiResponse<PromptData>> {
    try {
      const response = await fetch('/api/chat', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId,
          finalAnswer,
          userId,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating final answer:', error);
      return { success: false, error: 'Failed to update final answer' };
    }
  },
};

// Conversation API functions
export const conversationApi = {
  // Create a new conversation
  async createConversation(userId: string, title?: string): Promise<ApiResponse<ConversationData>> {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: 'Failed to create conversation' };
    }
  },

  // Get user's conversations
  async getConversations(userId: string): Promise<ApiResponse<ConversationData[]>> {
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { success: false, error: 'Failed to fetch conversations' };
    }
  },

  // Update conversation title
  async updateConversation(conversationId: string, title: string, userId: string): Promise<ApiResponse<ConversationData>> {
    try {
      const response = await fetch('/api/conversations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          title,
          userId,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return { success: false, error: 'Failed to update conversation' };
    }
  },

  // Delete a conversation
  async deleteConversation(conversationId: string, userId: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(
        `/api/conversations?conversationId=${conversationId}&userId=${userId}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return { success: false, error: 'Failed to delete conversation' };
    }
  },
};

// Example usage function for your Hero component
export const saveUserMessageAndResponses = async (
  userId: string,
  conversationId: string,
  userMessage: string,
  aiResponses: { modelName: string; output: string }[],
  finalAnswer?: string
) => {
  try {
    const result = await chatApi.createPrompt({
      userId,
      conversationId,
      content: userMessage,
      responses: aiResponses,
      finalAnswer,
    });

    if (result.success) {
      console.log('Successfully saved prompt and responses:', result.data);
      return result.data;
    } else {
      console.error('Failed to save:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error saving message:', error);
    return null;
  }
};