'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/store/app.store';
import { track } from '@/lib/posthog';

const MIN_LENGTH = 20;

interface CreateSearchResponse {
  id: string;
  status: string;
}

export function IdeaForm() {
  const [input, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [genericError, setGenericError] = useState<string | null>(null);
  const router = useRouter();
  const { getToken } = useAuth();
  const setCurrentSearchId = useAppStore((s) => s.setCurrentSearchId);
  const queryClient = useQueryClient();

  const isValid = input.trim().length >= MIN_LENGTH;
  const showError = touched && !isValid;

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<CreateSearchResponse>('/searches', getToken, {
        method: 'POST',
        body: JSON.stringify({ raw_input: input.trim() }),
      }),
    onSuccess: (data) => {
      setQuotaError(false);
      setGenericError(null);
      setCurrentSearchId(data.id);
      track('search_started', { search_id: data.id });
      router.push(`/search/${data.id}`);
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 429 || error.message?.toLowerCase().includes('limit reached')) {
        setQuotaError(true);
        setGenericError(null);
        // Refresh user-me so sidebar usage counter updates
        void queryClient.invalidateQueries({ queryKey: ['user-me'] });
      } else {
        setQuotaError(false);
        setGenericError(error.message ?? 'Something went wrong. Please try again.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    setQuotaError(false);
    setGenericError(null);
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Describe your startup idea, target market, and funding needs..."
          value={input}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          rows={6}
          className="resize-none"
          aria-invalid={showError}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {showError && (
              <span className="text-destructive">
                Please enter at least {MIN_LENGTH} characters.
              </span>
            )}
          </span>
          <span>
            {input.trim().length} / {MIN_LENGTH} min
          </span>
        </div>
      </div>

      {quotaError && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm">
          <p className="font-medium text-amber-800">Monthly limit reached</p>
          <p className="text-amber-700 mt-1">
            You&apos;ve used all 3 free searches this month.{' '}
            <a
              href="/pricing"
              onClick={() => track('upgrade_clicked', { source: 'quota_error' })}
              className="underline font-medium hover:text-amber-900"
            >
              Upgrade to Pro
            </a>{' '}
            for unlimited searches.
          </p>
        </div>
      )}

      {genericError && !quotaError && (
        <p className="text-sm text-destructive">{genericError}</p>
      )}

      <Button
        type="submit"
        disabled={mutation.isPending || (touched && !isValid)}
        className="w-full"
      >
        {mutation.isPending ? 'Starting search...' : 'Find Investors'}
      </Button>
    </form>
  );
}
