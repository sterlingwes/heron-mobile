# heron-mobile

- install [bun](https://bun.sh/) if you don't have it
- install dependencies with it (`bun install`)
- run the app on a real device (`bun ios --device`)

## arch

- uses expo with development build, not Go (`bun expo prebuild`)

## dev plan

- [x] proof of concept (PoC) working for iOS ffmpegkit stream capture as chunked mp4s with m3u8 playlist file (single camera)
- [x] PoC for capture preview (export video frame image every second)
- [ ] dual camera stream capture
- [ ] verify above, but for android
- [ ] PoC for upload to infra referencing existing app implementation
- [ ] refactor to allow entrypoint for server & credentials config
- [ ] add screen for server & credentials capture (with config.json download & persistence)
- [ ] add transition to main screen and recording / upload status UI
- [ ] add proper permissions prompts & handle denied
- [ ] test downsizing ffmpegkit lib to minimal video package from full-gpl
- [ ] add file management / upload history (?)
- [ ] ...

## random notes

- tried showing a delayed preview (ie. playing the m3u8 playlist in a video player once the first chunk is written but it gave an av error of "media may be damaged" and i'm reading that iOS doesn't handle this format well without re-muxing)
