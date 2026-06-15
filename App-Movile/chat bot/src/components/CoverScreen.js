import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function CoverScreen({ onStart }) {
  return (
    <View style={styles.container}>
      <Image source={require("../../assets/logo_tribuna.png")} style={styles.logo} resizeMode="contain" />
      <TouchableOpacity style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>Delegados</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, justifyContent:"center", alignItems:"center", backgroundColor:"#fff"},
  logo:{width:250, height:250, marginBottom:40},
  button:{backgroundColor:"#e91e63", paddingVertical:15, paddingHorizontal:40, borderRadius:25},
  buttonText:{color:"#fff", fontSize:20, fontWeight:"bold"},
});
