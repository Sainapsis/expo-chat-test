import React from 'react';
import { Modal, View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { User } from '@/types/types';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  users: User[];
  onSelectUser: (userId: string) => void;
};

export function UserSelectionModal({ isVisible, onClose, users, onSelectUser }: Props) {
  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <ThemedView style={styles.modalContainer}>
        <ThemedView style={styles.modalContent}>
          <ThemedText type="title" style={styles.title}>Select User</ThemedText>
          {users.map((user) => (
            <TouchableOpacity key={user.id} onPress={() => onSelectUser(user.id)} style={styles.userItem}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <ThemedText>{user.name}</ThemedText>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText>Close</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  title: {
    marginBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
});