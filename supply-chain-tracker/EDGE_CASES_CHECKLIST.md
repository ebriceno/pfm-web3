# Edge Cases & Bug Tracking

## Overview
This document tracks edge cases testing and bugs found during integration testing.

---

## Edge Cases to Test

### 1. Balance & Transfer Validation

#### 1.1 Insufficient Balance
**Scenario**: User tries to transfer more than available balance

- [ ] **Test**: Transfer 1500 when balance is 500
- **Expected**: Error message, transaction blocked
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 1.2 Zero Amount Transfer
**Scenario**: User tries to transfer 0 tokens

- [ ] **Test**: Set amount to 0 in transfer form
- **Expected**: Validation error, form cannot submit
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 1.3 Negative Amount
**Scenario**: User tries to enter negative amount

- [ ] **Test**: Input -100 in amount field
- **Expected**: HTML5 validation prevents negative input
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

### 2. Role-Based Restrictions

#### 2.1 Invalid Role Transfer
**Scenario**: Producer tries to transfer to Consumer directly

- [ ] **Test**: Producer → Consumer transfer
- **Expected**: Validation error, cannot select Consumer as recipient
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 2.2 Consumer Create Token
**Scenario**: Consumer tries to access token creation

- [ ] **Test**: Consumer navigates to `/tokens/create`
- **Expected**: Redirected or access denied
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 2.3 Consumer Transfer
**Scenario**: Consumer tries to create transfer

- [ ] **Test**: Consumer navigates to `/transfers/create`
- **Expected**: Blocked or error message
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 2.4 Factory Without Parent Token
**Scenario**: Factory creates token without parent

- [ ] **Test**: Factory submits form with no parent selected
- **Expected**: Validation error, parentId required
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

### 3. User Status & Permissions

#### 3.1 Unapproved User Actions
**Scenario**: Pending user tries to create token

- [ ] **Test**: Register user, don't approve, try actions
- **Expected**: Redirected to pending approval screen
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 3.2 Rejected User Actions
**Scenario**: Rejected user tries to access app

- [ ] **Test**: Admin rejects user, user tries to navigate
- **Expected**: Shows rejection message, no access to features
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 3.3 Revoked User
**Scenario**: Approved user gets revoked mid-session

- [ ] **Test**: User is using app, admin revokes, user continues
- **Expected**: Next action fails, shows status changed
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

### 4. Transfer State Management

#### 4.1 Double Accept
**Scenario**: Try to accept already-accepted transfer

- [ ] **Test**: Accept transfer, try to accept again
- **Expected**: Contract reverts, error message shown
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 4.2 Double Reject
**Scenario**: Try to reject already-rejected transfer

- [ ] **Test**: Reject transfer, try to reject again
- **Expected**: Contract reverts, error message shown
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 4.3 Accept After Reject
**Scenario**: Try to accept a rejected transfer

- [ ] **Test**: Reject transfer, then try to accept
- **Expected**: Contract reverts, cannot change from rejected
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 4.4 Wrong User Accept
**Scenario**: Sender tries to accept their own transfer

- [ ] **Test**: Producer creates transfer, Producer tries to accept
- **Expected**: Only recipient can accept
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

### 5. MetaMask & Wallet

#### 5.1 Transaction Rejection
**Scenario**: User rejects MetaMask transaction

- [ ] **Test**: Start any transaction, click Reject in MetaMask
- **Expected**: Toast error, app state unchanged
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 5.2 Disconnect During Transaction
**Scenario**: Disconnect wallet while transaction pending

- [ ] **Test**: Start transaction, disconnect MetaMask
- **Expected**: App detects disconnection, shows appropriate state
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 5.3 Wrong Network
**Scenario**: User switches to wrong network

- [ ] **Test**: Switch MetaMask to Mainnet
- **Expected**: App detects wrong network, shows error
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 5.4 Account Switch Mid-Session
**Scenario**: User switches MetaMask account

- [ ] **Test**: Use app with Account A, switch to Account B
- **Expected**: Page reloads, new account state loaded
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 5.5 No MetaMask
**Scenario**: User doesn't have MetaMask installed

- [ ] **Test**: Use browser without MetaMask
- **Expected**: Clear message to install MetaMask
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

### 6. Data Validation

#### 6.1 Empty Token Name
**Scenario**: Create token with empty name

- [ ] **Test**: Submit token form with blank name
- **Expected**: HTML5 required validation
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 6.2 Invalid JSON Features
**Scenario**: Enter malformed JSON in features

- [ ] **Test**: Enter `{invalid json}` in features
- **Expected**: Validation error before submission
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 6.3 Invalid Address
**Scenario**: Enter invalid Ethereum address

- [ ] **Test**: Enter `0x123` as recipient
- **Expected**: Address validation error
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 6.4 Very Large Numbers
**Scenario**: Enter extremely large supply/amount

- [ ] **Test**: Enter `999999999999999999999999`
- **Expected**: Contract handles BigInt correctly
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

### 7. Admin Actions

#### 7.1 Admin Approve Twice
**Scenario**: Admin tries to approve already-approved user

- [ ] **Test**: Approve user, try to approve again
- **Expected**: Already approved, no issue
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 7.2 Non-Admin Access
**Scenario**: Regular user tries to access admin panel

- [ ] **Test**: Non-admin navigates to `/admin`
- **Expected**: Redirected or access denied
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 7.3 Admin Register as User
**Scenario**: Admin account tries to register as regular user

- [ ] **Test**: Admin fills registration form
- **Expected**: Prevented or special handling
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

### 8. Token Hierarchy

#### 8.1 Circular Reference
**Scenario**: Token A → Token B → Token A

- [ ] **Test**: Try to create circular parent-child
- **Expected**: Contract logic prevents or doesn't matter
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 8.2 Non-Existent Parent
**Scenario**: Reference parent token that doesn't exist

- [ ] **Test**: Manually set parentId = 9999
- **Expected**: Contract reverts
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 8.3 Deep Hierarchy
**Scenario**: Many levels of parent-child (5+ levels)

- [ ] **Test**: Create Token1 → Token2 → Token3 → Token4 → Token5
- **Expected**: All work correctly, traceability maintained
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

### 9. UI/UX Edge Cases

#### 9.1 Rapid Clicking
**Scenario**: User rapidly clicks submit button

- [ ] **Test**: Double-click/triple-click submit
- **Expected**: Button disabled after first click
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 9.2 Browser Back Button
**Scenario**: User clicks back during transaction

- [ ] **Test**: Start transaction, click browser back
- **Expected**: App handles gracefully, no broken state
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 9.3 Page Refresh Mid-Transaction
**Scenario**: Refresh page while transaction pending

- [ ] **Test**: Submit form, immediately refresh
- **Expected**: Transaction completes, state recovers on reload
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 9.4 Long Text Inputs
**Scenario**: Enter very long token name or features

- [ ] **Test**: 1000+ character name
- **Expected**: Truncated or max-length validation
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 9.5 Special Characters
**Scenario**: Token name with emojis/special chars

- [ ] **Test**: Name = `🌾 Wheat™ 2024 ©`
- **Expected**: Stored and displayed correctly
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

### 10. Performance & Limits

#### 10.1 Many Tokens
**Scenario**: User owns 50+ tokens

- [ ] **Test**: Create many tokens, view tokens page
- **Expected**: Page loads, no slowdown
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 10.2 Many Transfers
**Scenario**: 100+ transfers in history

- [ ] **Test**: Execute many transfers, view transfers page
- **Expected**: Pagination or acceptable load time
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

#### 10.3 Slow Network
**Scenario**: Test on slow 3G connection

- [ ] **Test**: Chrome DevTools → Network → Slow 3G
- **Expected**: Loading states show, no timeouts
- **Status**: ⏳ Not Tested / ✅ Pass / ❌ Fail
- **Notes**: 

---

## Bugs Found

### Bug #1: [Title]
- **Severity**: Critical / High / Medium / Low
- **Description**: 
- **Steps to Reproduce**:
  1. 
  2. 
  3. 
- **Expected Behavior**: 
- **Actual Behavior**: 
- **Fix**: 
- **Status**: Open / In Progress / Fixed

---

### Bug #2: [Title]
- **Severity**: 
- **Description**: 
- **Steps to Reproduce**:
- **Expected Behavior**: 
- **Actual Behavior**: 
- **Fix**: 
- **Status**: 

---

## Testing Summary

- **Total Edge Cases**: 40
- **Tested**: ___ / 40
- **Passed**: ___ / 40
- **Failed**: ___ / 40
- **Bugs Found**: ___
- **Bugs Fixed**: ___

---

## Sign-Off

- **Tester**: _______________
- **Date**: _______________
- **Status**: ⏳ In Progress / ✅ Complete / ❌ Issues Found
- **Notes**: 

---

## Recommendations

Based on testing results:
1. 
2. 
3. 

---

## Next Steps

- [ ] Fix identified bugs
- [ ] Re-test failed cases
- [ ] Document workarounds
- [ ] Update user documentation
- [ ] Proceed to Phase 11 (Deployment)

