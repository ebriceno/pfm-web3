# Deployment Guide - Supply Chain Tracker DApp

## Overview
This guide provides step-by-step instructions for deploying the Supply Chain Tracker DApp to various networks.

---

## Table of Contents
1. [Local Development (Anvil)](#local-development-anvil)
2. [Testnet Deployment (Sepolia)](#testnet-deployment-sepolia)
3. [Mainnet Deployment](#mainnet-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Local Development (Anvil)

### Already Covered
See main `README.md` for complete local setup instructions.

**Quick Reference:**
```bash
# Terminal 1: Start Anvil
cd sc && anvil

# Terminal 2: Deploy Contract
forge script script/DeploySupplyChain.s.sol:DeploySupplyChain \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# Terminal 3: Start Frontend
cd web && npm run dev
```

---

## Testnet Deployment (Sepolia)

### Prerequisites

1. **Get Testnet ETH**
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Connect your wallet
   - Request test ETH (typically 0.5 ETH per request)
   - Wait for confirmation (~15 seconds)

2. **Get Infura/Alchemy API Key**
   - **Infura**: https://infura.io/
     - Sign up → Create Project → Copy Project ID
   - **Alchemy**: https://www.alchemy.com/
     - Sign up → Create App → Copy API Key

3. **Get Etherscan API Key** (for contract verification)
   - Visit https://etherscan.io/apis
   - Sign up → My API Keys → Create API Key
   - Copy your API key

---

### Step 1: Configure Environment

Create `.env` file in `sc/` directory:

```bash
cd sc
touch .env
```

Add the following to `.env`:

```env
# Sepolia RPC URL (choose one)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
# OR
# SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Your wallet private key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional: Admin address (defaults to deployer)
ADMIN_ADDRESS=0xYourAdminAddress
```

**⚠️ SECURITY WARNING**:
- **NEVER** commit `.env` file to git
- Add `.env` to `.gitignore`
- Use a separate wallet for testing (not your main wallet)
- Rotate keys after testing

---

### Step 2: Update Foundry Configuration

Edit `sc/foundry.toml` to add Sepolia configuration:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.28"

[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

---

### Step 3: Test Deployment (Simulation)

Before broadcasting to the network, test the deployment:

```bash
cd sc

# Simulate deployment (no broadcasting)
forge script script/DeploySupplyChain.s.sol:DeploySupplyChain \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY
```

**Expected Output**: Should show estimated gas costs and deployment plan without actually deploying.

---

### Step 4: Deploy to Sepolia

```bash
# Deploy and broadcast
forge script script/DeploySupplyChain.s.sol:DeploySupplyChain \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvvv
```

**Flags Explained:**
- `--rpc-url sepolia`: Use Sepolia network
- `--private-key`: Your wallet private key
- `--broadcast`: Actually send transactions
- `--verify`: Verify contract on Etherscan
- `-vvvv`: Verbose output for debugging

**Expected Output:**
```
## Setting up 1 EVM.
==========================
Simulating transaction...
Transaction simulated successfully.
==========================

Broadcasting transaction...
Transaction hash: 0x...

Waiting for transaction to be mined...
Transaction successfully mined!

Contract deployed at: 0x...
Admin address: 0x...

Verifying contract on Etherscan...
Contract verification submitted!
```

**⏱️ Deployment Time**: ~30-60 seconds

---

### Step 5: Verify Deployment

1. **Check Etherscan**:
   - Go to https://sepolia.etherscan.io/
   - Search for your contract address
   - Verify:
     - ✅ Contract is deployed
     - ✅ Contract is verified (green checkmark)
     - ✅ Admin address is correct

2. **Test Contract Functions**:
   ```bash
   # Read admin address
   cast call YOUR_CONTRACT_ADDRESS "admin()(address)" --rpc-url sepolia
   
   # Check next user ID (should be 1)
   cast call YOUR_CONTRACT_ADDRESS "nextUserId()(uint256)" --rpc-url sepolia
   ```

3. **Interact via Etherscan**:
   - Go to contract page → "Contract" tab → "Write Contract"
   - Connect MetaMask (Sepolia network)
   - Try calling `isAdmin(address)` with your address

---

### Step 6: Update Frontend Configuration

Edit `web/src/contracts/config.ts`:

```typescript
export const CONTRACT_CONFIG = {
  /**
   * Contract address on Sepolia testnet
   */
  address: '0xYourContractAddressHere', // 👈 Update this
  
  /**
   * Admin address (deployer)
   */
  adminAddress: '0xYourAdminAddressHere', // 👈 Update this
} as const;
```

---

### Step 7: Configure MetaMask for Sepolia

1. **Add Sepolia Network** (if not already added):
   - MetaMask → Networks → Add Network
   - **Network Name**: `Sepolia`
   - **RPC URL**: `https://sepolia.infura.io/v3/YOUR_INFURA_ID`
   - **Chain ID**: `11155111`
   - **Currency Symbol**: `ETH`
   - **Block Explorer**: `https://sepolia.etherscan.io`

2. **Switch to Sepolia**: Select "Sepolia" from network dropdown

3. **Import Test Accounts**: Import accounts using private keys (make sure they have testnet ETH)

---

### Step 8: Test Frontend

```bash
cd web
npm run dev
```

Open http://localhost:3000 and verify:
- ✅ Wallet connects to Sepolia
- ✅ Contract interactions work
- ✅ Transactions appear on Etherscan
- ✅ All features functional

---

## Mainnet Deployment

### ⚠️ WARNING
Deploying to mainnet requires **real ETH** and is **irreversible**. Ensure thorough testing on testnet first.

### Prerequisites
1. **Audit**: Get contract professionally audited
2. **Insurance**: Consider smart contract insurance
3. **Testing**: Complete all test scenarios
4. **Gas**: Have 0.1-0.5 ETH for deployment

### Steps

1. **Update `.env`**:
   ```env
   MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
   PRIVATE_KEY=your_production_wallet_private_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

2. **Update `foundry.toml`**:
   ```toml
   [rpc_endpoints]
   mainnet = "${MAINNET_RPC_URL}"

   [etherscan]
   mainnet = { key = "${ETHERSCAN_API_KEY}" }
   ```

3. **Simulate Deployment**:
   ```bash
   forge script script/DeploySupplyChain.s.sol:DeploySupplyChain \
     --rpc-url mainnet \
     --private-key $PRIVATE_KEY
   ```

4. **Deploy**:
   ```bash
   forge script script/DeploySupplyChain.s.sol:DeploySupplyChain \
     --rpc-url mainnet \
     --private-key $PRIVATE_KEY \
     --broadcast \
     --verify \
     -vvvv
   ```

5. **Post-Deployment**:
   - Transfer admin to multi-sig wallet
   - Set up monitoring
   - Announce deployment
   - Update documentation

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

**Why Vercel?**
- ✅ Optimized for Next.js
- ✅ Automatic deployments
- ✅ Free tier available
- ✅ Global CDN

**Steps:**

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd web
   vercel
   ```

4. **Configure**:
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. **Environment Variables** (if needed):
   - Dashboard → Project → Settings → Environment Variables
   - Add any required variables

6. **Custom Domain** (optional):
   - Settings → Domains → Add Domain
   - Configure DNS

**Production URL**: `https://your-project.vercel.app`

---

### Option 2: Netlify

**Steps:**

1. **Create `netlify.toml`** in `web/`:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Deploy via CLI**:
   ```bash
   npm install -g netlify-cli
   netlify login
   cd web
   netlify deploy --prod
   ```

3. **Or connect GitHub repo** in Netlify dashboard for automatic deployments

---

### Option 3: Self-Hosted (VPS)

**For Debian/Ubuntu server:**

1. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2**:
   ```bash
   sudo npm install -g pm2
   ```

3. **Clone and Build**:
   ```bash
   git clone <your-repo> supply-chain-tracker
   cd supply-chain-tracker/web
   npm install
   npm run build
   ```

4. **Start with PM2**:
   ```bash
   pm2 start npm --name "supply-chain-dapp" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx** (reverse proxy):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Post-Deployment Checklist

### Smart Contract
- [ ] Contract deployed successfully
- [ ] Contract verified on Etherscan
- [ ] Admin address confirmed
- [ ] Test basic functions (isAdmin, etc.)
- [ ] Save contract address securely
- [ ] Backup private keys (encrypted)

### Frontend
- [ ] Production build successful
- [ ] Contract address updated in config
- [ ] MetaMask connects correctly
- [ ] All pages load without errors
- [ ] Transactions work end-to-end
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Custom domain configured (optional)

### Documentation
- [ ] Update README with production URLs
- [ ] Document contract address
- [ ] Update environment setup guide
- [ ] Create user guide
- [ ] Announce deployment

### Security
- [ ] Private keys secured
- [ ] `.env` not committed
- [ ] Admin privileges reviewed
- [ ] Access control tested
- [ ] Rate limiting configured (if applicable)

---

## Monitoring & Maintenance

### Smart Contract Monitoring

1. **Etherscan Alerts**:
   - Watch contract for new transactions
   - Set up email notifications

2. **The Graph** (optional):
   - Create subgraph for event indexing
   - Query blockchain data efficiently

3. **Tenderly** (optional):
   - Real-time monitoring
   - Transaction simulation
   - Alerting system

### Frontend Monitoring

1. **Vercel Analytics**:
   - Enable in project settings
   - Monitor traffic and performance

2. **Sentry** (error tracking):
   ```bash
   npm install @sentry/nextjs
   ```

3. **Google Analytics** (optional):
   - Track user behavior
   - Monitor conversions

### Regular Maintenance

**Weekly:**
- [ ] Check transaction logs
- [ ] Review user registrations
- [ ] Monitor gas prices

**Monthly:**
- [ ] Review access permissions
- [ ] Update dependencies
- [ ] Backup important data
- [ ] Review security

**Quarterly:**
- [ ] Security audit
- [ ] Performance optimization
- [ ] User feedback review
- [ ] Feature planning

---

## Rollback Strategy

### If Deployment Fails

1. **Smart Contract**:
   - Cannot rollback (immutable)
   - Deploy new version if critical bug
   - Update frontend to use new address

2. **Frontend**:
   - Vercel: Rollback via dashboard → Deployments → Previous deployment → "Promote to Production"
   - Git: `git revert` and redeploy
   - Nginx: Keep previous build, switch symlink

---

## Cost Estimation

### Sepolia Testnet
- **Contract Deployment**: ~0.02-0.05 test ETH
- **Transaction Costs**: ~0.0001-0.001 test ETH per tx
- **Total for Testing**: Free (testnet ETH from faucet)

### Ethereum Mainnet
- **Contract Deployment**: ~$50-$200 USD (varies with gas)
- **User Registration**: ~$5-$20 per registration
- **Token Creation**: ~$10-$30 per token
- **Transfers**: ~$5-$15 per transfer
- **Admin Actions**: ~$5-$20 per action

**💡 Tip**: Deploy during low-gas periods (weekends, nights UTC)

### L2 Solutions (Future)
Consider deploying to Layer 2 for lower costs:
- **Polygon**: ~$0.01 per transaction
- **Arbitrum**: ~$0.10 per transaction
- **Optimism**: ~$0.10 per transaction

---

## Troubleshooting Deployment

### Error: "Insufficient funds"
**Solution**: Ensure wallet has enough ETH for gas

### Error: "Nonce too high"
**Solution**: Reset MetaMask account or use correct nonce

### Error: "Contract verification failed"
**Solution**: 
- Check compiler version matches
- Ensure constructor arguments are correct
- Try manual verification on Etherscan

### Error: "RPC URL not responding"
**Solution**: 
- Check Infura/Alchemy API key
- Verify network status
- Try alternative RPC provider

---

## Support

For deployment issues:
- Check [GitHub Issues](https://github.com/yourusername/supply-chain-tracker/issues)
- Foundry Docs: https://book.getfoundry.sh/
- Vercel Docs: https://vercel.com/docs

---

## Security Best Practices

1. **Never expose private keys**
2. **Use environment variables**
3. **Audit before mainnet**
4. **Start with testnet**
5. **Monitor contract activity**
6. **Keep dependencies updated**
7. **Use multi-sig for admin**
8. **Implement emergency pause**
9. **Regular security reviews**
10. **Bug bounty program**

---

## Conclusion

Following this guide ensures a smooth deployment process. Always test thoroughly on testnet before mainnet deployment. Keep documentation updated and maintain regular backups.

**Good luck with your deployment! 🚀**

