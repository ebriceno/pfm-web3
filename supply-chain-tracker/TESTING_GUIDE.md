# Testing Guide - Supply Chain Tracker DApp

## Overview
This guide provides comprehensive testing procedures for the Supply Chain Tracker DApp.

---

## Prerequisites

### 1. Environment Setup
```bash
# Terminal 1: Start Anvil (local blockchain)
cd sc
anvil

# Terminal 2: Deploy Smart Contract
forge script script/DeploySupplyChain.s.sol:DeploySupplyChain \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# Terminal 3: Start Next.js Frontend
cd ../web
npm run dev
```

### 2. MetaMask Setup
- Add Local Network (Anvil):
  - Network Name: `Anvil Local`
  - RPC URL: `http://localhost:8545`
  - Chain ID: `31337`
  - Currency: `ETH`

- Import Test Accounts (use private keys from Anvil output):
  - Account #0 (Admin): `0xac09...f80`
  - Account #1 (Producer): `0x59c6...90d`
  - Account #2 (Factory): `0x5de4...a99`
  - Account #3 (Retailer): `0x7c85...607`
  - Account #4 (Consumer): `0x47e1...b99`

---

## Test Scenario 1: Complete Supply Chain Flow

### Objective
Verify the entire supply chain flow from Producer to Consumer works correctly.

### Test Steps

#### Step 1: Admin Setup
**Actor**: Admin (Account #0)

1. ✅ **Connect Wallet**
   - Go to `http://localhost:3000`
   - Click "Connect Wallet"
   - Select Account #0 in MetaMask
   - Verify admin badge appears in header

2. ✅ **Access Admin Panel**
   - Navigate to `/admin`
   - Verify dashboard shows statistics (all zeros initially)
   - Navigate to `/admin/users`
   - Verify user list is empty

---

#### Step 2: User Registration
**Actors**: Producer, Factory, Retailer, Consumer

**For each role:**

1. ✅ **Switch Account** in MetaMask to next test account

2. ✅ **Register Role**
   - Refresh page or reconnect wallet
   - Select appropriate role:
     - Account #1 → Producer
     - Account #2 → Factory
     - Account #3 → Retailer
     - Account #4 → Consumer
   - Click "Register"
   - Approve MetaMask transaction
   - Verify toast notification: "Registration Submitted!"
   - Verify page shows "Pending Approval" message

**Expected Results:**
- ✅ Registration transaction successful
- ✅ User status shows "Pending"
- ✅ Toast notification appears

---

#### Step 3: User Approval
**Actor**: Admin (Account #0)

1. ✅ **Switch to Admin Account** in MetaMask

2. ✅ **Approve All Users**
   - Navigate to `/admin/users`
   - Verify 4 users appear with "Pending" status
   - For each user, click "Approve"
   - Approve MetaMask transaction
   - Verify toast notification: "User Approved"
   - Verify user status changes to "Approved"

**Expected Results:**
- ✅ All users approved successfully
- ✅ Status badges change to green "Approved"
- ✅ Toast notifications for each approval

---

#### Step 4: Producer Creates Raw Material
**Actor**: Producer (Account #1)

1. ✅ **Switch to Producer Account**

2. ✅ **Access Dashboard**
   - Navigate to `/dashboard`
   - Verify Producer dashboard appears
   - Verify statistics show zero tokens/transfers

3. ✅ **Create Raw Material Token**
   - Click "Create New Raw Material" or navigate to `/tokens/create`
   - Fill form:
     - **Token Name**: `Wheat`
     - **Total Supply**: `1000`
     - **Features**: `{"grade": "A", "organic": true, "origin": "Farm-001"}`
   - Verify no Parent Token field (Producer doesn't need parent)
   - Click "Create Token"
   - Approve MetaMask transaction
   - Wait for confirmation
   - Verify redirect to `/tokens`

4. ✅ **Verify Token Created**
   - Verify "Wheat" token appears in list
   - Verify balance = 1000
   - Verify ownership = 100%
   - Click on token to view details
   - Verify all token information is correct

**Expected Results:**
- ✅ Token created successfully
- ✅ Token appears in producer's portfolio
- ✅ Balance and supply match
- ✅ Features are stored correctly

---

#### Step 5: Producer → Factory Transfer
**Actor**: Producer (Account #1)

1. ✅ **Initiate Transfer**
   - From token details page, click "Transfer Token"
   - Or navigate to `/transfers/create?tokenId=1`
   - Fill form:
     - **Token**: Select "Wheat" (should be pre-selected)
     - **Recipient**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (Factory address)
     - **Amount**: `500`
   - Verify validation: Amount ≤ Balance (1000)
   - Click "Create Transfer"
   - Approve MetaMask transaction
   - Verify toast notification
   - Verify redirect to `/transfers`

2. ✅ **Verify Transfer Listed**
   - Navigate to `/transfers`
   - Verify transfer appears in "Sent" tab
   - Verify status = "Pending"
   - Verify recipient = Factory address

**Expected Results:**
- ✅ Transfer created successfully
- ✅ Transfer shows as "Pending"
- ✅ Producer balance still 1000 (not deducted until accepted)

---

#### Step 6: Factory Accepts Transfer
**Actor**: Factory (Account #2)

1. ✅ **Switch to Factory Account**

2. ✅ **View Pending Transfer**
   - Navigate to `/dashboard`
   - Verify alert: "Pending Incoming Transfers"
   - Click "Review Transfers" or navigate to `/transfers`
   - Verify transfer from Producer appears in "Pending" section
   - Verify details: 500 Wheat from Producer

3. ✅ **Accept Transfer**
   - Click "Accept" button
   - Approve MetaMask transaction
   - Verify toast notification: "Transfer Accepted"
   - Wait for transaction confirmation
   - Verify transfer moves to "Completed" section
   - Verify status badge changes to "Accepted"

4. ✅ **Verify Balance Updated**
   - Navigate to `/tokens`
   - Verify "Wheat" token appears with balance = 500
   - Verify ownership = 50% (500/1000)

5. ✅ **Verify Producer Balance**
   - Switch back to Producer account
   - Navigate to `/tokens`
   - Verify "Wheat" balance = 500 (deducted)
   - Verify ownership = 50%

**Expected Results:**
- ✅ Transfer accepted successfully
- ✅ Balances updated correctly (Producer: 500, Factory: 500)
- ✅ Toast notifications appear
- ✅ Transfer status = "Accepted"

---

#### Step 7: Factory Creates Derived Product
**Actor**: Factory (Account #2)

1. ✅ **Create Processed Product**
   - Navigate to `/tokens/create`
   - Fill form:
     - **Token Name**: `Flour`
     - **Total Supply**: `400`
     - **Parent Token**: Select "Wheat" (Token #1)
     - **Features**: `{"processed": true, "quality": "premium", "type": "all-purpose"}`
   - Verify Parent Token dropdown appears (Factory/Retailer only)
   - Verify owns parent token (Wheat)
   - Click "Create Token"
   - Approve MetaMask transaction

2. ✅ **Verify Token Created**
   - Navigate to `/tokens`
   - Verify "Flour" token appears
   - Verify balance = 400, supply = 400
   - Click to view details
   - Verify Parent Token link shows "Wheat"
   - Click parent link to verify traceability

**Expected Results:**
- ✅ Derived token created successfully
- ✅ Parent-child relationship established
- ✅ Traceability chain visible

---

#### Step 8: Factory → Retailer Transfer
**Actor**: Factory (Account #2)

1. ✅ **Transfer to Retailer**
   - From "Flour" token details, click "Transfer Token"
   - Fill form:
     - **Token**: Flour
     - **Recipient**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906` (Retailer)
     - **Amount**: `300`
   - Create transfer
   - Verify pending status

**Expected Results:**
- ✅ Transfer created
- ✅ Shows in Factory's sent transfers

---

#### Step 9: Retailer Accepts and Processes
**Actor**: Retailer (Account #3)

1. ✅ **Accept Factory Transfer**
   - Switch to Retailer account
   - Navigate to `/transfers`
   - Accept pending transfer from Factory
   - Verify balance updated (Flour: 300)

2. ✅ **Create Retail Product**
   - Navigate to `/tokens/create`
   - Create token:
     - **Name**: `Packaged Flour 1kg`
     - **Supply**: `300`
     - **Parent**: Flour (Token #2)
     - **Features**: `{"packaged": true, "weight": "1kg", "barcode": "123456789"}`
   - Verify token created

**Expected Results:**
- ✅ Transfer accepted
- ✅ New retail product created
- ✅ Traceability maintained (3-level chain)

---

#### Step 10: Retailer → Consumer Sale
**Actor**: Retailer (Account #3)

1. ✅ **Transfer to Consumer**
   - Navigate to `/transfers/create`
   - Transfer:
     - **Token**: Packaged Flour 1kg
     - **Recipient**: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` (Consumer)
     - **Amount**: `50`
   - Create transfer

**Expected Results:**
- ✅ Transfer created successfully

---

#### Step 11: Consumer Receives and Traces
**Actor**: Consumer (Account #4)

1. ✅ **Accept Purchase**
   - Switch to Consumer account
   - Navigate to `/transfers`
   - Accept pending transfer
   - Verify balance updated

2. ✅ **View Product**
   - Navigate to `/tokens`
   - Click on "Packaged Flour 1kg"
   - Verify all details

3. ✅ **Trace Supply Chain**
   - From token details, click Parent Token link (Flour)
   - From Flour, click Parent Token link (Wheat)
   - Verify complete traceability: Wheat → Flour → Packaged Flour
   - Verify all creators visible

4. ✅ **Check Dashboard**
   - Navigate to `/dashboard`
   - Verify Consumer dashboard
   - Verify recent purchases show

5. ✅ **Verify Cannot Transfer**
   - Try to click "Transfer Token" (should not be available)
   - Try to navigate to `/transfers/create` (should be redirected or show error)
   - Verify Consumer cannot create transfers (role restriction)

**Expected Results:**
- ✅ Product received successfully
- ✅ Complete traceability chain visible
- ✅ Consumer cannot initiate transfers
- ✅ All balances correct

---

## Test Scenario 2: Edge Cases

### 2.1 Insufficient Balance
**Test**: Try to transfer more than balance

1. As Producer, try to transfer 1500 Wheat (balance: 500)
2. Verify error message
3. Verify transaction not created

**Expected**: ✅ Error toast, no transaction

---

### 2.2 Invalid Role Transfer
**Test**: Try to transfer to wrong role

1. As Producer, try to transfer Wheat directly to Consumer
2. Verify validation error
3. Verify cannot select Consumer in recipient dropdown

**Expected**: ✅ Recipient validation prevents wrong role

---

### 2.3 Unapproved User Actions
**Test**: Unapproved user tries to create token

1. Register new user but don't approve
2. Try to access `/tokens/create`
3. Verify redirect or access denied

**Expected**: ✅ Blocked from action pages

---

### 2.4 Reject Transfer
**Test**: Recipient rejects transfer

1. Create transfer Producer → Factory
2. Factory clicks "Reject"
3. Verify status = "Rejected"
4. Verify balances unchanged

**Expected**: ✅ Transfer rejected, no balance change

---

### 2.5 MetaMask Rejection
**Test**: User rejects transaction

1. Start any transaction
2. Click "Reject" in MetaMask
3. Verify error toast
4. Verify app state unchanged

**Expected**: ✅ Error message, app remains stable

---

### 2.6 Network Disconnection
**Test**: Disconnect wallet mid-session

1. Connect wallet
2. Disconnect MetaMask
3. Verify app detects disconnection
4. Verify proper message shown

**Expected**: ✅ App handles disconnection gracefully

---

### 2.7 Double Accept
**Test**: Try to accept transfer twice

1. Accept a transfer
2. Try to accept same transfer again
3. Verify proper error handling

**Expected**: ✅ Cannot accept already-accepted transfer

---

### 2.8 Admin Cannot Register as User
**Test**: Admin tries to register as regular user

1. As Admin, try to register a role
2. Verify admin redirected to admin panel
3. Verify admin remains admin-only

**Expected**: ✅ Admin cannot register as regular user

---

### 2.9 Create Token Without Parent (Factory)
**Test**: Factory tries to create token without parent

1. As Factory, go to create token
2. Try to submit without selecting parent
3. Verify validation error

**Expected**: ✅ Parent token required for Factory/Retailer

---

### 2.10 Consumer Create Token
**Test**: Consumer tries to create token

1. As Consumer, navigate to `/tokens/create`
2. Verify redirected or blocked
3. Verify "Create Token" button not visible

**Expected**: ✅ Consumer cannot create tokens

---

## Test Scenario 3: UI/UX Testing

### 3.1 Mobile Responsive
**Test**: All pages on mobile viewport

1. Open Chrome DevTools
2. Toggle device toolbar
3. Test on iPhone SE (375px)
4. Verify:
   - ✅ Hamburger menu appears
   - ✅ Navigation works
   - ✅ Forms are usable
   - ✅ Tables are scrollable
   - ✅ Buttons are touch-friendly (min 44px)

---

### 3.2 Toast Notifications
**Test**: Toast system works

1. Perform various actions
2. Verify toasts appear for:
   - ✅ Successful transactions
   - ✅ Failed transactions
   - ✅ Validation errors
3. Verify toasts auto-dismiss
4. Verify multiple toasts stack

---

### 3.3 Loading States
**Test**: Loading indicators work

1. Perform slow actions
2. Verify loading spinners appear
3. Verify buttons disable during loading
4. Verify page doesn't break during loading

---

### 3.4 Empty States
**Test**: Empty states display correctly

1. New user with no tokens → verify empty state
2. No transfers → verify empty state
3. Admin with no users → verify empty state

---

## Performance Checklist

- [ ] Page load time < 3 seconds
- [ ] Transaction confirmation time acceptable
- [ ] No memory leaks (check DevTools)
- [ ] No console errors
- [ ] Smooth animations/transitions
- [ ] No layout shift (CLS)

---

## Security Checklist

- [ ] Admin-only routes protected
- [ ] User-only actions require approval
- [ ] Role-based transfer validation works
- [ ] Cannot manipulate contract without MetaMask
- [ ] Private keys never exposed
- [ ] No XSS vulnerabilities

---

## Browser Compatibility

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Test Results Template

```markdown
## Test Execution: [Date]

### Environment
- Anvil: Running
- Contract: Deployed at 0x...
- Frontend: localhost:3000

### Test Scenario 1: Complete Flow
- [ ] Admin setup: PASS/FAIL
- [ ] User registration: PASS/FAIL
- [ ] User approval: PASS/FAIL
- [ ] Token creation: PASS/FAIL
- [ ] Transfers: PASS/FAIL
- [ ] Traceability: PASS/FAIL

### Edge Cases
- [ ] Insufficient balance: PASS/FAIL
- [ ] Invalid role: PASS/FAIL
- [ ] Reject transfer: PASS/FAIL
- [ ] MetaMask rejection: PASS/FAIL

### UI/UX
- [ ] Mobile responsive: PASS/FAIL
- [ ] Toasts: PASS/FAIL
- [ ] Loading states: PASS/FAIL

### Issues Found
1. [Description of issue]
2. [Description of issue]

### Notes
[Any additional observations]
```

---

## Automated Testing (Future Enhancement)

For production, consider adding:
- Cypress E2E tests
- Jest unit tests
- React Testing Library component tests
- Contract fuzzing tests
- Load testing

---

## Conclusion

This guide covers comprehensive testing of the Supply Chain Tracker DApp. Execute each test scenario and document results. Any issues found should be fixed before deployment to testnet/mainnet.

