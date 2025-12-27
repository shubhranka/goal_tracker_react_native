import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../constants/Colors';
import { ProgressSnapshot } from '../types';

interface StatsVizProps {
  total: number;
  completed: number;
  overallProgress: number;
  history: ProgressSnapshot[];
}

const StatsViz: React.FC<StatsVizProps> = ({ total, completed, overallProgress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>PROGRESS</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(overallProgress)}%</Text>
          <Text style={styles.statLabel}>Overall</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completed}/{total}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
      </View>
      
      <View style={styles.progressBarBg}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${overallProgress}%` }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b', // slate-800
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    color: '#64748b', // slate-500
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.brand,
    borderRadius: 4,
  }
});

export default StatsViz;
