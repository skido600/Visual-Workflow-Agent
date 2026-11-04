import { Suspense } from "react";
import VerifyEmailClient from "../../../component/VerifyEmailClient";
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#262626]">
          <p className="text-zinc-400">Loading verification...</p>
        </main>
      }>
      <VerifyEmailClient />
    </Suspense>
  );
}
