import z from 'zod';

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'Please enter a valid 6-digit code'),
});

export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;
