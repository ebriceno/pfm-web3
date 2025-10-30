'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { web3Service } from '@/lib/web3';
import { UserStatus } from '@/contracts/config';

/**
 * User information from contract
 */
interface UserInfo {
  id: number;
  userAddress: string;
  role: string;
  status: number;
}

/**
 * Web3 Context Type
 */
interface Web3ContextType {
  // Connection state
  account: string | null;
  isConnected: boolean;
  isLoading: boolean;
  
  // User state
  userInfo: UserInfo | null;
  isAdmin: boolean;
  isApproved: boolean;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshUserInfo: () => Promise<void>;
  
  // Error state
  error: string | null;
  clearError: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

/**
 * Web3 Provider Component
 * Manages global Web3 state with localStorage persistence
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user information from contract
   */
  const loadUserInfo = async (address: string) => {
    try {
      // First check if address is admin
      const adminStatus = await web3Service.isAdmin(address);
      setIsAdmin(adminStatus);

      // Try to get user info (admin might not be registered as a user)
      try {
        const info = await web3Service.getUserInfo(address);
        setUserInfo(info);
      } catch {
        // If admin, it's OK to not have user info
        if (adminStatus) {
          console.log('Admin account - no user info needed');
          setUserInfo(null);
        } else {
          // Non-admin should have user info or be able to register
          console.log('User not registered yet');
          setUserInfo(null);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load user info:', err);
      setUserInfo(null);
      setIsAdmin(false);
    }
  };

  /**
   * Connect wallet
   */
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if MetaMask is installed
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.');
      }

      // Check network
      const chainId = await web3Service.getChainId();
      if (chainId !== '0x7a69') {
        // Not on Anvil, try to switch
        try {
          await web3Service.switchToAnvilNetwork();
        } catch {
          throw new Error('Please switch to Anvil Local network (Chain ID: 31337)');
        }
      }

      // Connect wallet
      const address = await web3Service.connectWallet();
      setAccount(address);
      localStorage.setItem('connectedAccount', address);

      // Load user info
      await loadUserInfo(address);
    } catch (err: unknown) {
      console.error('Failed to connect wallet:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnectWallet = () => {
    setAccount(null);
    setUserInfo(null);
    setIsAdmin(false);
    localStorage.removeItem('connectedAccount');
  };

  /**
   * Refresh user info (for when status changes)
   */
  const refreshUserInfo = async () => {
    if (account) {
      await loadUserInfo(account);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Handle account change from MetaMask
   */
  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      disconnectWallet();
    } else if (accounts[0] !== account) {
      // Account changed - clear state first
      const newAccount = accounts[0];
      
      // Clear old state immediately
      setUserInfo(null);
      setIsAdmin(false);
      setError(null);
      
      // Update account
      setAccount(newAccount);
      localStorage.setItem('connectedAccount', newAccount);
      
      // Small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Load new user info
      await loadUserInfo(newAccount);
    }
  }, [account]);

  /**
   * Handle chain change from MetaMask
   */
  const handleChainChanged = useCallback((chainId: string) => {
    // Reload page on chain change (recommended by MetaMask)
    if (chainId !== '0x7a69') {
      setError('Wrong network. Please switch to Anvil Local (Chain ID: 31337)');
    } else {
      setError(null);
      window.location.reload();
    }
  }, []);

  /**
   * Initialize - Load from localStorage on mount
   */
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setIsLoading(true);

        // Check if we have a saved account
        const savedAccount = localStorage.getItem('connectedAccount');
        if (!savedAccount) {
          setIsLoading(false);
          return;
        }

        // Check if MetaMask is available
        if (typeof window === 'undefined' || !window.ethereum) {
          localStorage.removeItem('connectedAccount');
          setIsLoading(false);
          return;
        }

        // Initialize web3 service
        await web3Service.init();

        // Get current account from MetaMask
        const currentAccount = await web3Service.getAccount();

        // Verify saved account matches current account
        if (currentAccount?.toLowerCase() === savedAccount.toLowerCase()) {
          setAccount(currentAccount);
          await loadUserInfo(currentAccount);
        } else {
          // Account mismatch, clear saved data
          localStorage.removeItem('connectedAccount');
        }
      } catch (err) {
        console.error('Failed to restore connection:', err);
        localStorage.removeItem('connectedAccount');
      } finally {
        setIsLoading(false);
      }
    };

    initializeConnection();
  }, []);

  /**
   * Setup MetaMask event listeners
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // Listen for chain changes
    window.ethereum.on('chainChanged', handleChainChanged);

    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, handleAccountsChanged, handleChainChanged]); // Re-run when account or handlers change

  const value: Web3ContextType = {
    // Connection state
    account,
    isConnected: !!account,
    isLoading,

    // User state
    userInfo,
    isAdmin,
    isApproved: userInfo?.status === UserStatus.Approved,

    // Actions
    connectWallet,
    disconnectWallet,
    refreshUserInfo,

    // Error state
    error,
    clearError,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

/**
 * Hook to use Web3 context
 * Must be used within Web3Provider
 */
export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
}

