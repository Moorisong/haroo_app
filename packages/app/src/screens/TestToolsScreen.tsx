import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { advanceDay, resetTestState, getTestStatus, createTestUser, createTestConnection, forceActivateMessageMode, forceExpireMessageMode, getTestMessageLogs, getTestPushLogs } from '../services/api';

export const TestToolsScreen = () => {
    const insets = useSafeAreaInsets();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const data = await getTestStatus();
            setStatus(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch test status');
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleAction = async (action: () => Promise<any>, successMessage: string) => {
        setLoading(true);
        try {
            await action();
            await fetchStatus();
            Alert.alert('Success', successMessage);
        } catch (error) {

            Alert.alert('Error', 'Action failed');
        } finally {
            setLoading(false);
        }
    };

    if (!status && loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.header}>Developer Test Tools</Text>

            <View style={styles.statusBox}>
                <Text style={styles.statusTitle}>Current Status</Text>
                <Text style={styles.statusText}>Mode: {status?.isTestMode ? 'TEST' : 'PROD'}</Text>
                <Text style={styles.statusText}>Offset Days: {status?.currentOffset}</Text>
                <Text style={styles.statusText}>Server Date: {status?.currentTestDate ? new Date(status.currentTestDate).toLocaleString() : 'Loading...'}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Time Travel</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleAction(() => advanceDay(1), 'Advanced 1 Day')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>+1 Day (Next Day)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleAction(() => advanceDay(3), 'Advanced 3 Days')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>+3 Days</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Tools</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleAction(createTestUser, 'Test User Created/Ensured')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Ensure Test User (TEST_RECEIVER)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { marginTop: 10, backgroundColor: '#4CAF50' }]}
                    onPress={() => handleAction(createTestConnection, 'Created PENDING Connection')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Create Test Connection (PENDING)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FF9800' }]}
                    onPress={() => handleAction(() => forceActivateMessageMode(1), 'Force Activated (1 Day)')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Force Activate (1 Day)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FF9800' }]}
                    onPress={() => handleAction(() => forceActivateMessageMode(3), 'Force Activated (3 Days)')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Force Activate (3 Days)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#9E9E9E' }]}
                    onPress={() => handleAction(forceExpireMessageMode, 'Force Expired')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Force Expire</Text>
                </TouchableOpacity>

            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Receiver Simulation</Text>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#607D8B' }]}
                    onPress={async () => {
                        setLoading(true);
                        try {
                            const logs = await getTestMessageLogs();
                            Alert.alert('Receiver Message', JSON.stringify(logs, null, 2));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to fetch messages');
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>View Receiver Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#3F51B5' }]}
                    onPress={async () => {
                        setLoading(true);
                        try {
                            const logs = await getTestPushLogs();
                            Alert.alert('Receiver Push Logs', JSON.stringify(logs, null, 2));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to fetch push logs');
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>View Receiver Push Logs</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reset</Text>
                <TouchableOpacity
                    style={[styles.button, styles.dangerButton]}
                    onPress={() => handleAction(resetTestState, 'Test State Reset')}
                    disabled={loading}
                >
                    <Text style={[styles.buttonText, styles.dangerButtonText]}>Reset Date & State</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    statusBox: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#666',
    },
    statusText: {
        fontSize: 14,
        marginBottom: 4,
        color: '#333',
        fontFamily: 'monospace',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#444',
    },
    button: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    dangerButton: {
        backgroundColor: '#ff5252',
    },
    dangerButtonText: {
        color: '#fff',
    }
});
