import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system";
import {
  Image,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraFace, useFFmpeg } from "./src/ffmpeg/ffmpeg-hooks";

export default function App() {
  const {
    startSessions,
    stopSessions,
    listDevices,
    activeSessions,
    imgTime,
    sessionStartTime,
  } = useFFmpeg();

  return (
    <View style={styles.container}>
      {!!imgTime && (
        <View style={{ flexDirection: "row" }}>
          <Image
            source={{
              uri: `${FileSystem.documentDirectory}${sessionStartTime.current}/${CameraFace.Back}.jpg?t=${imgTime}`,
            }}
            onError={(e) =>
              console.error(
                `Failed to load ${CameraFace.Back} image: ${e.nativeEvent.error}`
              )
            }
            style={{
              flex: 1,
              aspectRatio: 1,
              resizeMode: "cover",
              backgroundColor: "grey",
            }}
          />
          <Image
            source={{
              uri: `${FileSystem.documentDirectory}${sessionStartTime.current}/${CameraFace.Front}.jpg?t=${imgTime}`,
            }}
            onError={(e) =>
              console.error(
                `Failed to load ${CameraFace.Front} image: ${e.nativeEvent.error}`
              )
            }
            style={{
              flex: 1,
              aspectRatio: 1,
              resizeMode: "cover",
              backgroundColor: "grey",
            }}
          />
        </View>
      )}
      <ScrollView style={{ flex: 1, paddingTop: 60 }}>
        <SafeAreaView>
          <Button onPress={startSessions} color="blue" title="Start"></Button>
          <Button onPress={stopSessions} color="blue" title="Stop"></Button>
          <Button
            onPress={listDevices}
            color="blue"
            title="List Devices"
          ></Button>
          <View style={{ height: 20 }} />
          <Text style={{ fontWeight: "bold", marginLeft: 20 }}>
            Active sessions: {activeSessions.current.join(", ")}
          </Text>
        </SafeAreaView>
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
