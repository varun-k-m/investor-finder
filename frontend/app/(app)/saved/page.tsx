import { SavedBoard } from '@/components/saved/SavedBoard';

export default function SavedPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Saved Investors</h1>
      <SavedBoard />
    </div>
  );
}
