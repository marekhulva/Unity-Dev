import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  Keyboard,
} from 'react-native';
import { Clock, X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TimePickerInputProps {
  value: string; // Time in HH:MM format
  onChange: (time: string) => void;
  label?: string;
  disabled?: boolean;
}

export const TimePickerInput: React.FC<TimePickerInputProps> = ({
  value = '09:00',
  onChange,
  label,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
    } catch {
      return '9:00 AM';
    }
  };

  // Convert time string to Date object for DateTimePicker
  const getDateFromTime = (timeString: string): Date => {
    const [hours = '9', minutes = '0'] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    date.setSeconds(0);
    return date;
  };

  // Handle time change from DateTimePicker
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setIsOpen(false);
    }
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(false);
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        style={[
          styles.timeButton,
          disabled && styles.disabled,
          isOpen && styles.timeButtonActive
        ]}
        onPress={() => {
          if (!disabled) {
            Keyboard.dismiss();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
      >
        <Clock size={16} color="#FFD700" />
        <Text style={styles.timeText}>{formatTime(value)}</Text>
      </Pressable>

      {isOpen && !disabled && (
        Platform.OS === 'web' ? (
          // Web-only: HTML input
          <View style={styles.pickerContainer}>
            <input
              type="time"
              value={value}
              onChange={(e) => {
                const newTime = e.target.value;
                onChange(newTime);
                setIsOpen(false);
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#FFD700',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '16px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                width: '100%',
              }}
              autoFocus
            />
          </View>
        ) : Platform.OS === 'ios' ? (
          // iOS: Modal with picker
          <Modal
            visible={isOpen}
            transparent
            animationType="slide"
            onRequestClose={handleCancel}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={handleCancel}
            >
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                  <Pressable onPress={handleCancel} style={styles.modalButton}>
                    <X size={20} color="#888" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Text style={styles.modalTitle}>Select Time</Text>
                  <Pressable onPress={handleDone} style={styles.modalButton}>
                    <Text style={styles.doneButtonText}>Done</Text>
                    <Check size={20} color="#FFD700" />
                  </Pressable>
                </View>
                <DateTimePicker
                  value={getDateFromTime(value)}
                  mode="time"
                  is24Hour={false}
                  display="spinner"
                  onChange={handleTimeChange}
                  textColor="#FFD700"
                  themeVariant="dark"
                  style={styles.iosPicker}
                />
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          // Android: Native picker (default dialog)
          <DateTimePicker
            value={getDateFromTime(value)}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
            textColor="#FFD700"
            accentColor="#FFD700"
            themeVariant="dark"
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: 'rgba(255,215,0,0.5)',
  },
  disabled: {
    opacity: 0.5,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  pickerContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  // iOS Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  doneButtonText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
  iosPicker: {
    height: 216,
    backgroundColor: 'transparent',
  },
});