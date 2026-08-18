import React, {useEffect, useRef, useState, useMemo} from 'react';
import {
  View,
  Text,
  Clipboard,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import {useMeeting, usePubSub} from '@videosdk.live/react-native-sdk';
import {
  CallEnd,
  Chat,
  Copy,
  EndForAll,
  Leave,
  MicOff,
  MicOn,
  Participants,
  ScreenShare,
  VideoOff,
  VideoOn,
} from '../../../assets/icons';
import colors from '../../../styles/colors';
import IconContainer from '../../../components/IconContainer';
import LocalParticipantPresenter from '../Components/LocalParticipantPresenter';
import Menu from '../../../components/Menu';
import MenuItem from '../Components/MenuItem';
import BottomSheet from '../../../components/BottomSheet';
import ParticipantListViewer from '../Components/ParticipantListViewer';
import RemoteParticipantPresenter from './RemoteParticipantPresenter';
import VideosdkRPK from '../../../../VideosdkRPK';
import Toast from 'react-native-simple-toast';
import {MemoizedParticipantGrid} from './ParticipantGrid';
import {useOrientation} from '../../../utils/useOrientation';
import ChatViewer from '../Components/ChatViewer';
import {convertRFValue} from '../../../styles/spacing';
import Blink from '../../../components/Blink';

export default function MeetingViewer({
  setlocalParticipantMode,
  onRequestLeave,
  onRequestEnd,
}) {
  const {
    localParticipant,
    participants,
    pinnedParticipants,
    localWebcamOn,
    localMicOn,
    toggleWebcam,
    toggleMic,
    presenterId,
    localScreenShareOn,
    toggleScreenShare,
    meetingId,
    activeSpeakerId,
    changeMode,
    hlsState,
    startHls,
    stopHls,
    enableScreenShare,
    disableScreenShare,
  } = useMeeting({
    onError: data => {
      const {code, message} = data;
      Toast.show(`Error: ${code}: ${message}`);
    },
  });

  const leaveMenu = useRef();
  const bottomSheetRef = useRef();
  const hlsRef = useRef();
  const orientation = useOrientation();

  const [bottomSheetView, setBottomSheetView] = useState('');

  const participantIds = useMemo(() => {
    if (!localParticipant?.id) return [];
    const pinnedParticipantId = [...pinnedParticipants.keys()].filter(
      participantId => {
        return participantId != localParticipant.id;
      },
    );
    // const regularParticipantIds = [...participants.keys()].filter(
    //   participantId => {
    //     return (
    //       ![...pinnedParticipants.keys()].includes(participantId) &&
    //       localParticipant.id != participantId
    //     );
    //   },
    // );
    const ids = [
      localParticipant?.id,
      ...pinnedParticipantId,
      // ...regularParticipantIds,
    ].slice(0, presenterId ? 2 : 6);

    if (activeSpeakerId) {
      if (!ids.includes(activeSpeakerId)) {
        ids[ids.length - 1] = activeSpeakerId;
      }
    }
    return ids;
  }, [
    participants,
    activeSpeakerId,
    pinnedParticipants,
    presenterId,
    localScreenShareOn,
  ]);

  useEffect(() => {
    if (hlsRef.current) {
      if (hlsState === 'HLS_STARTING' || hlsState === 'HLS_STOPPING') {
        hlsRef.current.start();
      } else {
        hlsRef.current.stop();
      }
    }
  }, [hlsState]);

  usePubSub(
    'RAISE_HAND',
    {
      onMessageReceived: data => {
        const {senderName} = data;
        Toast.show(`${senderName} raised hand 🖐🏼`);
      },
    },
    {},
  );

  useEffect(() => {
    if (Platform.OS == 'ios') {
      VideosdkRPK.addListener('onScreenShare', async event => {
        try {
          if (event === 'START_BROADCAST') {
            await enableScreenShare();
          } else if (event === 'STOP_BROADCAST') {
            await disableScreenShare();
          }
        } catch (err) {
          console.error('screen share toggle failed', err);
        }
      });

      return () => {
        VideosdkRPK.removeAllListeners('onScreenShare');
      };
    }
  }, []);

  const _handleHLS = async () => {
    try {
      if (!hlsState || hlsState === 'HLS_STOPPED') {
        await startHls({
          layout: {
            type: 'SPOTLIGHT',
            priority: 'PIN',
            gridSize: 4,
          },
          orientation: 'landscape',
          theme: 'DARK',
          quality: 'high',
          mode: 'video-and-audio',
        });
      } else if (hlsState === 'HLS_PLAYABLE') {
        await stopHls();
      }
    } catch (err) {
      console.error('HLS toggle failed', err);
    }
  };

  usePubSub(
    `CHANGE_MODE_${localParticipant.id}`,
    {
      onMessageReceived: async data => {
        const {payload} = data;
        if (payload?.mode !== 'RECV_ONLY') return;
        try {
          await changeMode('RECV_ONLY');
          setlocalParticipantMode('RECV_ONLY');
        } catch (err) {
          console.error('changeMode failed', err);
        }
      },
    },
    {},
  );

  useEffect(() => {
    if (hlsRef.current) {
      if (hlsState === 'HLS_STARTING' || hlsState === 'HLS_STOPPING') {
        hlsRef.current.start();
      } else {
        hlsRef.current.stop();
      }
    }
  }, [hlsState]);

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'space-between',
          }}>
          <View style={{flexDirection: 'row'}}>
            <Text
              style={{
                fontSize: 16,
                color: colors.primary[100],
              }}>
              {meetingId ? meetingId : 'xxx - xxx - xxx'}
            </Text>

            <TouchableOpacity
              style={{
                justifyContent: 'center',
                marginLeft: 10,
              }}
              onPress={() => {
                Clipboard.setString(meetingId);
                Toast.show('Meeting Id copied Successfully');
              }}>
              <Copy fill={colors.primary[100]} width={18} height={18} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{flexDirection: 'row'}}>
          {hlsState === 'HLS_STARTED' ||
          hlsState === 'HLS_STOPPING' ||
          hlsState === 'HLS_PLAYABLE' ||
          hlsState === 'HLS_STARTING' ? (
            <Blink ref={hlsRef} duration={500}>
              <TouchableOpacity
                onPress={async () => {
                  await _handleHLS();
                }}
                activeOpacity={1}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginHorizontal: 8,
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  backgroundColor: '#FF5D5D',
                }}>
                <Text
                  style={{
                    fontSize: convertRFValue(12),
                    color: colors.primary[100],
                  }}>
                  {hlsState === 'HLS_STARTED'
                    ? `Live Starting`
                    : hlsState === 'HLS_STOPPING'
                      ? `Live Stopping`
                      : hlsState === 'HLS_STARTING'
                        ? `Live Starting`
                        : hlsState === 'HLS_PLAYABLE'
                          ? 'Stop Live'
                          : null}
                </Text>
              </TouchableOpacity>
            </Blink>
          ) : (
            <TouchableOpacity
              onPress={() => {
                _handleHLS();
              }}
              activeOpacity={1}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 8,
                padding: 8,
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: '#2B3034',
              }}>
              <Text
                style={{
                  fontSize: convertRFValue(12),
                  color: colors.primary[100],
                }}>
                Go Live
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              setBottomSheetView('PARTICIPANT_LIST');
              bottomSheetRef.current.show();
            }}
            activeOpacity={1}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 8,
              width: 60,
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: '#2B3034',
            }}>
            <Participants height={20} width={20} fill={colors.primary[100]} />
            <Text
              style={{
                fontSize: convertRFValue(12),
                color: colors.primary[100],
                marginLeft: 4,
              }}>
              {participants ? [...participants.keys()].length : 1}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Center */}
      <View
        style={{
          flex: 1,
          flexDirection: orientation == 'PORTRAIT' ? 'column' : 'row',
          marginVertical: 12,
        }}>
        {presenterId && !localScreenShareOn ? (
          <RemoteParticipantPresenter presenterId={presenterId} />
        ) : presenterId && localScreenShareOn ? (
          <LocalParticipantPresenter />
        ) : null}

        <MemoizedParticipantGrid
          participantIds={participantIds}
          isPresenting={presenterId != null}
        />
      </View>
      <Menu
        ref={leaveMenu}
        menuBackgroundColor={colors.primary[700]}
        placement="left">
        <MenuItem
          title={'Leave'}
          description={'Only you will leave the call'}
          icon={<Leave width={22} height={22} />}
          onPress={() => {
            leaveMenu.current?.hide?.();
            onRequestLeave?.();
          }}
        />
        <View
          style={{
            height: 1,
            backgroundColor: colors.primary['600'],
          }}
        />
        <MenuItem
          title={'End'}
          description={'End call for all participants'}
          icon={<EndForAll />}
          onPress={() => {
            leaveMenu.current?.hide?.();
            onRequestEnd?.();
          }}
        />
      </Menu>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
        }}>
        <IconContainer
          backgroundColor={'red'}
          Icon={() => {
            return <CallEnd height={26} width={26} fill="#FFF" />;
          }}
          onPress={() => {
            leaveMenu.current.show();
          }}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: '#2B3034',
          }}
          backgroundColor={!localMicOn ? colors.primary[100] : 'transparent'}
          onPress={async () => {
            try {
              await toggleMic();
            } catch (err) {
              console.error('toggleMic failed', err);
            }
          }}
          Icon={() => {
            return localMicOn ? (
              <MicOn height={24} width={24} fill="#FFF" />
            ) : (
              <MicOff height={28} width={28} fill="#1D2939" />
            );
          }}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: '#2B3034',
          }}
          backgroundColor={!localWebcamOn ? colors.primary[100] : 'transparent'}
          onPress={async () => {
            try {
              await toggleWebcam();
            } catch (err) {
              console.error('toggleWebcam failed', err);
            }
          }}
          Icon={() => {
            return localWebcamOn ? (
              <VideoOn height={24} width={24} fill="#FFF" />
            ) : (
              <VideoOff height={36} width={36} fill="#1D2939" />
            );
          }}
        />
        <IconContainer
          onPress={() => {
            setBottomSheetView('CHAT');
            bottomSheetRef.current.show();
          }}
          style={{
            borderWidth: 1.5,
            borderColor: '#2B3034',
          }}
          Icon={() => {
            return <Chat height={22} width={22} fill="#FFF" />;
          }}
        />
        <IconContainer
          style={{
            borderWidth: 1.5,
            borderColor: '#2B3034',
          }}
          onPress={async () => {
            if (presenterId != null && !localScreenShareOn) return;
            try {
              if (Platform.OS === 'android') {
                await toggleScreenShare();
              } else {
                VideosdkRPK.startBroadcast();
              }
            } catch (err) {
              console.error('screen share toggle failed', err);
            }
          }}
          Icon={() => {
            return <ScreenShare height={22} width={22} fill="#FFF" />;
          }}
        />
      </View>
      <BottomSheet
        sheetBackgroundColor={'#2B3034'}
        draggable={false}
        radius={12}
        hasDraggableIcon
        closeFunction={() => {
          setBottomSheetView('');
        }}
        ref={bottomSheetRef}
        height={Dimensions.get('window').height * 0.5}>
        {bottomSheetView === 'CHAT' ? (
          <ChatViewer raiseHandVisible={false} />
        ) : bottomSheetView === 'PARTICIPANT_LIST' ? (
          <ParticipantListViewer participantIds={[...participants.keys()]} />
        ) : null}
      </BottomSheet>
    </>
  );
}
