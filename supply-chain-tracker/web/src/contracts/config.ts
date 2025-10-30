/**
 * Contract Configuration
 * Update CONTRACT_ADDRESS after deploying to Anvil
 */

export const CONTRACT_CONFIG = {
  /**
   * Contract address on Anvil local network
   * TODO: Update this after deploying with `forge script`
   */
  address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Default first deployment address on Anvil
  
  /**
   * Admin address (first account from Anvil)
   * This is the default first account that deploys the contract
   */
  adminAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
} as const;

/**
 * Anvil Local Network Configuration
 */
export const ANVIL_NETWORK = {
  chainId: '0x7a69', // 31337 in hex
  chainIdNumber: 31337,
  chainName: 'Anvil Local',
  rpcUrls: ['http://localhost:8545'],
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorerUrls: null, // No block explorer for local network
} as const;

/**
 * Test accounts from Anvil (for development/testing)
 * These are the default accounts Anvil provides
 */
export const TEST_ACCOUNTS = {
  admin: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  producer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  factory: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  retailer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  consumer: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
} as const;

/**
 * Enum mapping from Solidity
 */
export enum UserStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Canceled = 3,
}

export enum TransferStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
}

/**
 * Role constants
 */
export const ROLES = {
  PRODUCER: 'Producer',
  FACTORY: 'Factory',
  RETAILER: 'Retailer',
  CONSUMER: 'Consumer',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Role emojis for UI display
 */
export const ROLE_ICONS = {
  Producer: '👨‍🌾',
  Factory: '🏭',
  Retailer: '🏪',
  Consumer: '🛒',
  Admin: '👑',
} as const;

/**
 * Valid transfer paths by role
 */
export const VALID_TRANSFERS = {
  Producer: ['Factory'],
  Factory: ['Retailer'],
  Retailer: ['Consumer'],
  Consumer: [],
} as const;

