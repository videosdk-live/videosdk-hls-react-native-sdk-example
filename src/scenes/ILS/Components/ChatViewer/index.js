import React, {useRef, useState} from 'react';
import {
  View,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import TextInputContainer from './TextInput';
import {useMeeting, usePubSub} from '@videosdk.live/react-native-sdk';
import Hyperlink from 'react-native-hyperlink';
import moment from 'moment';
import colors from '../../../../styles/colors';
import {convertRFValue} from '../../../../styles/spacing';

const ChatViewer = () => {
  const mpubsub = usePubSub('CHAT', {});
  const mMeeting = useMeeting({});
  const localParticipantId = mMeeting?.localParticipant?.id;

  const [message, setMessage] = useState('');
  const flatListRef = useRef();

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({animated: true});
  };

  const sendMessage = async () => {
    if (!message) return;
    try {
      await mpubsub.publish(message, {persist: true});
      setMessage('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to publish chat message:', err);
    }
  };

  return (
    <View style={{flex: 1}}>
      <View style={{marginTop: 12, alignItems: 'center'}}>
        <Text
          style={{
            fontSize: 18,
            color: colors.primary[100],
            fontWeight: 'bold',
          }}>
          Chat
        </Text>
      </View>
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === 'android' ? undefined : 'position'}
        style={{flex: 1, justifyContent: 'flex-end'}}>
        {mpubsub.messages ? (
          <FlatList
            ref={flatListRef}
            data={mpubsub.messages}
            showsVerticalScrollIndicator={false}
            keyExtractor={item => item.id}
            renderItem={({item}) => {
              const {message: text, senderId, timestamp, senderName} = item;
              const localSender = localParticipantId === senderId;
              const time = moment(timestamp).format('hh:mm a');
              return (
                <View
                  style={{
                    backgroundColor: colors.primary[600],
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    marginVertical: 6,
                    borderRadius: 10,
                    marginHorizontal: 12,
                    alignSelf: localSender ? 'flex-end' : 'flex-start',
                  }}>
                  <Text
                    style={{
                      fontSize: convertRFValue(12),
                      color: '#9A9FA5',
                      fontWeight: 'bold',
                    }}>
                    {localSender ? 'You' : senderName}
                  </Text>
                  <Hyperlink
                    linkDefault={true}
                    onPress={url => Linking.openURL(url)}
                    linkStyle={{color: 'blue'}}>
                    <Text
                      style={{fontSize: convertRFValue(14), color: 'white'}}>
                      {text}
                    </Text>
                  </Hyperlink>
                  <Text
                    style={{
                      color: 'grey',
                      fontSize: convertRFValue(10),
                      alignSelf: 'flex-end',
                      marginTop: 4,
                    }}>
                    {time}
                  </Text>
                </View>
              );
            }}
            style={{marginVertical: 5}}
          />
        ) : null}
        <View style={{paddingHorizontal: 12}}>
          <TextInputContainer
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatViewer;
