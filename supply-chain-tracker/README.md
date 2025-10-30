# 🔗 Supply Chain Tracker DApp

A blockchain-based supply chain tracking decentralized application (DApp) built with Solidity, Next.js, and ethers.js. This DApp provides complete traceability from raw material producers to end consumers through a transparent and immutable blockchain system.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity)
![Next.js](https://img.shields.io/badge/Next.js-16.0.1-000000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the DApp](#-running-the-dapp)
- [Testing](#-testing)
- [Usage Guide](#-usage-guide)
- [Smart Contract](#-smart-contract)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Functionality
- **🔐 Role-Based Access Control**: Four distinct roles (Producer, Factory, Retailer, Consumer)
- **🎫 Token-Based Product Tracking**: Each product batch is represented as a unique token
- **🔄 Controlled Transfer System**: Role-based transfer validation with accept/reject mechanism
- **📊 Complete Traceability**: Track products from raw materials to final consumer
- **👨‍💼 Admin Panel**: Centralized user management and system oversight
- **📱 Responsive Design**: Mobile-first design with hamburger menu
- **🔔 Toast Notifications**: Real-time feedback for all actions
- **💼 User Profiles**: Personal dashboard with portfolio and activity

### Technical Features
- **Smart Contract**: Fully tested Solidity contract (49 tests passing)
- **Frontend**: Modern Next.js 16 with TypeScript and Tailwind CSS
- **Web3 Integration**: ethers.js v6 for blockchain interaction
- **UI Components**: Radix UI primitives for accessibility
- **State Management**: React Context API for global state
- **Error Handling**: Error boundaries and graceful failure handling

---

## 🛠 Tech Stack

### Smart Contract
- **Solidity**: `^0.8.28`
- **Foundry**: Smart contract development framework
- **OpenZeppelin**: (Future) Security standards

### Frontend
- **Next.js**: `16.0.1` - React framework with App Router
- **TypeScript**: `^5.0` - Type safety
- **Tailwind CSS**: `^4.0` - Utility-first CSS
- **ethers.js**: `^6.15.0` - Ethereum library
- **Radix UI**: Accessible UI components
- **Lucide React**: Icon library

### Development Tools
- **Foundry**: Contract compilation and testing
- **Anvil**: Local Ethereum node
- **MetaMask**: Browser wallet

---

## 📁 Project Structure

```
supply-chain-tracker/
├── sc/                          # Smart Contract
│   ├── src/
│   │   └── SupplyChain.sol     # Main contract
│   ├── test/
│   │   └── SupplyChain.t.sol   # Contract tests (49 tests)
│   ├── script/
│   │   └── DeploySupplyChain.s.sol
│   └── foundry.toml
├── web/                         # Frontend
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   │   ├── page.tsx         # Landing + Registration
│   │   │   ├── dashboard/       # Role-based dashboard
│   │   │   ├── tokens/          # Token management
│   │   │   ├── transfers/       # Transfer system
│   │   │   ├── admin/           # Admin panel
│   │   │   └── profile/         # User profile
│   │   ├── components/          # Reusable components
│   │   │   ├── ui/              # UI primitives
│   │   │   ├── Header.tsx       # Navigation
│   │   │   ├── TokenCard.tsx    # Token display
│   │   │   └── ErrorBoundary.tsx
│   │   ├── contexts/
│   │   │   └── Web3Context.tsx  # Global Web3 state
│   │   ├── contracts/
│   │   │   ├── abi.ts           # Contract ABI
│   │   │   └── config.ts        # Contract config
│   │   ├── lib/
│   │   │   ├── web3.ts          # Web3 service layer
│   │   │   └── utils.ts         # Helper functions
│   │   └── hooks/
│   │       └── use-toast.ts     # Toast notifications
│   ├── package.json
│   └── tailwind.config.ts
├── DEVELOPMENT_PLAN.md          # Step-by-step plan
├── TESTING_GUIDE.md             # Testing documentation
├── EDGE_CASES_CHECKLIST.md      # Edge cases testing
├── DEPLOYMENT_GUIDE.md          # Deployment instructions
└── README.md                    # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**: Latest version
- **Foundry**: [Installation guide](https://book.getfoundry.sh/getting-started/installation)
- **MetaMask**: Browser extension ([Download](https://metamask.io/download/))
- **Git**: Version control

### Check Installations
```bash
node --version    # Should be v18+
npm --version     # Should be v9+
forge --version   # Should show foundry version
```

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd supply-chain-tracker
```

### 2. Install Smart Contract Dependencies
```bash
cd sc
forge install
```

### 3. Install Frontend Dependencies
```bash
cd ../web
npm install
```

---

## 💻 Running the DApp

### Step 1: Start Local Blockchain (Anvil)

Open a terminal and run:

```bash
cd sc
anvil
```

**Important**: Keep this terminal running. Note the default accounts and private keys displayed.

**Default Accounts:**
- Account #0 (Admin): `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Account #1 (Producer): `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Account #2 (Factory): `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- Account #3 (Retailer): `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- Account #4 (Consumer): `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`

---

### Step 2: Deploy Smart Contract

Open a **new terminal** and run:

```bash
cd sc
forge script script/DeploySupplyChain.s.sol:DeploySupplyChain \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

**Expected Output:**
```
==============================================
SupplyChain Contract Deployed!
==============================================
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Admin Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
==============================================
```

**📝 Important**: Copy the `Contract Address` - you'll need it in the next step!

---

### Step 3: Update Frontend Configuration

Edit `web/src/contracts/config.ts` and update the contract address:

```typescript
export const CONTRACT_CONFIG = {
  address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // 👈 Paste your contract address here
  adminAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
} as const;
```

---

### Step 4: Configure MetaMask

1. **Add Local Network**:
   - Open MetaMask
   - Click network dropdown → "Add Network" → "Add a network manually"
   - Fill in:
     - **Network Name**: `Anvil Local`
     - **RPC URL**: `http://localhost:8545`
     - **Chain ID**: `31337`
     - **Currency Symbol**: `ETH`
   - Save

2. **Import Test Accounts**:
   - Click account icon → "Import Account"
   - Paste private key from Anvil output
   - Repeat for multiple accounts (Admin, Producer, Factory, Retailer, Consumer)

---

### Step 5: Start Frontend

Open a **new terminal** and run:

```bash
cd web
npm run dev
```

The application will be available at: **http://localhost:3000**

---

## 🧪 Testing

### Smart Contract Tests

Run all 49 tests:

```bash
cd sc
forge test
```

Run with verbosity:

```bash
forge test -vv
```

Run specific test:

```bash
forge test --match-test testCompleteSupplyChainFlow -vvv
```

Test coverage:

```bash
forge coverage
```

---

### Integration Testing

Follow the comprehensive testing guide in `TESTING_GUIDE.md`:

```bash
# See TESTING_GUIDE.md for detailed test scenarios
# See EDGE_CASES_CHECKLIST.md for edge cases
```

---

## 📖 Usage Guide

### For Admin (Account #0)

1. **Connect Wallet**: Connect with admin account (default Account #0)
2. **Access Admin Panel**: Navigate to `/admin`
3. **Approve Users**:
   - Go to `/admin/users`
   - Review pending user registrations
   - Click "Approve" or "Reject" for each user
4. **Monitor System**: View statistics and user activity

---

### For Producer (Raw Materials)

1. **Register**:
   - Connect wallet with Producer account
   - Select "Producer" role
   - Wait for admin approval

2. **Create Raw Material Token**:
   - Navigate to "Tokens" → "Create Token"
   - Enter token details:
     - Name: `Wheat`
     - Total Supply: `1000`
     - Features: `{"grade": "A", "organic": true}`
   - Submit and approve transaction

3. **Transfer to Factory**:
   - Select token → "Transfer"
   - Enter Factory address
   - Enter amount (e.g., 500)
   - Submit transfer

---

### For Factory (Processing)

1. **Register**: Select "Factory" role and wait for approval

2. **Accept Incoming Materials**:
   - Go to "Transfers"
   - Review pending transfers from Producer
   - Click "Accept"

3. **Create Processed Product**:
   - Go to "Create Token"
   - Enter product details:
     - Name: `Flour`
     - Total Supply: `400`
     - Parent Token: Select "Wheat"
     - Features: `{"processed": true, "quality": "premium"}`
   - Submit transaction

4. **Transfer to Retailer**: Same as Producer → Factory flow

---

### For Retailer (Distribution)

1. **Register**: Select "Retailer" role
2. **Accept from Factory**: Accept processed products
3. **Create Retail Product**: Package products with retail information
4. **Transfer to Consumer**: Distribute to end consumers

---

### For Consumer (End User)

1. **Register**: Select "Consumer" role
2. **Accept Products**: Accept transfers from Retailer
3. **View Products**: Navigate to "Tokens" to see owned products
4. **Trace Supply Chain**:
   - Click on any token
   - Click "Parent Token" link
   - Follow chain back to raw materials

**Note**: Consumers cannot create tokens or initiate transfers.

---

## 📜 Smart Contract

### SupplyChain.sol

**Main Features:**
- User registration and approval system
- Role-based access control (Producer, Factory, Retailer, Consumer)
- Token creation with parent-child relationships
- Two-step transfer system (request → accept/reject)
- Complete traceability through parent tokens

**Key Functions:**

```solidity
// User Management
function requestUserRole(string memory role) external
function changeStatusUser(address userAddress, UserStatus newStatus) external
function getUserInfo(address userAddress) external view returns (User memory)

// Token Management
function createToken(string memory name, uint256 totalSupply, uint256 parentId, string memory features) external
function getToken(uint256 tokenId) external view returns (Token memory)
function getTokenBalance(uint256 tokenId, address owner) external view returns (uint256)

// Transfer System
function transfer(address to, uint256 tokenId, uint256 amount) external
function acceptTransfer(uint256 transferId) external
function rejectTransfer(uint256 transferId) external
function getTransfer(uint256 transferId) external view returns (Transfer memory)
```

**Events:**
- `UserRegistered(address indexed userAddress, string role, uint256 userId)`
- `UserStatusChanged(address indexed userAddress, UserStatus newStatus)`
- `TokenCreated(uint256 indexed tokenId, address indexed creator, string name, uint256 totalSupply, uint256 parentId)`
- `TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount)`
- `TransferAccepted(uint256 indexed transferId)`
- `TransferRejected(uint256 indexed transferId)`

---

## 🚀 Deployment

### Deploy to Testnet (Sepolia)

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

**Quick Steps:**

1. **Get Testnet ETH**:
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Request test ETH

2. **Update Environment**:
   ```bash
   cd sc
   # Add to .env file
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   PRIVATE_KEY=your_private_key_here
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

3. **Deploy Contract**:
   ```bash
   forge script script/DeploySupplyChain.s.sol:DeploySupplyChain \
     --rpc-url $SEPOLIA_RPC_URL \
     --private-key $PRIVATE_KEY \
     --broadcast \
     --verify
   ```

4. **Update Frontend Config**: Update contract address in `web/src/contracts/config.ts`

5. **Deploy Frontend**: Deploy to Vercel, Netlify, or your preferred hosting

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "MetaMask not installed" Error
**Solution**: Install MetaMask browser extension from https://metamask.io

---

#### 2. "User rejected transaction"
**Solution**: Click "Confirm" in MetaMask when prompted

---

#### 3. "Insufficient funds" Error
**Solution**: 
- For Anvil: Accounts have 10,000 ETH by default
- For Testnet: Get testnet ETH from faucet

---

#### 4. "Contract not deployed" Error
**Solution**:
- Ensure Anvil is running
- Redeploy contract using Step 2
- Update contract address in `config.ts`

---

#### 5. "Network mismatch" Error
**Solution**: Switch MetaMask to "Anvil Local" network (Chain ID: 31337)

---

#### 6. "Admin showing as Retailer"
**Solution**:
- Clear browser localStorage
- Disconnect and reconnect wallet
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

---

#### 7. Page not loading after account switch
**Solution**: The app automatically reloads when you switch accounts in MetaMask. Wait a few seconds.

---

#### 8. Toast notifications not appearing
**Solution**: Check browser console for errors. Toasts should appear in the top-right corner.

---

### Debug Mode

Enable verbose logging:

```typescript
// In web/src/lib/web3.ts
console.log('Web3 Debug:', ...);
```

Check Anvil logs for transaction details.

---

## 📚 Additional Documentation

- **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)**: Step-by-step development guide (11 phases)
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)**: Comprehensive testing procedures
- **[EDGE_CASES_CHECKLIST.md](./EDGE_CASES_CHECKLIST.md)**: Edge cases and bug tracking
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**: Deployment instructions
- **[.cursorrules](./.cursorrules)**: Development standards and patterns
- **[SMART_CONTRACT_SPEC.md](./SMART_CONTRACT_SPEC.md)**: Contract specification
- **[FRONTEND_SPEC.md](./FRONTEND_SPEC.md)**: Frontend architecture

---

## 🎯 Project Milestones

- [x] Phase 1: Smart Contract Development (49 tests passing)
- [x] Phase 2: Frontend Foundation (Next.js + Web3 setup)
- [x] Phase 3: Deployment & Testing (Anvil local network)
- [x] Phase 4: Admin Panel (User management)
- [x] Phase 5: Token Management (CRUD operations)
- [x] Phase 6: Transfer System (Two-step transfers)
- [x] Phase 7: User Profile (Portfolio & activity)
- [x] Phase 8: Dashboard & Analytics (Role-based views)
- [x] Phase 9: UI/UX Polish (Toasts + Responsive)
- [x] Phase 10: Integration Testing (Documentation)
- [x] Phase 11: Documentation & Deployment

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards
- Follow the patterns in `.cursorrules`
- Write tests for new features
- Update documentation
- Use TypeScript strict mode
- Follow Solidity style guide

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Twitter: [@yourhandle](https://twitter.com/yourhandle)

---

## 🙏 Acknowledgments

- [Foundry](https://github.com/foundry-rs/foundry) - Smart contract development
- [Next.js](https://nextjs.org/) - React framework
- [ethers.js](https://docs.ethers.org/) - Ethereum library
- [Radix UI](https://www.radix-ui.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Icons

---

## 📞 Support

If you encounter any issues or have questions:

1. Check [Troubleshooting](#-troubleshooting) section
2. Search [existing issues](https://github.com/yourusername/supply-chain-tracker/issues)
3. Open a [new issue](https://github.com/yourusername/supply-chain-tracker/issues/new)

---

## 🗺️ Roadmap

### Future Enhancements
- [ ] Deploy to Ethereum mainnet
- [ ] Add multi-chain support (Polygon, BSC)
- [ ] Implement IPFS for product images
- [ ] Add QR code generation for products
- [ ] Create mobile app (React Native)
- [ ] Add GraphQL API
- [ ] Implement batch transfers
- [ ] Add role delegation
- [ ] Create analytics dashboard for supply chain insights
- [ ] Add notification system (email/push)
- [ ] Implement token burning/destruction
- [ ] Add dispute resolution mechanism

---

## 📊 Stats

- **Smart Contract**: 1 main contract, 49 tests, 100% passing
- **Frontend**: 15+ pages, 20+ components, fully responsive
- **Documentation**: 1,500+ lines of documentation
- **Development Time**: [Your time here]
- **Lines of Code**: ~3,000+ (Solidity + TypeScript)

---

<div align="center">

**Built with ❤️ using Blockchain Technology**

⭐ **Star this repo if you find it helpful!** ⭐

</div>

