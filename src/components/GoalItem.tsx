import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Platform 
} from 'react-native';
import { 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  CheckCircle2, 
  Circle,
  X,
  ArrowUp,
  ArrowDown,
  Bell,
  BellRing,
  Calendar,
  Sparkles
} from 'lucide-react-native';
import { GoalNode } from '../types';
import { generateMotivation } from '../services/geminiService';
import { Colors } from '../constants/Colors';

interface GoalItemProps {
  node: GoalNode & { depth: number };
  isSelected?: boolean;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onToggleExpand: (id:string) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onToggleComplete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onSetReminder: (id: string, timestamp: number | undefined) => void;
  onToggleScheduledDay: (id: string, day: number) => void;
  onSetOneTimeTask: (id: string, date: number | undefined) => void;
  onGoalClick?: (goal: GoalNode) => void;
  appMode?: 'edit' | 'work';
  viewMode?: 'today' | 'all';
}

const GoalItem: React.FC<GoalItemProps> = ({ 
  node, 
  isSelected,
  selectedId, 
  onSelect,
  onToggleExpand, 
  onDelete,
  onUpdateProgress,
  onToggleComplete,
  onMove,
  onSetReminder,
  onToggleScheduledDay,
  onSetOneTimeTask,
  onGoalClick,
  appMode = 'edit',
  viewMode = 'today'
}) => {
  const [motivation, setMotivation] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [progressAnim] = useState(new Animated.Value(node.computedProgress));

  const hasChildren = node.children.length > 0;
  const isCompleted = node.computedProgress === 100;
  const active = isSelected || (selectedId === node.id);
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: node.computedProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [node.computedProgress]);

  useEffect(() => {
    if (confirmDelete) {
        const timer = setTimeout(() => setConfirmDelete(false), 3000);
        return () => clearTimeout(timer);
    }
  }, [confirmDelete]);

  const handleGetMotivation = async () => {
    const msg = await generateMotivation(node.title, node.computedProgress);
    setMotivation(msg);
    setTimeout(() => setMotivation(null), 5000);
  };

  const handleRowClick = () => {
      if (appMode === 'work' && onGoalClick && !isCompleted && viewMode === 'today') {
          onGoalClick(node);
      } else {
          onSelect(node.id);
      }
  };

  const handleDeleteClick = () => {
      if (confirmDelete) {
          onDelete(node.id);
      } else {
          setConfirmDelete(true);
      }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={handleRowClick}
        style={[
          styles.row, 
          { marginLeft: node.depth * 20 },
          active && styles.activeRow,
          appMode === 'work' && !isCompleted && styles.workRow
        ]}
      >
        {/* Active Marker */}
        {active && <View style={styles.activeMarker} />}

        {/* Expand Toggle */}
        <TouchableOpacity 
          onPress={() => onToggleExpand(node.id)}
          style={[styles.iconButton, (!hasChildren || appMode === 'work') && styles.invisible]}
        >
          {node.expanded ? <ChevronDown size={18} color={Colors.textSecondary} /> : <ChevronRight size={18} color={Colors.textSecondary} />}
        </TouchableOpacity>

        {/* Checkbox */}
        <TouchableOpacity 
          onPress={() => onToggleComplete(node.id)}
          style={[styles.iconButton, appMode === 'work' && styles.invisible]}
        >
          {isCompleted ? <CheckCircle2 size={22} color={Colors.secondary} /> : <Circle size={22} color={Colors.border} />}
        </TouchableOpacity>

        {/* Title & Progress */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text 
              style={[
                styles.title, 
                isCompleted && styles.completedTitle,
                active && styles.activeTitle
              ]}
              numberOfLines={1}
            >
              {node.title}
            </Text>
            
            {node.reminder && node.reminder > Date.now() && (
                 <View style={styles.badge}>
                     <BellRing size={10} color={Colors.primary} />
                 </View>
            )}
          </View>
          
          {!isCompleted && (
            <View style={styles.progressContainer}>
              <Animated.View 
                style={[
                  styles.progressBar, 
                  { width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%']
                    }) 
                  }
                ]} 
              />
            </View>
          )}
        </View>

        {/* Actions Menu (Simplify for mobile, maybe use long press or a small button) */}
        <View style={styles.actions}>
            {active && appMode === 'edit' && !confirmDelete && (
                <TouchableOpacity onPress={handleGetMotivation} style={styles.aiButton}>
                    <Sparkles size={16} color={Colors.primary} />
                </TouchableOpacity>
            )}
            {active && appMode === 'edit' && (
                <TouchableOpacity onPress={handleDeleteClick} style={styles.deleteButton}>
                    {confirmDelete ? <X size={18} color={Colors.error} /> : <Trash2 size={18} color={Colors.textSecondary} />}
                </TouchableOpacity>
            )}
        </View>
      </TouchableOpacity>

      {motivation && (
          <View style={[styles.motivationBubble, { marginLeft: node.depth * 20 + 40 }]}>
              <Text style={styles.motivationText}>{motivation}</Text>
          </View>
      )}

      {confirmDelete && (
          <View style={[styles.confirmDeleteBar, { marginLeft: node.depth * 20 + 40 }]}>
              <Text style={styles.confirmDeleteText}>Delete this goal and all subgoals?</Text>
              <TouchableOpacity onPress={() => onDelete(node.id)} style={styles.confirmButton}>
                  <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
          </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeRow: {
    backgroundColor: '#eff6ff', // bg-blue-50
    borderColor: '#bfdbfe', // border-blue-200
  },
  workRow: {
    backgroundColor: '#f0fdf4', // bg-green-50
    borderColor: '#bbf7d0', // border-green-200
  },
  activeMarker: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -12,
    width: 4,
    height: 24,
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  iconButton: {
    padding: 4,
    marginRight: 4,
  },
  invisible: {
    opacity: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  activeTitle: {
    color: Colors.primary,
  },
  completedTitle: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  progressContainer: {
    height: 3,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
    width: '90%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  badge: {
    marginLeft: 6,
    backgroundColor: '#dbeafe',
    padding: 2,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  motivationBubble: {
    backgroundColor: Colors.sidebar,
    padding: 10,
    borderRadius: 8,
    marginTop: -4,
    marginBottom: 8,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  motivationText: {
    color: '#fff',
    fontSize: 12,
    fontStyle: 'italic',
  },
  confirmDeleteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginTop: -4,
    marginBottom: 8,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  confirmDeleteText: {
    fontSize: 12,
    color: Colors.error,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default GoalItem;
