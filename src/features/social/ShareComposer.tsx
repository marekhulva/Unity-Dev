import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, Image, Platform, Dimensions, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { GlassSurface } from '../../ui/GlassSurface';
import { useStore } from '../../state/rootStore';
import { Visibility } from '../../state/slices/socialSlice';
import { getVisibilityLabel, getVisibilityIcon } from '../../utils/visibilityMapper';
import { FEED_ALL } from '../circles/components/CircleSelector';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ShareComposer: React.FC = () => {
  const shareOpen = useStore(s=>s.shareOpen);
  const draft = useStore(s=>s.shareDraft);
  const close = useStore(s=>s.closeShare);
  const addPost = useStore(s=>s.addPost);
  const setFeedView = useStore(s=>s.setFeedView);

  const [text, setText] = React.useState('');
  const [photoUri, setPhotoUri] = React.useState<string|undefined>(undefined);
  const [recording, setRecording] = React.useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = React.useState<string|undefined>(undefined);
  const [visibility, setVisibility] = React.useState<Visibility>('followers');
  const [busy, setBusy] = React.useState(false);
  
  // Use a ref to track the text value as a workaround for web
  const textRef = React.useRef('');

  React.useEffect(()=> {
    if (shareOpen && draft) {
      // Only reset when opening, not on every render
      setText(draft?.text || (draft?.promptSeed ? draft?.promptSeed + ' ' : ''));
      setPhotoUri(draft?.photoUri);
      setAudioUri(draft?.audioUri);
      setVisibility(draft?.visibility || 'followers');
    } else if (!shareOpen) {
      // Clear when closing
      setText('');
      setPhotoUri(undefined);
      setAudioUri(undefined);
      setVisibility('followers');
    }
  }, [shareOpen, draft?.promptSeed]);

  const pickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos in Settings');
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9
      };

      // Only add presentationStyle for iOS
      if (Platform.OS === 'ios') {
        (options as any).presentationStyle = 'pageSheet';
      }

      const res = await ImagePicker.launchImageLibraryAsync(options);
      if (!res.canceled && res.assets?.[0]?.uri) {
        setPhotoUri(res.assets[0].uri);
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to pick image:', error);
    }
  };

  const startRecording = async () => {
    setBusy(true);
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
    } catch (e) {
      if (__DEV__) {
        console.warn('Audio recording error:', e);
      }
      Alert.alert('Recording Failed', 'Unable to record audio. Please try again.');
    }
    setBusy(false);
  };
  const stopRecording = async () => {
    if (!recording) return;
    setBusy(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI() || undefined;
      
      // Convert to base64 for web platform to persist across refreshes
      if (Platform.OS === 'web' && uri) {
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            if (__DEV__) console.log('ShareComposer - Audio converted to base64, length:', base64.length);
            setAudioUri(base64);
            setBusy(false);
          };
          reader.readAsDataURL(blob);
          setRecording(null);
          return; // Exit early, setBusy(false) will be called in onloadend
        } catch (error) {
          if (__DEV__) console.error('Error converting audio to base64:', error);
          setAudioUri(uri); // Fallback to blob URL
        }
      } else {
        setAudioUri(uri);
      }
    } catch (e) {
      if (__DEV__) {
        console.warn('Audio stop error:', e);
      }
      Alert.alert('Stop Recording Failed', 'Unable to stop recording. Please try again.');
    }
    setRecording(null);
    setBusy(false);
  };

  const publish = async () => {
    if (!draft) return;
    const type = draft.type;
    
    // Use the ref value which should have the latest text
    const finalText = textRef.current || text;
    
    if (__DEV__) console.log('Current text state:', text);
    if (__DEV__) console.log('Text from ref:', textRef.current);
    if (__DEV__) console.log('Draft:', draft);
    if (__DEV__) console.log('Audio URI present:', !!audioUri);
    if (__DEV__) console.log('Audio URI length:', audioUri?.length);
    if (__DEV__) console.log('Audio URI starts with data:audio:', audioUri?.startsWith('data:audio'));
    
    const content = finalText?.trim() || (type==='checkin' ? `Checked in: ${draft.actionTitle}` : '');
    
    if (__DEV__) console.log('Publishing post with content:', content);
    if (__DEV__) console.log('Text from input:', finalText);
    
    // Determine the actual type based on media
    const actualType = audioUri ? 'audio' : (photoUri ? 'photo' : type);
    
    const post = {
      type: actualType,
      visibility,
      content,
      mediaUrl: photoUri || audioUri || undefined,
      photoUri: actualType === 'photo' ? photoUri : undefined,
      audioUri: actualType === 'audio' ? audioUri : undefined,
      actionTitle: draft.actionTitle,
      goalTitle: draft.goal,
      streak: draft.streak,
      goalColor: draft.goalColor,
    };
    
    if (__DEV__) console.log('Full post object:', post);
    if (__DEV__) console.log('Post type:', post.type);
    if (__DEV__) console.log('Post audioUri:', !!post.audioUri);
    
    // Call the async addPost function to save to backend
    await addPost(post as any);

    // Fetch updated unified feed to show the new post
    const fetchUnifiedFeed = useStore.getState().fetchUnifiedFeed;
    const activeCircleId = useStore.getState().activeCircleId;
    await fetchUnifiedFeed(true, activeCircleId || FEED_ALL);

    if (__DEV__) console.log('✅ [SHARE-COMPOSER] Post published and feed refreshed');

    // show in selected tab
    setFeedView(visibility);
    close();
  };

  return (
    <Modal visible={shareOpen} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.modalContainer}>
            <GlassSurface style={styles.sheet}>
          <Text style={styles.title}>Share</Text>
          {/* Instagram-style Visibility Selector */}
          <View style={styles.row}>
            {(['private', 'circle', 'followers'] as Visibility[]).map(v => (
              <Pressable key={v} onPress={()=>setVisibility(v)} style={[styles.visPill, visibility===v && styles.visActive]}>
                <Text style={[styles.visText, visibility===v && styles.visActiveText]}>
                  {getVisibilityIcon(v)} {getVisibilityLabel(v)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Context (for check-ins) */}
          {draft?.type==='checkin' && (
            <View style={[styles.context, draft.goalColor ? { borderColor: draft.goalColor+'33' } : null]}>
              <Text style={styles.contextTitle}>{draft.actionTitle}</Text>
              {!!draft.goal && <Text style={styles.contextMeta}>{draft.goal} • 🔥 {draft.streak ?? 0}</Text>}
            </View>
          )}

          {/* Text */}
          <TextInput
            value={text}
            onChangeText={(newText) => {
              if (__DEV__) console.log('Text changed to:', newText);
              setText(newText);
              textRef.current = newText; // Also update ref
            }}
            onEndEditing={(e) => {
              if (__DEV__) console.log('End editing with text:', e.nativeEvent.text);
              setText(e.nativeEvent.text);
              textRef.current = e.nativeEvent.text;
            }}
            placeholder={draft?.promptSeed ?? "Add a note..."}
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline={true}
            numberOfLines={4}
            style={styles.input}
            autoFocus={false}
            editable={true}
            keyboardType="default"
          />

          {/* Photo preview */}
          {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} />}
          {/* Audio hint */}
          {audioUri && <Text style={styles.audioHint}>🎙️ Audio attached</Text>}

          {/* Actions */}
          <View style={styles.toolsRow}>
            <Pressable onPress={pickImage} style={styles.toolBtn}><Text style={styles.toolText}>🖼️ Photo</Text></Pressable>
            {recording 
              ? <Pressable disabled={busy} onPress={stopRecording} style={styles.toolBtn}><Text style={styles.toolText}>⏹ Stop</Text></Pressable>
              : <Pressable disabled={busy} onPress={startRecording} style={styles.toolBtn}><Text style={styles.toolText}>🎙️ Record</Text></Pressable>}
          </View>

          <View style={styles.publishRow}>
            <Pressable onPress={close} style={styles.secondary}><Text style={styles.secondaryText}>Cancel</Text></Pressable>
            <Pressable onPress={publish} style={styles.primary}><Text style={styles.primaryText}>Publish</Text></Pressable>
          </View>
            </GlassSurface>
            <Pressable onPress={close} style={{height:40}} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay:{ 
    flex: 1,
    backgroundColor:'rgba(0,0,0,0.9)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 375 : '100%', // Constrain to phone width on web
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  sheet:{ 
    padding:16,
  },
  title:{ color:'#FFF', fontWeight:'800', fontSize:18, marginBottom:8 },
  row:{ flexDirection:'row', gap:6, marginBottom:12 },
  visPill:{ flex:1, alignItems:'center', paddingVertical:10, borderRadius:999, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:'rgba(255,255,255,0.04)' },
  visActive:{ borderColor:'#FFFFFF', backgroundColor:'rgba(255,255,255,0.12)' },
  visText:{ color:'rgba(255,255,255,0.8)', fontWeight:'700' },
  visActiveText:{ color:'#000', backgroundColor:'#FFF', paddingHorizontal:8, borderRadius:999 },
  context:{ borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:'rgba(255,255,255,0.04)', borderRadius:16, padding:12, marginBottom:12 },
  contextTitle:{ color:'#FFF', fontWeight:'700' },
  contextMeta:{ color:'rgba(255,255,255,0.7)', marginTop:4 },
  input:{ minHeight:100, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', borderRadius:16, padding:12, color:'#FFF', backgroundColor:'rgba(255,255,255,0.05)', marginBottom:12 },
  photo:{ width:'100%', height:220, borderRadius:16, marginBottom:10 },
  audioHint:{ color:'#ECEDEF', marginBottom:8 },
  toolsRow:{ flexDirection:'row', gap:8, marginBottom:10 },
  toolBtn:{ flex:1, alignItems:'center', paddingVertical:12, borderRadius:14, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:'rgba(255,255,255,0.06)' },
  toolText:{ color:'#FFF', fontWeight:'700' },
  publishRow:{ flexDirection:'row', gap:10, marginTop:4 },
  primary:{ flex:1, alignItems:'center', paddingVertical:12, borderRadius:14, backgroundColor:'#FFF' },
  primaryText:{ color:'#000', fontWeight:'800' },
  secondary:{ flex:1, alignItems:'center', paddingVertical:12, borderRadius:14, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:'rgba(255,255,255,0.04)' },
  secondaryText:{ color:'#FFF', fontWeight:'800' },
});