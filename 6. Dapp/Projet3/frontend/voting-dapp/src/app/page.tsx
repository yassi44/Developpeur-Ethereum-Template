"use client";
import dynamic from "next/dynamic";

const MetaMaskConnect = dynamic(() => import("./components/MetaMaskConnect"), {
  ssr: false,
});
const AdminPanel = dynamic(() => import("./components/AdminPanel"), {
  ssr: false,
});
const VoterPanel = dynamic(() => import("./components/VoterPanel"), {
  ssr: false,
});
const Results = dynamic(() => import("./components/Results"), { ssr: false });

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Voting DApp</h1>

      <MetaMaskConnect />

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <AdminPanel />
        <VoterPanel />
      </div>

      <Results />
    </div>
  );
}
