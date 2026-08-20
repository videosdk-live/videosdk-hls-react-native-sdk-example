import React, {useEffect, useState} from 'react';
import {
  View,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import TextInputContainer from '../../../components/TextInputContainer';
import Button from '../../../components/Button';
import colors from '../../../styles/colors';
import {SCREEN_NAMES} from '../../../navigators/screenNames';
import {getToken} from '../../../api/api';

export default function Viewer_Home({navigation}) {
  const [name, setName] = useState('');
  const [meetingId, setMeetingId] = useState('xxxx-xxxx-xxxx');
  const [token, setToken] = useState('');

  useEffect(() => {
    navigation.setOptions({title: 'Join as a viewer'});
    (async () => {
      try {
        const t = await getToken();
        setToken(t);
      } catch (err) {
        console.error('token fetch failed', err);
      }
    })();
  }, [navigation]);

  const naviagateToViewer = () => {
    navigation.navigate(SCREEN_NAMES.Meeting, {
      name,
      token,
      meetingId,
      mode: 'RECV_ONLY',
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{
        flex: 1,
        backgroundColor: colors.primary['900'],
      }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: colors.primary['900'],
            justifyContent: 'center',
          }}>
          <View style={{marginHorizontal: 32}}>
            <TextInputContainer
              placeholder={'Enter meeting code'}
              value={meetingId}
              setValue={setMeetingId}
            />
            <TextInputContainer
              placeholder={'Enter your name'}
              value={name}
              setValue={setName}
            />
            <Button
              text={'Join as a viewer'}
              onPress={() => naviagateToViewer()}
            />
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
