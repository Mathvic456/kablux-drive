import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  useWindowDimensions,
  Dimensions 
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';

export default function Legal() {
    const navigation = useNavigation();
    const [activeSection, setActiveSection] = useState('terms');
    
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

    const legalSections = {
        terms: {
            title: 'Terms of Service',
            content: `Last Updated: December 15, 2024

1. ACCEPTANCE OF TERMS
By accessing or using the KabLux Driver application ("the App"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.

2. DRIVER REQUIREMENTS
2.1. You must be at least 21 years old with a valid driver's license.
2.2. Maintain valid vehicle insurance and registration.
2.3. Pass background checks and maintain a good driving record.
2.4. Keep your vehicle in safe and clean condition.

3. SERVICE PROVISION
3.1. You are an independent contractor, not an employee of KabLux.
3.2. You have the flexibility to choose when and where you work.
3.3. KabLux provides the platform to connect you with riders.

4. PAYMENTS AND FEES
4.1. You receive a percentage of the total fare as per our current payment structure.
4.2. Payments are processed weekly via your preferred payment method.
4.3. KabLux may charge service fees for platform usage.

5. CODE OF CONDUCT
5.1. Treat all riders with respect and professionalism.
5.2. Follow all traffic laws and safety regulations.
5.3. Maintain vehicle cleanliness and safety standards.
5.4. Do not discriminate against riders based on race, gender, religion, or any other protected characteristic.

6. TERMINATION
Either party may terminate this agreement at any time with written notice. KabLux reserves the right to suspend or terminate accounts for violations of these terms.`
        },
        privacy: {
            title: 'Privacy Policy',
            content: `Last Updated: December 15, 2024

1. INFORMATION WE COLLECT
1.1. Personal Information: Name, email, phone number, driver's license, vehicle information.
1.2. Location Data: GPS data during active trips for navigation and safety.
1.3. Trip Information: Pickup/dropoff locations, trip duration, fare information.
1.4. Device Information: Device type, operating system, app usage data.

2. HOW WE USE YOUR INFORMATION
2.1. To provide and improve our services.
2.2. To process payments and calculate earnings.
2.3. For safety and security purposes.
2.4. To communicate important updates and notifications.

3. INFORMATION SHARING
3.1. With riders: Your name, vehicle details, and location during active trips.
3.2. With service providers: Payment processors, background check services.
3.3. Legal requirements: When required by law or to protect our rights.

4. DATA SECURITY
We implement industry-standard security measures to protect your personal information. However, no method of electronic transmission is 100% secure.

5. DATA RETENTION
We retain your personal information for as long as necessary to provide our services and comply with legal obligations.`
        },
        community: {
            title: 'Community Guidelines',
            content: `Last Updated: December 15, 2024

1. RESPECT AND PROFESSIONALISM
1.1. Treat all riders and fellow drivers with respect.
1.2. Maintain professional communication at all times.
1.3. Dress appropriately and maintain personal hygiene.

2. SAFETY FIRST
2.1. Always prioritize safety over speed.
2.2. Follow all traffic laws and regulations.
2.3. Do not use mobile devices while driving.
2.4. Ensure vehicle is properly maintained and safe.

3. SERVICE STANDARDS
3.1. Arrive on time for scheduled pickups.
3.2. Maintain a clean and comfortable vehicle.
3.3. Assist riders with luggage when appropriate.
3.4. Follow the designated route unless requested by rider.

4. PROHIBITED ACTIVITIES
4.1. No smoking or vaping in vehicles.
4.2. No use of drugs or alcohol while driving.
4.3. No discrimination of any kind.
4.4. No solicitation of riders for other services.

5. CONFLICT RESOLUTION
5.1. Handle disputes professionally and calmly.
5.2. Contact support for assistance with difficult situations.
5.3. Never engage in arguments or physical confrontations.`
        },
        insurance: {
            title: 'Insurance Policy',
            content: `Last Updated: December 15, 2024

1. INSURANCE COVERAGE
1.1. Commercial Auto Insurance: Provided by KabLux during active trips.
1.2. Personal Insurance: Required when app is off or personal use.
1.3. Liability Coverage: Up to $1,000,000 for third-party injuries and property damage.

2. COVERAGE PERIODS
2.1. Period 1: App Off - Your personal insurance applies.
2.2. Period 2: App On, No Trip - Contingent liability coverage.
2.3. Period 3: En Route to Pickup - Primary liability coverage.
2.4. Period 4: During Trip - Comprehensive commercial coverage.

3. DRIVER RESPONSIBILITIES
3.1. Maintain valid personal auto insurance.
3.2. Report accidents immediately to KabLux and authorities.
3.3. Cooperate with insurance investigations.
3.4. Keep insurance documents current in the app.

4. CLAIM PROCESS
4.1. Contact emergency services if needed.
4.2. Document the scene with photos and notes.
4.3. Exchange information with other parties.
4.4. Contact KabLux support within 24 hours.

5. DEDUCTIBLES
The deductible for comprehensive and collision coverage is $2,500, which may be waived if not at fault.`
        },
        payment: {
            title: 'Payment Terms',
            content: `Last Updated: December 15, 2024

1. EARNING STRUCTURE
1.1. Base Fare: Fixed amount per trip.
1.2. Time Rate: Earnings based on trip duration.
1.3. Distance Rate: Earnings based on trip distance.
1.4. Surge Pricing: Increased rates during high demand.

2. PAYMENT SCHEDULE
2.1. Weekly payments processed every Monday.
2.2. Payments deposited to your linked bank account.
2.3. 2-3 business days for bank processing.
2.4. Instant cash-out available for small fee.

3. FEES AND COMMISSIONS
3.1. Service Fee: 20-25% of trip fare depending on city.
3.2. Booking Fee: Fixed amount per trip paid by rider.
3.3. Instant Cash-out Fee: 1.5% of transferred amount.

4. TAX RESPONSIBILITIES
4.1. You are responsible for reporting your earnings.
4.2. KabLux provides annual tax documents for earnings over $600.
4.3. Keep records of business expenses for deductions.
4.4. Consult with a tax professional for specific advice.

5. PAYMENT ISSUES
5.1. Report missing payments within 30 days.
5.2. Contact support for payment discrepancies.
5.3. Update bank information promptly when needed.`
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="black" />
            <View style={[
                styles.container,
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
                        styles.headerTitle,
                        isSmallScreen && styles.headerTitleSmall,
                        isLargeScreen && styles.headerTitleLarge,
                        isTablet && styles.headerTitleTablet,
                        isShortScreen && styles.headerTitleShort
                    ]}>Legal</Text>
                    <View style={{ width: isSmallScreen ? 28 : 32 }}></View>
                </View>

                {/* Tabs - Fixed Layout */}
                <View style={[
                    styles.tabsContainer,
                    isSmallScreen && styles.tabsContainerSmall,
                    isLargeScreen && styles.tabsContainerLarge,
                    isTablet && styles.tabsContainerTablet,
                    isShortScreen && styles.tabsContainerShort
                ]}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.tabsContent,
                            isShortScreen && styles.tabsContentShort
                        ]}
                    >
                        {Object.keys(legalSections).map((sectionKey) => (
                            <TouchableOpacity
                                key={sectionKey}
                                style={[
                                    styles.tab,
                                    isSmallScreen && styles.tabSmall,
                                    isLargeScreen && styles.tabLarge,
                                    isTablet && styles.tabTablet,
                                    isShortScreen && styles.tabShort,
                                    activeSection === sectionKey && styles.tabActive
                                ]}
                                onPress={() => setActiveSection(sectionKey)}
                            >
                                <Text style={[
                                    styles.tabText,
                                    isSmallScreen && styles.tabTextSmall,
                                    isLargeScreen && styles.tabTextLarge,
                                    isTablet && styles.tabTextTablet,
                                    isShortScreen && styles.tabTextShort,
                                    activeSection === sectionKey && styles.tabTextActive
                                ]}>
                                    {getShortTitle(legalSections[sectionKey].title)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Main Content - Scrollable */}
                <ScrollView 
                    style={styles.mainContent}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.contentContainer,
                        isSmallScreen && styles.contentContainerSmall,
                        isLargeScreen && styles.contentContainerLarge,
                        isTablet && styles.contentContainerTablet,
                        isShortScreen && styles.contentContainerShort
                    ]}
                >
                    <View style={[
                        styles.contentCard,
                        isSmallScreen && styles.contentCardSmall,
                        isLargeScreen && styles.contentCardLarge,
                        isTablet && styles.contentCardTablet,
                        isShortScreen && styles.contentCardShort
                    ]}>
                        <Text style={[
                            styles.sectionTitle,
                            isSmallScreen && styles.sectionTitleSmall,
                            isLargeScreen && styles.sectionTitleLarge,
                            isTablet && styles.sectionTitleTablet,
                            isShortScreen && styles.sectionTitleShort
                        ]}>
                            {legalSections[activeSection].title}
                        </Text>
                        <Text style={[
                            styles.contentText,
                            isSmallScreen && styles.contentTextSmall,
                            isLargeScreen && styles.contentTextLarge,
                            isTablet && styles.contentTextTablet,
                            isShortScreen && styles.contentTextShort
                        ]}>
                            {legalSections[activeSection].content}
                        </Text>
                    </View>

                    {/* Additional Legal Information */}
                    <View style={[
                        styles.legalNotice,
                        isSmallScreen && styles.legalNoticeSmall,
                        isLargeScreen && styles.legalNoticeLarge,
                        isTablet && styles.legalNoticeTablet,
                        isShortScreen && styles.legalNoticeShort
                    ]}>
                        <Ionicons 
                            name="warning-outline" 
                            size={isSmallScreen ? 18 : isShortScreen ? 16 : 20} 
                            color="#FEB914" 
                        />
                        <Text style={[
                            styles.legalNoticeText,
                            isSmallScreen && styles.legalNoticeTextSmall,
                            isLargeScreen && styles.legalNoticeTextLarge,
                            isTablet && styles.legalNoticeTextTablet,
                            isShortScreen && styles.legalNoticeTextShort
                        ]}>
                            These terms are legally binding. By using KabLux Driver services, you agree to comply with all applicable terms and conditions.
                        </Text>
                    </View>

                    {/* Contact Legal */}
                    <View style={[
                        styles.contactCard,
                        isSmallScreen && styles.contactCardSmall,
                        isLargeScreen && styles.contactCardLarge,
                        isTablet && styles.contactCardTablet,
                        isShortScreen && styles.contactCardShort
                    ]}>
                        <Text style={[
                            styles.contactTitle,
                            isSmallScreen && styles.contactTitleSmall,
                            isLargeScreen && styles.contactTitleLarge,
                            isTablet && styles.contactTitleTablet,
                            isShortScreen && styles.contactTitleShort
                        ]}>Legal Questions?</Text>
                        <Text style={[
                            styles.contactText,
                            isSmallScreen && styles.contactTextSmall,
                            isLargeScreen && styles.contactTextLarge,
                            isTablet && styles.contactTextTablet,
                            isShortScreen && styles.contactTextShort
                        ]}>
                            For legal inquiries or clarification on any terms, please contact our legal department:
                        </Text>
                        <View style={[
                            styles.contactInfo,
                            isSmallScreen && styles.contactInfoSmall,
                            isLargeScreen && styles.contactInfoLarge,
                            isShortScreen && styles.contactInfoShort
                        ]}>
                            <Text style={[
                                styles.contactDetail,
                                isSmallScreen && styles.contactDetailSmall,
                                isLargeScreen && styles.contactDetailLarge,
                                isShortScreen && styles.contactDetailShort
                            ]}>📧 hello@kabluxe.com</Text>
                            <Text style={[
                                styles.contactDetail,
                                isSmallScreen && styles.contactDetailSmall,
                                isLargeScreen && styles.contactDetailLarge,
                                isShortScreen && styles.contactDetailShort
                            ]}>📞 +234 806 026 1407-LEGAL</Text>
                        </View>
                    </View>
                    
                    {/* Spacer for bottom safe area */}
                    <View style={[
                        styles.bottomSpacer,
                        isShortScreen && styles.bottomSpacerShort
                    ]} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

// Helper function to shorten long titles for tabs
const getShortTitle = (title) => {
    const shortTitles = {
        'Terms of Service': 'Terms',
        'Privacy Policy': 'Privacy',
        'Community Guidelines': 'Guidelines',
        'Insurance Policy': 'Insurance',
        'Payment Terms': 'Payments'
    };
    return shortTitles[title] || title;
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
    containerShort: {
        paddingTop: Platform.OS === 'ios' ? 5 : 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Math.min(width * 0.05, 20),
        paddingBottom: Math.min(height * 0.015, 15),
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerSmall: {
        paddingHorizontal: Math.min(width * 0.04, 16),
        paddingBottom: Math.min(height * 0.012, 12),
    },
    headerLarge: {
        paddingHorizontal: Math.min(width * 0.06, 24),
        paddingBottom: Math.min(height * 0.018, 18),
    },
    headerTablet: {
        paddingHorizontal: Math.min(width * 0.08, 32),
        paddingBottom: Math.min(height * 0.02, 20),
    },
    headerShort: {
        paddingHorizontal: Math.min(width * 0.035, 14),
        paddingBottom: Math.min(height * 0.01, 10),
    },
    headerTitle: {
        color: 'white',
        fontSize: Math.min(width * 0.055, 24),
        fontWeight: '700',
    },
    headerTitleSmall: {
        fontSize: Math.min(width * 0.052, 20),
    },
    headerTitleLarge: {
        fontSize: Math.min(width * 0.058, 28),
    },
    headerTitleTablet: {
        fontSize: Math.min(width * 0.06, 32),
    },
    headerTitleShort: {
        fontSize: Math.min(width * 0.048, 18),
    },
    tabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: 'black',
        height: Math.min(height * 0.065, 60),
        justifyContent: 'center',
    },
    tabsContainerSmall: {
        height: Math.min(height * 0.06, 56),
    },
    tabsContainerLarge: {
        height: Math.min(height * 0.07, 64),
    },
    tabsContainerTablet: {
        height: Math.min(height * 0.075, 68),
    },
    tabsContainerShort: {
        height: Math.min(height * 0.055, 52),
    },
    tabsContent: {
        paddingHorizontal: Math.min(width * 0.04, 16),
        alignItems: 'center',
    },
    tabsContentShort: {
        paddingHorizontal: Math.min(width * 0.03, 12),
    },
    tab: {
        paddingHorizontal: Math.min(width * 0.035, 16),
        paddingVertical: Math.min(height * 0.01, 8),
        borderRadius: Math.min(width * 0.045, 20),
        marginRight: Math.min(width * 0.015, 8),
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: 'transparent',
        minWidth: Math.min(width * 0.2, 80),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: Math.min(height * 0.035, 32),
    },
    tabSmall: {
        paddingHorizontal: Math.min(width * 0.03, 14),
        paddingVertical: Math.min(height * 0.008, 6),
        borderRadius: Math.min(width * 0.04, 18),
        marginRight: Math.min(width * 0.012, 6),
        minWidth: Math.min(width * 0.18, 70),
        minHeight: Math.min(height * 0.032, 28),
    },
    tabLarge: {
        paddingHorizontal: Math.min(width * 0.04, 18),
        paddingVertical: Math.min(height * 0.012, 10),
        borderRadius: Math.min(width * 0.05, 22),
        marginRight: Math.min(width * 0.018, 10),
        minWidth: Math.min(width * 0.22, 90),
        minHeight: Math.min(height * 0.038, 36),
    },
    tabTablet: {
        paddingHorizontal: Math.min(width * 0.045, 20),
        paddingVertical: Math.min(height * 0.014, 12),
        borderRadius: Math.min(width * 0.055, 25),
        marginRight: Math.min(width * 0.02, 12),
        minWidth: Math.min(width * 0.24, 100),
        minHeight: Math.min(height * 0.042, 40),
    },
    tabShort: {
        paddingHorizontal: Math.min(width * 0.025, 10),
        paddingVertical: Math.min(height * 0.007, 5),
        borderRadius: Math.min(width * 0.035, 16),
        marginRight: Math.min(width * 0.01, 4),
        minWidth: Math.min(width * 0.16, 60),
        minHeight: Math.min(height * 0.03, 26),
    },
    tabActive: {
        backgroundColor: '#FEB914',
        borderColor: '#FEB914',
    },
    tabText: {
        color: '#FEB914',
        fontSize: Math.min(width * 0.035, 14),
        fontWeight: '600',
        textAlign: 'center',
    },
    tabTextSmall: {
        fontSize: Math.min(width * 0.033, 12),
    },
    tabTextLarge: {
        fontSize: Math.min(width * 0.037, 16),
    },
    tabTextTablet: {
        fontSize: Math.min(width * 0.04, 18),
    },
    tabTextShort: {
        fontSize: Math.min(width * 0.031, 11),
    },
    tabTextActive: {
        color: '#000',
        fontWeight: '700',
    },
    mainContent: {
        flex: 1,
    },
    contentContainer: {
        padding: Math.min(width * 0.05, 20),
        paddingBottom: Math.min(height * 0.05, 40),
    },
    contentContainerSmall: {
        padding: Math.min(width * 0.04, 16),
        paddingBottom: Math.min(height * 0.04, 32),
    },
    contentContainerLarge: {
        padding: Math.min(width * 0.06, 24),
        paddingBottom: Math.min(height * 0.06, 48),
    },
    contentContainerTablet: {
        padding: Math.min(width * 0.08, 32),
        paddingBottom: Math.min(height * 0.08, 64),
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    contentContainerShort: {
        padding: Math.min(width * 0.035, 14),
        paddingBottom: Math.min(height * 0.03, 24),
    },
    contentCard: {
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#FEB914',
        borderRadius: Math.min(width * 0.04, 16),
        padding: Math.min(width * 0.05, 20),
        marginBottom: Math.min(height * 0.025, 20),
    },
    contentCardSmall: {
        borderRadius: Math.min(width * 0.035, 14),
        padding: Math.min(width * 0.04, 16),
        marginBottom: Math.min(height * 0.02, 16),
    },
    contentCardLarge: {
        borderRadius: Math.min(width * 0.045, 18),
        padding: Math.min(width * 0.06, 24),
        marginBottom: Math.min(height * 0.03, 24),
    },
    contentCardTablet: {
        borderRadius: Math.min(width * 0.05, 20),
        padding: Math.min(width * 0.08, 32),
        marginBottom: Math.min(height * 0.04, 32),
    },
    contentCardShort: {
        borderRadius: Math.min(width * 0.03, 12),
        padding: Math.min(width * 0.035, 14),
        marginBottom: Math.min(height * 0.015, 12),
    },
    sectionTitle: {
        color: '#FEB914',
        fontSize: Math.min(width * 0.055, 24),
        fontWeight: '700',
        marginBottom: Math.min(height * 0.02, 16),
        textAlign: 'center',
    },
    sectionTitleSmall: {
        fontSize: Math.min(width * 0.052, 20),
        marginBottom: Math.min(height * 0.016, 12),
    },
    sectionTitleLarge: {
        fontSize: Math.min(width * 0.058, 28),
        marginBottom: Math.min(height * 0.024, 20),
    },
    sectionTitleTablet: {
        fontSize: Math.min(width * 0.062, 32),
        marginBottom: Math.min(height * 0.03, 24),
    },
    sectionTitleShort: {
        fontSize: Math.min(width * 0.048, 18),
        marginBottom: Math.min(height * 0.012, 10),
    },
    contentText: {
        color: 'white',
        fontSize: Math.min(width * 0.038, 15),
        lineHeight: Math.min(width * 0.05, 24),
    },
    contentTextSmall: {
        fontSize: Math.min(width * 0.036, 14),
        lineHeight: Math.min(width * 0.048, 22),
    },
    contentTextLarge: {
        fontSize: Math.min(width * 0.04, 16),
        lineHeight: Math.min(width * 0.052, 26),
    },
    contentTextTablet: {
        fontSize: Math.min(width * 0.045, 18),
        lineHeight: Math.min(width * 0.058, 28),
    },
    contentTextShort: {
        fontSize: Math.min(width * 0.034, 13),
        lineHeight: Math.min(width * 0.045, 20),
    },
    legalNotice: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderLeftWidth: Math.min(width * 0.01, 4),
        borderLeftColor: '#FEB914',
        padding: Math.min(width * 0.04, 16),
        borderRadius: Math.min(width * 0.025, 8),
        marginBottom: Math.min(height * 0.025, 20),
        alignItems: 'flex-start',
    },
    legalNoticeSmall: {
        padding: Math.min(width * 0.035, 14),
        borderRadius: Math.min(width * 0.02, 6),
        marginBottom: Math.min(height * 0.02, 16),
    },
    legalNoticeLarge: {
        padding: Math.min(width * 0.045, 18),
        borderRadius: Math.min(width * 0.03, 10),
        marginBottom: Math.min(height * 0.03, 24),
    },
    legalNoticeTablet: {
        padding: Math.min(width * 0.06, 24),
        borderRadius: Math.min(width * 0.035, 12),
        marginBottom: Math.min(height * 0.04, 32),
    },
    legalNoticeShort: {
        padding: Math.min(width * 0.03, 12),
        borderRadius: Math.min(width * 0.018, 6),
        marginBottom: Math.min(height * 0.015, 12),
        borderLeftWidth: Math.min(width * 0.008, 3),
    },
    legalNoticeText: {
        color: '#FEB914',
        fontSize: Math.min(width * 0.038, 14),
        lineHeight: Math.min(width * 0.048, 22),
        marginLeft: Math.min(width * 0.025, 10),
        flex: 1,
    },
    legalNoticeTextSmall: {
        fontSize: Math.min(width * 0.036, 13),
        lineHeight: Math.min(width * 0.045, 20),
        marginLeft: Math.min(width * 0.02, 8),
    },
    legalNoticeTextLarge: {
        fontSize: Math.min(width * 0.04, 16),
        lineHeight: Math.min(width * 0.05, 24),
        marginLeft: Math.min(width * 0.03, 12),
    },
    legalNoticeTextTablet: {
        fontSize: Math.min(width * 0.045, 18),
        lineHeight: Math.min(width * 0.055, 26),
        marginLeft: Math.min(width * 0.035, 14),
    },
    legalNoticeTextShort: {
        fontSize: Math.min(width * 0.034, 12),
        lineHeight: Math.min(width * 0.042, 18),
        marginLeft: Math.min(width * 0.018, 6),
    },
    contactCard: {
        backgroundColor: '#04223A',
        borderWidth: 1,
        borderColor: '#FEB914',
        borderRadius: Math.min(width * 0.04, 16),
        padding: Math.min(width * 0.05, 20),
        marginBottom: Math.min(height * 0.025, 20),
    },
    contactCardSmall: {
        borderRadius: Math.min(width * 0.035, 14),
        padding: Math.min(width * 0.04, 16),
        marginBottom: Math.min(height * 0.02, 16),
    },
    contactCardLarge: {
        borderRadius: Math.min(width * 0.045, 18),
        padding: Math.min(width * 0.06, 24),
        marginBottom: Math.min(height * 0.03, 24),
    },
    contactCardTablet: {
        borderRadius: Math.min(width * 0.05, 20),
        padding: Math.min(width * 0.08, 32),
        marginBottom: Math.min(height * 0.04, 32),
    },
    contactCardShort: {
        borderRadius: Math.min(width * 0.03, 12),
        padding: Math.min(width * 0.035, 14),
        marginBottom: Math.min(height * 0.015, 12),
    },
    contactTitle: {
        color: '#FEB914',
        fontSize: Math.min(width * 0.048, 18),
        fontWeight: '700',
        marginBottom: Math.min(height * 0.012, 10),
    },
    contactTitleSmall: {
        fontSize: Math.min(width * 0.045, 16),
        marginBottom: Math.min(height * 0.01, 8),
    },
    contactTitleLarge: {
        fontSize: Math.min(width * 0.05, 20),
        marginBottom: Math.min(height * 0.015, 12),
    },
    contactTitleTablet: {
        fontSize: Math.min(width * 0.055, 22),
        marginBottom: Math.min(height * 0.02, 16),
    },
    contactTitleShort: {
        fontSize: Math.min(width * 0.042, 14),
        marginBottom: Math.min(height * 0.008, 6),
    },
    contactText: {
        color: 'white',
        fontSize: Math.min(width * 0.038, 14),
        lineHeight: Math.min(width * 0.048, 22),
        marginBottom: Math.min(height * 0.018, 15),
    },
    contactTextSmall: {
        fontSize: Math.min(width * 0.036, 13),
        lineHeight: Math.min(width * 0.045, 20),
        marginBottom: Math.min(height * 0.015, 12),
    },
    contactTextLarge: {
        fontSize: Math.min(width * 0.04, 16),
        lineHeight: Math.min(width * 0.05, 24),
        marginBottom: Math.min(height * 0.02, 18),
    },
    contactTextTablet: {
        fontSize: Math.min(width * 0.045, 18),
        lineHeight: Math.min(width * 0.055, 26),
        marginBottom: Math.min(height * 0.025, 20),
    },
    contactTextShort: {
        fontSize: Math.min(width * 0.034, 12),
        lineHeight: Math.min(width * 0.042, 18),
        marginBottom: Math.min(height * 0.012, 10),
    },
    contactInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: Math.min(width * 0.04, 15),
        borderRadius: Math.min(width * 0.025, 8),
    },
    contactInfoSmall: {
        padding: Math.min(width * 0.035, 12),
        borderRadius: Math.min(width * 0.02, 6),
    },
    contactInfoLarge: {
        padding: Math.min(width * 0.045, 18),
        borderRadius: Math.min(width * 0.03, 10),
    },
    contactInfoShort: {
        padding: Math.min(width * 0.03, 10),
        borderRadius: Math.min(width * 0.018, 6),
    },
    contactDetail: {
        color: '#FEB914',
        fontSize: Math.min(width * 0.038, 14),
        marginBottom: Math.min(height * 0.01, 8),
        fontWeight: '500',
    },
    contactDetailSmall: {
        fontSize: Math.min(width * 0.036, 13),
        marginBottom: Math.min(height * 0.008, 6),
    },
    contactDetailLarge: {
        fontSize: Math.min(width * 0.04, 16),
        marginBottom: Math.min(height * 0.012, 10),
    },
    contactDetailShort: {
        fontSize: Math.min(width * 0.034, 12),
        marginBottom: Math.min(height * 0.006, 4),
    },
    bottomSpacer: {
        height: Math.min(height * 0.03, 24),
    },
    bottomSpacerShort: {
        height: Math.min(height * 0.02, 16),
    },
});