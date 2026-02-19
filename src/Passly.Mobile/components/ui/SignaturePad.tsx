import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SignaturePadProps {
  onSignatureCapture: (base64: string) => void;
  onClear: () => void;
  onDrawBegin?: () => void;
  onDrawEnd?: () => void;
}

export function SignaturePad({ onSignatureCapture, onClear, onDrawBegin, onDrawEnd }: SignaturePadProps) {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const signatureRef = useRef<SignatureCanvas>(null);

  const strokeColor = t.fg;
  const bgColor = scheme === 'dark' ? t.surface3 : t.surface;

  const handleBegin = () => {
    onDrawBegin?.();
  };

  const handleEnd = () => {
    onDrawEnd?.();
    signatureRef.current?.readSignature();
  };

  const handleOK = (signature: string) => {
    // signature comes as a data URI — strip the prefix to get raw base64
    const base64 = signature.replace(/^data:image\/\w+;base64,/, '');
    onSignatureCapture(base64);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    onClear();
  };

  const webStyle = `
    .m-signature-pad { box-shadow: none; border: none; margin: 0; background-color: ${bgColor}; }
    .m-signature-pad--body { border: none; background-color: ${bgColor}; }
    .m-signature-pad--body canvas { background-color: ${bgColor}; }
    .m-signature-pad--footer { display: none; }
    body, html { background-color: ${bgColor} !important; }
  `;

  return (
    <View style={styles.container}>
      <View style={[styles.canvasWrap, { borderColor: t.border, backgroundColor: bgColor }]}>
        <SignatureCanvas
          ref={signatureRef}
          onBegin={handleBegin}
          onEnd={handleEnd}
          onOK={handleOK}
          penColor={strokeColor}
          backgroundColor={bgColor}
          webStyle={webStyle}
          style={{ backgroundColor: bgColor }}
          dotSize={1.5}
          minWidth={1}
          maxWidth={2.5}
        />
      </View>
      <Pressable onPress={handleClear} style={styles.clearButton}>
        <Text style={[styles.clearText, { color: t.fg2 }]}>Clear signature</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  canvasWrap: {
    height: 160,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  clearButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  clearText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
