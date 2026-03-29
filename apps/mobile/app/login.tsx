import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { useLogin } from '@/hooks/use-auth';

const LoginFormSchema = z.object({
  username: z.string().min(3, 'Nazwa uzytkownika musi miec co najmniej 3 znaki'),
  password: z.string().min(8, 'Haslo musi miec min. 8 znakow'),
});

type LoginFormValues = z.infer<typeof LoginFormSchema>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { username: data.username, password: data.password },
      {
        onError: (error: unknown) => {
          const err = error as { response?: { status?: number } };
          const status = err?.response?.status;

          if (status === 423) {
            Toast.show({
              type: 'error',
              text1: t('errors.accountLocked'),
            });
          } else {
            Toast.show({
              type: 'error',
              text1: t('errors.loginFailed'),
            });
          }
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View style={styles.branding}>
          <Text style={styles.brandTitle}>KITEK</Text>
          <Text style={styles.brandSub}>
            System wynajmu pojazdow
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Nazwa uzytkownika"
                placeholder="jkowalski"
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.username?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Haslo"
                placeholder="Min. 8 znakow"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                containerStyle={{ marginTop: 16 }}
              />
            )}
          />

          <View style={styles.submitWrap}>
            <AppButton
              title="Zaloguj"
              onPress={handleSubmit(onSubmit)}
              loading={loginMutation.isPending}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  branding: {
    marginBottom: 48,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#3B82F6',
  },
  brandSub: {
    marginTop: 8,
    fontSize: 16,
    color: '#71717A',
  },
  form: {},
  submitWrap: {
    marginTop: 24,
  },
});
