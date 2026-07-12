import { Platform, useWindowDimensions } from 'react-native';

// Standard web breakpoints. Native platforms (phones/tablets) are always
// "mobile" here regardless of physical screen size — the sidebar/wide-layout
// treatment is a web-only concept; native keeps its existing bottom-tab UI.
const DESKTOP_BREAKPOINT = 900;

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = isWeb && width >= DESKTOP_BREAKPOINT;
  return { width, isWeb, isDesktopWeb };
}
