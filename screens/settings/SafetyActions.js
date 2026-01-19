import {View,Text,StyleSheet,TouchableOpacity,Dimensions} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {Feather,Entypo,FontAwesome5,MaterialIcons} from '@expo/vector-icons';

const {width,height}=Dimensions.get('window');
const isSmallScreen=width<375;
const isLargeScreen=width>768;

export default function SafetyActions(){
const navigation=useNavigation();
const goBack=()=>{navigation.goBack();}

return(
<View style={styles.container}>
<View style={styles.header}>
<TouchableOpacity onPress={goBack}><Ionicons name="arrow-back-circle" size={isSmallScreen?28:32} color="white"/></TouchableOpacity>
<Text style={styles.text}>Safety Actions</Text>
<View style={{width:isSmallScreen?20:24}}></View>
</View>
<TouchableOpacity style={styles.row}><FontAwesome5 name="user-friends" size={isSmallScreen?18:20} color="#FFC107"/><Text style={styles.rowText}>Message KabLux support</Text></TouchableOpacity>
<TouchableOpacity style={styles.row}><Entypo name="warning" size={isSmallScreen?20:22} color="#FFC107"/><Text style={styles.rowText}>Report issue with customer</Text></TouchableOpacity>
<TouchableOpacity style={styles.row}><MaterialIcons name="local-police" size={isSmallScreen?20:22} color="#FF4B4B"/><Text style={[styles.rowText,{color:"#FF4B4B"}]}>Call the Police</Text></TouchableOpacity>
<TouchableOpacity style={styles.row}><Feather name="share-2" size={isSmallScreen?18:20} color="#FFC107"/><Text style={styles.rowText}>Share Location</Text></TouchableOpacity>
<TouchableOpacity style={[styles.row,{borderBottomWidth:0}]}><Feather name="mic-off" size={isSmallScreen?18:20} color="#FFC107"/><Text style={styles.rowText}>Record audio</Text></TouchableOpacity>
</View>
);
}

const styles=StyleSheet.create({
container:{flex:1,paddingHorizontal:isSmallScreen?16:isLargeScreen?30:20,paddingTop:isSmallScreen?40:50,backgroundColor:'black',gap:isSmallScreen?20:30},
text:{fontSize:isSmallScreen?24:isLargeScreen?36:30,color:'white',alignSelf:'center',justifyContent:'center'},
header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
row:{flexDirection:"row",alignItems:"center",borderBottomWidth:0.7,borderBottomColor:"rgba(255, 193, 7, 0.4)",paddingVertical:isSmallScreen?14:18},
rowText:{color:"white",fontSize:isSmallScreen?14:15,fontWeight:"500",marginLeft:isSmallScreen?10:12},
});