import { useEffect, useRef, useCallback } from 'react';
import { draftService } from '@/services/draftService';
import { debounce } from 'lodash';

export const useDraftAutoSave = (conversationId: string | null) => {
    const saveTimeoutRef = useRef<NodeJS.Timeout>();

    const saveDraft = useCallback(async (content: string) => {
        if (!conversationId) return;
        
        try {
            if (content.trim()) {
                await draftService.saveDraft(conversationId, content);
            } else {
                await draftService.deleteDraft(conversationId);
            }
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    }, [conversationId]);

    // Debounced save - chỉ save sau 2 giây không typing
    const debouncedSave = useCallback(
        debounce((content: string) => {
            saveDraft(content);
        }, 2000),
        [saveDraft]
    );

    const loadDraft = useCallback(async () => {
        if (!conversationId) return null;
        
        try {
            const draft = await draftService.getDraft(conversationId);
            return draft?.content || '';
        } catch (error) {
            console.error('Error loading draft:', error);
            return '';
        }
    }, [conversationId]);

    const clearDraft = useCallback(async () => {
        if (!conversationId) return;
        
        try {
            await draftService.deleteDraft(conversationId);
        } catch (error) {
            console.error('Error clearing draft:', error);
        }
    }, [conversationId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        saveDraft: debouncedSave,
        loadDraft,
        clearDraft
    };
};
