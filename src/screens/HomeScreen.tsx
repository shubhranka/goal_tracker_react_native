import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  TouchableOpacity,
  TextInput,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, List, Calendar, LayoutGrid, Edit3, Briefcase } from 'lucide-react-native';
import { 
  loadGoals, 
  addGoal, 
  updateGoal, 
  deleteGoal, 
  createGoal, 
  buildGoalTree, 
  flattenGoalTree,
  loadHistory,
  saveHistory
} from '../services/goalService';
import { suggestSubgoals } from '../services/geminiService';
import { Goal, GoalNode, ProgressSnapshot } from '../types';
import GoalItem from '../components/GoalItem';
import CommandBar from '../components/CommandBar';
import StatsViz from '../components/StatsViz';
import PomodoroTimer from '../components/PomodoroTimer';
import { Colors } from '../constants/Colors';

const HomeScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  const [appMode, setAppMode] = useState<'edit' | 'work'>('edit');
  const [pomodoroGoal, setPomodoroGoal] = useState<GoalNode | null>(null);
  const [history, setHistory] = useState<ProgressSnapshot[]>([]);

  const { data: goals = [] } = useQuery<Goal[], Error>({
    queryKey: ['goals'],
    queryFn: loadGoals,
  });

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const goalTree = useMemo(() => {
    let nodes: GoalNode[] = [];

    if (viewMode === 'today') {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;
      
      const todaysGoals = goals.filter(g => {
        // In Work Mode, we will filter completed items AFTER building the tree
        // so that we can check computedProgress (e.g. parent with all completed children)
        
        const isScheduledToday = g.scheduledDays?.includes(today.getDay());
        const isOneTimeToday = g.oneTimeTask && g.oneTimeTask >= todayStart && g.oneTimeTask < todayEnd;
        const isUnscheduledOneTime = g.oneTimeTask === undefined && g.scheduledDays === undefined;
        
        return isScheduledToday || isOneTimeToday || isUnscheduledOneTime;
      });
      nodes = buildGoalTree(todaysGoals);
    } else {
      nodes = buildGoalTree(goals);
    }

    if (appMode === 'work' && viewMode === 'today') {
      const filterCompleted = (list: GoalNode[]): GoalNode[] => {
        return list.reduce((acc, node) => {
          // If the node itself is fully complete (or all children are complete), hide it
          if (node.computedProgress === 100) {
            return acc;
          }
          
          const filteredChildren = filterCompleted(node.children);
          
          acc.push({
            ...node,
            children: filteredChildren
          });
          return acc;
        }, [] as GoalNode[]);
      };
      return filterCompleted(nodes);
    }

    return nodes;
  }, [goals, viewMode, appMode]);

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return goalTree;
    const filterNodes = (nodes: GoalNode[]): GoalNode[] => {
      return nodes.reduce((acc, node) => {
        const matches = node.title.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredChildren = filterNodes(node.children);
        if (matches || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren, expanded: true });
        }
        return acc;
      }, [] as GoalNode[]);
    };
    return filterNodes(goalTree);
  }, [goalTree, searchQuery]);

  const visibleGoals = useMemo(() => flattenGoalTree(filteredTree), [filteredTree]);

  const stats = useMemo(() => {
    const getAllNodes = (nodes: GoalNode[]): GoalNode[] => {
        let all: GoalNode[] = [];
        nodes.forEach(n => {
            all.push(n);
            if (n.children.length > 0) all = [...all, ...getAllNodes(n.children)];
        });
        return all;
    };
    const allNodes = getAllNodes(buildGoalTree(goals));
    const total = allNodes.length;
    const completed = allNodes.filter(n => n.computedProgress === 100).length;
    const roots = buildGoalTree(goals);
    const overallProgress = roots.length === 0 
        ? 0 
        : roots.reduce((acc, node) => acc + node.computedProgress, 0) / roots.length;
    return { total, completed, overallProgress };
  }, [goals]);

  // Mutations
  const addMutation = useMutation({
    mutationFn: addGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const updateMutation = useMutation({
    mutationFn: updateGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  // Handlers
  const handleAddGoal = async (title: string, withAI: boolean) => {
    const parentId = selectedId;
    const tempGoal = createGoal(title, parentId);
    
    try {
        const createdGoal = await addMutation.mutateAsync(tempGoal);
        setSelectedId(createdGoal.id);

        if (withAI) {
            const context = parentId ? goals.find(g => g.id === parentId)?.title : '';
            const subgoals = await suggestSubgoals(title, context ? `Subgoal of: ${context}` : undefined);
            subgoals.forEach(sg => addMutation.mutate(createGoal(sg.title, createdGoal.id, sg.description)));
        }
    } catch (error) {
        console.error("Failed to add goal", error);
    }
  };

  const handleUpdateProgress = (id: string, progress: number) => {
    const goal = goals.find(g => g.id === id);
    if (goal) updateMutation.mutate({ ...goal, progress, isCompleted: progress === 100 });
  };

  const handleToggleComplete = (id: string) => {
    const target = goals.find(g => g.id === id);
    if (!target) return;
    const newStatus = !target.isCompleted;

    const getDescendantIds = (rootId: string, allGoals: Goal[]): string[] => {
        const children = allGoals.filter(g => g.parentId === rootId);
        return [...children.map(c => c.id), ...children.flatMap(c => getDescendantIds(c.id, allGoals))];
    };

    const idsToUpdate = [id, ...getDescendantIds(id, goals)];
    goals.filter(g => idsToUpdate.includes(g.id)).forEach(goal => {
        updateMutation.mutate({
            ...goal,
            isCompleted: newStatus,
            progress: newStatus ? 100 : 0,
            completedAt: newStatus ? Date.now() : undefined,
        });
    });
  };

  const handleGoalClick = (node: GoalNode) => {
    if (appMode === 'work') setPomodoroGoal(node);
  };

  const handlePomodoroComplete = (completed: boolean) => {
    if (!pomodoroGoal) return;
    if (completed) handleToggleComplete(pomodoroGoal.id);
    else handleUpdateProgress(pomodoroGoal.id, Math.min(pomodoroGoal.progress + 25, 99));
    setPomodoroGoal(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      <View style={styles.header}>
        <View>
            <Text style={styles.headerTitle}>ASCEND_v1.0</Text>
            <Text style={styles.headerSubtitle}>~/goals/{viewMode}</Text>
        </View>
        <TouchableOpacity 
            onPress={() => setAppMode(appMode === 'edit' ? 'work' : 'edit')}
            style={[styles.modeButton, appMode === 'work' && styles.workModeButton]}
        >
            {appMode === 'edit' ? <Edit3 size={18} color="#fff" /> : <Briefcase size={18} color="#fff" />}
            <Text style={styles.modeButtonText}>{appMode === 'edit' ? 'Edit' : 'Work'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={visibleGoals}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <StatsViz 
                total={stats.total} 
                completed={stats.completed} 
                overallProgress={stats.overallProgress} 
                history={history}
            />

            <View style={styles.searchBar}>
                <Search size={18} color={Colors.textSecondary} />
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Filter goals..." 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.viewToggles}>
                <TouchableOpacity 
                    onPress={() => setViewMode('today')}
                    style={[styles.toggle, viewMode === 'today' && styles.activeToggle]}
                >
                    <Calendar size={16} color={viewMode === 'today' ? '#fff' : Colors.textSecondary} />
                    <Text style={[styles.toggleText, viewMode === 'today' && styles.activeToggleText]}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setViewMode('all')}
                    style={[styles.toggle, viewMode === 'all' && styles.activeToggle]}
                >
                    <List size={16} color={viewMode === 'all' ? '#fff' : Colors.textSecondary} />
                    <Text style={[styles.toggleText, viewMode === 'all' && styles.activeToggleText]}>All Goals</Text>
                </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <GoalItem 
            node={item} 
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToggleExpand={(id) => {
                const goal = goals.find(g => g.id === id);
                if (goal) updateMutation.mutate({ ...goal, expanded: !goal.expanded });
            }}
            onDelete={(id) => deleteMutation.mutate(id)}
            onUpdateProgress={handleUpdateProgress}
            onToggleComplete={handleToggleComplete}
            onMove={() => {}} // Mobile reorder simplified for now
            onSetReminder={(id, ts) => {
                const goal = goals.find(g => g.id === id);
                if (goal) updateMutation.mutate({ ...goal, reminder: ts });
            }}
            onToggleScheduledDay={(id, day) => {
                const goal = goals.find(g => g.id === id);
                if (goal) {
                    let days = goal.scheduledDays ? [...goal.scheduledDays] : [];
                    days = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
                    updateMutation.mutate({ ...goal, scheduledDays: days });
                }
            }}
            onSetOneTimeTask={(id, ts) => {
                const goal = goals.find(g => g.id === id);
                if (goal) updateMutation.mutate({ ...goal, oneTimeTask: ts });
            }}
            onGoalClick={handleGoalClick}
            appMode={appMode}
            viewMode={viewMode}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      {appMode === 'edit' && (
        <CommandBar 
            onAddGoal={handleAddGoal} 
            selectedParentTitle={selectedId ? goals.find(g => g.id === selectedId)?.title || null : null} 
        />
      )}

      {pomodoroGoal && (
          <PomodoroTimer 
            goal={pomodoroGoal} 
            onClose={() => setPomodoroGoal(null)} 
            onComplete={handlePomodoroComplete} 
          />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  workModeButton: {
    backgroundColor: Colors.secondary,
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listHeader: {
    padding: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  viewToggles: {
    flexDirection: 'row',
    gap: 12,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeToggle: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  activeToggleText: {
    color: '#fff',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  }
});

export default HomeScreen;
