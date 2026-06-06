import 'react-native-gesture-handler';
import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { configureGoogleSignIn } from './src/store/slices/authSlice';
import UpdatePrompt from './src/components/common/UpdatePrompt';
import { useOtaUpdate } from './src/hooks/useOtaUpdate';

// Configure Google Sign-In once at app start
configureGoogleSignIn();

function AppWithUpdates() {
  const { status, downloadAndApply, dismiss } = useOtaUpdate();

  return (
    <>
      <AppNavigator />
      <UpdatePrompt
        status={status}
        onUpdate={downloadAndApply}
        onLater={dismiss}
      />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AppWithUpdates />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
