import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Video from 'react-native-video';
import ChatViewer from '../Components/ChatViewer';
import {Cancel, HourGlass, Stop} from '../../../assets/icons';
import {useOrientation} from '../../../utils/useOrientation';
import colors from '../../../styles/colors';
import {convertRFValue} from '../../../styles/spacing';
import {usePubSub, useMeeting} from '@videosdk.live/react-native-sdk';
import ControlsOverlay from './ControlsOverlay';

export default function ViewerContainer({
  localParticipantId,
  setlocalParticipantMode,
  onRequestLeave,
}) {
  const {changeMode, hlsState, hlsUrls} = useMeeting();
  const deviceOrientation = useOrientation();
  const [progress, setProgrss] = useState(0);
  const [playableDuration, setplayableDuration] = useState(0);

  const [isChatVisible, setisChatVisible] = useState(false);
  const [pause, setPause] = useState(false);

  const videoPlayer = useRef(null);

  const seekTo = sec => {
    videoPlayer &&
      videoPlayer.current &&
      typeof videoPlayer.current.seek === 'function' &&
      videoPlayer.current.seek(sec);
  };

  usePubSub(
    `CHANGE_MODE_${localParticipantId}`,
    {
      onMessageReceived: data => {
        const {payload, senderName} = data;
        if (payload?.mode === 'SEND_AND_RECV') {
          showAlert(senderName);
        }
      },
    },
    {},
  );

  const showAlert = senderName => {
    Alert.alert(
      'Permission',
      `${senderName} has requested you to join as a speaker`,
      [
        {
          text: 'Reject',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await changeMode('SEND_AND_RECV');
              setlocalParticipantMode('SEND_AND_RECV');
            } catch (err) {
              console.error('changeMode failed', err);
            }
          },
        },
      ],
    );
  };

  const LandscapeView = () => {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#2B3034',
          flexDirection: 'row',
        }}>
        <View style={{flex: 1}}>
          <Video
            ref={videoPlayer}
            source={{
              uri: hlsUrls.playbackHlsUrl,
            }} // Can be a URL or a local file.
            style={{
              flex: 1,
              backgroundColor: 'black',
            }}
            onError={e => console.log('error', e)}
            paused={pause}
            onProgress={({currentTime, playableDuration}) => {
              setProgrss(currentTime);
              setplayableDuration(playableDuration);
            }}
            onLoad={data => {
              const {duration} = data;
              setplayableDuration(duration);
            }}
            disableAudioSessionManagement={true}
          />
          <ControlsOverlay
            playableDuration={playableDuration}
            setPause={setPause}
            pause={pause}
            progress={progress}
            seekTo={sec => {
              seekTo(sec);
            }}
            isChatVisible={isChatVisible}
            setisChatVisible={setisChatVisible}
            onRequestLeave={onRequestLeave}
          />
        </View>
        {isChatVisible ? (
          <View style={{flex: 0.8}}>
            <ChatViewer raiseHandVisible={false} />
          </View>
        ) : null}
      </SafeAreaView>
    );
  };

  const PortraitView = () => {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#2B3034',
        }}>
        <View
          style={{
            flex: 0.4,
          }}>
          <Video
            ref={videoPlayer}
            source={{
              uri: hlsUrls.playbackHlsUrl,
            }} // Can be a URL or a local file.
            style={{
              flex: 1,
              backgroundColor: 'black',
            }}
            // controls
            onError={e => console.log('error', e)}
            paused={pause}
            onProgress={({currentTime, playableDuration}) => {
              setProgrss(currentTime);
              setplayableDuration(playableDuration);
            }}
            onLoad={data => {
              const {duration} = data;
              setplayableDuration(duration);
            }}
            disableAudioSessionManagement={true}
          />
          <ControlsOverlay
            playableDuration={playableDuration}
            setPause={setPause}
            pause={pause}
            progress={progress}
            seekTo={sec => {
              seekTo(sec);
            }}
            onRequestLeave={onRequestLeave}
          />
        </View>
        <View
          style={{
            flex: 0.8,
            backgroundColor: '#2B3034',
          }}>
          <ChatViewer raiseHandVisible={true} />
        </View>
      </SafeAreaView>
    );
  };

  const WaitingScreen = () => {
    return (
      <SafeAreaView
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          backgroundColor: colors.primary[900],
        }}>
        <HourGlass />
        <Text
          style={{
            fontSize: convertRFValue(18),
            color: colors.primary[100],
            fontWeight: 'bold',
            marginTop: 12,
          }}>
          Waiting for speaker
        </Text>
        <Text
          style={{
            fontSize: convertRFValue(18),
            color: colors.primary[100],
            fontWeight: 'bold',
          }}>
          to start the live streaming
        </Text>
        <TouchableOpacity
          onPress={() => {
            onRequestLeave?.();
          }}
          style={{
            height: 30,
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 4,
            position: 'absolute',
            top: 12,
            left: 12,
          }}>
          <Cancel />
        </TouchableOpacity>
      </SafeAreaView>
    );
  };

  const StopLiveStreamScreen = () => {
    return (
      <SafeAreaView
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          backgroundColor: colors.primary[900],
        }}>
        <Stop />
        <Text
          style={{
            fontSize: convertRFValue(18),
            color: colors.primary[100],
            fontWeight: 'bold',
            marginTop: 12,
          }}>
          Host has stopped
        </Text>
        <Text
          style={{
            fontSize: convertRFValue(18),
            color: colors.primary[100],
            fontWeight: 'bold',
          }}>
          the live streaming
        </Text>
        <TouchableOpacity
          onPress={() => {
            onRequestLeave?.();
          }}
          style={{
            height: 30,
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 4,
            position: 'absolute',
            top: 12,
            left: 12,
          }}>
          <Cancel />
        </TouchableOpacity>
      </SafeAreaView>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'android' ? undefined : 'padding'}
      keyboardVerticalOffset={-1}
      style={{
        flex: 1,
        backgroundColor: '#2B3034',
        flexDirection: deviceOrientation === 'PORTRAIT' ? 'column' : 'row',
      }}>
      {hlsState == 'HLS_PLAYABLE' ? (
        deviceOrientation === 'PORTRAIT' ? (
          PortraitView()
        ) : (
          LandscapeView()
        )
      ) : (
        <WaitingScreen />
      )}
    </KeyboardAvoidingView>
  );
}
