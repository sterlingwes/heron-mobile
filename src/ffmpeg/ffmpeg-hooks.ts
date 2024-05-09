import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import {
  createAndroidRecordCommand,
  createIOSRecordCommand,
  createListDevicesCommand,
} from "./ffmpeg-commands";
import {
  FFmpegKit,
  FFmpegKitConfig,
  Level as LogLevel,
  SessionState,
} from "ffmpeg-kit-react-native";
import { startLogCapture, writeCapturedLogs } from "./ffmpeg-utils";

export enum CameraFace {
  Back = "back",
  Front = "front",
}

export const useFFmpeg = () => {
  const sessionStartTime = useRef<number>(0); // change to state or add separate states for img filepaths for rendering
  const activeSessions = useRef<number[]>([]);
  const [imgTime, setImgTime] = useState(0);
  const imgInterval = useRef<number | Timer>(0);

  const startRecording = useCallback(
    async (camera: CameraFace) => {
      const commandParams =
        camera === CameraFace.Back
          ? {
              videoDeviceIndex: 0,
              audioDeviceIndex: 0,
              frameRate: 60,
            }
          : {
              videoDeviceIndex: 1,
              audioDeviceIndex: "none" as const,
              frameRate: 60,
            };

      // TODO: ios dual camera not running concurrently still (android is)
      // start with figuring out how to debug process hang using split log storage
      const identifier = `${sessionStartTime.current}/${camera}`;
      const command =
        Platform.OS === "ios"
          ? createIOSRecordCommand({ ...commandParams, identifier })
          : createAndroidRecordCommand({ ...commandParams, identifier });
      const session = await FFmpegKit.executeWithArgumentsAsync(command);

      const isRunning = (await session.getState()) === SessionState.RUNNING;
      const sessionId = session.getSessionId();
      console.info({ identifier, sessionId, isRunning });
      if (isRunning) {
        activeSessions.current = [...activeSessions.current, sessionId];
      }

      return session;
    },
    [sessionStartTime]
  );

  const listDevices = useCallback(async () => {
    const session = await FFmpegKit.executeWithArguments(
      createListDevicesCommand()
    );
    const output = await session.getOutput();
    console.log("list devices:", output);
  }, []);

  const startSessions = useCallback(async () => {
    await FFmpegKitConfig.setLogLevel(LogLevel.AV_LOG_VERBOSE);
    // startLogCapture();
    sessionStartTime.current = Date.now();
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}${sessionStartTime.current}/`
    );
    await startRecording(CameraFace.Back);
    await startRecording(CameraFace.Front);

    imgInterval.current = setInterval(() => {
      setImgTime(Date.now());
    }, 1100);
  }, [imgInterval, sessionStartTime]);

  const stopSessions = useCallback(async () => {
    const cancelledSessions = new Set<number>();
    clearInterval(imgInterval.current);
    activeSessions.current.reduce(async (chain, sessionId) => {
      await chain;
      try {
        console.log(`cancelling session ${sessionId}`);
        await FFmpegKit.cancel(sessionId);
        cancelledSessions.add(sessionId);
      } catch (e) {
        console.log(`Failed to cancel session ${sessionId}: ${e.message}`);
      }
    }, Promise.resolve());
    console.log(`stopped ${cancelledSessions.size} sessions`);
    activeSessions.current = activeSessions.current.filter(
      (sessionId) => !cancelledSessions.has(sessionId)
    );
    writeCapturedLogs(sessionStartTime.current.toString());
    sessionStartTime.current = 0;
  }, [activeSessions]);

  return {
    imgTime,
    activeSessions,
    sessionStartTime,
    listDevices,
    startSessions,
    stopSessions,
  };
};
