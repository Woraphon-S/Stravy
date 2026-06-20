import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AppStackParamList = {
  Tabs: undefined;
  ActivityDetail: { id: string };
  Settings: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Record: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type ActivityDetailProps = NativeStackScreenProps<AppStackParamList, 'ActivityDetail'>;

export type SettingsProps = NativeStackScreenProps<AppStackParamList, 'Settings'>;

export type FeedTabProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Feed'>,
  NativeStackScreenProps<AppStackParamList>
>;

export type RecordTabProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Record'>,
  NativeStackScreenProps<AppStackParamList>
>;

export type ProfileTabProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<AppStackParamList>
>;

export type LoginProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
