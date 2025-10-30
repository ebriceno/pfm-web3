import { BrowserProvider, Contract, Eip1193Provider } from 'ethers';
import { SUPPLY_CHAIN_ABI } from '@/contracts/abi';
import { CONTRACT_CONFIG } from '@/contracts/config';

/**
 * Web3 Service for blockchain interactions
 * Singleton pattern to manage contract instance
 */
class Web3Service {
  private provider: BrowserProvider | null = null;
  private contract: Contract | null = null;

  /**
   * Initialize Web3 provider and contract instance
   */
  async init() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    this.provider = new BrowserProvider(window.ethereum as Eip1193Provider);
    const signer = await this.provider.getSigner();
    this.contract = new Contract(
      CONTRACT_CONFIG.address,
      SUPPLY_CHAIN_ABI,
      signer
    );
  }

  /**
   * Ensure provider and contract are initialized
   */
  private async ensureInitialized() {
    if (!this.provider || !this.contract) {
      await this.init();
    }
  }

  // ============================================
  // WALLET OPERATIONS
  // ============================================

  /**
   * Connect wallet and request account access
   */
  async connectWallet(): Promise<string> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    await this.init();
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    return accounts[0];
  }

  /**
   * Get current connected account
   */
  async getAccount(): Promise<string | null> {
    if (!this.provider) return null;
    try {
      const signer = await this.provider.getSigner();
      return await signer.getAddress();
    } catch {
      return null;
    }
  }

  /**
   * Get current network chain ID
   */
  async getChainId(): Promise<string> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    return await window.ethereum.request({ method: 'eth_chainId' });
  }

  /**
   * Switch to Anvil network (or add if not present)
   */
  async switchToAnvilNetwork() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 in hex
      });
    } catch (switchError: any) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x7a69',
              chainName: 'Anvil Local',
              rpcUrls: ['http://localhost:8545'],
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Request a role for the current user
   */
  async requestUserRole(role: string) {
    await this.ensureInitialized();
    const tx = await this.contract!.requestUserRole(role);
    await tx.wait();
    return tx;
  }

  /**
   * Get user information by address
   */
  async getUserInfo(address: string) {
    await this.ensureInitialized();
    try {
      const user = await this.contract!.getUserInfo(address);
      return {
        id: Number(user.id),
        userAddress: user.userAddress,
        role: user.role,
        status: Number(user.status),
      };
    } catch (error: any) {
      // User not found
      if (error.message.includes('User not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Change user status (admin only)
   */
  async changeUserStatus(userAddress: string, status: number) {
    await this.ensureInitialized();
    const tx = await this.contract!.changeStatusUser(userAddress, status);
    await tx.wait();
    return tx;
  }

  /**
   * Check if address is admin
   */
  async isAdmin(address: string): Promise<boolean> {
    await this.ensureInitialized();
    return await this.contract!.isAdmin(address);
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    await this.ensureInitialized();
    const nextUserId = await this.contract!.nextUserId();
    const totalUsers = Number(nextUserId) - 1; // nextUserId starts at 1
    
    const users = [];
    for (let i = 1; i <= totalUsers; i++) {
      try {
        const user = await this.contract!.users(i);
        users.push({
          id: Number(user.id),
          userAddress: user.userAddress,
          role: user.role,
          status: Number(user.status),
        });
      } catch (error) {
        console.error(`Error fetching user ${i}:`, error);
      }
    }
    
    return users;
  }

  /**
   * Get contract statistics
   */
  async getStatistics() {
    await this.ensureInitialized();
    const [nextUserId, nextTokenId, nextTransferId] = await Promise.all([
      this.contract!.nextUserId(),
      this.contract!.nextTokenId(),
      this.contract!.nextTransferId(),
    ]);

    return {
      totalUsers: Number(nextUserId) - 1,
      totalTokens: Number(nextTokenId) - 1,
      totalTransfers: Number(nextTransferId) - 1,
    };
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  /**
   * Create a new token
   */
  async createToken(
    name: string,
    totalSupply: number,
    features: string,
    parentId: number
  ) {
    await this.ensureInitialized();
    const tx = await this.contract!.createToken(name, totalSupply, features, parentId);
    await tx.wait();
    return tx;
  }

  /**
   * Get token information by ID
   */
  async getToken(tokenId: number) {
    await this.ensureInitialized();
    const token = await this.contract!.getToken(tokenId);
    return {
      id: Number(token.id),
      creator: token.creator,
      name: token.name,
      totalSupply: Number(token.totalSupply),
      features: token.features,
      parentId: Number(token.parentId),
      dateCreated: Number(token.dateCreated),
    };
  }

  /**
   * Get token balance for specific address
   */
  async getTokenBalance(tokenId: number, address: string): Promise<number> {
    await this.ensureInitialized();
    const balance = await this.contract!.getTokenBalance(tokenId, address);
    return Number(balance);
  }

  /**
   * Get all token IDs owned by user
   */
  async getUserTokens(address: string): Promise<number[]> {
    await this.ensureInitialized();
    const tokens = await this.contract!.getUserTokens(address);
    return tokens.map((id: bigint) => Number(id));
  }

  /**
   * Get multiple tokens information (batch request)
   */
  async getTokensBatch(tokenIds: number[]) {
    await this.ensureInitialized();
    const promises = tokenIds.map((id) => this.getToken(id));
    return await Promise.all(promises);
  }

  // ============================================
  // TRANSFER MANAGEMENT
  // ============================================

  /**
   * Initiate a transfer
   */
  async transfer(to: string, tokenId: number, amount: number) {
    await this.ensureInitialized();
    const tx = await this.contract!.transfer(to, tokenId, amount);
    await tx.wait();
    return tx;
  }

  /**
   * Accept a pending transfer
   */
  async acceptTransfer(transferId: number) {
    await this.ensureInitialized();
    const tx = await this.contract!.acceptTransfer(transferId);
    await tx.wait();
    return tx;
  }

  /**
   * Reject a pending transfer
   */
  async rejectTransfer(transferId: number) {
    await this.ensureInitialized();
    const tx = await this.contract!.rejectTransfer(transferId);
    await tx.wait();
    return tx;
  }

  /**
   * Get transfer information by ID
   */
  async getTransfer(transferId: number) {
    await this.ensureInitialized();
    const transfer = await this.contract!.getTransfer(transferId);
    return {
      id: Number(transfer.id),
      from: transfer.from,
      to: transfer.to,
      tokenId: Number(transfer.tokenId),
      dateCreated: Number(transfer.dateCreated),
      amount: Number(transfer.amount),
      status: Number(transfer.status),
    };
  }

  /**
   * Get all transfer IDs involving a user
   */
  async getUserTransfers(address: string): Promise<number[]> {
    await this.ensureInitialized();
    const transfers = await this.contract!.getUserTransfers(address);
    return transfers.map((id: bigint) => Number(id));
  }

  /**
   * Get multiple transfers information (batch request)
   */
  async getTransfersBatch(transferIds: number[]) {
    await this.ensureInitialized();
    const promises = transferIds.map((id) => this.getTransfer(id));
    return await Promise.all(promises);
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Get next token ID (for UI display)
   */
  async getNextTokenId(): Promise<number> {
    await this.ensureInitialized();
    const nextId = await this.contract!.nextTokenId();
    return Number(nextId);
  }

  /**
   * Get next transfer ID (for UI display)
   */
  async getNextTransferId(): Promise<number> {
    await this.ensureInitialized();
    const nextId = await this.contract!.nextTransferId();
    return Number(nextId);
  }

  /**
   * Get next user ID (for UI display)
   */
  async getNextUserId(): Promise<number> {
    await this.ensureInitialized();
    const nextId = await this.contract!.nextUserId();
    return Number(nextId);
  }
}

// Export singleton instance
export const web3Service = new Web3Service();

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

