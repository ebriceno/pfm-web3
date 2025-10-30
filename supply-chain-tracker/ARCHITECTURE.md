# Architecture Overview - Supply Chain Tracker DApp

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages (App Router)                                   │  │
│  │  ├─ Landing / Registration                            │  │
│  │  ├─ Dashboard (Role-based)                            │  │
│  │  ├─ Tokens (CRUD)                                     │  │
│  │  ├─ Transfers (Create/Accept/Reject)                  │  │
│  │  ├─ Admin Panel                                       │  │
│  │  └─ Profile                                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Components Layer                                     │  │
│  │  ├─ UI Primitives (Radix UI)                          │  │
│  │  ├─ Business Components (TokenCard, Header, etc.)     │  │
│  │  └─ Error Boundaries                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  State Management                                     │  │
│  │  ├─ Web3Context (Global wallet state)                 │  │
│  │  ├─ React State (Local component state)               │  │
│  │  └─ localStorage (Persistence)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services Layer                                       │  │
│  │  ├─ Web3Service (Singleton)                           │  │
│  │  ├─ Contract Interactions (ethers.js)                 │  │
│  │  └─ Utils & Helpers                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ ethers.js v6
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                         MetaMask                              │
│              (Browser Extension Wallet)                       │
└─────────────────────────────┬─────────────────────────────────┘
                              │
                              │ JSON-RPC
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                    Ethereum Network                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Smart Contract (SupplyChain.sol)                     │   │
│  │                                                        │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  State Variables                             │    │   │
│  │  │  ├─ Users (mapping)                          │    │   │
│  │  │  ├─ Tokens (mapping)                         │    │   │
│  │  │  ├─ Transfers (mapping)                      │    │   │
│  │  │  ├─ Balances (nested mapping)                │    │   │
│  │  │  └─ Counters (IDs)                           │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                        │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  Functions                                   │    │   │
│  │  │  ├─ User Management                          │    │   │
│  │  │  │  ├─ requestUserRole()                     │    │   │
│  │  │  │  ├─ changeStatusUser()                    │    │   │
│  │  │  │  └─ getUserInfo()                         │    │   │
│  │  │  ├─ Token Management                         │    │   │
│  │  │  │  ├─ createToken()                         │    │   │
│  │  │  │  ├─ getToken()                            │    │   │
│  │  │  │  └─ getTokenBalance()                     │    │   │
│  │  │  └─ Transfer Management                      │    │   │
│  │  │     ├─ transfer()                            │    │   │
│  │  │     ├─ acceptTransfer()                      │    │   │
│  │  │     └─ rejectTransfer()                      │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                        │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  Events                                      │    │   │
│  │  │  ├─ UserRegistered                           │    │   │
│  │  │  ├─ UserStatusChanged                        │    │   │
│  │  │  ├─ TokenCreated                             │    │   │
│  │  │  ├─ TransferRequested                        │    │   │
│  │  │  ├─ TransferAccepted                         │    │   │
│  │  │  └─ TransferRejected                         │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### User Registration Flow
```
User (Browser)
    │
    ├─► Click "Register"
    │
    ├─► Select Role (Producer/Factory/Retailer/Consumer)
    │
    ├─► Frontend validates selection
    │
    ├─► Web3Service.requestUserRole(role)
    │
    ├─► ethers.js prepares transaction
    │
    ├─► MetaMask prompts user confirmation
    │
    ├─► User approves → Transaction sent to blockchain
    │
    ├─► Smart Contract executes requestUserRole()
    │       │
    │       ├─► Validates role string
    │       ├─► Creates User struct
    │       ├─► Sets status = Pending (0)
    │       ├─► Emits UserRegistered event
    │       └─► Returns
    │
    ├─► Transaction mined
    │
    ├─► Frontend detects confirmation
    │
    ├─► Toast notification: "Registration Submitted!"
    │
    └─► UI updates to "Pending Approval" state
```

### Token Creation Flow
```
Approved User (Producer/Factory/Retailer)
    │
    ├─► Navigate to /tokens/create
    │
    ├─► Fill form:
    │   ├─ Token Name
    │   ├─ Total Supply
    │   ├─ Parent Token (if Factory/Retailer)
    │   └─ Features (JSON)
    │
    ├─► Frontend validation
    │   ├─ Check non-empty fields
    │   ├─ Validate JSON features
    │   └─ Check role requirements
    │
    ├─► Web3Service.createToken(...)
    │
    ├─► MetaMask confirmation
    │
    ├─► Smart Contract.createToken()
    │       │
    │       ├─► Check user approved
    │       ├─► Validate role-based rules:
    │       │   ├─ Producer: parentId must be 0
    │       │   ├─ Factory/Retailer: parentId > 0 required
    │       │   └─ Consumer: blocked
    │       ├─► Create Token struct
    │       ├─► Set balance[tokenId][creator] = totalSupply
    │       ├─► Emit TokenCreated event
    │       └─► Return tokenId
    │
    ├─► Transaction mined
    │
    ├─► Toast: "Token Created Successfully!"
    │
    └─► Redirect to /tokens (shows new token)
```

### Transfer Flow (Two-Step Process)
```
Step 1: Initiate Transfer
─────────────────────────
Sender (Owner of tokens)
    │
    ├─► Navigate to /transfers/create
    │
    ├─► Fill form:
    │   ├─ Select Token
    │   ├─ Enter Recipient Address
    │   └─ Enter Amount
    │
    ├─► Frontend validation
    │   ├─ Check amount <= balance
    │   ├─ Validate recipient address
    │   └─ Check role compatibility
    │
    ├─► Web3Service.transfer(to, tokenId, amount)
    │
    ├─► Smart Contract.transfer()
    │       │
    │       ├─► Validate sender owns tokens
    │       ├─► Check sufficient balance
    │       ├─► Validate role-based transfer rules:
    │       │   ├─ Producer → Factory ✓
    │       │   ├─ Factory → Retailer ✓
    │       │   ├─ Retailer → Consumer ✓
    │       │   └─ Consumer → Anyone ✗
    │       ├─► Create Transfer struct (status = Pending)
    │       ├─► Emit TransferRequested event
    │       └─► Return transferId
    │
    ├─► Transaction mined
    │
    ├─► Toast: "Transfer Created!"
    │
    └─► Status: PENDING (balances NOT yet changed)

Step 2: Accept/Reject Transfer
────────────────────────────────
Recipient
    │
    ├─► Navigate to /transfers
    │
    ├─► See pending incoming transfer
    │
    ├─► Click "Accept" or "Reject"
    │
    ├─► If Accept: Web3Service.acceptTransfer(transferId)
    │       │
    │       └─► Smart Contract.acceptTransfer()
    │               │
    │               ├─► Verify msg.sender == transfer.to
    │               ├─► Check transfer status == Pending
    │               ├─► Update balances:
    │               │   ├─ balances[tokenId][from] -= amount
    │               │   └─ balances[tokenId][to] += amount
    │               ├─► Set transfer.status = Accepted (1)
    │               ├─► Emit TransferAccepted event
    │               └─► Return
    │
    ├─► If Reject: Web3Service.rejectTransfer(transferId)
    │       │
    │       └─► Smart Contract.rejectTransfer()
    │               │
    │               ├─► Verify msg.sender == transfer.to
    │               ├─► Check transfer status == Pending
    │               ├─► Set transfer.status = Rejected (2)
    │               ├─► Emit TransferRejected event
    │               └─► Return (no balance changes)
    │
    ├─► Transaction mined
    │
    ├─► Toast: "Transfer Accepted!" or "Transfer Rejected"
    │
    └─► UI updates with new balances (if accepted)
```

---

## Frontend Architecture

### Directory Structure
```
web/src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Web3Provider, Header, Toaster)
│   ├── page.tsx                  # Landing + Registration
│   ├── dashboard/
│   │   └── page.tsx              # Role-based dashboard
│   ├── tokens/
│   │   ├── page.tsx              # Token list
│   │   ├── create/
│   │   │   └── page.tsx          # Token creation form
│   │   └── [id]/
│   │       └── page.tsx          # Token details
│   ├── transfers/
│   │   ├── page.tsx              # Transfers list
│   │   └── create/
│   │       └── page.tsx          # Transfer creation form
│   ├── admin/
│   │   ├── page.tsx              # Admin dashboard
│   │   └── users/
│   │       └── page.tsx          # User management
│   └── profile/
│       └── page.tsx              # User profile
│
├── components/
│   ├── ui/                       # Reusable UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   ├── Header.tsx                # Navigation (with mobile menu)
│   ├── TokenCard.tsx             # Token display component
│   └── ErrorBoundary.tsx         # Error catching component
│
├── contexts/
│   └── Web3Context.tsx           # Global Web3 state management
│
├── lib/
│   ├── web3.ts                   # Web3Service (singleton)
│   └── utils.ts                  # Helper functions
│
├── hooks/
│   └── use-toast.ts              # Toast notifications hook
│
└── contracts/
    ├── abi.ts                    # Contract ABI
    └── config.ts                 # Contract configuration
```

### State Management Layers

1. **Global State (Web3Context)**:
   - Wallet connection status
   - Current account
   - User information (role, status)
   - Admin status
   - Loading states
   - Error messages

2. **Local Component State**:
   - Form inputs
   - UI states (modals, dropdowns)
   - Temporary data
   - Pagination

3. **Persistent State (localStorage)**:
   - Connected account address
   - User preferences (future)

### Component Patterns

#### 1. Page Component Pattern
```typescript
export default function SomePage() {
  const { isConnected, userInfo, isApproved } = useWeb3();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Access control
  useEffect(() => {
    if (!isConnected || !isApproved) {
      router.push('/');
    }
  }, [isConnected, isApproved]);
  
  // Data fetching
  useEffect(() => {
    async function fetchData() {
      // Fetch from blockchain
    }
    fetchData();
  }, [dependencies]);
  
  // Render: Loading → Empty → Data
  if (isLoading) return <Loader />;
  if (data.length === 0) return <EmptyState />;
  return <DataDisplay />;
}
```

#### 2. Form Component Pattern
```typescript
function FormComponent() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await web3Service.someFunction(...);
      toast({ title: 'Success!', variant: 'success' });
      router.push('/destination');
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## Smart Contract Architecture

### Data Structures

```solidity
enum UserStatus { Pending, Approved, Rejected, Cancelled }
enum TransferStatus { Pending, Accepted, Rejected, Cancelled }

struct User {
    uint256 id;
    address userAddress;
    string role;
    UserStatus status;
}

struct Token {
    uint256 id;
    string name;
    uint256 totalSupply;
    address creator;
    uint256 dateCreated;
    uint256 parentId;
    string features;
}

struct Transfer {
    uint256 id;
    address from;
    address to;
    uint256 tokenId;
    uint256 amount;
    TransferStatus status;
    uint256 dateCreated;
}
```

### Storage Layout

```
Storage Slot Layout:
├─ admin (address) → slot 0
├─ nextUserId (uint256) → slot 1
├─ nextTokenId (uint256) → slot 2
├─ nextTransferId (uint256) → slot 3
├─ users (mapping: uint256 => User) → slot 4
├─ tokens (mapping: uint256 => Token) → slot 5
├─ transfers (mapping: uint256 => Transfer) → slot 6
├─ addressToUserId (mapping: address => uint256) → slot 7
├─ userTokens (mapping: address => uint256[]) → slot 8
├─ userTransfers (mapping: address => uint256[]) → slot 9
└─ balances (mapping: uint256 => mapping: address => uint256) → slot 10
```

### Gas Optimization Strategies

1. **Packed Structs**: Enums use uint8, dates use uint256
2. **Mappings over Arrays**: O(1) access time
3. **Minimal Storage**: Only essential data on-chain
4. **View Functions**: No gas for reads
5. **Events**: Cheaper than storage for historical data

---

## Security Architecture

### Smart Contract Security

1. **Access Control**:
   - Admin-only functions (`onlyAdmin` pattern)
   - Role-based validations
   - Ownership checks

2. **State Validation**:
   - Require statements for all inputs
   - Status checks (prevent double-accept, etc.)
   - Balance checks before transfers

3. **Immutability**:
   - Admin address set at deployment
   - No upgrade mechanism (explicit choice)
   - Transparent, auditable code

### Frontend Security

1. **Input Validation**:
   - Client-side form validation
   - Address format validation
   - Amount range checks

2. **Transaction Safety**:
   - User confirmation via MetaMask
   - Error handling for rejections
   - Transaction status tracking

3. **Data Integrity**:
   - Read directly from blockchain
   - No off-chain data manipulation
   - Event-based updates

---

## Performance Considerations

### Frontend
- **Code Splitting**: Next.js automatic splitting
- **Lazy Loading**: Components loaded on demand
- **Caching**: React memoization, localStorage
- **Optimistic UI**: Immediate feedback, confirm later

### Blockchain
- **Batch Reads**: Fetch multiple tokens at once
- **View Functions**: Free to call
- **Event Indexing**: Future enhancement with The Graph
- **L2 Scaling**: Consider Polygon/Arbitrum for production

---

## Future Enhancements

1. **Multi-chain Support**: Deploy to multiple networks
2. **IPFS Integration**: Store product images/documents
3. **The Graph**: Index events for efficient queries
4. **Mobile App**: React Native version
5. **Analytics**: On-chain analytics dashboard
6. **Notifications**: Email/push for important events
7. **Batch Operations**: Transfer multiple tokens at once
8. **Role Delegation**: Sub-accounts with permissions
9. **Token Burning**: Destroy tokens when consumed
10. **Dispute Resolution**: On-chain arbitration

---

## Technology Decisions

### Why Foundry?
- Fast compilation and testing
- Built-in scripting
- No external dependencies
- Professional-grade tooling

### Why Next.js?
- React framework with App Router
- Server-side rendering
- Excellent DX
- Production-ready

### Why ethers.js?
- Well-maintained
- TypeScript support
- Comprehensive documentation
- Industry standard

### Why Radix UI?
- Accessible by default
- Unstyled (flexible)
- Production-ready
- Excellent documentation

---

## Conclusion

This architecture provides:
- ✅ **Separation of Concerns**: Clear layers (Contract, Service, Context, UI)
- ✅ **Scalability**: Easy to add new features
- ✅ **Maintainability**: Clean code, well-documented
- ✅ **Security**: Multiple validation layers
- ✅ **Performance**: Optimized for Web3 interactions
- ✅ **User Experience**: Responsive, intuitive, feedback-rich

The system is production-ready for deployment to testnet/mainnet with appropriate auditing.

