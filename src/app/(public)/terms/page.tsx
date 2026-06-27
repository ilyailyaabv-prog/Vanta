export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>This is a placeholder terms of service page.</p>
        <p>By using Vanta, you agree to these terms. You must be 18 years or older to use this service.</p>
        <p>For the full terms of service, please contact us at support@vanta.com.</p>
      </div>
    </div>
  );
}