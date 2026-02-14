import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { X } from 'lucide-react-native';

interface DebugLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const DebugPanel = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      const message = args.join(' ');
      
      // Only capture our debug logs (with emoji markers)
      if (message.includes('[ONBOARDING]') || 
          message.includes('[SUPABASE]') || 
          message.includes('[STEP') ||
          message.includes('[AUDIO]') ||
          message.includes('[PHOTO]') ||
          message.includes('[CAMERA]') ||
          message.includes('[POST]') ||
          message.includes('[UI]') ||
          message.includes('[PROFILE]') ||
          message.includes('[AVATAR]') ||
          message.includes('[AUTH]') ||
          message.includes('[STORAGE]')) {
        
        let type: DebugLog['type'] = 'info';
        if (message.includes('🟢') || message.includes('✅')) type = 'success';
        if (message.includes('🟡')) type = 'warning';
        if (message.includes('🔴') || message.includes('❌')) type = 'error';
        
        setLogs(prev => [...prev.slice(-20), {
          timestamp: new Date().toLocaleTimeString(),
          message: message.replace(/🟦|🟢|🟡|🔴|✅|❌|🎉|🔵/g, '').trim(),
          type
        }]);
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.join(' ');
      if (message.includes('[')) {
        setLogs(prev => [...prev.slice(-20), {
          timestamp: new Date().toLocaleTimeString(),
          message,
          type: 'error'
        }]);
      }
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.join(' ');
      if (message.includes('[')) {
        setLogs(prev => [...prev.slice(-20), {
          timestamp: new Date().toLocaleTimeString(),
          message,
          type: 'warning'
        }]);
      }
    };

    // Cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <Pressable 
        style={styles.minimizedContainer}
        onPress={() => setIsMinimized(false)}
      >
        <Text style={styles.minimizedText}>Debug ({logs.length})</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Console</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => setLogs([])} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
          <Pressable onPress={() => setIsMinimized(true)} style={styles.minimizeButton}>
            <Text style={styles.minimizeText}>_</Text>
          </Pressable>
          <Pressable onPress={() => setIsVisible(false)} style={styles.closeButton}>
            <X size={16} color="#FFF" />
          </Pressable>
        </View>
      </View>
      
      <ScrollView 
        style={styles.logsContainer}
        showsVerticalScrollIndicator={true}
        ref={ref => ref?.scrollToEnd({ animated: true })}
      >
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>Waiting for debug logs...</Text>
        ) : (
          logs.map((log, index) => (
            <View key={index} style={[styles.logItem, styles[`log${log.type}`]]}>
              <Text style={styles.timestamp}>{log.timestamp}</Text>
              <Text style={styles.message}>{log.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 10,
    right: 10,
    maxHeight: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10000,
  },
  minimizedContainer: {
    position: 'absolute',
    bottom: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10000,
  },
  minimizedText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  clearText: {
    color: '#FFF',
    fontSize: 12,
  },
  minimizeButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  minimizeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  logsContainer: {
    maxHeight: 250,
    padding: 10,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
  },
  logItem: {
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  loginfo: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  logsuccess: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  logwarning: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  logerror: {
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 2,
  },
  message: {
    fontSize: 11,
    color: '#FFF',
    fontFamily: 'monospace',
  },
});