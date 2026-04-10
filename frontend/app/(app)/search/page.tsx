import { IdeaForm } from '@/components/search/IdeaForm';

export default function SearchPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">Find Investors</h1>
      <IdeaForm />
    </div>
  );
}
