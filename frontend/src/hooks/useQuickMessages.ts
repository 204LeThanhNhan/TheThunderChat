import { useState, useEffect, useCallback } from 'react';
import { quickMessageService } from '@/services/quickMessageService';

export const useQuickMessages = () => {
    const [quickMessages, setQuickMessages] = useState<Record<string, string>>({});
    const [suggestions, setSuggestions] = useState<{ key: string; value: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadQuickMessages();
    }, []);

    const loadQuickMessages = async () => {
        try {
            const messages = await quickMessageService.getAll();
            setQuickMessages(messages);
        } catch (error) {
            console.error('Error loading quick messages:', error);
        }
    };

    const searchSuggestions = useCallback(async (prefix: string) => {
        if (!prefix || prefix.length === 0) {
            setSuggestions([]);
            return;
        }

        try {
            const results = await quickMessageService.search(prefix);
            setSuggestions(results);
        } catch (error) {
            console.error('Error searching quick messages:', error);
            setSuggestions([]);
        }
    }, []);

    const saveQuickMessage = async (key: string, value: string) => {
        try {
            setLoading(true);
            const updated = await quickMessageService.save(key, value);
            setQuickMessages(updated);
        } catch (error) {
            console.error('Error saving quick message:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteQuickMessage = async (key: string) => {
        try {
            setLoading(true);
            await quickMessageService.delete(key);
            const { [key]: _, ...rest } = quickMessages;
            setQuickMessages(rest);
        } catch (error) {
            console.error('Error deleting quick message:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const expandQuickMessage = (text: string): string => {
        // Check if text starts with /
        if (!text.startsWith('/')) return text;

        const key = text.slice(1); // Remove /
        return quickMessages[key] || text;
    };

    return {
        quickMessages,
        suggestions,
        loading,
        searchSuggestions,
        saveQuickMessage,
        deleteQuickMessage,
        expandQuickMessage
    };
};
