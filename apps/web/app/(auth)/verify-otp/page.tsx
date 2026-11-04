import { Suspense } from "react";
import VerifyOtpClient from "../../../component/VerifyOtpClient";

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#262626]">
          <p className="text-zinc-400">Loading verification...</p>
        </main>
      }>
      <VerifyOtpClient />
    </Suspense>
  );
}
