import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';

export const WebContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Inject styles for iPhone frame
      const style = document.createElement('style');
      style.innerHTML = `
        #root > div {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2c2c2c;
        }
        
        #root > div > div {
          width: 390px !important;
          height: 844px !important;
          max-width: 390px !important;
          max-height: 844px !important;
          border-radius: 40px !important;
          overflow: hidden !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important;
          border: 8px solid #333 !important;
          /* Removed forced black background for testing */
          position: relative !important;
        }
        
        /* Fix modal positioning to stay within iPhone frame */
        [data-modal-container] {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        {children}
      </View>
    );
  }

  return <>{children}</>;
};