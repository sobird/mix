import { z } from 'zod';
import { zodToRule } from '.';

export const SignUpFormZod = z
  .object({
    email: z.string().min(1).email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .strict()
  .refine((data) => { return data.password === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const SignUpFormRule = zodToRule(SignUpFormZod);
