import {
  useMeeting,
  ReactNativeForegroundService,
} from '@videosdk.live/react-native-sdk';
import {useEffect, useRef, useState} from 'react';
import MeetingViewer from './Speaker/MeetingViewer';
import WaitingToJoinView from './Components/WaitingToJoinView';
import React from 'react';
import ViewerContainer from './Viewer/ViewerContainer';
import Orientation from 'react-native-orientation-locker';

export default function ILSContainer({webcamEnabled}) {
  const [isJoined, setJoined] = useState(false);
  const [downStreamUrl, setDownstreamUrl] = useState(null);
  const [isStoppedHls, setisStoppedHls] = useState(false);
  const [localParticipantMode, setlocalParticipantMode] = useState(null);

  const _handleOnHlsStateChanged = data => {
    switch (data.status) {
      case 'HLS_STARTED':
        setDownstreamUrl(data.downstreamUrl);
        break;
      case 'HLS_STOPPED':
        setisStoppedHls(true);
        break;
      default:
        setDownstreamUrl(null);
        setisStoppedHls(false);
    }
  };

  const mMeeting = useMeeting({});

  const mMeetingRef = useRef();

  useEffect(() => {
    mMeetingRef.current = mMeeting;
  }, [mMeeting]);

  const {join, changeWebcam, leave, participants, localParticipant} =
    useMeeting({
      onHlsStateChanged: _handleOnHlsStateChanged,
      onParticipantModeChanged: ({mode, participantId}) => {
        const localParticipant = mMeetingRef.current?.localParticipant;
        if (participantId === localParticipant.id) {
          if (mode === 'CONFERENCE') {
            Orientation.lockToPortrait();
            Orientation.unlockAllOrientations();
            localParticipant.pin();
          } else {
            localParticipant.unpin();
          }
        }
      },
      onMeetingJoined: () => {
        const localParticipant = mMeetingRef.current?.localParticipant;
        const meetingMode = localParticipant.mode;
        if (meetingMode === 'CONFERENCE') {
          localParticipant.pin();
        }
        setTimeout(() => {
          setJoined(true);
        }, 500);
      },
    });

  useEffect(() => {
    const mode = localParticipant
      ? participants.get(localParticipant.id).mode
      : null;
    setlocalParticipantMode(mode);
  }, [localParticipant]);

  useEffect(() => {
    setTimeout(() => {
      if (!isJoined) {
        join();
        if (webcamEnabled) changeWebcam();
      }
    }, 1000);

    return () => {
      Orientation.lockToPortrait();
      Orientation.unlockAllOrientations();
      leave();
      ReactNativeForegroundService.stopAll();
    };
  }, []);

  return isJoined ? (
    localParticipantMode === 'CONFERENCE' ? (
      <MeetingViewer setlocalParticipantMode={setlocalParticipantMode} />
    ) : (
      <ViewerContainer
        downStreamUrl={downStreamUrl}
        localParticipantId={localParticipant.id}
        isStoppedHls={isStoppedHls}
        setlocalParticipantMode={setlocalParticipantMode}
      />
    )
  ) : (
    <WaitingToJoinView />
  );
}
