import { useDriverRide } from '../../context/DriverRideContext';
import { SocketContext } from "../../context/WebSocketProvider";
import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useContext, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
    id: string;
    text: string;
    sender: 'driver' | 'rider';
    timestamp: Date;
}

interface ChatScreenProps {
    navigation?: any;
    route?: any;
}

export default function DriverChatScreen({ navigation, route }: ChatScreenProps) {
    const { riderName } = route?.params || {};
    const goBack = () => navigation?.goBack();
    const [messageText, setMessageText] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);
    const { rideId } = useDriverRide();
    const { chatMessages, sendChatMessage } = useContext(SocketContext);

    const currentMessages = rideId ? chatMessages[rideId] || [] : [];

    const handleSendMessage = async () => {
        if (!messageText.trim() || !rideId) return;
        
        const textToSend = messageText.trim();
        setMessageText('');
        
        try {
            await sendChatMessage(rideId, textToSend);
        } catch (err) {
            console.error("Failed to send chat:", err);
        }
    };

    const formatTime = (date: any) => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                   <TouchableOpacity onPress={goBack}>
                       <Feather name="chevron-left" size={28} color="white" />
                   </TouchableOpacity>
                   <View style={styles.headerInfo}>
                        <Text style={styles.riderNameText}>{riderName || "Your Rider"}</Text>
                        <Text style={styles.vehicleText}>Active Ride</Text>
                   </View>
                </View>

                {/* Messages List */}
                <ScrollView 
                    ref={scrollViewRef}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {currentMessages.map((msg) => (
                        <View key={msg.id} style={[
                            styles.bubbleContainer,
                            msg.sender === 'driver' ? styles.driverContainer : styles.riderContainer
                        ]}>
                            <View style={[
                                styles.bubble,
                                msg.sender === 'driver' ? styles.driverBubble : styles.riderBubble
                            ]}>
                                <Text style={[
                                    styles.messageText,
                                    msg.sender === 'driver' ? styles.driverText : styles.riderText
                                ]}>{msg.text}</Text>
                                <Text style={[
                                    styles.timeText,
                                    msg.sender === 'driver' && styles.driverTimeText
                                ]}>{formatTime(msg.timestamp)}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Input Area */}
                <View style={styles.inputWrapper}>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Message your rider..."
                            placeholderTextColor="#666"
                            value={messageText}
                            onChangeText={setMessageText}
                            multiline
                        />
                        <TouchableOpacity 
                            style={[styles.sendCircle, !messageText.trim() && styles.sendDisabled]} 
                            onPress={handleSendMessage}
                            disabled={!messageText.trim()}
                        >
                            <Ionicons name="send" size={20} color={messageText.trim() ? "#000" : "#444"} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
        backgroundColor: '#000',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 8,
    },
    riderNameText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    vehicleText: {
        color: '#facc15',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 30,
    },
    bubbleContainer: {
        width: '100%',
        marginVertical: 4,
        flexDirection: 'row',
    },
    driverContainer: {
        justifyContent: 'flex-end',
    },
    riderContainer: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    driverBubble: {
        backgroundColor: '#facc15',
        borderBottomRightRadius: 4,
    },
    riderBubble: {
        backgroundColor: '#1a1a1a',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    driverText: {
        color: '#000',
    },
    riderText: {
        color: '#fff',
    },
    timeText: {
        fontSize: 10,
        color: 'rgba(0,0,0,0.5)',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    driverTimeText: {
        color: 'rgba(0,0,0,0.6)',
    },
    inputWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#000',
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#111',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#222',
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        maxHeight: 100,
        paddingTop: 8,
        paddingBottom: 8,
        paddingHorizontal: 8,
    },
    sendCircle: {
        backgroundColor: '#facc15',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendDisabled: {
        backgroundColor: '#222',
    },
});