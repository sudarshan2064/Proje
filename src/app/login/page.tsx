"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/");
  }, [router]);

  return (
    <div className="flex justify-center items-center h-full">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
