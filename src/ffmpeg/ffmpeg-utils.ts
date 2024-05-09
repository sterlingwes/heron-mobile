import * as FileSystem from "expo-file-system";
import { FFmpegKitConfig, Level as LogLevel } from "ffmpeg-kit-react-native";

type LogLine = {
  time: number;
  message: String;
  level: number;
  session: number;
};
const log: LogLine[] = [];

export const startLogCapture = () => {
  FFmpegKitConfig.enableLogCallback((logLine) => {
    log.push({
      message: logLine.getMessage(),
      time: Date.now(),
      level: logLine.getLevel(),
      session: logLine.getSessionId(),
    });
  });

  FFmpegKitConfig.enableFFmpegSessionCompleteCallback(async (session) => {
    console.info(
      `FFmpeg process ${session.getSessionId()} exited with rc=${await session.getReturnCode()}`
    );
  });
};

export const writeCapturedLogs = (sessionStartTime: string) => {
  return FileSystem.writeAsStringAsync(
    `${FileSystem.documentDirectory}${sessionStartTime}/logs.txt`,
    log
      .map(
        (line) =>
          `${line.time} ${LogLevel.levelToString(line.level)} ${line.message}`
      )
      .join("\n")
  );
};
