import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Goal, GoalNode, ProgressSnapshot } from '../types';

const getApiUrl = () => {    
    // For Expo development, use the backend URL from environment
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (backendUrl) {
        // Ensure the URL has the correct format
        const cleanUrl = backendUrl.replace(/\/+$/, ''); // Remove trailing slashes
        return `${cleanUrl}/api/goals`;
    }
    throw new Error('Backend URL not configured. Please set EXPO_PUBLIC_BACKEND_URL in your .env file and restart the app.'); 
};

const API_URL = getApiUrl();
const HISTORY_KEY = 'ascend_progress_history';

export const loadGoals = async (): Promise<Goal[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (e) {
    console.error("Failed to load goals", e);
    return [];
  }
};

export const saveGoals = async (goals: Goal[]): Promise<void> => {
   // No-op or deprecated for server-based approach, but keeping for type safety if used elsewhere
   console.warn("saveGoals is deprecated in server mode");
};

export const addGoal = async (goal: Goal): Promise<Goal> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goal),
  });
  if (!response.ok) throw new Error('Failed to add goal');
  return await response.json();
};

export const updateGoal = async (goal: Goal): Promise<Goal> => {
  const response = await fetch(`${API_URL}/${goal.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goal),
  });
  if (!response.ok) throw new Error('Failed to update goal');
  return await response.json();
};

export const deleteGoal = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete goal');
};

export const reorderGoals = async (reorderedGoals: Goal[]): Promise<void> => {
  const response = await fetch(`${API_URL}/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reorderedGoals),
  });
  if (!response.ok) throw new Error('Failed to reorder goals');
};

export const loadHistory = async (): Promise<ProgressSnapshot[]> => {
  try {
    const saved = await AsyncStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [{ timestamp: Date.now(), progress: 0, total: 0, completed: 0 }];
  } catch {
    return [];
  }
};

export const saveHistory = async (snapshot: ProgressSnapshot) => {
  const history = await loadHistory();
  const last = history[history.length - 1];
  const now = Date.now();
  
  if (!last || (now - last.timestamp > 60000) || Math.abs(last.progress - snapshot.progress) > 1) {
    const newHistory = [...history, snapshot].slice(-50);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  }
};

export const createGoal = (title: string, parentId: string | null = null, description?: string): Goal => {
  return {
    id: uuidv4(), // Client-side ID (may be replaced by server)
    title,
    description,
    parentId,
    progress: 0,
    isCompleted: false,
    createdAt: Date.now(),
    expanded: true,
  };
};

export const buildGoalTree = (goals: Goal[]): GoalNode[] => {
  const goalMap = new Map<string, GoalNode>();
  
  goals.forEach(g => {
    goalMap.set(g.id, {
      ...g,
      children: [],
      computedProgress: g.progress,
      isLeaf: true
    });
  });

  const roots: GoalNode[] = [];

  goals.forEach(g => {
    const node = goalMap.get(g.id)!;
    if (g.parentId && goalMap.has(g.parentId)) {
      const parent = goalMap.get(g.parentId)!;
      parent.children.push(node);
      parent.isLeaf = false;
    } else {
      roots.push(node);
    }
  });

  const calculateNodeProgress = (node: GoalNode): number => {
    if (node.children.length === 0) {
      return node.isCompleted ? 100 : node.progress;
    }
    
    const totalProgress = node.children.reduce((acc, child) => acc + calculateNodeProgress(child), 0);
    const avg = totalProgress / node.children.length;
    node.computedProgress = avg;
    return avg;
  };

  roots.forEach(calculateNodeProgress);
  return roots;
};

export const flattenGoalTree = (nodes: GoalNode[], depth = 0): (GoalNode & { depth: number })[] => {
  return nodes.reduce((acc, node) => {
    acc.push({ ...node, depth });
    if (node.children && node.children.length > 0 && node.expanded) {
      acc.push(...flattenGoalTree(node.children, depth + 1));
    }
    return acc;
  }, [] as (GoalNode & { depth: number })[]);
};

