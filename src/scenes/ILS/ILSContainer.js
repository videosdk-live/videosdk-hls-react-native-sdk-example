import {useMeeting} from '@videosdk.live/react-native-sdk';
import React, {useEffect, useRef, useState} from 'react';
import MeetingViewer from './Speaker/MeetingViewer';
import WaitingToJoinView from './Components/WaitingToJoinView';
import ViewerContainer from './Viewer/ViewerContainer';
import Orientation from 'react-native-orientation-locker';

export default function ILSContainer() {
  const [isJoined, setJoined] = useState(false);
  const [localParticipantMode, setlocalParticipantMode] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const mMeeting = useMeeting({});

  const mMeetingRef = useRef();
  const joinedRef = useRef(false);
  const hasLeftRef = useRef(false);

  useEffect(() => {
    mMeetingRef.current = mMeeting;
  }, [mMeeting]);

  const {join, leave, end, participants, localParticipant} = useMeeting({
    onParticipantModeChanged: async ({mode, participantId}) => {
      const local = mMeetingRef.current?.localParticipant;
      if (!local || participantId !== local.id) return;
      try {
        if (mode === 'SEND_AND_RECV') {
          Orientation.unlockAllOrientations();
          await local.pin('CAM');
        } else {
          await local.unpin('CAM');
        }
      } catch (err) {
        console.error('participant mode change failed', err);
      }
    },
    onMeetingJoined: async () => {
      joinedRef.current = true;
      const local = mMeetingRef.current?.localParticipant;
      try {
        if (local?.mode === 'SEND_AND_RECV') {
          await local.pin('CAM');
        }
      } catch (err) {
        console.error('post-join setup failed', err);
      }
      setTimeout(() => {
        setJoined(true);
      }, 500);
    },
    onMeetingLeft: () => {
      joinedRef.current = false;
      hasLeftRef.current = true;
    },
  });

  useEffect(() => {
    const mode = localParticipant
      ? participants.get(localParticipant.id)?.mode
      : null;
    setlocalParticipantMode(mode);
  }, [localParticipant, participants]);

  useEffect(() => {
    const joinTimeout = setTimeout(async () => {
      if (!joinedRef.current) {
        try {
          await join();
        } catch (err) {
          console.error('meeting join failed', err);
        }
      }
    }, 1000);

    return () => {
      clearTimeout(joinTimeout);
      Orientation.lockToPortrait();
      if (!joinedRef.current || hasLeftRef.current) return;
      (async () => {
        try {
          await leave();
        } catch (err) {
          console.error('meeting leave failed', err);
        }
      })();
    };
  }, []);

  useEffect(() => {
    if (!pendingAction || isJoined) return;
    (async () => {
      try {
        if (pendingAction === 'end') {
          await end();
        } else {
          await leave();
        }
      } catch (err) {
        console.error(`${pendingAction}() failed`, err);
      }
    })();
  }, [pendingAction, isJoined, leave, end]);

  const handleRequestLeave = () => {
    setPendingAction('leave');
    setJoined(false);
  };

  const handleRequestEnd = () => {
    setPendingAction('end');
    setJoined(false);
  };

  if (!isJoined || !localParticipant?.id) {
    return <WaitingToJoinView />;
  }

  return localParticipantMode === 'SEND_AND_RECV' ? (
    <MeetingViewer
      setlocalParticipantMode={setlocalParticipantMode}
      onRequestLeave={handleRequestLeave}
      onRequestEnd={handleRequestEnd}
    />
  ) : (
    <ViewerContainer
      localParticipantId={localParticipant.id}
      setlocalParticipantMode={setlocalParticipantMode}
      onRequestLeave={handleRequestLeave}
    />
  );
}
