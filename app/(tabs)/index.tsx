import { StyleSheet, FlatList, SafeAreaView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { useChats } from '@/hooks/useChats';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const chats = useChats();
  const router = useRouter();

  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Chats</ThemedText>
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleChatPress(item.id)}>
              <ThemedView style={styles.chatItem}>
                <ThemedText type="defaultSemiBold">{item.userName}</ThemedText>
                <ThemedText>{item.lastMessage}</ThemedText>
                <ThemedText style={styles.timestamp}>{item.timestamp}</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          )}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white', // or use your theme color
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  title: {
    marginBottom: 16,
  },
  chatItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});
