import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';
import { Loading } from '../components/Feedback';
import { ActivityDetailScreen } from '../features/activity/ActivityDetailScreen';
import { useAuth } from '../features/auth/AuthContext';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RegisterScreen } from '../features/auth/RegisterScreen';
import { FeedScreen } from '../features/feed/FeedScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { RecordScreen } from '../features/record/RecordScreen';
import { useI18n } from '../i18n/I18nContext';
import { IconHome, IconPlus, IconUser } from '../icons';
import { colors } from '../theme';
import { AppStackParamList, AuthStackParamList, MainTabParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  const { t } = useI18n();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabel:
          route.name === 'Feed'
            ? t('tabs.feed')
            : route.name === 'Record'
              ? t('tabs.record')
              : t('tabs.profile'),
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Feed') return <IconHome size={size} color={color} />;
          if (route.name === 'Record') return <IconPlus size={size} color={color} />;
          return <IconUser size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Record" component={RecordScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { t } = useI18n();
  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AppStack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <AppStack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: t('activity.headerTitle') }}
      />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Loading />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}
