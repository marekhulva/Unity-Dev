import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

const SEEDS = [
  "What's your biggest insight today?",
  "The hardest thing about today was...",
  "A small win I'm proud of..."
];

type Props = {
  onSeed: (s:string)=>void;
  onStatus: ()=>void;
  onPhoto: ()=>void;
  onAudio: ()=>void;
};

export const PromptCarousel: React.FC<Props> = ({ onSeed, onStatus, onPhoto, onAudio }) => {
  const scrollRef = React.useRef<ScrollView|null>(null);
  const [index, setIndex] = React.useState(0);

  React.useEffect(()=> {
    const id = setInterval(()=> {
      const next = (index+1) % SEEDS.length;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * 280, animated: true });
    }, 6000);
    return ()=> clearInterval(id);
  }, [index]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Share something</Text>

      <ScrollView
        horizontal
        ref={scrollRef}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{gap:8}}
        snapToInterval={280}
        decelerationRate="fast"
      >
        {SEEDS.map(seed => (
          <Pressable key={seed} onPress={()=>onSeed(seed)} style={styles.chip}>
            <Text style={styles.chipText}>{seed}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.quickRow}>
        <Pressable onPress={onStatus} style={styles.quickBtn}><Text style={styles.quickText}>✍️ Status</Text></Pressable>
        <Pressable onPress={onPhoto} style={styles.quickBtn}><Text style={styles.quickText}>🖼️ Photo</Text></Pressable>
        <Pressable onPress={onAudio} style={styles.quickBtn}><Text style={styles.quickText}>🎙️ Audio</Text></Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card:{ borderWidth:1, borderColor:'rgba(255,255,255,0.1)', backgroundColor:'rgba(255,255,255,0.04)', borderRadius:16, padding:14, marginBottom:12 },
  title:{ color:'#FFF', fontWeight:'800', marginBottom:8 },
  chip:{ width:280, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:'rgba(255,255,255,0.06)', borderRadius:999, paddingVertical:10, paddingHorizontal:12 },
  chipText:{ color:'#ECEDEF' },
  quickRow:{ flexDirection:'row', gap:8, marginTop:10 },
  quickBtn:{ flex:1, alignItems:'center', paddingVertical:10, borderRadius:12, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:'rgba(255,255,255,0.06)' },
  quickText:{ color:'#FFF', fontWeight:'700' },
});