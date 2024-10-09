import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, SafeAreaView, FlatList, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Message } from '@/types/types';
import { useState } from 'react';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const chatId = Array.isArray(id) ? id[0] : id;
  const { messages, sendMessage, currentUser } = useChatMessages(chatId);
  const [inputMessage, setInputMessage] = useState('');

  const renderMessage = ({ item }: { item: Message | undefined }) => {
    if (!item) {
      return (
        <ThemedView style={styles.placeholderContainer}>
          <ThemedText style={styles.placeholderText}>Message unavailable</ThemedText>
        </ThemedView>
      );
    }

    const senderName = item.sender?.name || 'Unknown';
    const messageBody = item.body || 'No message content';

    return (
      <ThemedView style={[
        styles.messageContainer,
        item.sender?.id === currentUser.id ? styles.sentMessage : styles.receivedMessage
      ]}>
        <ThemedText style={styles.sender}>{senderName}</ThemedText>
        <ThemedText>{messageBody}</ThemedText>
      </ThemedView>
    );
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ThemedText type="title" style={styles.title}>Chat {id}</ThemedText>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          inverted
        />
        <ThemedView style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type a message..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
            <ThemedText style={styles.sendButtonText}>Send</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  title: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  messageList: {
    paddingHorizontal: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  sender: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  placeholderContainer: {
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignSelf: 'center',
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
});