import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../constants/Colors';
import { loadHistory, loadGoals } from '../services/goalService';
import { ProgressSnapshot, Goal } from '../types';

const VisualizationScreen: React.FC = () => {
  const [history, setHistory] = useState<ProgressSnapshot[]>([]);

  const { data: goals = [] } = useQuery<Goal[], Error>({
    queryKey: ['goals'],
    queryFn: loadGoals,
  });

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const longestStreak = useMemo(() => {
    if (goals.length === 0) return 0;

    // Get all completed dates
    const completedDates = goals
      .filter(g => g.isCompleted && g.completedAt)
      .map(g => {
        const date = new Date(g.completedAt!);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      })
      .sort((a, b) => a - b); // Ascending order

    if (completedDates.length === 0) return 0;

    // Remove duplicates
    const uniqueDates = Array.from(new Set(completedDates));

    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate = -1;

    uniqueDates.forEach((date) => {
        if (lastDate === -1) {
            currentStreak = 1;
        } else {
            const diff = date - lastDate;
            // 24 hours in millis = 86400000. Allow a bit of leeway for dst etc if needed, but strict day check is safest
            // Actually we normalized to midnight above, so diff should be exactly 86400000 for consecutive days
            if (diff === 86400000) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
        }
        maxStreak = Math.max(maxStreak, currentStreak);
        lastDate = date;
    });

    return maxStreak;
  }, [goals]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Visualizations</Text>
        
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Progress History</Text>
            <View style={styles.chartPlaceholder}>
                {history.map((point, i) => (
                    <View key={i} style={styles.barContainer}>
                        <View 
                            style={[
                                styles.bar, 
                                { height: `${point.progress}%` }
                            ]} 
                        />
                        <Text style={styles.barLabel}>{new Date(point.timestamp).getDate()}</Text>
                    </View>
                ))}
                {history.length === 0 && (
                    <Text style={styles.noDataText}>No history data available yet.</Text>
                )}
            </View>
        </View>

        <View style={styles.statsGrid}>
            <View style={styles.smallCard}>
                <Text style={styles.smallCardLabel}>Longest Streak</Text>
                <Text style={styles.smallCardValue}>{longestStreak} Days</Text>
            </View>
            <View style={styles.smallCard}>
                <Text style={styles.smallCardLabel}>Total Completed</Text>
                <Text style={styles.smallCardValue}>
                    {goals.filter(g => g.isCompleted).length}
                </Text>
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  chartPlaceholder: {
    height: 200,
    flexDirection: 'row',
    alignItems: 'bottom',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 8,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  noDataText: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 80,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  smallCardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  smallCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
});

export default VisualizationScreen;
