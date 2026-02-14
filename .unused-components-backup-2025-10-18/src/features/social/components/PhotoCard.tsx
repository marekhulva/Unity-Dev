import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, MapPin, Calendar } from 'lucide-react-native';
import { PostCardBase } from './PostCardBase';
import { Post } from '../../../../state/slices/socialSlice';

const { width } = Dimensions.get('window');

interface PhotoCardProps {
  post: Post;
  onReact: (emoji: string) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ post, onReact }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: width - 64, height: 250 });

  // Calculate aspect ratio based on image
  React.useEffect(() => {
    if (post.photoUri) {
      Image.getSize(post.photoUri, (w, h) => {
        const maxWidth = width - 64;
        const ratio = h / w;
        setImageDimensions({
          width: maxWidth,
          height: Math.min(maxWidth * ratio, 400), // Max height 400
        });
      });
    }
  }, [post.photoUri]);

  return (
    <PostCardBase
      post={post}
      onReact={onReact}
      borderColor="rgba(192,192,192,0.2)"
      glowColor="rgba(192,192,192,0.1)"
    >
      {/* Photo container */}
      {post.photoUri && (
        <Pressable style={styles.photoContainer}>
          {!imageLoaded && (
            <View style={[styles.placeholder, { height: imageDimensions.height }]}>
              <Camera size={32} color="#C0C0C0" />
            </View>
          )}
          
          <Image
            source={{ uri: post.photoUri }}
            style={[styles.photo, imageDimensions]}
            onLoad={() => setImageLoaded(true)}
            resizeMode="cover"
          />
          
          {/* Photo overlay gradient for better text visibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.photoOverlay}
            pointerEvents="none"
          />
          
          {/* Photo metadata */}
          {(post.location || post.photoDate) && (
            <View style={styles.photoMeta}>
              {post.location && (
                <View style={styles.metaItem}>
                  <MapPin size={10} color="#FFFFFF" />
                  <Text style={styles.metaText}>{post.location}</Text>
                </View>
              )}
              {post.photoDate && (
                <View style={styles.metaItem}>
                  <Calendar size={10} color="#FFFFFF" />
                  <Text style={styles.metaText}>{post.photoDate}</Text>
                </View>
              )}
            </View>
          )}
        </Pressable>
      )}

      {/* Caption */}
      {post.content && (
        <Text style={styles.caption}>{post.content}</Text>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Album indicator */}
      {post.albumName && (
        <View style={styles.albumIndicator}>
          <Text style={styles.albumText}>📸 From album: {post.albumName}</Text>
        </View>
      )}
    </PostCardBase>
  );
};

const styles = StyleSheet.create({
  photoContainer: {
    marginHorizontal: -12,
    marginTop: -8,
    marginBottom: 12,
    position: 'relative',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    borderRadius: 12,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  photoMeta: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: 'rgba(192,192,192,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.15)',
  },
  tagText: {
    fontSize: 11,
    color: '#C0C0C0',
    fontWeight: '600',
  },
  albumIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  albumText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
});