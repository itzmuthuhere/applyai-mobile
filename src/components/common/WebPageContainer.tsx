import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

interface Props {
  children: React.ReactNode;
  maxWidth?: number;
}

// Constrains + centers page content on web so it doesn't stretch full-bleed
// edge-to-edge across a wide browser window (the phone-width layouts look
// wrong stretched to 1900px). Pure passthrough on native — zero visual change
// there. Use inside a screen's outer ScrollView/View, wrapping the content
// that was designed for a phone-width column.
export default function WebPageContainer({ children, maxWidth = 720 }: Props) {
  const { isWeb } = useResponsive();
  if (!isWeb) return <>{children}</>;
  return (
    <View style={[styles.center, { maxWidth }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    width: '100%',
    alignSelf: 'center',
  },
});
