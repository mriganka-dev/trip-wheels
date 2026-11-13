import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <main className="py-12">
      <Container>
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </Container>
    </main>
  );
}

