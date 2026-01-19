import React,{useState} from "react";
import {View,Text,StyleSheet,TouchableOpacity,ScrollView,Modal,Dimensions} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useNavigation} from "@react-navigation/native";
import CentralModal from '../components/CentralModal';

const {width,height}=Dimensions.get('window');
const isSmallScreen=width<375;
const isMediumScreen=width>=375&&width<768;
const isLargeScreen=width>=768;

export default function DriverIncomeDashboard(){
const [activeTab,setActiveTab]=useState("Daily");
const [dateModalVisible,setDateModalVisible]=useState(false);
const [incomePlanModalVisible,setIncomePlanModalVisible]=useState(false);
const [orderHistoryModalVisible,setOrderHistoryModalVisible]=useState(false);
const [achievementsModalVisible,setAchievementsModalVisible]=useState(false);
const [currentDate,setCurrentDate]=useState(new Date());
const [successModalVisible,setSuccessModalVisible]=useState(false);
const [successMessage,setSuccessMessage]=useState("");
const navigation=useNavigation();
const tabs=["Daily","Weekly","Monthly"];
const mockData={Daily:{date:"Aug 21, 2025",income:"₦5,000",orders:1,mileage:"4.5km",perKm:"₦473.12",target:"₦7,000.00",score:"32%"},Weekly:{date:"Aug 15-21, 2025",income:"₦35,000",orders:7,mileage:"31.5km",perKm:"₦520.00",target:"₦45,000.00",score:"78%"},Monthly:{date:"August 2025",income:"₦120,000",orders:24,mileage:"108km",perKm:"₦490.50",target:"₦150,000.00",score:"80%"}};
const orderHistory=[{id:1,time:"08:30 AM",amount:"₦1,200",distance:"2.1km",status:"Completed"},{id:2,time:"10:15 AM",amount:"₦950",distance:"1.8km",status:"Completed"},{id:3,time:"01:45 PM",amount:"₦1,800",distance:"3.2km",status:"Completed"},{id:4,time:"04:20 PM",amount:"₦1,050",distance:"2.0km",status:"Completed"}];
const achievements=[{id:1,title:"Early Bird",description:"Complete 5 trips before 8 AM",progress:"3/5",completed:false},{id:2,title:"Weekend Warrior",description:"Earn ₦20,000 in a weekend",progress:"₦15,000/₦20,000",completed:false},{id:3,title:"Safety First",description:"Maintain 5.0 rating for a week",progress:"4.8/5.0",completed:false},{id:4,title:"Distance Master",description:"Drive 100km in a week",progress:"75km/100km",completed:false},{id:5,title:"First Trip",description:"Complete your first trip",progress:"Completed",completed:true}];
const currentData=mockData[activeTab];

const navigateDate=(direction)=>{
const newDate=new Date(currentDate);
if(activeTab==="Daily"){newDate.setDate(currentDate.getDate()+(direction==="next"?1:-1));}
else if(activeTab==="Weekly"){newDate.setDate(currentDate.getDate()+(direction==="next"?7:-7));}
else{newDate.setMonth(currentDate.getMonth()+(direction==="next"?1:-1));}
setCurrentDate(newDate);
}
const handleSetIncomePlan=()=>{setIncomePlanModalVisible(true);}
const handleSaveIncomePlan=(target)=>{setSuccessMessage(`Income target set to ${target}`);setSuccessModalVisible(true);setIncomePlanModalVisible(false);}
const getScoreColor=(score)=>{
const scoreNum=parseInt(score);
if(scoreNum>=80)return"#50FF66";
if(scoreNum>=50)return"#FFC107";
return"red";
}
const getScoreLabel=(score)=>{
const scoreNum=parseInt(score);
if(scoreNum>=80)return"Excellent";
if(scoreNum>=50)return"Good";
return"Warning";
}
const goBack=()=>{navigation.goBack();}

return(
<View style={styles.container}>
<View style={styles.header}>
<TouchableOpacity onPress={goBack}><Ionicons name="arrow-back-circle" size={isSmallScreen?28:isMediumScreen?32:36} color="white"/></TouchableOpacity>
<Text style={styles.text}>Earnings</Text>
<View style={{width:isSmallScreen?20:isMediumScreen?24:28}}></View>
</View>
<View style={styles.tabsRow}>
{tabs.map((tab)=>(<TouchableOpacity key={tab} style={[styles.tab,activeTab===tab&&styles.activeTab]} onPress={()=>setActiveTab(tab)}><Text style={[styles.tabText,activeTab===tab&&styles.activeTabText]}>{tab}</Text></TouchableOpacity>))}
</View>
<View style={styles.dateRow}>
<TouchableOpacity onPress={()=>navigateDate("prev")}><Ionicons name="chevron-back-outline" size={isSmallScreen?18:20} color="#fff"/></TouchableOpacity>
<TouchableOpacity style={{alignItems:"center"}} onPress={()=>setDateModalVisible(true)}>
<Text style={styles.dateText}>{currentData.date}</Text>
<Text style={styles.incomeAmount}>{currentData.income}</Text>
<Text style={styles.subLabel}>Net Income</Text>
</TouchableOpacity>
<TouchableOpacity onPress={()=>navigateDate("next")}><Ionicons name="chevron-forward-outline" size={isSmallScreen?18:20} color="#fff"/></TouchableOpacity>
</View>
<View style={styles.statsRow}>
<View style={styles.statBox}><Text style={styles.statValue}>{currentData.orders}</Text><Text style={styles.statLabel}>Orders</Text></View>
<View style={styles.statBox}><Text style={styles.statValue}>{currentData.mileage}</Text><Text style={styles.statLabel}>Mileage</Text></View>
<View style={styles.statBox}><Text style={styles.statValue}>{currentData.perKm}</Text><Text style={styles.statLabel}>Per Km</Text></View>
</View>
<View style={styles.divider}/>
<TouchableOpacity style={styles.button} onPress={handleSetIncomePlan}><Text style={styles.buttonText}>Set Income plan</Text></TouchableOpacity>
<View style={styles.bottomStats}>
<View style={styles.targetBox}><Text style={styles.targetTitle}>Daily target</Text><Text style={styles.targetValue}>{currentData.target}</Text></View>
<View style={styles.scoreBox}><Text style={styles.targetTitle}>Driver score</Text><View style={styles.scoreRow}><Text style={styles.targetValue}>{currentData.score}</Text><View style={[styles.warningBadge,{backgroundColor:getScoreColor(currentData.score)}]}><Text style={styles.warningText}>{getScoreLabel(currentData.score)}</Text></View></View></View>
</View>
<View style={styles.toggleSection}>
<TouchableOpacity style={styles.toggleRow} onPress={()=>setOrderHistoryModalVisible(true)}><Ionicons name="document-text-outline" size={isSmallScreen?16:18} color="#FFC107"/><Text style={styles.toggleLabel}>Order history</Text><Ionicons name="chevron-forward" size={isSmallScreen?14:16} color="#FFC107" style={styles.chevron}/></TouchableOpacity>
<TouchableOpacity style={styles.toggleRow} onPress={()=>setAchievementsModalVisible(true)}><Ionicons name="flag-outline" size={isSmallScreen?16:18} color="#FFC107"/><Text style={styles.toggleLabel}>Achievements</Text><Ionicons name="chevron-forward" size={isSmallScreen?14:16} color="#FFC107" style={styles.chevron}/></TouchableOpacity>
</View>
<Modal visible={dateModalVisible} transparent animationType="slide" onRequestClose={()=>setDateModalVisible(false)}>
<View style={styles.modalOverlay}><View style={styles.modalContainer}><Text style={styles.modalTitle}>Select Date</Text><Text style={styles.modalText}>Date selection functionality would be implemented here with a proper date picker.</Text><TouchableOpacity style={styles.closeButton} onPress={()=>setDateModalVisible(false)}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity></View></View>
</Modal>
<Modal visible={incomePlanModalVisible} transparent animationType="slide" onRequestClose={()=>setIncomePlanModalVisible(false)}>
<View style={styles.modalOverlay}><View style={styles.modalContainer}><Text style={styles.modalTitle}>Set Income Plan</Text><Text style={styles.modalText}>Set your daily income target to track your progress and stay motivated.</Text>
<View style={styles.planOptions}><TouchableOpacity style={styles.planOption} onPress={()=>handleSaveIncomePlan("₦5,000")}><Text style={styles.planOptionText}>₦5,000 - Basic</Text></TouchableOpacity><TouchableOpacity style={styles.planOption} onPress={()=>handleSaveIncomePlan("₦7,000")}><Text style={styles.planOptionText}>₦7,000 - Standard</Text></TouchableOpacity><TouchableOpacity style={styles.planOption} onPress={()=>handleSaveIncomePlan("₦10,000")}><Text style={styles.planOptionText}>₦10,000 - Premium</Text></TouchableOpacity></View>
<TouchableOpacity style={styles.closeButton} onPress={()=>setIncomePlanModalVisible(false)}><Text style={styles.closeButtonText}>Cancel</Text></TouchableOpacity></View></View>
</Modal>
<Modal visible={orderHistoryModalVisible} transparent animationType="slide" onRequestClose={()=>setOrderHistoryModalVisible(false)}>
<View style={styles.modalOverlay}><View style={[styles.modalContainer,styles.largeModal]}><Text style={styles.modalTitle}>Order History - {currentData.date}</Text>
<ScrollView style={styles.modalScrollView}>{orderHistory.map((order)=>(<View key={order.id} style={styles.orderItem}><View style={styles.orderHeader}><Text style={styles.orderTime}>{order.time}</Text><Text style={styles.orderAmount}>{order.amount}</Text></View><View style={styles.orderDetails}><Text style={styles.orderDistance}>Distance: {order.distance}</Text><Text style={styles.orderStatus}>{order.status}</Text></View></View>))}</ScrollView>
<TouchableOpacity style={styles.closeButton} onPress={()=>setOrderHistoryModalVisible(false)}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity></View></View>
</Modal>
<Modal visible={achievementsModalVisible} transparent animationType="slide" onRequestClose={()=>setAchievementsModalVisible(false)}>
<View style={styles.modalOverlay}><View style={[styles.modalContainer,styles.largeModal]}><Text style={styles.modalTitle}>Your Achievements</Text>
<ScrollView style={styles.modalScrollView}>{achievements.map((achievement)=>(<View key={achievement.id} style={[styles.achievementItem,achievement.completed&&styles.completedAchievement]}><View style={styles.achievementHeader}><Text style={styles.achievementTitle}>{achievement.title}</Text>{achievement.completed&&(<Ionicons name="checkmark-circle" size={isSmallScreen?18:20} color="#50FF66"/>)}</View><Text style={styles.achievementDescription}>{achievement.description}</Text><Text style={styles.achievementProgress}>{achievement.progress}</Text></View>))}</ScrollView>
<TouchableOpacity style={styles.closeButton} onPress={()=>setAchievementsModalVisible(false)}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity></View></View>
</Modal>
<CentralModal visible={successModalVisible} onClose={()=>setSuccessModalVisible(false)} title="Success" subText={successMessage} icon="checkmark-circle" confirmText="OK" closeText="" onConfirm={()=>setSuccessModalVisible(false)} confirmButtonColor="#fcbf24" themeColor="#4CAF50"/>
</View>
);
}

const styles=StyleSheet.create({
container:{flex:1,backgroundColor:"#000",paddingHorizontal:isSmallScreen?12:isMediumScreen?16:20,paddingTop:isSmallScreen?40:isMediumScreen?50:60},
text:{fontSize:isSmallScreen?24:isMediumScreen?30:36,color:'white',alignSelf:'center',justifyContent:'center'},
header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:isSmallScreen?0:10},
tabsRow:{flexDirection:"row",justifyContent:"center",marginBottom:isSmallScreen?12:20,marginTop:isSmallScreen?8:10},
tab:{borderWidth:1,borderColor:"#FFC107",backgroundColor:'#181818',borderRadius:8,paddingVertical:isSmallScreen?4:6,paddingHorizontal:isSmallScreen?12:18,marginHorizontal:isSmallScreen?4:6},
activeTab:{backgroundColor:"#FFC107"},
tabText:{color:"#FFC107",fontWeight:"600",fontSize:isSmallScreen?12:14},
activeTabText:{color:"#000"},
dateRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:isSmallScreen?12:20,marginTop:isSmallScreen?8:10},
dateText:{color:"#fff",fontWeight:"500",fontSize:isSmallScreen?12:14},
incomeAmount:{color:"#fff",fontSize:isSmallScreen?22:isMediumScreen?28:32,fontWeight:"700",marginVertical:isSmallScreen?4:6},
subLabel:{color:"#aaa",fontSize:isSmallScreen?10:12},
statsRow:{flexDirection:"row",justifyContent:"space-between",marginBottom:isSmallScreen?12:20},
statBox:{backgroundColor:'#181818',borderRadius:10,padding:isSmallScreen?10:14,flex:1,marginHorizontal:isSmallScreen?3:5,alignItems:"center"},
statValue:{color:"#fff",fontWeight:"700",fontSize:isSmallScreen?14:16},
statLabel:{color:"#aaa",fontSize:isSmallScreen?10:12,marginTop:isSmallScreen?2:4},
divider:{height:2,backgroundColor:"#FFC107",marginVertical:isSmallScreen?8:10},
button:{backgroundColor:"#FFC107",borderRadius:8,alignItems:"center",paddingVertical:isSmallScreen?10:12,marginBottom:isSmallScreen?12:20,width:isSmallScreen?'45%':isMediumScreen?'40%':'35%',alignSelf:'center'},
buttonText:{color:"#000",fontWeight:"700",fontSize:isSmallScreen?14:16},
bottomStats:{flexDirection:"row",justifyContent:"space-between",marginBottom:isSmallScreen?20:30},
targetBox:{borderColor:"#FFC107",borderWidth:1,borderRadius:10,padding:isSmallScreen?8:12,width:isSmallScreen?'38%':isMediumScreen?'35%':'32%',backgroundColor:'#181818'},
scoreBox:{borderColor:"#FFC107",borderWidth:1,borderRadius:10,padding:isSmallScreen?8:12,width:isSmallScreen?'30%':isMediumScreen?'30%':'28%',backgroundColor:'#181818'},
targetTitle:{color:"#fff",fontWeight:"500",marginBottom:6,fontSize:isSmallScreen?12:14},
targetValue:{color:"#fff",fontWeight:"700",fontSize:isSmallScreen?12:14},
scoreRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
warningBadge:{borderRadius:6,paddingHorizontal:isSmallScreen?4:6,paddingVertical:isSmallScreen?1:2},
warningText:{color:"#fff",fontSize:isSmallScreen?8:10,fontWeight:"600"},
toggleSection:{borderTopWidth:1,borderTopColor:"#222",paddingTop:isSmallScreen?8:12},
toggleRow:{flexDirection:"row",alignItems:"center",marginVertical:isSmallScreen?8:10,justifyContent:"space-between"},
toggleLabel:{color:"#fff",fontSize:isSmallScreen?12:14,marginLeft:isSmallScreen?8:10,flex:1},
chevron:{marginLeft:"auto"},
modalOverlay:{flex:1,backgroundColor:"rgba(0,0,0,0.7)",justifyContent:"center",alignItems:"center",padding:isSmallScreen?12:20},
modalContainer:{backgroundColor:"#001B2E",borderRadius:14,padding:isSmallScreen?16:20,width:"100%",maxWidth:isSmallScreen?320:isMediumScreen?360:400,borderWidth:1,borderColor:"#FFC107"},
largeModal:{maxHeight:"80%"},
modalScrollView:{maxHeight:isSmallScreen?300:400},
modalTitle:{color:"#FFC107",fontSize:isSmallScreen?16:18,fontWeight:"700",textAlign:"center",marginBottom:isSmallScreen?12:16},
modalText:{color:"#fff",textAlign:"center",marginBottom:isSmallScreen?12:20,lineHeight:isSmallScreen?18:20,fontSize:isSmallScreen?12:14},
closeButton:{backgroundColor:"#FFC107",borderRadius:8,paddingVertical:isSmallScreen?8:10,alignItems:"center",marginTop:isSmallScreen?8:10},
closeButtonText:{fontWeight:"700",color:"#000",fontSize:isSmallScreen?14:16},
planOptions:{marginBottom:isSmallScreen?12:20},
planOption:{backgroundColor:"#063B5D",borderRadius:8,padding:isSmallScreen?12:15,marginBottom:isSmallScreen?8:10,alignItems:"center"},
planOptionText:{color:"#fff",fontWeight:"600",fontSize:isSmallScreen?14:16},
orderItem:{backgroundColor:"#063B5D",borderRadius:8,padding:isSmallScreen?12:15,marginBottom:isSmallScreen?8:10},
orderHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:5},
orderTime:{color:"#fff",fontWeight:"600",fontSize:isSmallScreen?12:14},
orderAmount:{color:"#50FF66",fontWeight:"700",fontSize:isSmallScreen?14:16},
orderDetails:{flexDirection:"row",justifyContent:"space-between"},
orderDistance:{color:"#aaa",fontSize:isSmallScreen?10:12},
orderStatus:{color:"#50FF66",fontSize:isSmallScreen?10:12,fontWeight:"600"},
achievementItem:{backgroundColor:"#063B5D",borderRadius:8,padding:isSmallScreen?12:15,marginBottom:isSmallScreen?8:10,opacity:0.7},
completedAchievement:{opacity:1,borderColor:"#50FF66",borderWidth:1},
achievementHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:5},
achievementTitle:{color:"#fff",fontWeight:"700",fontSize:isSmallScreen?14:16},
achievementDescription:{color:"#aaa",marginBottom:5,fontSize:isSmallScreen?12:14},
achievementProgress:{color:"#FFC107",fontSize:isSmallScreen?10:12,fontWeight:"600"},
});