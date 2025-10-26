import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function Settings() {
  return (
    <View style={styles.container}>
      <Text>Settings</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    padding:20,
    paddingTop:50,
    backgroundColor: '#000000',
    gap:30,
    }
})