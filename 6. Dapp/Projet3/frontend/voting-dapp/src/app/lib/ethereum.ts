import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class EthereumService {
  private static instance: EthereumService;
  public provider: ethers.BrowserProvider | null = null;
  public signer: ethers.JsonRpcSigner | null = null;
  public account: string | null = null;

  static getInstance(): EthereumService {
    if (!EthereumService.instance) {
      EthereumService.instance = new EthereumService();
    }
    return EthereumService.instance;
  }

  async connectWallet(): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error("Window is not available");
    }

    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    await this.provider.send("eth_requestAccounts", []);
    this.signer = await this.provider.getSigner();
    this.account = await this.signer.getAddress();

    return this.account;
  }

  async getContract() {
    if (!this.provider || !this.signer) {
      throw new Error("Wallet not connected");
    }

    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
  }
}
