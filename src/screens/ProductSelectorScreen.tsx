import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../types/product';
import { BrandWordmark, ProductCard, Button } from '../components';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, fontSize, appIconSizes } from '../styles/theme';

const ALL_CATEGORIES = ['Baby', 'Cameras', 'Headphones', 'Home Electronics & Personal Care'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  Baby: 'Baby',
  Cameras: 'Cameras',
  Headphones: 'Audio',
  'Home Electronics & Personal Care': 'Home tech',
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProductSelector'>;
};

export const ProductSelectorScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.bottom), [colors, insets.bottom]);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const { products, loading, error, refetch } = useProducts();

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) list = list.filter((p) => p.category === selectedCategory);
    return list;
  }, [products, selectedCategory]);

  const categoryCounts = useMemo(() => {
    return products.reduce<Record<string, number>>((acc, product) => {
      acc[product.category] = (acc[product.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Logo row */}
        <View style={styles.logoRow}>
          <View style={styles.logoLeft}>
            {/* App icon */}
            <Image
              source={isDark
                ? require('../../assets/aiwish-logo-transparent-dark.png')
                : require('../../assets/aiwish-logo-transparent-light.png')}
              style={styles.appIcon}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            {/* Wordmark */}
            <View style={styles.wordmarkBlock}>
              <BrandWordmark textStyle={styles.logoText} iwishColor={colors.brandEnd} />
            </View>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Text style={styles.themeIcon}>{isDark ? '☀︎' : '☾'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerInstruction}>
          Choose a product to view price timing and retailer options.
        </Text>

        {/* CATEGORY label */}
        <Text style={styles.catLabel}>Category</Text>

        {/* Category pills */}
        {!loading && !error && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
          >
            <Pressable
              style={[styles.pill, !selectedCategory && styles.pillActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.pillText, !selectedCategory && styles.pillTextActive]}>
                All
              </Text>
              <Text style={[styles.pillCount, !selectedCategory && styles.pillCountActive]}>
                {products.length}
              </Text>
            </Pressable>
            {ALL_CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.pill, selectedCategory === cat && styles.pillActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                <Text style={[styles.pillText, selectedCategory === cat && styles.pillTextActive]}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </Text>
                <Text style={[styles.pillCount, selectedCategory === cat && styles.pillCountActive]}>
                  {categoryCounts[cat] ?? 0}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Product count */}
        {!loading && !error && (
          <Text style={styles.prodCount}>{filteredProducts.length} products</Text>
        )}
      </View>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <Image
            source={isDark
              ? require('../../assets/aiwish-logo-transparent-dark.png')
              : require('../../assets/aiwish-logo-transparent-light.png')}
            style={styles.loadingIcon}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: spacing.md }} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" onPress={refetch} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={handleProductPress}
            />
          )}
          style={styles.flatList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ── Header
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm + 4,
      backgroundColor: colors.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    logoLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    appIcon: {
      width: 50,
      height: 50,
    },
    wordmarkBlock: {},
    logoText: {
      fontSize: 26,
      fontWeight: '700',
      letterSpacing: -0.8,
      color: colors.text,
    },
    themeToggle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderMed,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeIcon: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0,
      color: colors.text,
    },
    headerInstruction: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textMuted,
      letterSpacing: 0,
      lineHeight: 18,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    catLabel: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginBottom: 10,
      fontFamily: 'Roboto',
    },
    pillRow: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: spacing.md,
    },
    pill: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      minHeight: 34,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderMed,
      backgroundColor: colors.surface,
    },
    pillActive: {
      backgroundColor: colors.surface2,
      borderColor: colors.brandEnd,
    },
    pillText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
      letterSpacing: -0.1,
    },
    pillTextActive: {
      color: colors.brandEnd,
      fontWeight: '600',
    },
    pillCount: {
      backgroundColor: colors.surfaceLight,
      borderRadius: 999,
      color: colors.textSoft,
      fontSize: 11,
      fontWeight: '800',
      minWidth: 21,
      overflow: 'hidden',
      paddingHorizontal: 6,
      paddingVertical: 2,
      textAlign: 'center',
    },
    pillCountActive: {
      backgroundColor: colors.cardBg,
      color: colors.brandEnd,
    },
    prodCount: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSoft,
      marginTop: 8,
    },

    // ── List
    flatList: { flex: 1 },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm + 4,
      paddingBottom: bottomInset + spacing.lg,
    },

    // ── States
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    loadingIcon: {
      width: appIconSizes.state,
      height: appIconSizes.state,
    },
    loadingText: {
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    errorText: {
      fontSize: fontSize.md,
      color: colors.error,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
