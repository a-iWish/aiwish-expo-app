import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  ProductDetail: { productId: string };
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
};

export type MainTabParamList = {
  Discover: undefined;
  Watchlist: undefined;
  Settings: undefined;
};
