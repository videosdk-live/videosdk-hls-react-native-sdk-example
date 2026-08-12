import {useMeeting, useParticipant} from '@videosdk.live/react-native-sdk';
import React, {useEffect} from 'react';

const PauseInvisibleParticipant = ({participantId, isVisible}) => {
  const {webcamStream, isLocal} = useParticipant(participantId);

  useEffect(() => {
    if (isLocal) return;
    (async () => {
      try {
        if (typeof isVisible === 'string') {
          if (isVisible && typeof webcamStream?.resume === 'function') {
            if (webcamStream.paused) await webcamStream.resume();
          } else if (typeof webcamStream?.pause === 'function') {
            if (!webcamStream.paused) await webcamStream.pause();
          }
        } else if (typeof webcamStream?.pause === 'function') {
          if (!webcamStream.paused) await webcamStream.pause();
        }
      } catch (err) {
        console.error('stream pause/resume failed', err);
      }
    })();
  }, [isLocal, isVisible, webcamStream]);

  return <></>;
};

const PauseInvisibleParticipants = ({visibleParticipantIds}) => {
  const {participants} = useMeeting();

  return (
    <>
      {[...participants.keys()].map(participantId => {
        return (
          visibleParticipantIds.length > 0 && (
            <PauseInvisibleParticipant
              key={`PauseInvisibleParticipant_${participantId}`}
              participantId={participantId}
              isVisible={visibleParticipantIds.find(
                pId => pId === participantId,
              )}
            />
          )
        );
      })}
    </>
  );
};

export default PauseInvisibleParticipants;
