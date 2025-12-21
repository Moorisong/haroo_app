import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { advanceDay, advanceHours, resetMainTestState, resetTraceTestState, getTestStatus, createTestUser, createTestConnection, forceActivateMessageMode, forceExpireMessageMode, forceRejectMessageMode, getTestMessageLogs, getTestPushLogs } from '../services/api';
import LocationService from '../services/LocationService';
import traceService from '../services/traceService';

export const TestToolsScreen = () => {
    const insets = useSafeAreaInsets();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showMainContent, setShowMainContent] = useState(false);
    const [showTrace, setShowTrace] = useState(false);

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
                <View style={styles.timeButtonRow}>
                    <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => handleAction(() => advanceHours(1), 'Advanced 1 Hour')}
                        disabled={loading}
                    >
                        <Text style={styles.timeButtonText}>+1h</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => handleAction(() => advanceHours(2), 'Advanced 2 Hours')}
                        disabled={loading}
                    >
                        <Text style={styles.timeButtonText}>+2h</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => handleAction(() => advanceHours(12), 'Advanced 12 Hours')}
                        disabled={loading}
                    >
                        <Text style={styles.timeButtonText}>+12h</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => handleAction(() => advanceDay(1), 'Advanced 1 Day')}
                        disabled={loading}
                    >
                        <Text style={styles.timeButtonText}>+1d</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => handleAction(() => advanceDay(3), 'Advanced 3 Days')}
                        disabled={loading}
                    >
                        <Text style={styles.timeButtonText}>+3d</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 메인 콘텐츠 토글 섹션 */}
            <TouchableOpacity
                style={styles.toggleHeader}
                onPress={() => setShowMainContent(!showMainContent)}
            >
                <Text style={styles.toggleTitle}>📨 메인 콘텐츠 Test</Text>
                <Text style={styles.toggleArrow}>{showMainContent ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {showMainContent && (
                <View style={styles.toggleContent}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => handleAction(createTestUser, 'Test User Created/Ensured')}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Ensure Test User (TEST_RECEIVER)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#4CAF50' }]}
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

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#E91E63' }]}
                        onPress={() => handleAction(forceRejectMessageMode, 'Force Rejected')}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Force Reject (PENDING only)</Text>
                    </TouchableOpacity>

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
            )}

            {/* 한줄 토글 섹션 */}
            <TouchableOpacity
                style={styles.toggleHeader}
                onPress={() => setShowTrace(!showTrace)}
            >
                <Text style={styles.toggleTitle}>📍 여기 한줄 (Trace) Test</Text>
                <Text style={styles.toggleArrow}>{showTrace ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {showTrace && (
                <View style={styles.toggleContent}>
                    <Text style={styles.sectionDesc}>작성 권한 상태를 변경하여 테스트합니다.</Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#4CAF50' }]}
                        onPress={() => {
                            (global as any).TRACE_WRITE_PERMISSION = 'FREE_AVAILABLE';
                            Alert.alert('Trace Test', '무료 작성 가능 상태로 변경됨');
                        }}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>FREE_AVAILABLE (무료 작성 가능)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#FF9800' }]}
                        onPress={() => {
                            (global as any).TRACE_WRITE_PERMISSION = 'FREE_USED';
                            Alert.alert('Trace Test', '무료 작성 초과 상태로 변경됨');
                        }}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>FREE_USED (결제 모달 테스트)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#9C27B0' }]}
                        onPress={() => {
                            (global as any).TRACE_WRITE_PERMISSION = 'PAID_AVAILABLE';
                            Alert.alert('Trace Test', '유료 작성 가능 상태로 변경됨');
                        }}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>PAID_AVAILABLE (유료 추가 작성)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#f44336' }]}
                        onPress={() => {
                            (global as any).TRACE_WRITE_PERMISSION = 'DENIED_COOLDOWN';
                            Alert.alert('Trace Test', '쿨다운 상태로 변경됨');
                        }}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>DENIED_COOLDOWN (쿨다운 테스트)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#607D8B', marginTop: 10 }]}
                        onPress={async () => {
                            try {
                                setLoading(true);
                                const loc = await LocationService.getCurrentLocation();
                                if (loc.errorMsg || !loc.isInKorea) {
                                    await traceService.seedTestMessages(35.8296177, 128.7372248);
                                } else {
                                    await traceService.seedTestMessages(loc.lat, loc.lng);
                                }
                                Alert.alert('Success', '테스트 메시지 5개가 생성되었습니다.');
                            } catch (e) {
                                console.error(e);
                                Alert.alert('Error', '생성 실패');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>타인 글 5개 생성 (Seeding)</Text>
                    </TouchableOpacity>

                    <View style={styles.traceStatusBox}>
                        <Text style={styles.traceStatusText}>
                            현재 상태: {(global as any).TRACE_WRITE_PERMISSION || 'FREE_AVAILABLE'}
                        </Text>
                    </View>
                </View>
            )}

            {/* Reset 섹션 (맨 아래) */}
            <View style={[styles.section, { marginTop: 20 }]}>
                <Text style={styles.sectionTitle}>🗑️ Reset</Text>

                <TouchableOpacity
                    style={[styles.button, styles.dangerButton]}
                    onPress={() => handleAction(resetMainTestState, '메인 콘텐츠 테스트 상태 초기화')}
                    disabled={loading}
                >
                    <Text style={[styles.buttonText, styles.dangerButtonText]}>메인 콘텐츠 초기화</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.dangerButton]}
                    onPress={() => {
                        handleAction(resetTraceTestState, '한줄 테스트 상태 초기화');
                        delete (global as any).TRACE_WRITE_PERMISSION;
                    }}
                    disabled={loading}
                >
                    <Text style={[styles.buttonText, styles.dangerButtonText]}>한줄 테스트 초기화</Text>
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
    },
    sectionDesc: {
        fontSize: 13,
        color: '#888',
        marginBottom: 12,
    },
    traceStatusBox: {
        backgroundColor: '#e3f2fd',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    traceStatusText: {
        fontSize: 14,
        color: '#1976d2',
        fontWeight: '600',
        textAlign: 'center',
    },
    toggleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    toggleArrow: {
        fontSize: 14,
        color: '#666',
    },
    toggleContent: {
        backgroundColor: '#fff',
        padding: 15,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        marginTop: -5,
    },
    timeButtonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    timeButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    timeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
