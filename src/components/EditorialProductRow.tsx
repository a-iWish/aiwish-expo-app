import React, { useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';
import { Product } from '../types/product';
import { useTheme } from '../context/ThemeContext';
import {
  ThemeColors,
  spacing,
  appIconSizes,
  MIN_TOUCH,
  DISPLAY_FONT,
  SEMIBOLD_FONT,
  BODY_FONT,
} from '../styles/theme';
import { AppText } from './AppText';
import {
  normalizeVerdict,
  verdictColor,
  verdictDisplayWord,
} from '../utils/verdictStyle';
import { percentChangeVsReference } from '../utils/priceChangePercent';
import { buildListMetaParts } from '../utils/formatListMeta';

interface EditorialProductRowProps {
  product: Product;
  onPress: (product: Product) => void;
  metaSuffix?: string;
}

const THUMB = appIconSizes.listThumb;

export const EditorialProductRow: React.FC<EditorialProductRowProps> = ({
  product,
  onPress,
  metaSuffix,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const price = product.trusted_price ?? product.current_price;
  const retailer = product.trusted_source ?? product.retailer ?? 'Retailer';
  const reference = product.msrp ?? product.original_price ?? null;
  const deltaPct =
    price != null ? percentChangeVsReference(price, reference) : null;

  const verdictKey = normalizeVerdict(product.recommendation);
  const verdictColorValue = verdictColor(verdictKey, colors);
  const verdictWord = verdictDisplayWord(verdictKey);
  const confidence = product.confidence;

  const metaParts = buildListMetaParts(
    price,
    deltaPct,
    retailer,
    metaSuffix,
    colors,
  );

  return (
    <Pressable
      onPress={() => onPress(product)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${verdictWord}`}
    >
      <View style={styles.thumbCol}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.thumb}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbPlaceholderText}>ai</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <AppText variant="bodySemibold" numberOfLines={3} style={styles.name}>
          {product.name}
        </AppText>

        {product.category ? (
          <AppText variant="meta" style={styles.category}>
            {product.category}
          </AppText>
        ) : null}

        <View style={styles.verdictRow}>
          <Text style={[styles.verdictWord, { color: verdictColorValue }]}>
            {verdictWord}
          </Text>
          {confidence != null && (
            <Text style={styles.confidence}>{Math.round(confidence)}%</Text>
          )}
        </View>

        <Text style={styles.metaLine} numberOfLines={2}>
          {metaParts.map((part, index) => (
            <Text key={`${part.text}-${index}`}>
              {index > 0 ? <Text style={styles.metaSep}> · </Text> : null}
              <Text style={[styles.metaPart, part.color != null && { color: part.color }]}>
                {part.text}
              </Text>
            </Text>
          ))}
        </Text>
      </View>
    </Pressable>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      minHeight: MIN_TOUCH + spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    pressed: {
      backgroundColor: colors.surfaceLight,
    },
    thumbCol: {
      paddingTop: 2,
    },
    thumb: {
      width: THUMB,
      height: THUMB,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    thumbPlaceholder: {
      width: THUMB,
      height: THUMB,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbPlaceholderText: {
      fontFamily: SEMIBOLD_FONT,
      fontSize: 11,
      color: colors.textSoft,
    },
    body: {
      flex: 1,
      gap: 6,
    },
    name: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.25,
    },
    category: {
      marginTop: -2,
      textTransform: 'uppercase',
    },
    verdictRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    verdictWord: {
      fontFamily: DISPLAY_FONT,
      fontSize: 28,
      lineHeight: 28,
      letterSpacing: -1,
    },
    confidence: {
      fontFamily: DISPLAY_FONT,
      fontSize: 18,
      lineHeight: 22,
      color: colors.textSoft,
      fontVariant: ['tabular-nums'],
      paddingBottom: 1,
    },
    metaLine: {
      fontFamily: BODY_FONT,
      fontSize: 13,
      lineHeight: 18,
    },
    metaPart: {
      fontFamily: BODY_FONT,
      fontSize: 13,
    },
    metaSep: {
      fontFamily: BODY_FONT,
      fontSize: 13,
      color: colors.textSoft,
    },
  });
