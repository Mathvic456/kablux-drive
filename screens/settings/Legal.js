import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';

export default function Legal() {
    const navigation = useNavigation();
    const [activeSection, setActiveSection] = useState('terms');

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
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack}>
                    <Ionicons name="arrow-back-circle" size={32} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Legal</Text>
                <View style={{ width: 32 }}></View>
            </View>

            {/* Tabs - Fixed Layout */}
            <View style={styles.tabsContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                >
                    {Object.keys(legalSections).map((sectionKey) => (
                        <TouchableOpacity
                            key={sectionKey}
                            style={[
                                styles.tab,
                                activeSection === sectionKey && styles.tabActive
                            ]}
                            onPress={() => setActiveSection(sectionKey)}
                        >
                            <Text style={[
                                styles.tabText,
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
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.contentCard}>
                    <Text style={styles.sectionTitle}>
                        {legalSections[activeSection].title}
                    </Text>
                    <Text style={styles.contentText}>
                        {legalSections[activeSection].content}
                    </Text>
                </View>

                {/* Additional Legal Information */}
                <View style={styles.legalNotice}>
                    <Ionicons name="warning-outline" size={20} color="#FFC107" />
                    <Text style={styles.legalNoticeText}>
                        These terms are legally binding. By using KabLux Driver services, you agree to comply with all applicable terms and conditions.
                    </Text>
                </View>

                {/* Contact Legal */}
                <View style={styles.contactCard}>
                    <Text style={styles.contactTitle}>Legal Questions?</Text>
                    <Text style={styles.contactText}>
                        For legal inquiries or clarification on any terms, please contact our legal department:
                    </Text>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactDetail}>📧 legal@kablux.com</Text>
                        <Text style={styles.contactDetail}>📞 +1 (555) 123-LEGAL</Text>
                        <Text style={styles.contactDetail}>📍 123 Legal Lane, Suite 100, Business City</Text>
                    </View>
                </View>

                {/* Agreement Section */}
                <View style={styles.agreementSection}>
                    <Text style={styles.agreementTitle}>Driver Agreement</Text>
                    <Text style={styles.agreementText}>
                        By continuing to use the KabLux Driver app, you acknowledge that you have read, understood, and agree to be bound by all the terms and conditions outlined in these legal documents.
                    </Text>
                    <View style={styles.agreementStatus}>
                        <Ionicons name="checkmark-circle" size={20} color="#FFC107" />
                        <Text style={styles.agreementStatusText}>
                            Last accepted: December 15, 2024
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    tabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: 'black',
        height: 60,
        justifyContent: 'center',
    },
    tabsContent: {
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#04223A',
        borderWidth: 1,
        borderColor: 'transparent',
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabActive: {
        backgroundColor: '#FFC107',
        borderColor: '#FFC107',
    },
    tabText: {
        color: '#FFC107',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    tabTextActive: {
        color: '#000',
        fontWeight: '700',
    },
    mainContent: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    contentCard: {
        backgroundColor: '#04223A',
        borderWidth: 1,
        borderColor: '#FFC107',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#FFC107',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    contentText: {
        color: 'white',
        fontSize: 14,
        lineHeight: 22,
    },
    legalNotice: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    legalNoticeText: {
        color: '#FFC107',
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 10,
        flex: 1,
    },
    contactCard: {
        backgroundColor: '#04223A',
        borderWidth: 1,
        borderColor: '#FFC107',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    contactTitle: {
        color: '#FFC107',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
    },
    contactText: {
        color: 'white',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 15,
    },
    contactInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 15,
        borderRadius: 8,
    },
    contactDetail: {
        color: '#FFC107',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    agreementSection: {
        backgroundColor: '#04223A',
        borderWidth: 1,
        borderColor: '#FFC107',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    agreementTitle: {
        color: '#FFC107',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
    },
    agreementText: {
        color: 'white',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 15,
    },
    agreementStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        padding: 12,
        borderRadius: 8,
    },
    agreementStatusText: {
        color: '#FFC107',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});