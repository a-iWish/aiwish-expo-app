import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  TextStyle,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

/** Dotless lowercase i — we draw a red heart as the tittle. */
const I_DOTLESS = '\u0131';

type Props = {
  textStyle: StyleProp<TextStyle>;
  /** Color for the "iwish" segment — defaults to cyan #00d4e8 */
  iwishColor?: string;
  /** Accessibility label for the full word (default: a.iwish) */
  accessibilityLabel?: string;
};

export const BrandWordmark: React.FC<Props> = ({
  textStyle,
  iwishColor = '#00d4e8',
  accessibilityLabel = 'a.iwish',
}) => {
  const { colors } = useTheme();
  const [stemBox, setStemBox] = useState({ w: 0, h: 0 });

  // Split the caller's textStyle: layout margins belong on the OUTER row, not on
  // the letters. Applying a marginTop to the inner "ı" shoves the letter down and
  // leaves the absolutely-positioned heart floating above it.
  const { heartSize, marginStyle, innerStyle } = useMemo(() => {
    const flat = StyleSheet.flatten(textStyle) ?? {};
    const {
      margin, marginTop, marginBottom, marginVertical, marginHorizontal,
      marginLeft, marginRight, marginStart, marginEnd, ...rest
    } = flat as Record<string, unknown>;
    const fs = typeof flat.fontSize === 'number' ? flat.fontSize : 20;
    return {
      heartSize: Math.max(7, Math.round(fs * 0.34)),
      marginStyle: {
        margin, marginTop, marginBottom, marginVertical, marginHorizontal,
        marginLeft, marginRight, marginStart, marginEnd,
      } as TextStyle,
      innerStyle: rest as TextStyle,
    };
  }, [textStyle]);

  // Default the "a." + "ı" stem to the theme text color so they stay visible in
  // both light and dark mode. Placed before innerStyle so a caller can still
  // override the color explicitly.
  const iTextStyle = useMemo(
    () => [
      { color: colors.text },
      innerStyle,
      styles.iGlyph,
      Platform.OS === 'android' ? styles.iGlyphAndroid : null,
    ],
    [innerStyle, colors.text],
  );

  const onStemLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStemBox({ w: width, h: height });
  }, []);

  /**
   * Center the heart where the “i” tittle sits: upper band of the line box, on the stem.
   * Android font metrics differ; tune with a small platform offset.
   */
  const heartPos =
    stemBox.w > 0 && stemBox.h > 0
      ? (() => {
          const yCenter =
            stemBox.h *
            (Platform.OS === 'android' ? 0.11 : 0.13);
          const top = Math.round(yCenter - heartSize / 2);
          return {
            left: Math.round((stemBox.w - heartSize) / 2),
            top,
          };
        })()
      : null;

  return (
    <View
      style={[styles.row, marginStyle]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[{ color: colors.text }, innerStyle]}>a.</Text>
      <View style={styles.iBlock}>
        <Text style={iTextStyle} onLayout={onStemLayout}>
          {I_DOTLESS}
        </Text>
        {heartPos != null && (
          <View
            style={[
              styles.heartWrap,
              {
                top: heartPos.top,
                left: heartPos.left,
                width: heartSize,
                height: heartSize,
              },
            ]}
            pointerEvents="none"
          >
            <Text
              style={[
                styles.heart,
                {
                  fontSize: heartSize,
                  color: colors.error,
                  lineHeight: heartSize,
                },
              ]}
            >
              ♥
            </Text>
          </View>
        )}
      </View>
      <Text style={[innerStyle, { color: iwishColor }]}>wish</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  /** Keeps the stem aligned with surrounding text; heart overlays the tittle area. */
  iBlock: {
    position: 'relative',
    overflow: 'visible',
  },
  iGlyph: {
    letterSpacing: 0,
  },
  iGlyphAndroid: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  heartWrap: {
    position: 'absolute',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  heart: {
    fontWeight: '700',
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
});
