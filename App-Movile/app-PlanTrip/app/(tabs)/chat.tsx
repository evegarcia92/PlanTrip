import { StyleSheet, SafeAreaView } from 'react-native';
import ChatScreenComponent from '../../components/ChatScreen';
import { Theme } from '@/constants/theme';

export default function ChatTab() {
  return (
    <SafeAreaView style={styles.container}>
      <ChatScreenComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bgEnd }
});

