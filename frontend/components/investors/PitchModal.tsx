'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';

interface PitchResponse {
  id: string;
  content: string;
  version: number;
}

interface Props {
  investorId: string;
  investorName: string;
  open: boolean;
  onClose: () => void;
}

export function PitchModal({ investorId, investorName, open, onClose }: Props) {
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const { getToken } = useAuth();

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<PitchResponse>(`/investors/${investorId}/pitch`, getToken, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      setContent(data.content);
    },
  });

  // Trigger generation on open
  useEffect(() => {
    if (open) {
      setContent('');
      mutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRegenerate = () => {
    setContent('');
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pitch for {investorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mutation.isPending && (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating your pitch...</span>
            </div>
          )}

          {mutation.isError && (
            <p className="text-destructive text-sm">
              {(mutation.error as Error).message ?? 'Failed to generate pitch. Please try again.'}
            </p>
          )}

          {mutation.isSuccess && content && (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="resize-none font-mono text-sm"
            />
          )}
        </div>

        <DialogFooter className="gap-2">
          {mutation.isSuccess && (
            <>
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!content}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRegenerate}>
                Regenerate
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
