module.exports = {
  dependencies: {
    '@videosdk.live/react-native-webrtc': {
      root: `${__dirname}/node_modules/@videosdk.live/react-native-webrtc`,
      platforms: {
        android: {
          sourceDir: `${__dirname}/node_modules/@videosdk.live/react-native-webrtc/android`,
          packageImportPath:
            'import live.videosdk.rnwebrtc.WebRTCModulePackage;',
          packageInstance: 'new WebRTCModulePackage()',
        },
      },
    },
  },
};
