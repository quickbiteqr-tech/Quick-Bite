'use server';

import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { headers } from 'next/headers';

// 1. Zod Validation Schema
const ContactFormSchema = z.object({
  intent: z.enum(['demo', 'partnership', 'support', 'other']),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters long")
});

export type ContactFormInputs = z.infer<typeof ContactFormSchema>;

// 2. Initialize Upstash Rate Limiter (3 requests per hour per IP)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
});

export async function submitContactForm(data: ContactFormInputs) {
  try {
    // 3. Check Rate Limit
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(`contact_form_${ip}`);
    
    if (!success) {
      return { success: false, error: "You've sent too many requests. Please try again later." };
    }

    // 4. Validate Data
    const parsedData = ContactFormSchema.safeParse(data);
    if (!parsedData.success) {
      return { success: false, error: "Invalid form data provided." };
    }

    // 5. Insert to Supabase
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('contact_messages')
      .insert([{
        intent: parsedData.data.intent,
        name: parsedData.data.name,
        email: parsedData.data.email,
        message: parsedData.data.message
      }]);

    if (error) {
      console.error('Insert Error:', error);
      return { success: false, error: "Failed to send message. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error('Action Error:', error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
