import { Controller, useForm } from 'react-hook-form';

import { updateProfileMutationOptions } from '@/features/user/queries';
import { zodResolver } from '@hookform/resolvers/zod';
import type { User } from '@rekode/types/client/proto/user';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';

import { Button } from '@rekode/ui/components/button';
import { Field, FieldError, FieldLabel } from '@rekode/ui/components/field';
import { Input } from '@rekode/ui/components/input';

import { type ProfileSchema, profileSchema } from '../schema/profile';
import { FormHeader } from './form-header';

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const navigate = useNavigate({
    from: '/auth/profile/',
  });

  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? '',
    },
  });

  const updateProfileMutation = useMutation({
    ...updateProfileMutationOptions,
    onSuccess: () => {
      navigate({ to: '/' });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateProfileMutation.mutate({
      name: data.name,
    });
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <FormHeader
        title="Setup your profile"
        description="Tell us a bit about yourself. We’ll tailor your workspace accordingly."
      />

      {/* Email Form */}
      <form className="flex flex-col gap-7" onSubmit={onSubmit}>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Your Name</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id={field.name}
                type="text"
                placeholder="Enter your fullname"
                autoComplete="name"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button type="submit">Continue</Button>
      </form>

      {/* Terms */}
      <p className="text-muted-foreground mx-auto max-w-72 text-center text-xs leading-relaxed font-medium">
        By creating account you agree to company{' '}
        <Link to="/" className="text-primary hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link className="text-primary hover:underline" to="/">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
