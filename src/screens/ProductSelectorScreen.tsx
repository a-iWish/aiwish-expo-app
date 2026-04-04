import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { mockProducts } from '../data/mockProducts';
import { Product } from '../types/product';
import { ProductCard, Button } from '../components';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, fontSize } from '../styles/theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ProductSelector'>;
};

export const ProductSelectorScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleProductPress = (product: Product) => {
    setSelectedProduct((prev) =>
      prev?.product_id === product.product_id ? null : product
    );
  };

  const handleSubmit = () => {
    if (selectedProduct) {
      navigation.navigate('ProductDetail', {
        productId: selectedProduct.product_id,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.logo}>a.iwish</Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Smart Wishlist with ML Price Prediction</Text>
        <Text style={styles.instruction}>
          Select a product to view price insights
        </Text>
      </View>

      <FlatList
        data={mockProducts}
        keyExtractor={(item) => item.product_id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={handleProductPress}
            selected={selectedProduct?.product_id === item.product_id}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Button
          title={
            selectedProduct
              ? `View ${selectedProduct.title.split(' ').slice(0, 3).join(' ')}...`
              : 'Select a product'
          }
          onPress={handleSubmit}
          disabled={!selectedProduct}
        />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logo: {
      fontSize: fontSize.xxl,
      fontWeight: '900',
      color: colors.primary,
      letterSpacing: -1,
    },
    themeToggle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeIcon: {
      fontSize: 20,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    instruction: {
      fontSize: fontSize.md,
      color: colors.textPrimary,
      fontWeight: '600',
      marginTop: spacing.md,
    },
    list: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    footer: {
      padding: spacing.md,
      paddingBottom: spacing.lg,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
