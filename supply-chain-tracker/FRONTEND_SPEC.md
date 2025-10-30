# 🌐 Frontend Specification

## Application: Supply Chain Tracker Web Interface

**Version**: 0.1.0  
**Framework**: Next.js 16 (App Router)  
**React**: 19.2.0  
**TypeScript**: ^5

---

## 🎯 Technology Stack

### Core
- **Next.js**: 16.0.1
- **React**: 19.2.0
- **TypeScript**: ^5
- **Tailwind CSS**: ^4

### Web3
- **ethers.js**: ^6.x (to be installed)
- **MetaMask**: Browser extension

### UI Components
- **Radix UI** (Shadcn UI style):
  - @radix-ui/react-dialog
  - @radix-ui/react-select
  - @radix-ui/react-toast
- **Lucide React**: Icons
- **class-variance-authority**: Component variants
- **clsx + tailwind-merge**: Utility classes

---

## 📂 Project Structure

```
web/src/
├── app/                           # Next.js App Router pages
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Landing/Auth page
│   ├── globals.css                # Global styles
│   ├── dashboard/
│   │   └── page.tsx               # Dashboard
│   ├── tokens/
│   │   ├── page.tsx               # Token list
│   │   ├── create/
│   │   │   └── page.tsx           # Create token
│   │   └── [id]/
│   │       ├── page.tsx           # Token details
│   │       └── transfer/
│   │           └── page.tsx       # Transfer token
│   ├── transfers/
│   │   └── page.tsx               # Transfers management
│   ├── admin/
│   │   ├── page.tsx               # Admin dashboard
│   │   └── users/
│   │       └── page.tsx           # User management
│   └── profile/
│       └── page.tsx               # User profile
├── components/
│   ├── ui/                        # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   └── toast.tsx
│   ├── Header.tsx                 # Navigation header
│   ├── TokenCard.tsx              # Token display card
│   ├── TransferList.tsx           # Transfer list
│   └── UserTable.tsx              # User management table
├── contexts/
│   └── Web3Context.tsx            # Global Web3 state
├── hooks/
│   ├── useWallet.ts               # Wallet operations
│   └── useContract.ts             # Contract interactions
├── lib/
│   ├── web3.ts                    # Web3 service
│   └── utils.ts                   # Utility functions
└── contracts/
    ├── abi.ts                     # Contract ABI
    └── config.ts                  # Contract config
```

---

## 🎨 Design System

### Colors (Tailwind Classes)

```typescript
export const colors = {
  // Status colors
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  
  // Role colors
  producer: 'bg-blue-100 text-blue-800',
  factory: 'bg-purple-100 text-purple-800',
  retailer: 'bg-orange-100 text-orange-800',
  consumer: 'bg-green-100 text-green-800',
  admin: 'bg-red-100 text-red-800',
  
  // UI elements
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
}
```

### Typography

```typescript
// Headings
h1: 'text-4xl font-bold'
h2: 'text-3xl font-bold'
h3: 'text-2xl font-bold'
h4: 'text-xl font-semibold'

// Body
body: 'text-base text-gray-900'
small: 'text-sm text-gray-600'
tiny: 'text-xs text-gray-500'
```

### Spacing

```typescript
// Container padding
container: 'px-4 md:px-6 lg:px-8'

// Section spacing
section: 'py-8 md:py-12'

// Card spacing
card: 'p-4 md:p-6'
```

### Components Style Guide

#### Button
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  Action
</button>
```

#### Card
```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h3 className="text-xl font-bold mb-4">Title</h3>
  <div className="space-y-2">Content</div>
</div>
```

#### Badge
```tsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
  Label
</span>
```

---

## 🔧 Core Services

### Web3 Service (`lib/web3.ts`)

```typescript
import { BrowserProvider, Contract } from 'ethers'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/contracts/config'

class Web3Service {
  private provider: BrowserProvider | null = null
  private contract: Contract | null = null

  /**
   * Initialize Web3 provider and contract
   */
  async init() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed')
    }

    this.provider = new BrowserProvider(window.ethereum)
    const signer = await this.provider.getSigner()
    this.contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  }

  /**
   * Connect wallet
   */
  async connectWallet(): Promise<string> {
    if (!this.provider) await this.init()
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })
    return accounts[0]
  }

  /**
   * Get current account
   */
  async getAccount(): Promise<string | null> {
    if (!this.provider) return null
    const accounts = await this.provider.listAccounts()
    return accounts[0]?.address || null
  }

  /**
   * Contract: Get user info
   */
  async getUserInfo(address: string) {
    if (!this.contract) await this.init()
    try {
      const user = await this.contract.getUserInfo(address)
      return {
        id: Number(user.id),
        userAddress: user.userAddress,
        role: user.role,
        status: Number(user.status)
      }
    } catch (error) {
      // User not found
      return null
    }
  }

  /**
   * Contract: Request user role
   */
  async requestUserRole(role: string) {
    if (!this.contract) await this.init()
    const tx = await this.contract.requestUserRole(role)
    await tx.wait()
    return tx
  }

  /**
   * Contract: Change user status (admin only)
   */
  async changeUserStatus(userAddress: string, status: number) {
    if (!this.contract) await this.init()
    const tx = await this.contract.changeStatusUser(userAddress, status)
    await tx.wait()
    return tx
  }

  /**
   * Contract: Create token
   */
  async createToken(name: string, totalSupply: number, features: string, parentId: number) {
    if (!this.contract) await this.init()
    const tx = await this.contract.createToken(name, totalSupply, features, parentId)
    await tx.wait()
    return tx
  }

  /**
   * Contract: Get token
   */
  async getToken(tokenId: number) {
    if (!this.contract) await this.init()
    const token = await this.contract.getToken(tokenId)
    return {
      id: Number(token.id),
      creator: token.creator,
      name: token.name,
      totalSupply: Number(token.totalSupply),
      features: token.features,
      parentId: Number(token.parentId),
      dateCreated: Number(token.dateCreated)
    }
  }

  /**
   * Contract: Get token balance
   */
  async getTokenBalance(tokenId: number, address: string): Promise<number> {
    if (!this.contract) await this.init()
    const balance = await this.contract.getTokenBalance(tokenId, address)
    return Number(balance)
  }

  /**
   * Contract: Get user tokens
   */
  async getUserTokens(address: string): Promise<number[]> {
    if (!this.contract) await this.init()
    const tokens = await this.contract.getUserTokens(address)
    return tokens.map((id: any) => Number(id))
  }

  /**
   * Contract: Transfer
   */
  async transfer(to: string, tokenId: number, amount: number) {
    if (!this.contract) await this.init()
    const tx = await this.contract.transfer(to, tokenId, amount)
    await tx.wait()
    return tx
  }

  /**
   * Contract: Accept transfer
   */
  async acceptTransfer(transferId: number) {
    if (!this.contract) await this.init()
    const tx = await this.contract.acceptTransfer(transferId)
    await tx.wait()
    return tx
  }

  /**
   * Contract: Reject transfer
   */
  async rejectTransfer(transferId: number) {
    if (!this.contract) await this.init()
    const tx = await this.contract.rejectTransfer(transferId)
    await tx.wait()
    return tx
  }

  /**
   * Contract: Get transfer
   */
  async getTransfer(transferId: number) {
    if (!this.contract) await this.init()
    const transfer = await this.contract.getTransfer(transferId)
    return {
      id: Number(transfer.id),
      from: transfer.from,
      to: transfer.to,
      tokenId: Number(transfer.tokenId),
      dateCreated: Number(transfer.dateCreated),
      amount: Number(transfer.amount),
      status: Number(transfer.status)
    }
  }

  /**
   * Contract: Get user transfers
   */
  async getUserTransfers(address: string): Promise<number[]> {
    if (!this.contract) await this.init()
    const transfers = await this.contract.getUserTransfers(address)
    return transfers.map((id: any) => Number(id))
  }

  /**
   * Contract: Is admin
   */
  async isAdmin(address: string): Promise<boolean> {
    if (!this.contract) await this.init()
    return await this.contract.isAdmin(address)
  }
}

export const web3Service = new Web3Service()
```

---

## 🔐 Web3 Context (`contexts/Web3Context.tsx`)

```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { web3Service } from '@/lib/web3'

interface UserInfo {
  id: number
  userAddress: string
  role: string
  status: number
}

interface Web3ContextType {
  account: string | null
  userInfo: UserInfo | null
  isAdmin: boolean
  isConnected: boolean
  isApproved: boolean
  isLoading: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  refreshUserInfo: () => Promise<void>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const loadFromStorage = async () => {
      const savedAccount = localStorage.getItem('connectedAccount')
      if (savedAccount) {
        try {
          await web3Service.init()
          const currentAccount = await web3Service.getAccount()
          if (currentAccount?.toLowerCase() === savedAccount.toLowerCase()) {
            setAccount(currentAccount)
            await loadUserInfo(currentAccount)
          } else {
            localStorage.removeItem('connectedAccount')
          }
        } catch (error) {
          console.error('Failed to restore connection:', error)
          localStorage.removeItem('connectedAccount')
        }
      }
      setIsLoading(false)
    }
    loadFromStorage()
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      setAccount(accounts[0])
      localStorage.setItem('connectedAccount', accounts[0])
      await loadUserInfo(accounts[0])
    }
  }

  const handleChainChanged = () => {
    window.location.reload()
  }

  const loadUserInfo = async (address: string) => {
    try {
      const info = await web3Service.getUserInfo(address)
      setUserInfo(info)
      
      const adminStatus = await web3Service.isAdmin(address)
      setIsAdmin(adminStatus)
    } catch (error) {
      console.error('Failed to load user info:', error)
      setUserInfo(null)
      setIsAdmin(false)
    }
  }

  const connectWallet = async () => {
    try {
      setIsLoading(true)
      const address = await web3Service.connectWallet()
      setAccount(address)
      localStorage.setItem('connectedAccount', address)
      await loadUserInfo(address)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setUserInfo(null)
    setIsAdmin(false)
    localStorage.removeItem('connectedAccount')
  }

  const refreshUserInfo = async () => {
    if (account) {
      await loadUserInfo(account)
    }
  }

  const value = {
    account,
    userInfo,
    isAdmin,
    isConnected: !!account,
    isApproved: userInfo?.status === 1, // UserStatus.Approved = 1
    isLoading,
    connectWallet,
    disconnectWallet,
    refreshUserInfo
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error('useWeb3 must be used within Web3Provider')
  }
  return context
}
```

---

## 📄 Page Specifications

### 1. Landing Page (`app/page.tsx`)

**States**:
1. **Not Connected**: Show hero + "Connect MetaMask" button
2. **Connected - Not Registered**: Show registration form
3. **Connected - Pending**: Show waiting message
4. **Connected - Approved**: Show welcome + redirect to dashboard
5. **Connected - Rejected**: Show rejection message

**Components**:
- Hero section
- Connect button
- Registration form (role selector)
- Status messages

### 2. Dashboard (`app/dashboard/page.tsx`)

**Role-Based Content**:
- **Producer**: Tokens created, transfers sent, quick create
- **Factory**: Tokens received, products created, inventory
- **Retailer**: Inventory, transfers to consumers
- **Consumer**: Products received, traceability
- **Admin**: System stats, user management link

**Components**:
- Stats cards
- Quick actions
- Recent activity feed

### 3. Token List (`app/tokens/page.tsx`)

**Features**:
- Grid/list of user's tokens
- Filter by token type
- Search by name
- Create token button
- Empty state

### 4. Create Token (`app/tokens/create/page.tsx`)

**Form Fields**:
- Name (required)
- Total Supply (required, number)
- Features (JSON, textarea with helper)
- Parent Token (select, only for Factory/Retailer)

**Validation**:
- Non-empty name
- Positive supply
- Valid JSON format for features
- Valid parent selection for Factory/Retailer

### 5. Token Details (`app/tokens/[id]/page.tsx`)

**Information**:
- Token details (name, supply, features)
- Creator info
- Creation date
- Current balance
- Parent token link (if exists)
- Transfer button
- Transfer history

### 6. Transfer Token (`app/tokens/[id]/transfer/page.tsx`)

**Form**:
- Token info display
- Recipient selector (filtered by valid roles)
- Amount input (max = balance)
- Confirm button

**Validation**:
- Valid recipient role
- Amount > 0 and <= balance
- Recipient is approved user

### 7. Transfers (`app/transfers/page.tsx`)

**Tabs**:
1. **Incoming Pending**: Accept/Reject buttons
2. **Outgoing Pending**: Waiting status
3. **History**: All past transfers

**Information per Transfer**:
- Token name
- From/To addresses
- Amount
- Status
- Date
- Actions (if pending incoming)

### 8. Admin Dashboard (`app/admin/page.tsx`)

**Stats**:
- Total users by status
- Total tokens
- Total transfers
- Recent activity

**Quick Links**:
- User management
- System overview

### 9. User Management (`app/admin/users/page.tsx`)

**Table Columns**:
- Address (truncated)
- Role
- Status
- Actions (Approve/Reject)

**Features**:
- Filter by status
- Search by address
- Bulk actions (future)

### 10. Profile (`app/profile/page.tsx`)

**Sections**:
- User information
- Token portfolio (tokens + balances)
- Activity timeline
- Statistics

---

## 🔌 Contract Integration

### Contract Configuration (`contracts/config.ts`)

```typescript
export const CONTRACT_ADDRESS = '0x...' // From deployment

export const ANVIL_NETWORK = {
  chainId: '0x7a69', // 31337 in hex
  chainName: 'Anvil Local',
  rpcUrls: ['http://localhost:8545'],
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  }
}

export const ADMIN_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

export const TEST_ACCOUNTS = {
  admin: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  producer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  factory: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  retailer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  consumer: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
}
```

### Contract ABI (`contracts/abi.ts`)

```typescript
// Extract from: sc/out/SupplyChain.sol/SupplyChain.json
export const CONTRACT_ABI = [
  // ... ABI array
]
```

---

## 🎯 Constants & Enums

### Enums

```typescript
export enum UserStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Canceled = 3
}

export enum TransferStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2
}

export const UserStatusLabels = {
  [UserStatus.Pending]: 'Pending',
  [UserStatus.Approved]: 'Approved',
  [UserStatus.Rejected]: 'Rejected',
  [UserStatus.Canceled]: 'Canceled'
}

export const TransferStatusLabels = {
  [TransferStatus.Pending]: 'Pending',
  [TransferStatus.Accepted]: 'Accepted',
  [TransferStatus.Rejected]: 'Rejected'
}
```

### Roles

```typescript
export const ROLES = {
  PRODUCER: 'Producer',
  FACTORY: 'Factory',
  RETAILER: 'Retailer',
  CONSUMER: 'Consumer'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const ROLE_ICONS = {
  Producer: '👨‍🌾',
  Factory: '🏭',
  Retailer: '🏪',
  Consumer: '🛒',
  Admin: '👑'
}

export const VALID_TRANSFERS = {
  Producer: ['Factory'],
  Factory: ['Retailer'],
  Retailer: ['Consumer'],
  Consumer: []
}
```

---

## 🛠️ Utility Functions (`lib/utils.ts`)

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Truncate Ethereum address
 */
export function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Format date from timestamp
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Parse JSON safely
 */
export function parseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    Producer: 'bg-blue-100 text-blue-800',
    Factory: 'bg-purple-100 text-purple-800',
    Retailer: 'bg-orange-100 text-orange-800',
    Consumer: 'bg-green-100 text-green-800',
    Admin: 'bg-red-100 text-red-800'
  }
  return colors[role] || 'bg-gray-100 text-gray-800'
}

/**
 * Get status badge color
 */
export function getStatusBadgeColor(status: number): string {
  const colors = [
    'bg-yellow-100 text-yellow-800', // Pending
    'bg-green-100 text-green-800',   // Approved
    'bg-red-100 text-red-800',       // Rejected
    'bg-gray-100 text-gray-800'      // Canceled
  ]
  return colors[status] || 'bg-gray-100 text-gray-800'
}
```

---

## 🚨 Error Handling

### Error Types

```typescript
export class Web3Error extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'Web3Error'
  }
}

export function handleWeb3Error(error: any): string {
  // MetaMask user rejection
  if (error.code === 4001) {
    return 'Transaction rejected by user'
  }
  
  // Contract revert
  if (error.code === 'CALL_EXCEPTION') {
    return error.reason || 'Transaction failed'
  }
  
  // Network error
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection.'
  }
  
  // Generic error
  return error.message || 'An unexpected error occurred'
}
```

---

## ✅ Testing Checklist

### Manual Testing Scenarios

#### User Flow
- [ ] Connect MetaMask
- [ ] Register as each role
- [ ] Admin approves user
- [ ] Admin rejects user
- [ ] Approved user can access system
- [ ] Rejected user cannot operate

#### Token Flow
- [ ] Producer creates raw material
- [ ] Factory creates product with parent
- [ ] Retailer creates product with parent
- [ ] Consumer cannot create token
- [ ] Token balance displays correctly

#### Transfer Flow
- [ ] Producer → Factory transfer
- [ ] Factory → Retailer transfer
- [ ] Retailer → Consumer transfer
- [ ] Accept transfer updates balances
- [ ] Reject transfer keeps balances
- [ ] Invalid role transfer blocked
- [ ] Consumer cannot transfer

#### UI/UX
- [ ] All pages responsive on mobile
- [ ] Loading states show during transactions
- [ ] Error messages display correctly
- [ ] Success toasts appear
- [ ] Empty states show when no data
- [ ] Navigation works correctly

#### Edge Cases
- [ ] MetaMask not installed
- [ ] Wrong network
- [ ] Account disconnection
- [ ] Transaction rejection
- [ ] Insufficient balance
- [ ] Network errors

---

## 📱 Responsive Breakpoints

```typescript
// Tailwind breakpoints
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
```

---

## 🎯 Performance Guidelines

1. **Lazy Loading**: Use dynamic imports for heavy pages
2. **Memoization**: Use React.memo for expensive components
3. **Debouncing**: Debounce search inputs
4. **Caching**: Cache contract reads when appropriate
5. **Optimization**: Minimize re-renders with proper state management

---

## 🔒 Security Best Practices

1. ✅ Never expose private keys
2. ✅ Validate all user inputs
3. ✅ Sanitize displayed data (addresses, JSON)
4. ✅ Use environment variables for config
5. ✅ Handle MetaMask errors gracefully
6. ✅ Validate transactions before signing
7. ✅ Check network ID before operations

---

## 📚 Dependencies to Install

```bash
npm install ethers@^6
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
```

---

**Last Updated**: 2025-10-30  
**Status**: Specification Complete - Ready for Implementation

