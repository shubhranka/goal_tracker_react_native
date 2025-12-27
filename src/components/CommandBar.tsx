import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Text
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Sparkles } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

interface CommandBarProps {
  onAddGoal: (title: string, withAI: boolean) => void;
  selectedParentTitle: string | null;
}

const CommandBar: React.FC<CommandBarProps> = ({ onAddGoal, selectedParentTitle }) => {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();

  const handleAdd = (withAI: boolean) => {
    if (text.trim()) {
      onAddGoal(text.trim(), withAI);
      setText('');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}
    >
      {selectedParentTitle && (
        <View style={styles.parentIndicator}>
          <Text style={styles.parentText}>Adding subgoal to: {selectedParentTitle}</Text>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a new goal..."
          value={text}
          onChangeText={setText}
          placeholderTextColor={Colors.textSecondary}
        />
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            onPress={() => handleAdd(true)} 
            style={[styles.actionButton, styles.aiButton]}
          >
            <Sparkles size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleAdd(false)} 
            style={[styles.actionButton, styles.plusButton]}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  parentIndicator: {
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  parentText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiButton: {
    backgroundColor: Colors.primary,
  },
  plusButton: {
    backgroundColor: Colors.secondary,
  }
});

export default CommandBar;
