export default function SearchResultsPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Search Results</h1>
      <p className="text-muted-foreground">Search ID: {params.id}</p>
      {/* InvestorGrid — implemented in S4-004 */}
    </div>
  );
}
