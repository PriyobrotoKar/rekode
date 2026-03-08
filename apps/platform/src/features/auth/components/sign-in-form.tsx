import { Controller, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconBrandGithub, IconBrandGoogleFilled } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';

import { Button } from '@rekode/ui/components/button';
import { Field, FieldError, FieldLabel } from '@rekode/ui/components/field';
import { Input } from '@rekode/ui/components/input';

import { loginWithEmailMutationOptions } from '../queries';
import { type SignInSchema, signInSchema } from '../schema/sign-in';
import { FormHeader } from './form-header';

export function SignInForm() {
  const navigate = useNavigate();
  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
    },
  });

  const mutation = useMutation({
    ...loginWithEmailMutationOptions,
    onSuccess: (_, email) => {
      navigate({
        to: '/auth/verify-otp',
        search: {
          email,
        },
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data.email);
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <FormHeader
        title="Log in"
        description="Welcome back to your workspace. Sign in to continue building and collaborating."
      />

      {/* Email Form */}
      <form className="flex flex-col gap-7" onSubmit={onSubmit}>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id={field.name}
                type="email"
                placeholder="Enter your email address"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button isLoading={mutation.isPending} type="submit">
          Continue
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="bg-background relative px-2.5">
          <span className="text-muted-foreground text-md">OR</span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="flex flex-col gap-4">
        <Button
          render={
            <a href="http://localhost:8000/auth/google">
              <IconBrandGoogleFilled />
              Continue with Google
            </a>
          }
          variant="secondary"
        ></Button>
        <Button variant="secondary">
          <IconBrandGithub />
          Continue with Github
        </Button>
      </div>

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
