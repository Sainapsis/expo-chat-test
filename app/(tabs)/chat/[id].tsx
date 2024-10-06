import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Message } from '@/types/chat';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { messages } = useChatMessages(id);

  const renderMessage = ({ item }: { item: Message }) => (
    <ThemedView style={styles.messageContainer}>
      <ThemedText style={styles.sender}>{item.senderName}</ThemedText>
      <ThemedText>{item.body}</ThemedText>
    </ThemedView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Chat {id}</ThemedText>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
  },
  messageList: {
    width: '100%',
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
});