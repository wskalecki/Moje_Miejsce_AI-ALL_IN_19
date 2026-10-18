import { Config } from '@remotion/cli/config'

// Media (voiceover, music, b-roll, screen recordings) lives in ../assets.
Config.setPublicDir('../assets')
Config.setVideoImageFormat('jpeg')
Config.setJpegQuality(95)
Config.setConcurrency(6)
