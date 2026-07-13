import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

interface Props {
  children: React.ReactNode;
  maxWidth?: number;
  // Extra styles for the centered container itself — most commonly `gap`,
  // since a `gap` set on the ScrollView's contentContainerStyle stops
  // applying between the actual content rows once they're one level deeper
  // inside this wrapper.
  style?: StyleProp<ViewStyle>;
}

// Constrains + centers page content on web so it doesn't stretch full-bleed
// edge-to-edge across a wide browser window (the phone-width layouts look
// wrong stretched to 1900px). Pure passthrough on native — zero visual change
// there. Use inside a screen's outer ScrollView/View, wrapping the content
// that was designed for a phone-width column.
export default function WebPageContainer({ children, maxWidth = 720, style }: Props) {
  const { isWeb } = useResponsive();
  if (!isWeb) return <>{children}</>;
  return (
    <View style={[styles.center, { maxWidth }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
