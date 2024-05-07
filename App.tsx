import { StatusBar } from "expo-status-bar";
import {
  FFmpegKit,
  Level as LogLevel,
  SessionState,
} from "ffmpeg-kit-react-native";
import * as FileSystem from "expo-file-system";
import { useState, useRef, useCallback } from "react";
import {
  Image,
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const listDevicesCmd = [
  "-hide_banner",
  "-f",
  "avfoundation",
  "-list_devices",
  "true",
  "-i",
  '""',
];

// TODO: validate this (not tested)
const androidRecordCommand = [
  "-y",
  "-thread_queue_size",
  "512",
  "-f",
  "android_camera",
  "-camera_index",
  "0",
  "-video_size",
  "640x480",
  "-input_queue_size",
  "10",
  "-i",
  "nothing",
  "-c:v",
  "libx264",
  "-strftime",
  "1",
  "-framerate",
  "20",
  "-hls_time",
  "2",
  "-hls_list_size",
  "10",
  "-hls_segment_filename",
  `${FileSystem.documentDirectory}back-%Y%m%d-%s.mp4`,
  `${FileSystem.documentDirectory}back-out.m3u8`,
];

const iosRecordCommand = [
  "-hide_banner",
  "-y",
  "-thread_queue_size",
  "512",
  "-f",
  "avfoundation",
  "-video_size",
  "640x480",
  "-framerate",
  "30", // TODO: pick from supported framerates
  "-i",
  "0:0",
  "-c:v",
  "libx264",
  "-strftime",
  "1",
  "-hls_time",
  "2",
  "-hls_list_size",
  "10",
  "-hls_segment_filename",
  `${FileSystem.documentDirectory}back-%Y%m%d-%s.mp4`,
  `${FileSystem.documentDirectory}back-out.m3u8`,
  `-r`,
  "1",
  "-update",
  "1",
  `${FileSystem.documentDirectory}back-out.jpg`,
];

const runFfmpegCommandWithLogging = async (
  command: ReturnType<(typeof FFmpegKit)["executeWithArgumentsAsync"]>,
  log: (_: string) => any
) => {
  try {
    const session = await command;
    log("FFmpeg process started with sessionId: " + session.getSessionId());
    const state = await session.getState();
    log(`FFmpeg process state is: ${state}`);
    const returnCode = await session.getReturnCode();
    log(`FFmpeg return code is: ${state}`);
    const cmdOutput = await session.getOutput();
    log(`FFmpeg output is: ${cmdOutput}`);
    const logs = await session.getLogs();
    logs.forEach((l) => {
      log(`(${LogLevel.levelToString(l.getLevel())}) ${l.getMessage()}`);
    });
    return { session };
  } catch (error) {
    log(`FFmpeg process failed: ${error.message}`);
  }
};

export default function App() {
  const [output, setOutput] = useState<string[]>([]);
  const [imgTime, setImgTime] = useState(Date.now());
  const imgInterval = useRef<number | Timer>(0);
  const activeSessions = useRef<number[]>([]);

  const log = (newOutput) => {
    setOutput((output) => output.concat("•\t" + newOutput));
  };

  const stopSessions = useCallback(async (sessionId) => {
    const cancelledSessions = new Set<number>();
    clearInterval(imgInterval.current);
    activeSessions.current.reduce(async (chain, sessionId) => {
      await chain;
      try {
        await FFmpegKit.cancel(sessionId);
        cancelledSessions.add(sessionId);
      } catch (e) {
        log(`Failed to cancel session ${sessionId}: ${e.message}`);
      }
    }, Promise.resolve());
    log(`stopped ${cancelledSessions.size} sessions`);
    activeSessions.current = activeSessions.current.filter(
      (sessionId) => !cancelledSessions.has(sessionId)
    );
  }, []);

  const listFiles = useCallback(async () => {
    const playlist = await FileSystem.readDirectoryAsync(
      FileSystem.documentDirectory
    ).then((files) => {
      log(
        "Files in document directory: " +
          (files.length ? files.join(", ") : "none")
      );
      const playlist = files.find((f) => f.endsWith(".m3u8"));
      if (playlist) {
        return FileSystem.readAsStringAsync(
          `${FileSystem.documentDirectory}${playlist}`
        );
      }
    });

    if (playlist) {
      const files = playlist
        .split("\n")
        .filter((line) => !!line && !line.startsWith("#EXT"));
      log(`Playlist contents: ${files.join(",")}`);
    }
  }, []);

  const startBackRecording = useCallback(async () => {
    const { session } = await runFfmpegCommandWithLogging(
      FFmpegKit.executeWithArgumentsAsync(
        Platform.OS === "android" ? androidRecordCommand : iosRecordCommand
      ),
      log
    );

    imgInterval.current = setInterval(() => {
      setImgTime(Date.now());
    }, 1000);

    const isRunning = (await session.getState()) === SessionState.RUNNING;
    if (isRunning) {
      activeSessions.current = [
        ...activeSessions.current,
        session.getSessionId(),
      ];
    }
  }, []);

  // TODO: different for android vs. ios
  const listDevices = useCallback(() => {
    runFfmpegCommandWithLogging(
      FFmpegKit.executeWithArgumentsAsync(listDevicesCmd),
      log
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row" }}>
        <Image
          source={{
            uri: `${FileSystem.documentDirectory}back-out.jpg?t=${imgTime}`,
          }}
          onError={(e) => log(`Failed to load image: ${e.nativeEvent.error}`)}
          style={{
            width: 200,
            height: 200,
            resizeMode: "cover",
            backgroundColor: "grey",
          }}
        />
      </View>
      <ScrollView style={{ flex: 1 }}>
        <SafeAreaView>
          <Button
            onPress={listDevices}
            color="blue"
            title="List Devices"
          ></Button>
          <Button
            onPress={startBackRecording}
            color="blue"
            title="Start Back"
          ></Button>
          <Button
            onPress={stopSessions}
            color="blue"
            title="Stop Sessions"
          ></Button>
          <Button onPress={listFiles} color="blue" title="List Files"></Button>
          <View style={{ height: 20 }} />
          <Text style={{ fontWeight: "bold", marginLeft: 20 }}>
            FFmpegKit logs
          </Text>
          <View
            style={{ marginHorizontal: 10, flexDirection: "column-reverse" }}
          >
            <Text>{output}</Text>
          </View>
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
