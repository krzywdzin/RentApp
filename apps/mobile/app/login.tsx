import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  email: z.string().email('Nieprawidlowy adres email'),
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
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { email: data.email, password: data.password },
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
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View className="mb-12 items-center">
          <Text className="text-4xl font-bold text-blue-600">KITEK</Text>
          <Text className="mt-2 text-base text-zinc-500">
            System wynajmu pojazdow
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Email"
                placeholder="jan@firma.pl"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
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
              />
            )}
          />

          <View className="mt-4">
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
