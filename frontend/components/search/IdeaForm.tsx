'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/store/app.store';

const MIN_LENGTH = 20;

interface CreateSearchResponse {
  id: string;
  status: string;
}

export function IdeaForm() {
  const [input, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const router = useRouter();
  const { getToken } = useAuth();
  const setCurrentSearchId = useAppStore((s) => s.setCurrentSearchId);

  const isValid = input.trim().length >= MIN_LENGTH;
  const showError = touched && !isValid;

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<CreateSearchResponse>('/searches', getToken, {
        method: 'POST',
        body: JSON.stringify({ raw_input: input.trim() }),
      }),
    onSuccess: (data) => {
      setCurrentSearchId(data.id);
      router.push(`/search/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
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

      {mutation.isError && (
        <p className="text-sm text-destructive">
          {(mutation.error as Error).message ?? 'Something went wrong. Please try again.'}
        </p>
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
