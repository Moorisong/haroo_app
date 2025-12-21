import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';

interface LoadingContextType {
    showLoading: () => void;
    hideLoading: () => void;
    isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

const DELAY_MS = 500; // Only show spinner if request takes longer than this

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const loadingCount = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showLoading = useCallback(() => {
        loadingCount.current += 1;

        if (loadingCount.current === 1) {
            setIsLoading(true);
            // Only show spinner after delay
            timeoutRef.current = setTimeout(() => {
                if (loadingCount.current > 0) {
                    setShowSpinner(true);
                }
            }, DELAY_MS);
        }
    }, []);

    const hideLoading = useCallback(() => {
        loadingCount.current = Math.max(0, loadingCount.current - 1);

        if (loadingCount.current === 0) {
            setIsLoading(false);
            setShowSpinner(false);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
    }, []);

    return (
        <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading }}>
            {children}
            <Modal
                visible={showSpinner}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View style={styles.overlay}>
                    <View style={styles.spinnerContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                </View>
            </Modal>
        </LoadingContext.Provider>
    );
};

export const useLoading = (): LoadingContextType => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};

// Singleton for axios interceptors (before context is mounted)
let globalShowLoading: (() => void) | null = null;
let globalHideLoading: (() => void) | null = null;

export const setGlobalLoadingHandlers = (
    show: () => void,
    hide: () => void
) => {
    globalShowLoading = show;
    globalHideLoading = hide;
};

export const getGlobalLoadingHandlers = () => ({
    showLoading: globalShowLoading,
    hideLoading: globalHideLoading,
});

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 16,
        padding: 24,
    },
});
