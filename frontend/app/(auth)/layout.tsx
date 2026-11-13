import React from "react";
import { Container } from "@/components/layout/container";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="py-10 sm:py-16">
      <Container size="narrow">
        <div className="w-full max-w-md mx-auto">{children}</div>
      </Container>
    </main>
  );
}

