export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">About Vanta</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>
          Vanta is a curated video platform dedicated to showcasing the world's most talented
          performers and creators. Our mission is to provide a premium viewing experience with
          high-quality content, intuitive navigation, and a respectful community.
        </p>
        <p>
          Founded with a passion for artistic expression, Vanta brings together performers,
          videographers, and enthusiasts in a single, elegant platform.
        </p>
        <p>
          For inquiries, please contact us at support@vanta.com.
        </p>
      </div>
    </div>
  );
}