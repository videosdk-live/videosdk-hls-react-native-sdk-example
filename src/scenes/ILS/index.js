import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import colors from '../../styles/colors';
import {
  MeetingProvider,
  MeetingConsumer,
} from '@videosdk.live/react-native-sdk';
import ILSContainer from './ILSContainer';
import {SCREEN_NAMES} from '../../navigators/screenNames';

export default function Meeting({navigation, route}) {
  const token = route.params.token;
  const meetingId = route.params.meetingId;
  const micEnabled = !!route.params.micEnabled;
  const webcamEnabled = !!route.params.webcamEnabled;
  const name = route.params.name ? route.params.name : 'Test User';
  const mode = route.params.mode ? route.params.mode : 'SEND_AND_RECV';

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: colors.primary[900], padding: 12}}>
      <MeetingProvider
        config={{
          meetingId,
          micEnabled,
          webcamEnabled,
          name,
          mode, // "SEND_AND_RECV" | "SIGNALLING_ONLY" | "RECV_ONLY"
          notification: {
            title: 'Video SDK Meeting',
            message: 'Meeting is running.',
          },
          defaultCamera: 'front',
        }}
        token={token}>
        <MeetingConsumer
          {...{
            onMeetingLeft: () => {
              navigation.navigate(SCREEN_NAMES.Home);
            },
          }}>
          {() => {
            return <ILSContainer />;
          }}
        </MeetingConsumer>
      </MeetingProvider>
    </SafeAreaView>
  );
}
