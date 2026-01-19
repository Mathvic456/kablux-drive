import {View,Text,StyleSheet,TouchableOpacity,Modal,TextInput,ScrollView,Dimensions} from 'react-native';
import TransferForm from '../components/TransferForm';
import Ionicons from '@expo/vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import ScreenHeaders from '../components/ScreenHeaders';
import {Feather,Entypo,FontAwesome,MaterialIcons,FontAwesome5} from '@expo/vector-icons';
import {useState} from 'react';
import CentralModal from '../components/CentralModal';

const {width,height}=Dimensions.get('window');
const isSmallScreen=width<375;
const isLargeScreen=width>768;

export default function City(){
const navigation=useNavigation();
const [modalVisible,setModalVisible]=useState(false);
const [placeType,setPlaceType]=useState('');
const [address,setAddress]=useState('');
const [alertModalVisible,setAlertModalVisible]=useState(false);
const [alertData,setAlertData]=useState({title:'',message:'',isError:false});
const [favourites,setFavourites]=useState([{type:'home',title:'Home',address:'268 olorulana Street, osun state',city:'Osun State'},{type:'city',title:'City',address:'Lagos State of Nigeria',city:'Lagos State'}]);

const goBack=()=>{navigation.goBack();}
const handleAddPlace=()=>{setModalVisible(true);}
const handlePlaceTypeSelect=(type)=>{setPlaceType(type);}
const handleSavePlace=()=>{
if(!placeType){setAlertData({title:'Error',message:'Please select a place type',isError:true});setAlertModalVisible(true);return;}
if(!address.trim()){setAlertData({title:'Error',message:'Please enter an address',isError:true});setAlertModalVisible(true);return;}
const extractedCity=extractCityFromAddress(address);
const newPlace={type:placeType,title:placeType==='home'?'Home':'Work',address:address,city:extractedCity};
setFavourites(prevFavourites=>[newPlace,...prevFavourites]);
setPlaceType('');setAddress('');setModalVisible(false);
setAlertData({title:'Success',message:'Place added to favourites!',isError:false});setAlertModalVisible(true);
}
const extractCityFromAddress=(fullAddress)=>{
const cityKeywords=['Lagos','Abuja','Port Harcourt','Kano','Ibadan','Enugu','Calabar','Osun','Oyo'];
for(const city of cityKeywords){if(fullAddress.toLowerCase().includes(city.toLowerCase())){return city;}}
return 'Unknown City';
}
const getPlaceIcon=(type)=>{
switch(type){
case 'home':return<Entypo name="home" size={isSmallScreen?20:22} color="#FFC107"/>;
case 'work':return<FontAwesome5 name="briefcase" size={isSmallScreen?16:18} color="#FFC107"/>;
case 'city':return<FontAwesome5 name="city" size={isSmallScreen?16:18} color="#FFC107"/>;
default:return<Entypo name="location-pin" size={isSmallScreen?20:22} color="#FFC107"/>;
}
}

return(
<View style={styles.container}>
<View style={styles.header}>
<TouchableOpacity onPress={goBack}><Ionicons name="arrow-back-circle" size={isSmallScreen?28:32} color="white"/></TouchableOpacity>
<Text style={styles.text}>City</Text>
<View style={{width:isSmallScreen?20:24}}></View>
</View>
<Text style={styles.sectionTitle}>Favourites</Text>
<View style={styles.card}>
{favourites.map((favourite,index)=>(
<View key={index} style={styles.row}>
{getPlaceIcon(favourite.type)}
<View style={styles.textBox}>
<Text style={styles.title}>{favourite.title}</Text>
<Text style={styles.desc}>{favourite.address}</Text>
{favourite.city&&(<Text style={styles.cityText}>City: {favourite.city}</Text>)}
</View>
<Entypo name="chevron-right" size={isSmallScreen?16:18} color="#FFC107"/>
</View>
))}
<TouchableOpacity style={styles.row} onPress={handleAddPlace}>
<Feather name="plus" size={isSmallScreen?20:22} color="#FFC107"/>
<View style={styles.textBox}><Text style={styles.title}>Add a place</Text></View>
<Entypo name="chevron-right" size={isSmallScreen?16:18} color="#FFC107"/>
</TouchableOpacity>
</View>
<Text style={[styles.sectionTitle,{marginTop:isSmallScreen?20:30}]}>Apply for city to city</Text>
<Text style={styles.subText}>This is for specially approved vehicles only</Text>
<View style={styles.card}>
<View style={styles.row}>
<Text style={styles.title}>From</Text>
<View style={styles.textBox}><Text style={styles.desc}>Lagos State of Nigeria</Text></View>
</View>
<TouchableOpacity style={styles.row}>
<Text style={styles.title}>To</Text>
<Entypo name="chevron-right" size={isSmallScreen?16:18} color="#FFC107" style={{marginLeft:'auto'}}/>
</TouchableOpacity>
</View>
<Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={()=>setModalVisible(false)}>
<View style={styles.modalOverlay}>
<View style={styles.modalContent}>
<View style={styles.modalHeader}>
<Text style={styles.modalTitle}>Add New Place</Text>
<TouchableOpacity onPress={()=>setModalVisible(false)}><Ionicons name="close" size={24} color="#FFC107"/></TouchableOpacity>
</View>
<ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
<Text style={styles.modalLabel}>Select Place Type</Text>
<View style={styles.placeTypeContainer}>
<TouchableOpacity style={[styles.placeTypeButton,placeType==='home'&&styles.placeTypeButtonSelected]} onPress={()=>handlePlaceTypeSelect('home')}>
<Entypo name="home" size={isSmallScreen?20:24} color={placeType==='home'?'#000':'#FFC107'}/>
<Text style={[styles.placeTypeText,placeType==='home'&&styles.placeTypeTextSelected]}>Home</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.placeTypeButton,placeType==='work'&&styles.placeTypeButtonSelected]} onPress={()=>handlePlaceTypeSelect('work')}>
<FontAwesome5 name="briefcase" size={isSmallScreen?18:20} color={placeType==='work'?'#000':'#FFC107'}/>
<Text style={[styles.placeTypeText,placeType==='work'&&styles.placeTypeTextSelected]}>Work</Text>
</TouchableOpacity>
</View>
<Text style={styles.modalLabel}>Enter Address</Text>
<TextInput style={styles.addressInput} placeholder="Enter full address..." placeholderTextColor="#888" value={address} onChangeText={setAddress} multiline={true} numberOfLines={3} textAlignVertical="top"/>
{address&&(<View style={styles.cityPreview}><Text style={styles.cityPreviewText}>Detected City: {extractCityFromAddress(address)}</Text></View>)}
<TouchableOpacity style={[styles.saveButton,(!placeType||!address.trim())&&styles.saveButtonDisabled]} onPress={handleSavePlace} disabled={!placeType||!address.trim()}>
<Text style={styles.saveButtonText}>Save to Favourites</Text>
</TouchableOpacity>
</ScrollView>
</View>
</View>
</Modal>
<CentralModal visible={alertModalVisible} onClose={()=>setAlertModalVisible(false)} title={alertData.title} subText={alertData.message} icon={alertData.isError?'alert-circle':'checkmark-circle'} confirmText="OK" closeText="" onConfirm={()=>setAlertModalVisible(false)} confirmButtonColor={alertData.isError?'#f44336':'#fcbf24'} themeColor={alertData.isError?'#f44336':'#4CAF50'}/>
</View>
);
}

const styles=StyleSheet.create({
container:{flex:1,paddingHorizontal:isSmallScreen?16:isLargeScreen?30:20,paddingTop:isSmallScreen?40:50,backgroundColor:'black',gap:isSmallScreen?20:30},
text:{fontSize:isSmallScreen?24:isLargeScreen?36:30,color:'white',alignSelf:'center',justifyContent:'center'},
header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
sectionTitle:{color:'white',fontSize:isSmallScreen?14:16,fontWeight:'700',marginBottom:8},
subText:{color:'#aaa',fontSize:isSmallScreen?12:13,marginBottom:8},
card:{backgroundColor:'#04223A',borderWidth:1,borderColor:'#FFC107',borderRadius:16,paddingVertical:4},
row:{flexDirection:'row',alignItems:'center',paddingVertical:isSmallScreen?12:14,paddingHorizontal:isSmallScreen?12:16,borderBottomWidth:0.7,borderBottomColor:'rgba(255, 193, 7, 0.3)'},
textBox:{flex:1,marginLeft:10},
title:{color:'white',fontSize:isSmallScreen?14:15,fontWeight:'500'},
desc:{color:'#ccc',fontSize:isSmallScreen?12:13,marginTop:2},
cityText:{color:'#FFC107',fontSize:isSmallScreen?10:12,marginTop:2,fontStyle:'italic'},
modalOverlay:{flex:1,backgroundColor:'rgba(0, 0, 0, 0.8)',justifyContent:'flex-end'},
modalContent:{backgroundColor:'#04223A',borderTopLeftRadius:20,borderTopRightRadius:20,borderWidth:1,borderColor:'#FFC107',maxHeight:'80%'},
modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:isSmallScreen?16:20,borderBottomWidth:1,borderBottomColor:'#FFC107'},
modalTitle:{color:'white',fontSize:isSmallScreen?18:20,fontWeight:'700'},
modalBody:{padding:isSmallScreen?16:20},
modalLabel:{color:'white',fontSize:isSmallScreen?14:16,fontWeight:'600',marginBottom:8,marginTop:isSmallScreen?8:10},
placeTypeContainer:{flexDirection:'row',justifyContent:'space-between',marginBottom:isSmallScreen?16:20},
placeTypeButton:{flex:1,alignItems:'center',padding:isSmallScreen?12:15,marginHorizontal:5,borderWidth:2,borderColor:'#FFC107',borderRadius:12,backgroundColor:'transparent'},
placeTypeButtonSelected:{backgroundColor:'#FFC107'},
placeTypeText:{color:'#FFC107',marginTop:6,fontWeight:'600',fontSize:isSmallScreen?14:16},
placeTypeTextSelected:{color:'#000',fontWeight:'700'},
addressInput:{backgroundColor:'rgba(255, 255, 255, 0.1)',borderWidth:1,borderColor:'#FFC107',borderRadius:12,padding:isSmallScreen?12:15,color:'white',fontSize:isSmallScreen?14:16,minHeight:100,textAlignVertical:'top'},
cityPreview:{backgroundColor:'rgba(255, 193, 7, 0.1)',padding:8,borderRadius:8,marginTop:8,borderLeftWidth:3,borderLeftColor:'#FFC107'},
cityPreviewText:{color:'#FFC107',fontSize:isSmallScreen?12:14,fontWeight:'500'},
saveButton:{backgroundColor:'#FFC107',padding:isSmallScreen?14:16,borderRadius:12,alignItems:'center',marginTop:isSmallScreen?16:20},
saveButtonDisabled:{backgroundColor:'#666',opacity:0.5},
saveButtonText:{color:'#000',fontSize:isSmallScreen?14:16,fontWeight:'700'},
});