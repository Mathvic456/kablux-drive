import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Platform,
  useWindowDimensions,
  Dimensions,
  ScrollView,
  Linking,
  Alert 
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Feather, Entypo, MaterialIcons } from '@expo/vector-icons';
import * as MailComposer from 'expo-mail-composer';

export default function HelpAndSupport() {
    const navigation = useNavigation();
    const { width, height } = useWindowDimensions();
    const isSmallScreen = width < 375; // iPhone SE, small Android
    const isMediumScreen = width >= 375 && width <= 414; // iPhone 12-15, most Android
    const isLargeScreen = width > 414; // iPhone Plus/Pro Max
    const isTablet = width > 768;
    const screenHeight = Dimensions.get('window').height;
    const isShortScreen = screenHeight < 700; // Small height devices

    const goBack = () => {
        navigation.goBack();
    }

    // Contact functions
    const handleChatWithUs = async () => {
        try {
            // Using Linking to open email app
            const emailUrl = 'mailto:hello@kabluxe.com?subject=Chat%20Support%20Request&body=Hello%20KabLux%20Support%2C%0A%0AI%20need%20assistance%20with%3A%0A%0A%0A%0ADriver%20ID%3A%20%0APhone%3A%20';
            const canOpen = await Linking.canOpenURL(emailUrl);
            if (canOpen) {
                await Linking.openURL(emailUrl);
            } else {
                // Fallback to MailComposer
                const isAvailable = await MailComposer.isAvailableAsync();
                if (isAvailable) {
                    await MailComposer.composeAsync({
                        recipients: ['hello@kabluxe.com'],
                        subject: 'Chat Support Request',
                        body: 'Hello KabLux Support,\n\nI need assistance with:\n\n\n\nDriver ID: \nPhone: '
                    });
                } else {
                    Alert.alert(
                        'Email Not Available',
                        'Please set up an email client on your device to contact support.',
                        [{ text: 'OK' }]
                    );
                }
            }
        } catch (error) {
            console.error('Error opening email:', error);
            Alert.alert(
                'Error',
                'Unable to open email client. Please try again or use another method.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleCallUs = async () => {
        try {
            const phoneNumber = 'tel:+2348060261407';
            const canOpen = await Linking.canOpenURL(phoneNumber);
            if (canOpen) {
                Alert.alert(
                    'Call Support',
                    'Call KabLux Support at +234 806 026 1407?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Call', onPress: () => Linking.openURL(phoneNumber) }
                    ]
                );
            } else {
                Alert.alert(
                    'Phone Not Available',
                    'Unable to make calls from this device.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error opening phone:', error);
            Alert.alert(
                'Error',
                'Unable to make phone call. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleSendEmail = async () => {
        try {
            const emailUrl = 'mailto:hello@kabluxe.com?subject=KabLux%20Driver%20Support&body=Hello%20KabLux%20Support%2C%0A%0AI%20need%20assistance%20with%3A%0A%0A%0A%0ADriver%20ID%3A%20%0APhone%3A%20%0A%0APlease%20provide%20as%20much%20detail%20as%20possible.';
            const canOpen = await Linking.canOpenURL(emailUrl);
            if (canOpen) {
                await Linking.openURL(emailUrl);
            } else {
                const isAvailable = await MailComposer.isAvailableAsync();
                if (isAvailable) {
                    await MailComposer.composeAsync({
                        recipients: ['hello@kabluxe.com'],
                        subject: 'KabLux Driver Support',
                        body: 'Hello KabLux Support,\n\nI need assistance with:\n\n\n\nDriver ID: \nPhone: \n\nPlease provide as much detail as possible.'
                    });
                } else {
                    Alert.alert(
                        'Email Not Available',
                        'Please set up an email client on your device to send an email.',
                        [{ text: 'OK' }]
                    );
                }
            }
        } catch (error) {
            console.error('Error opening email:', error);
            Alert.alert(
                'Error',
                'Unable to open email client. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleFAQ = () => {
        navigation.navigate('FAQ'); // Make sure you have a FAQ screen in your navigation stack
        // Alternative: You could open a web FAQ page
        // Linking.openURL('https://kabluxe.com/faq');
    };

    // FAQ data if you want to show inline FAQ
    const faqItems = [
        {
            question: 'How do I reset my password?',
            answer: 'Go to Profile → Account Settings → Reset Password. You will receive an email with reset instructions.'
        },
        {
            question: 'How are my earnings calculated?',
            answer: 'Earnings = Base Fare + (Distance × Rate) + (Time × Rate) - Service Fee. Surge pricing applies during high demand.'
        },
        {
            question: 'When do I get paid?',
            answer: 'Weekly payments processed every Monday. Bank transfers take 2-3 business days. Instant cash-out available for a small fee.'
        },
        {
            question: 'What should I do in case of an accident?',
            answer: '1. Ensure safety first. 2. Contact emergency services if needed. 3. Document the scene. 4. Contact KabLux support within 24 hours.'
        },
        {
            question: 'How do I update my bank information?',
            answer: 'Go to Wallet → Payment Methods → Update Bank Info. Changes may take 24-48 hours to verify.'
        }
    ];

    const renderHelpOption = (icon, title, description, onPress, isLast = false) => (
        <TouchableOpacity 
            style={[
                styles.row,
                isSmallScreen && styles.rowSmall,
                isLargeScreen && styles.rowLarge,
                isTablet && styles.rowTablet,
                isShortScreen && styles.rowShort,
                isLast && styles.rowLast
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {icon}
            <View style={[
                styles.textBox,
                isShortScreen && styles.textBoxShort
            ]}>
                <Text style={[
                    styles.title,
                    isSmallScreen && styles.titleSmall,
                    isLargeScreen && styles.titleLarge,
                    isTablet && styles.titleTablet,
                    isShortScreen && styles.titleShort
                ]}>
                    {title}
                </Text>
                <Text style={[
                    styles.desc,
                    isSmallScreen && styles.descSmall,
                    isLargeScreen && styles.descLarge,
                    isTablet && styles.descTablet,
                    isShortScreen && styles.descShort
                ]}>
                    {description}
                </Text>
            </View>
            <Ionicons 
                name="chevron-forward" 
                size={isSmallScreen ? 18 : isShortScreen ? 16 : 20} 
                color="#FFC107" 
                style={styles.chevron}
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="black" />
            <View style={[
                styles.container,
                isSmallScreen && styles.containerSmall,
                isLargeScreen && styles.containerLarge,
                isTablet && styles.containerTablet,
                isShortScreen && styles.containerShort
            ]}>
                {/* Header */}
                <View style={[
                    styles.header,
                    isSmallScreen && styles.headerSmall,
                    isLargeScreen && styles.headerLarge,
                    isTablet && styles.headerTablet,
                    isShortScreen && styles.headerShort
                ]}>
                    <TouchableOpacity 
                        onPress={goBack}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons 
                            name="arrow-back-circle" 
                            size={isSmallScreen ? 28 : isShortScreen ? 26 : 32} 
                            color="white" 
                        />
                    </TouchableOpacity>
                    <Text style={[
                        styles.text,
                        isSmallScreen && styles.textSmall,
                        isLargeScreen && styles.textLarge,
                        isTablet && styles.textTablet,
                        isShortScreen && styles.textShort
                    ]}>Help & Support</Text>
                    <View style={{ 
                        width: isSmallScreen ? 28 : isShortScreen ? 26 : 32 
                    }}></View>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        isShortScreen && styles.scrollContentShort
                    ]}
                >
                    {/* Help Card */}
                    <View style={[
                        styles.card,
                        isSmallScreen && styles.cardSmall,
                        isLargeScreen && styles.cardLarge,
                        isTablet && styles.cardTablet,
                        isShortScreen && styles.cardShort
                    ]}>
                        {/* Chat with us */}
                        {renderHelpOption(
                            <Feather 
                                name="message-circle" 
                                size={isSmallScreen ? 20 : isShortScreen ? 18 : 22} 
                                color="#FFC107" 
                            />,
                            'Chat with us',
                            'Get help with rides or accounts related issues, available 24/7',
                            handleChatWithUs
                        )}

                        {/* Call us */}
                        {renderHelpOption(
                            <Feather 
                                name="phone" 
                                size={isSmallScreen ? 20 : isShortScreen ? 18 : 22} 
                                color="#FFC107" 
                            />,
                            'Call us',
                            'Get help with rides or account related issues\nMonday - Friday, 8am - 9pm',
                            handleCallUs
                        )}

                        {/* Send us an email */}
                        {renderHelpOption(
                            <MaterialIcons 
                                name="email" 
                                size={isSmallScreen ? 20 : isShortScreen ? 18 : 22} 
                                color="#FFC107" 
                            />,
                            'Send us an email',
                            'Get help with rides or account related issues, available 24/7',
                            handleSendEmail
                        )}

                        {/* FAQ */}
                        {renderHelpOption(
                            <Entypo 
                                name="help" 
                                size={isSmallScreen ? 20 : isShortScreen ? 18 : 22} 
                                color="#FFC107" 
                            />,
                            'FAQ',
                            'Get quick help from our frequently asked questions',
                            handleFAQ,
                            true
                        )}
                    </View>

                    {/* Quick Help Section */}
                    <View style={[
                        styles.quickHelpSection,
                        isSmallScreen && styles.quickHelpSectionSmall,
                        isLargeScreen && styles.quickHelpSectionLarge,
                        isTablet && styles.quickHelpSectionTablet,
                        isShortScreen && styles.quickHelpSectionShort
                    ]}>
                        <Text style={[
                            styles.quickHelpTitle,
                            isSmallScreen && styles.quickHelpTitleSmall,
                            isLargeScreen && styles.quickHelpTitleLarge,
                            isTablet && styles.quickHelpTitleTablet,
                            isShortScreen && styles.quickHelpTitleShort
                        ]}>Quick Help Topics</Text>
                        
                        {faqItems.map((item, index) => (
                            <TouchableOpacity 
                                key={index}
                                style={[
                                    styles.faqItem,
                                    isSmallScreen && styles.faqItemSmall,
                                    isLargeScreen && styles.faqItemLarge,
                                    isShortScreen && styles.faqItemShort,
                                    index === faqItems.length - 1 && styles.faqItemLast
                                ]}
                                onPress={() => Alert.alert(item.question, item.answer)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.faqQuestion,
                                    isSmallScreen && styles.faqQuestionSmall,
                                    isLargeScreen && styles.faqQuestionLarge,
                                    isShortScreen && styles.faqQuestionShort
                                ]}>{item.question}</Text>
                                <Ionicons 
                                    name="chevron-forward" 
                                    size={isSmallScreen ? 16 : isShortScreen ? 14 : 18} 
                                    color="#FFC107" 
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Contact Info Footer */}
                    <View style={[
                        styles.contactFooter,
                        isSmallScreen && styles.contactFooterSmall,
                        isLargeScreen && styles.contactFooterLarge,
                        isTablet && styles.contactFooterTablet,
                        isShortScreen && styles.contactFooterShort
                    ]}>
                        <Text style={[
                            styles.contactFooterTitle,
                            isSmallScreen && styles.contactFooterTitleSmall,
                            isShortScreen && styles.contactFooterTitleShort
                        ]}>Need Urgent Help?</Text>
                        <View style={[
                            styles.contactFooterRow,
                            isShortScreen && styles.contactFooterRowShort
                        ]}>
                            <Ionicons name="call-outline" size={isSmallScreen ? 16 : isShortScreen ? 14 : 18} color="#FFC107" />
                            <Text style={[
                                styles.contactFooterText,
                                isSmallScreen && styles.contactFooterTextSmall,
                                isShortScreen && styles.contactFooterTextShort
                            ]}>+234 806 026 1407 (Emergency)</Text>
                        </View>
                        <View style={[
                            styles.contactFooterRow,
                            isShortScreen && styles.contactFooterRowShort
                        ]}>
                            <Ionicons name="mail-outline" size={isSmallScreen ? 16 : isShortScreen ? 14 : 18} color="#FFC107" />
                            <Text style={[
                                styles.contactFooterText,
                                isSmallScreen && styles.contactFooterTextSmall,
                                isShortScreen && styles.contactFooterTextShort
                            ]}>hello@kabluxe.com</Text>
                        </View>
                        <Text style={[
                            styles.contactFooterNote,
                            isSmallScreen && styles.contactFooterNoteSmall,
                            isShortScreen && styles.contactFooterNoteShort
                        ]}>Response time: Within 24 hours for emails</Text>
                    </View>

                    {/* Bottom Spacer */}
                    <View style={[
                        styles.bottomSpacer,
                        isShortScreen && styles.bottomSpacerShort
                    ]} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'black',
    },
    container: {
        flex: 1,
        backgroundColor: 'black',
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
    },
    containerSmall: {
        paddingTop: Platform.OS === 'ios' ? 5 : 15,
    },
    containerLarge: {
        paddingTop: Platform.OS === 'ios' ? 15 : 25,
    },
    containerTablet: {
        paddingTop: Platform.OS === 'ios' ? 20 : 30,
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
    },
    containerShort: {
        paddingTop: Platform.OS === 'ios' ? 5 : 10,
    },
    scrollContent: {
        paddingBottom: Math.min(height * 0.05, 40),
    },
    scrollContentShort: {
        paddingBottom: Math.min(height * 0.03, 24),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Math.min(width * 0.05, 20),
        paddingBottom: Math.min(height * 0.02, 20),
    },
    headerSmall: {
        paddingHorizontal: Math.min(width * 0.04, 16),
        paddingBottom: Math.min(height * 0.015, 15),
    },
    headerLarge: {
        paddingHorizontal: Math.min(width * 0.06, 24),
        paddingBottom: Math.min(height * 0.025, 25),
    },
    headerTablet: {
        paddingHorizontal: Math.min(width * 0.08, 32),
        paddingBottom: Math.min(height * 0.03, 30),
    },
    headerShort: {
        paddingHorizontal: Math.min(width * 0.035, 14),
        paddingBottom: Math.min(height * 0.01, 10),
    },
    text: {
        fontSize: Math.min(width * 0.065, 30),
        color: 'white',
        fontWeight: '700',
        textAlign: 'center',
        flex: 1,
    },
    textSmall: {
        fontSize: Math.min(width * 0.06, 26),
    },
    textLarge: {
        fontSize: Math.min(width * 0.07, 34),
    },
    textTablet: {
        fontSize: Math.min(width * 0.075, 36),
    },
    textShort: {
        fontSize: Math.min(width * 0.055, 24),
    },
    card: {
        backgroundColor: '#04223A',
        borderWidth: 1,
        borderColor: '#FFC107',
        borderRadius: Math.min(width * 0.04, 16),
        marginHorizontal: Math.min(width * 0.05, 20),
        marginBottom: Math.min(height * 0.03, 30),
        overflow: 'hidden',
    },
    cardSmall: {
        borderRadius: Math.min(width * 0.035, 14),
        marginHorizontal: Math.min(width * 0.04, 16),
        marginBottom: Math.min(height * 0.025, 20),
    },
    cardLarge: {
        borderRadius: Math.min(width * 0.045, 18),
        marginHorizontal: Math.min(width * 0.06, 24),
        marginBottom: Math.min(height * 0.035, 35),
    },
    cardTablet: {
        borderRadius: Math.min(width * 0.05, 20),
        marginHorizontal: Math.min(width * 0.08, 32),
        marginBottom: Math.min(height * 0.04, 40),
    },
    cardShort: {
        borderRadius: Math.min(width * 0.03, 12),
        marginHorizontal: Math.min(width * 0.035, 14),
        marginBottom: Math.min(height * 0.02, 16),
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Math.min(height * 0.018, 16),
        paddingHorizontal: Math.min(width * 0.04, 16),
        borderBottomWidth: 0.8,
        borderBottomColor: 'rgba(255, 193, 7, 0.3)',
        minHeight: Math.min(height * 0.07, 56),
    },
    rowSmall: {
        paddingVertical: Math.min(height * 0.016, 14),
        paddingHorizontal: Math.min(width * 0.035, 14),
        minHeight: Math.min(height * 0.065, 52),
    },
    rowLarge: {
        paddingVertical: Math.min(height * 0.02, 18),
        paddingHorizontal: Math.min(width * 0.045, 18),
        minHeight: Math.min(height * 0.075, 60),
    },
    rowTablet: {
        paddingVertical: Math.min(height * 0.022, 20),
        paddingHorizontal: Math.min(width * 0.06, 24),
        minHeight: Math.min(height * 0.08, 64),
    },
    rowShort: {
        paddingVertical: Math.min(height * 0.014, 12),
        paddingHorizontal: Math.min(width * 0.03, 12),
        minHeight: Math.min(height * 0.06, 48),
    },
    rowLast: {
        borderBottomWidth: 0,
    },
    textBox: {
        marginLeft: Math.min(width * 0.03, 12),
        flex: 1,
        marginRight: Math.min(width * 0.02, 8),
    },
    textBoxShort: {
        marginLeft: Math.min(width * 0.025, 10),
        marginRight: Math.min(width * 0.015, 6),
    },
    title: {
        color: 'white',
        fontSize: Math.min(width * 0.042, 16),
        fontWeight: '600',
        marginBottom: Math.min(height * 0.004, 4),
    },
    titleSmall: {
        fontSize: Math.min(width * 0.04, 14),
    },
    titleLarge: {
        fontSize: Math.min(width * 0.044, 18),
    },
    titleTablet: {
        fontSize: Math.min(width * 0.048, 20),
    },
    titleShort: {
        fontSize: Math.min(width * 0.038, 13),
    },
    desc: {
        color: '#ccc',
        fontSize: Math.min(width * 0.035, 13),
        lineHeight: Math.min(width * 0.042, 18),
    },
    descSmall: {
        fontSize: Math.min(width * 0.033, 12),
        lineHeight: Math.min(width * 0.04, 16),
    },
    descLarge: {
        fontSize: Math.min(width * 0.037, 14),
        lineHeight: Math.min(width * 0.044, 20),
    },
    descTablet: {
        fontSize: Math.min(width * 0.04, 16),
        lineHeight: Math.min(width * 0.048, 22),
    },
    descShort: {
        fontSize: Math.min(width * 0.031, 11),
        lineHeight: Math.min(width * 0.038, 16),
    },
    chevron: {
        marginLeft: 'auto',
    },
    quickHelpSection: {
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#FFC107',
        borderRadius: Math.min(width * 0.04, 16),
        marginHorizontal: Math.min(width * 0.05, 20),
        marginBottom: Math.min(height * 0.03, 30),
        padding: Math.min(width * 0.04, 16),
    },
    quickHelpSectionSmall: {
        borderRadius: Math.min(width * 0.035, 14),
        marginHorizontal: Math.min(width * 0.04, 16),
        marginBottom: Math.min(height * 0.025, 20),
        padding: Math.min(width * 0.035, 14),
    },
    quickHelpSectionLarge: {
        borderRadius: Math.min(width * 0.045, 18),
        marginHorizontal: Math.min(width * 0.06, 24),
        marginBottom: Math.min(height * 0.035, 35),
        padding: Math.min(width * 0.045, 18),
    },
    quickHelpSectionTablet: {
        borderRadius: Math.min(width * 0.05, 20),
        marginHorizontal: Math.min(width * 0.08, 32),
        marginBottom: Math.min(height * 0.04, 40),
        padding: Math.min(width * 0.06, 24),
    },
    quickHelpSectionShort: {
        borderRadius: Math.min(width * 0.03, 12),
        marginHorizontal: Math.min(width * 0.035, 14),
        marginBottom: Math.min(height * 0.02, 16),
        padding: Math.min(width * 0.03, 12),
    },
    quickHelpTitle: {
        color: '#FFC107',
        fontSize: Math.min(width * 0.045, 18),
        fontWeight: '700',
        marginBottom: Math.min(height * 0.015, 15),
    },
    quickHelpTitleSmall: {
        fontSize: Math.min(width * 0.042, 16),
        marginBottom: Math.min(height * 0.012, 12),
    },
    quickHelpTitleLarge: {
        fontSize: Math.min(width * 0.048, 20),
        marginBottom: Math.min(height * 0.018, 18),
    },
    quickHelpTitleTablet: {
        fontSize: Math.min(width * 0.052, 22),
        marginBottom: Math.min(height * 0.02, 20),
    },
    quickHelpTitleShort: {
        fontSize: Math.min(width * 0.04, 14),
        marginBottom: Math.min(height * 0.01, 10),
    },
    faqItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Math.min(height * 0.012, 12),
        paddingHorizontal: Math.min(width * 0.03, 12),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 193, 7, 0.2)',
        minHeight: Math.min(height * 0.05, 40),
    },
    faqItemSmall: {
        paddingVertical: Math.min(height * 0.01, 10),
        paddingHorizontal: Math.min(width * 0.025, 10),
        minHeight: Math.min(height * 0.045, 36),
    },
    faqItemLarge: {
        paddingVertical: Math.min(height * 0.014, 14),
        paddingHorizontal: Math.min(width * 0.035, 14),
        minHeight: Math.min(height * 0.055, 44),
    },
    faqItemShort: {
        paddingVertical: Math.min(height * 0.008, 8),
        paddingHorizontal: Math.min(width * 0.02, 8),
        minHeight: Math.min(height * 0.04, 32),
    },
    faqItemLast: {
        borderBottomWidth: 0,
    },
    faqQuestion: {
        color: 'white',
        fontSize: Math.min(width * 0.038, 14),
        fontWeight: '500',
        flex: 1,
        marginRight: Math.min(width * 0.02, 8),
    },
    faqQuestionSmall: {
        fontSize: Math.min(width * 0.036, 13),
    },
    faqQuestionLarge: {
        fontSize: Math.min(width * 0.04, 16),
    },
    faqQuestionShort: {
        fontSize: Math.min(width * 0.034, 12),
    },
    contactFooter: {
        backgroundColor: '#04223A',
        borderWidth: 1,
        borderColor: '#FFC107',
        borderRadius: Math.min(width * 0.04, 16),
        marginHorizontal: Math.min(width * 0.05, 20),
        padding: Math.min(width * 0.04, 16),
    },
    contactFooterSmall: {
        borderRadius: Math.min(width * 0.035, 14),
        marginHorizontal: Math.min(width * 0.04, 16),
        padding: Math.min(width * 0.035, 14),
    },
    contactFooterLarge: {
        borderRadius: Math.min(width * 0.045, 18),
        marginHorizontal: Math.min(width * 0.06, 24),
        padding: Math.min(width * 0.045, 18),
    },
    contactFooterTablet: {
        borderRadius: Math.min(width * 0.05, 20),
        marginHorizontal: Math.min(width * 0.08, 32),
        padding: Math.min(width * 0.06, 24),
    },
    contactFooterShort: {
        borderRadius: Math.min(width * 0.03, 12),
        marginHorizontal: Math.min(width * 0.035, 14),
        padding: Math.min(width * 0.03, 12),
    },
    contactFooterTitle: {
        color: '#FFC107',
        fontSize: Math.min(width * 0.042, 16),
        fontWeight: '700',
        marginBottom: Math.min(height * 0.012, 12),
    },
    contactFooterTitleSmall: {
        fontSize: Math.min(width * 0.04, 14),
        marginBottom: Math.min(height * 0.01, 10),
    },
    contactFooterTitleShort: {
        fontSize: Math.min(width * 0.038, 13),
        marginBottom: Math.min(height * 0.008, 8),
    },
    contactFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Math.min(height * 0.008, 8),
    },
    contactFooterRowShort: {
        marginBottom: Math.min(height * 0.006, 6),
    },
    contactFooterText: {
        color: 'white',
        fontSize: Math.min(width * 0.038, 14),
        marginLeft: Math.min(width * 0.02, 8),
        flex: 1,
    },
    contactFooterTextSmall: {
        fontSize: Math.min(width * 0.036, 13),
        marginLeft: Math.min(width * 0.015, 6),
    },
    contactFooterTextShort: {
        fontSize: Math.min(width * 0.034, 12),
        marginLeft: Math.min(width * 0.01, 4),
    },
    contactFooterNote: {
        color: '#ccc',
        fontSize: Math.min(width * 0.035, 12),
        fontStyle: 'italic',
        marginTop: Math.min(height * 0.008, 8),
    },
    contactFooterNoteSmall: {
        fontSize: Math.min(width * 0.033, 11),
        marginTop: Math.min(height * 0.006, 6),
    },
    contactFooterNoteShort: {
        fontSize: Math.min(width * 0.031, 10),
        marginTop: Math.min(height * 0.004, 4),
    },
    bottomSpacer: {
        height: Math.min(height * 0.03, 24),
    },
    bottomSpacerShort: {
        height: Math.min(height * 0.02, 16),
    },
});