"use client";
import { useState } from "react";
import { EthereumService } from "../lib/ethereum";

export default function MetaMaskConnect() {
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    setLoading(true);
    try {
      const ethereum = EthereumService.getInstance();
      const address = await ethereum.connectWallet();
      setAccount(address);
    } catch (error) {
      console.error("Connection failed:", error);
    }
    setLoading(false);
  };

  if (account) {
    return (
      <div className="bg-green-100 p-4 rounded">
        Connected: {account.slice(0, 6)}...{account.slice(-4)}
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={loading}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      {loading ? "Connecting..." : "Connect MetaMask"}
    </button>
  );
}
