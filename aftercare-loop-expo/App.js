import { useRef, useState } from "react";
import { ActivityIndicator, Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";

// Where the Aftercare Loop web app is served. Default: the live Vercel site.
// For a Mac on the same Wi-Fi use e.g. EXPO_PUBLIC_APP_URL=http://<mac-ip>:3000. Override at start time:
//   EXPO_PUBLIC_APP_URL=https://your-live-url npx expo start
const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? "https://aftercare-loop.vercel.app";

export default function App() {
  const webref = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" backgroundColor="#FBA17E" />
      <WebView
        ref={webref}
        source={{ uri: APP_URL }}
        style={styles.web}
        onLoadStart={() => { setLoading(true); setError(null); }}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => { setLoading(false); setError(e.nativeEvent.description || "Could not reach the app"); }}
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
      />
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#EE6200" />
          <Text style={styles.hint}>Loading Aftercare Loop…</Text>
        </View>
      )}
      {error && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Can’t reach the app</Text>
          <Text style={styles.hint}>{APP_URL}</Text>
          <Text style={styles.hint}>{error}</Text>
          <Text style={styles.hint}>
            Make sure the phone is on the same Wi-Fi as the Mac and the server is running.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FBA17E", paddingTop: Platform.OS === "android" ? 24 : 0 },
  web: { flex: 1, backgroundColor: "#FFFFFF" },
  overlay: {
    position: "absolute", inset: 0, top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", padding: 24, gap: 12,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#1F1F1F" },
  hint: { fontSize: 15, color: "#555555", textAlign: "center" },
});
