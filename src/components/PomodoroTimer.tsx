import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Dimensions,
  Platform
} from 'react-native';
import { X, Play, Pause, RotateCcw, Check, Minus, Plus } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { GoalNode } from '../types';

interface PomodoroTimerProps {
  goal: GoalNode;
  onClose: () => void;
  onComplete: (completed: boolean) => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ goal, onClose, onComplete }) => {
  const [initialDuration, setInitialDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a sound or notify if possible
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialDuration * 60);
  };

  const increaseTime = () => {
    if (!isActive) {
      const newDuration = initialDuration + 5;
      setInitialDuration(newDuration);
      setTimeLeft(newDuration * 60);
    }
  };

  const decreaseTime = () => {
    if (!isActive && initialDuration > 5) {
      const newDuration = initialDuration - 5;
      setInitialDuration(newDuration);
      setTimeLeft(newDuration * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (25 * 60 - timeLeft) / (25 * 60);

  return (
    <Modal transparent visible animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <Text style={styles.goalLabel}>CURRENT TASK</Text>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          
          <View style={styles.timerContainer}>
            <View style={styles.timerWrapper}>
              <TouchableOpacity 
                onPress={decreaseTime} 
                disabled={isActive || initialDuration <= 5}
                style={[styles.adjustButton, (isActive || initialDuration <= 5) && styles.disabledButton]}
              >
                <Minus size={24} color={Colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.timerCircle}>
                  <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              </View>

              <TouchableOpacity 
                onPress={increaseTime} 
                disabled={isActive}
                style={[styles.adjustButton, isActive && styles.disabledButton]}
              >
                <Plus size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
              <RotateCcw size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.mainButton, { backgroundColor: isActive ? Colors.error : Colors.secondary }]} 
              onPress={toggleTimer}
            >
              {isActive ? <Pause size={32} color="#fff" /> : <Play size={32} color="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={() => onComplete(true)}>
              <Check size={28} color={Colors.secondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.finishSession} onPress={() => onComplete(false)}>
              <Text style={styles.finishSessionText}>End Session Early</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: Dimensions.get('window').width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  timerContainer: {
    marginBottom: 40,
  },
  timerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.text,
  },
  adjustButton: {
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 50,
  },
  disabledButton: {
    opacity: 0.3,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    marginBottom: 32,
  },
  controlButton: {
    padding: 8,
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  finishSession: {
      paddingVertical: 12,
  },
  finishSessionText: {
      color: Colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
  }
});

export default PomodoroTimer;
