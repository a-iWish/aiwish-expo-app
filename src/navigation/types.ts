import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  ProductDetail: { productId: string };
  SharedWishlist: { token: string };
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Compare: undefined;
  SharedListDetail: { listId: string };
};

export type MainTabParamList = {
  Discover: undefined;
  Wishlist: undefined;
  Friends: undefined;
  Settings: undefined;
};
