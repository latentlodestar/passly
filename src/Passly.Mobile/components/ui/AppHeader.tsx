import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { processSteps, indexToRoute } from '@/constants/steps';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppSelector } from '@/store';


export function WorkflowHeader({ title, step }: { title: string; step?: number }) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const router = useRouter();
  const maxReachedStep = useAppSelector((s) => s.progress.maxReachedStep);

  return (
    <View>
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.sideBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <MaterialIcons name="chevron-left" size={28} color="#FFFFFF" />
        </Pressable>

        <View style={styles.center}>
          <Text style={[styles.title, { color: '#FFFFFF' }]}>{title}</Text>
          {step != null && (
            <View style={styles.tracker}>
              {processSteps.map((_s, i) => {
                const isActive = i === step;
                const isComplete = i <= maxReachedStep && i !== step;
                const isTappable = i <= maxReachedStep && i !== step;
                const route = indexToRoute(i);

                const dot = (
                  <View
                    style={[
                      styles.trackerDot,
                      isComplete && { backgroundColor: t.successText },
                      isActive && { backgroundColor: t.primary },
                      !isActive && !isComplete && { backgroundColor: '#3A3F47' },
                    ]}
                  />
                );

                return (
                  <View key={i} style={styles.trackerStep}>
                    {isTappable && route ? (
                      <Pressable
                        onPress={() => router.push(route as never)}
                        hitSlop={8}
                        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                      >
                        {dot}
                      </Pressable>
                    ) : (
                      dot
                    )}
                    {i < processSteps.length - 1 && (
                      <View
                        style={[
                          styles.trackerLine,
                          { backgroundColor: i < maxReachedStep ? t.successText : '#3A3F47' },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={8}
          style={({ pressed }) => [styles.sideBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <MaterialIcons name="settings" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sideBtn: {
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  tracker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  trackerStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trackerDot: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerLine: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
});
