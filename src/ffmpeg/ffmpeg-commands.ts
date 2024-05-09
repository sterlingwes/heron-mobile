import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

export const createListDevicesCommand = () =>
  Platform.OS === "ios"
    ? [
        "-hide_banner",
        "-f",
        "avfoundation",
        "-list_devices",
        "true",
        "-i",
        '""',
      ]
    : [];

export const createAndroidRecordCommand = ({
  frameRate,
  videoDeviceIndex,
  audioDeviceIndex,
  identifier,
}: {
  frameRate: number;
  videoDeviceIndex: number | "none" | "default";
  audioDeviceIndex: number | "none" | "default";
  identifier: string;
}) => [
  "-hide_banner",
  "-y",
  "-thread_queue_size",
  "512",
  "-f",
  "android_camera",
  "-camera_index",
  videoDeviceIndex.toString(),
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
  `${FileSystem.documentDirectory}${identifier}-%Y%m%d-%s.mp4`,
  `${FileSystem.documentDirectory}${identifier}.m3u8`,
  `-r`,
  "1",
  "-update",
  "1",
  `${FileSystem.documentDirectory}${identifier}.jpg`,
];

export const createIOSRecordCommand = ({
  frameRate,
  videoDeviceIndex,
  audioDeviceIndex,
  identifier,
}: {
  frameRate: number;
  videoDeviceIndex: number | "none" | "default";
  audioDeviceIndex: number | "none" | "default";
  identifier: string;
}) => [
  // "-hide_banner",
  "-y",
  "-thread_queue_size",
  "512",
  "-f",
  "avfoundation",
  "-video_size",
  "640x480",
  "-pix_fmt",
  "nv12",
  "-framerate",
  `${frameRate}`, // TODO: pick from supported framerates
  "-i",
  `${videoDeviceIndex}:${audioDeviceIndex}`,
  "-c:v",
  "libx264",
  "-strftime",
  "1",
  "-hls_time",
  "2",
  "-hls_list_size",
  "10",
  "-hls_segment_filename",
  `${FileSystem.documentDirectory}${identifier}-%Y%m%d-%s.mp4`,
  `${FileSystem.documentDirectory}${identifier}.m3u8`,
  `-r`,
  "1",
  "-update",
  "1",
  `${FileSystem.documentDirectory}${identifier}.jpg`,
  "-loglevel",
  "level+debug",
];

export const testScreenGrabCommand = (identifier: string) => [
  "-hide_banner",
  "-y",
  "-thread_queue_size",
  "512",
  "-f",
  "avfoundation",
  "-video_size",
  "640x480",
  "-pix_fmt",
  "nv12",
  "-framerate",
  "30",
  "-i",
  `0:none`,
  `-r`,
  "1",
  "-update",
  "1",
  `${FileSystem.documentDirectory}${identifier}.jpg`,
];
