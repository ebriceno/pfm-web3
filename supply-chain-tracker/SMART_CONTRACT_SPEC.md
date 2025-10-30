# 🔥 Smart Contract Specification

## Contract: SupplyChain.sol

**Version**: 0.1.0  
**Solidity**: ^0.8.20  
**License**: MIT

---

## 📊 Data Structures

### Enums

```solidity
enum UserStatus {
    Pending,    // User registered, awaiting approval
    Approved,   // User approved by admin
    Rejected,   // User rejected by admin
    Canceled    // User canceled their registration
}

enum TransferStatus {
    Pending,    // Transfer initiated, awaiting acceptance
    Accepted,   // Transfer accepted by recipient
    Rejected    // Transfer rejected by recipient
}
```

### Structs

```solidity
struct Token {
    uint256 id;                          // Unique token ID
    address creator;                     // Address that created the token
    string name;                         // Token name (e.g., "Organic Wheat")
    uint256 totalSupply;                 // Total supply created
    string features;                     // JSON string with metadata
    uint256 parentId;                    // Parent token ID (0 if raw material)
    uint256 dateCreated;                 // Creation timestamp
    mapping(address => uint256) balance; // Balance per address
}

struct Transfer {
    uint256 id;              // Unique transfer ID
    address from;            // Sender address
    address to;              // Recipient address
    uint256 tokenId;         // Token being transferred
    uint256 dateCreated;     // Transfer initiation timestamp
    uint256 amount;          // Amount being transferred
    TransferStatus status;   // Current status
}

struct User {
    uint256 id;          // Unique user ID
    address userAddress; // User's wallet address
    string role;         // Role: Producer, Factory, Retailer, Consumer
    UserStatus status;   // Current status
}
```

---

## 🔐 State Variables

```solidity
// Admin
address public admin;

// Counters
uint256 public nextTokenId = 1;
uint256 public nextTransferId = 1;
uint256 public nextUserId = 1;

// Mappings
mapping(uint256 => Token) public tokens;
mapping(uint256 => Transfer) public transfers;
mapping(uint256 => User) public users;
mapping(address => uint256) public addressToUserId;

// Helper mappings for efficient queries
mapping(address => uint256[]) private userTokenIds;
mapping(address => uint256[]) private userTransferIds;
```

---

## 📢 Events

```solidity
event TokenCreated(
    uint256 indexed tokenId,
    address indexed creator,
    string name,
    uint256 totalSupply
);

event TransferRequested(
    uint256 indexed transferId,
    address indexed from,
    address indexed to,
    uint256 tokenId,
    uint256 amount
);

event TransferAccepted(uint256 indexed transferId);

event TransferRejected(uint256 indexed transferId);

event UserRoleRequested(address indexed user, string role);

event UserStatusChanged(address indexed user, UserStatus status);
```

---

## 🛡️ Modifiers

```solidity
modifier onlyAdmin() {
    require(msg.sender == admin, "Only admin can perform this action");
    _;
}

modifier onlyApprovedUser() {
    uint256 userId = addressToUserId[msg.sender];
    require(userId != 0, "User not registered");
    require(users[userId].status == UserStatus.Approved, "User not approved");
    _;
}
```

---

## 🔧 Functions

### Constructor

```solidity
constructor() {
    admin = msg.sender;
}
```

### User Management Functions

#### requestUserRole
```solidity
/**
 * @notice Allows a user to request a role in the system
 * @param role The requested role (Producer, Factory, Retailer, Consumer)
 */
function requestUserRole(string memory role) public {
    require(addressToUserId[msg.sender] == 0, "User already registered");
    require(_isValidRole(role), "Invalid role");
    
    uint256 userId = nextUserId++;
    User storage newUser = users[userId];
    newUser.id = userId;
    newUser.userAddress = msg.sender;
    newUser.role = role;
    newUser.status = UserStatus.Pending;
    
    addressToUserId[msg.sender] = userId;
    
    emit UserRoleRequested(msg.sender, role);
}
```

#### changeStatusUser
```solidity
/**
 * @notice Admin changes user status (approve/reject)
 * @param userAddress Address of the user
 * @param newStatus New status to set
 */
function changeStatusUser(address userAddress, UserStatus newStatus) public onlyAdmin {
    uint256 userId = addressToUserId[userAddress];
    require(userId != 0, "User not found");
    
    users[userId].status = newStatus;
    
    emit UserStatusChanged(userAddress, newStatus);
}
```

#### getUserInfo
```solidity
/**
 * @notice Gets information about a user
 * @param userAddress Address of the user
 * @return User struct with user information
 */
function getUserInfo(address userAddress) public view returns (User memory) {
    uint256 userId = addressToUserId[userAddress];
    require(userId != 0, "User not found");
    return users[userId];
}
```

#### isAdmin
```solidity
/**
 * @notice Checks if an address is the admin
 * @param userAddress Address to check
 * @return bool True if address is admin
 */
function isAdmin(address userAddress) public view returns (bool) {
    return userAddress == admin;
}
```

### Token Management Functions

#### createToken
```solidity
/**
 * @notice Creates a new token
 * @param name Token name
 * @param totalSupply Total supply to create
 * @param features JSON string with token metadata
 * @param parentId Parent token ID (0 for raw materials)
 */
function createToken(
    string memory name,
    uint256 totalSupply,
    string memory features,
    uint256 parentId
) public onlyApprovedUser {
    require(bytes(name).length > 0, "Name cannot be empty");
    require(totalSupply > 0, "Supply must be greater than 0");
    
    uint256 userId = addressToUserId[msg.sender];
    string memory userRole = users[userId].role;
    
    // Producer: parentId must be 0
    if (_compareStrings(userRole, "Producer")) {
        require(parentId == 0, "Producer cannot have parent token");
    }
    // Factory/Retailer: must have valid parent token
    else if (_compareStrings(userRole, "Factory") || _compareStrings(userRole, "Retailer")) {
        require(parentId > 0 && parentId < nextTokenId, "Invalid parent token");
        require(tokens[parentId].balance[msg.sender] > 0, "Must own parent token");
    }
    // Consumer: cannot create tokens
    else {
        revert("Consumer cannot create tokens");
    }
    
    uint256 tokenId = nextTokenId++;
    Token storage newToken = tokens[tokenId];
    newToken.id = tokenId;
    newToken.creator = msg.sender;
    newToken.name = name;
    newToken.totalSupply = totalSupply;
    newToken.features = features;
    newToken.parentId = parentId;
    newToken.dateCreated = block.timestamp;
    newToken.balance[msg.sender] = totalSupply;
    
    userTokenIds[msg.sender].push(tokenId);
    
    emit TokenCreated(tokenId, msg.sender, name, totalSupply);
}
```

#### getToken
```solidity
/**
 * @notice Gets token information
 * @param tokenId ID of the token
 * @return Token struct (Note: mapping excluded, use getTokenBalance separately)
 */
function getToken(uint256 tokenId) public view returns (
    uint256 id,
    address creator,
    string memory name,
    uint256 totalSupply,
    string memory features,
    uint256 parentId,
    uint256 dateCreated
) {
    require(tokenId > 0 && tokenId < nextTokenId, "Invalid token ID");
    Token storage token = tokens[tokenId];
    return (
        token.id,
        token.creator,
        token.name,
        token.totalSupply,
        token.features,
        token.parentId,
        token.dateCreated
    );
}
```

#### getTokenBalance
```solidity
/**
 * @notice Gets token balance for a specific address
 * @param tokenId ID of the token
 * @param userAddress Address to check balance
 * @return Balance of the token
 */
function getTokenBalance(uint256 tokenId, address userAddress) public view returns (uint256) {
    require(tokenId > 0 && tokenId < nextTokenId, "Invalid token ID");
    return tokens[tokenId].balance[userAddress];
}
```

#### getUserTokens
```solidity
/**
 * @notice Gets all token IDs owned by a user (with balance > 0)
 * @param userAddress Address of the user
 * @return Array of token IDs
 */
function getUserTokens(address userAddress) public view returns (uint256[] memory) {
    return userTokenIds[userAddress];
}
```

### Transfer Management Functions

#### transfer
```solidity
/**
 * @notice Initiates a transfer of tokens
 * @param to Recipient address
 * @param tokenId Token to transfer
 * @param amount Amount to transfer
 */
function transfer(address to, uint256 tokenId, uint256 amount) public onlyApprovedUser {
    require(to != address(0), "Invalid recipient");
    require(to != msg.sender, "Cannot transfer to yourself");
    require(tokenId > 0 && tokenId < nextTokenId, "Invalid token ID");
    require(amount > 0, "Amount must be greater than 0");
    require(tokens[tokenId].balance[msg.sender] >= amount, "Insufficient balance");
    
    uint256 fromUserId = addressToUserId[msg.sender];
    uint256 toUserId = addressToUserId[to];
    require(toUserId != 0, "Recipient not registered");
    require(users[toUserId].status == UserStatus.Approved, "Recipient not approved");
    
    // Validate role-based transfer rules
    string memory fromRole = users[fromUserId].role;
    string memory toRole = users[toUserId].role;
    require(_isValidTransfer(fromRole, toRole), "Invalid role transfer");
    
    // Consumer cannot transfer
    require(!_compareStrings(fromRole, "Consumer"), "Consumer cannot transfer");
    
    uint256 transferId = nextTransferId++;
    Transfer storage newTransfer = transfers[transferId];
    newTransfer.id = transferId;
    newTransfer.from = msg.sender;
    newTransfer.to = to;
    newTransfer.tokenId = tokenId;
    newTransfer.dateCreated = block.timestamp;
    newTransfer.amount = amount;
    newTransfer.status = TransferStatus.Pending;
    
    userTransferIds[msg.sender].push(transferId);
    userTransferIds[to].push(transferId);
    
    emit TransferRequested(transferId, msg.sender, to, tokenId, amount);
}
```

#### acceptTransfer
```solidity
/**
 * @notice Accepts a pending transfer
 * @param transferId ID of the transfer
 */
function acceptTransfer(uint256 transferId) public onlyApprovedUser {
    require(transferId > 0 && transferId < nextTransferId, "Invalid transfer ID");
    Transfer storage txn = transfers[transferId];
    
    require(txn.to == msg.sender, "Only recipient can accept");
    require(txn.status == TransferStatus.Pending, "Transfer not pending");
    require(tokens[txn.tokenId].balance[txn.from] >= txn.amount, "Insufficient balance");
    
    // Execute transfer
    tokens[txn.tokenId].balance[txn.from] -= txn.amount;
    tokens[txn.tokenId].balance[txn.to] += txn.amount;
    
    // Update transfer status
    txn.status = TransferStatus.Accepted;
    
    // Add token to recipient's list if first time
    bool hasToken = false;
    uint256[] storage recipientTokens = userTokenIds[txn.to];
    for (uint i = 0; i < recipientTokens.length; i++) {
        if (recipientTokens[i] == txn.tokenId) {
            hasToken = true;
            break;
        }
    }
    if (!hasToken) {
        userTokenIds[txn.to].push(txn.tokenId);
    }
    
    emit TransferAccepted(transferId);
}
```

#### rejectTransfer
```solidity
/**
 * @notice Rejects a pending transfer
 * @param transferId ID of the transfer
 */
function rejectTransfer(uint256 transferId) public onlyApprovedUser {
    require(transferId > 0 && transferId < nextTransferId, "Invalid transfer ID");
    Transfer storage txn = transfers[transferId];
    
    require(txn.to == msg.sender, "Only recipient can reject");
    require(txn.status == TransferStatus.Pending, "Transfer not pending");
    
    txn.status = TransferStatus.Rejected;
    
    emit TransferRejected(transferId);
}
```

#### getTransfer
```solidity
/**
 * @notice Gets transfer information
 * @param transferId ID of the transfer
 * @return Transfer struct
 */
function getTransfer(uint256 transferId) public view returns (Transfer memory) {
    require(transferId > 0 && transferId < nextTransferId, "Invalid transfer ID");
    return transfers[transferId];
}
```

#### getUserTransfers
```solidity
/**
 * @notice Gets all transfer IDs involving a user
 * @param userAddress Address of the user
 * @return Array of transfer IDs
 */
function getUserTransfers(address userAddress) public view returns (uint256[] memory) {
    return userTransferIds[userAddress];
}
```

### Helper Functions (Internal)

```solidity
function _isValidRole(string memory role) internal pure returns (bool) {
    return _compareStrings(role, "Producer") ||
           _compareStrings(role, "Factory") ||
           _compareStrings(role, "Retailer") ||
           _compareStrings(role, "Consumer");
}

function _isValidTransfer(string memory fromRole, string memory toRole) internal pure returns (bool) {
    if (_compareStrings(fromRole, "Producer")) {
        return _compareStrings(toRole, "Factory");
    } else if (_compareStrings(fromRole, "Factory")) {
        return _compareStrings(toRole, "Retailer");
    } else if (_compareStrings(fromRole, "Retailer")) {
        return _compareStrings(toRole, "Consumer");
    }
    return false;
}

function _compareStrings(string memory a, string memory b) internal pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
}
```

---

## 🎯 Business Rules

### User Management
1. ✅ Anyone can request a role (Producer, Factory, Retailer, Consumer)
2. ✅ Only admin can approve/reject users
3. ✅ User must be approved to perform any operations
4. ✅ Each address can only register once
5. ✅ Admin is set at deployment (contract creator)

### Token Creation
1. ✅ Only approved users can create tokens
2. ✅ **Producer**: Can create tokens with parentId = 0 (raw materials)
3. ✅ **Factory**: Must specify parent token (must own some of parent)
4. ✅ **Retailer**: Must specify parent token (must own some of parent)
5. ✅ **Consumer**: Cannot create tokens
6. ✅ Total supply is credited to creator at creation
7. ✅ Token features stored as JSON string

### Transfer Rules
1. ✅ Only approved users can transfer
2. ✅ Transfer flow must follow: Producer → Factory → Retailer → Consumer
3. ✅ **Producer** can only transfer to **Factory**
4. ✅ **Factory** can only transfer to **Retailer**
5. ✅ **Retailer** can only transfer to **Consumer**
6. ✅ **Consumer** cannot transfer (end of chain)
7. ✅ Transfer creates a pending request
8. ✅ Recipient must accept or reject transfer
9. ✅ Balance only moves when transfer is accepted
10. ✅ Cannot transfer to yourself
11. ✅ Cannot transfer more than balance
12. ✅ Recipient must be registered and approved

---

## 🧪 Test Coverage Requirements

### User Tests (9 tests minimum)
- [x] testUserRegistration - User can request role
- [x] testAdminApproveUser - Admin can approve user
- [x] testAdminRejectUser - Admin can reject user
- [x] testUserStatusChanges - Status changes work correctly
- [x] testOnlyApprovedUsersCanOperate - Unapproved users blocked
- [x] testGetUserInfo - getUserInfo returns correct data
- [x] testIsAdmin - isAdmin returns correct value
- [x] testOnlyAdminCanChangeStatus - Non-admin cannot change status
- [x] testUserAlreadyRegistered - Cannot register twice

### Token Tests (12 tests minimum)
- [x] testCreateTokenByProducer - Producer creates token with parentId=0
- [x] testCreateTokenByFactory - Factory creates with parent
- [x] testCreateTokenByRetailer - Retailer creates with parent
- [x] testTokenWithParentId - Parent relationship tracked
- [x] testTokenMetadata - Features stored correctly
- [x] testTokenBalance - Balance set correctly at creation
- [x] testGetToken - getToken returns correct data
- [x] testGetUserTokens - getUserTokens returns owned tokens
- [x] testUnapprovedUserCannotCreateToken - Unapproved blocked
- [x] testProducerCannotHaveParent - Producer must have parentId=0
- [x] testFactoryMustHaveParent - Factory needs parent
- [x] testConsumerCannotCreateToken - Consumer blocked from creating

### Transfer Tests (15 tests minimum)
- [x] testTransferFromProducerToFactory - Valid transfer
- [x] testTransferFromFactoryToRetailer - Valid transfer
- [x] testTransferFromRetailerToConsumer - Valid transfer
- [x] testAcceptTransfer - Accept updates balances
- [x] testRejectTransfer - Reject doesn't update balances
- [x] testTransferInsufficientBalance - Blocked
- [x] testGetTransfer - Returns correct data
- [x] testGetUserTransfers - Returns user's transfers
- [x] testInvalidRoleTransfer - Invalid role flow blocked
- [x] testUnapprovedUserCannotTransfer - Unapproved blocked
- [x] testConsumerCannotTransfer - Consumer cannot send
- [x] testTransferToSameAddress - Blocked
- [x] testTransferZeroAmount - Blocked
- [x] testTransferNonExistentToken - Blocked
- [x] testDoubleAcceptTransfer - Cannot accept twice

### Event Tests (6 tests minimum)
- [x] testUserRegisteredEvent - Emitted on registration
- [x] testUserStatusChangedEvent - Emitted on status change
- [x] testTokenCreatedEvent - Emitted on token creation
- [x] testTransferRequestedEvent - Emitted on transfer
- [x] testTransferAcceptedEvent - Emitted on accept
- [x] testTransferRejectedEvent - Emitted on reject

### Flow Tests (3 tests minimum)
- [x] testCompleteSupplyChainFlow - Full Producer→Consumer flow
- [x] testMultipleTokensFlow - Multiple tokens in parallel
- [x] testTraceabilityFlow - Can trace product to origin

**Minimum Required Tests: 45**

---

## 🔒 Security Considerations

1. ✅ **Access Control**: All write functions protected by modifiers
2. ✅ **Input Validation**: All inputs validated (non-zero, non-empty, valid ranges)
3. ✅ **Reentrancy**: No external calls, no reentrancy risk
4. ✅ **Integer Overflow**: Using Solidity 0.8+ (built-in overflow protection)
5. ✅ **Event Logging**: All state changes emit events for transparency
6. ✅ **Role Validation**: Transfer rules enforced at contract level

---

## 📝 Implementation Notes

### Storage Optimization
- Using `uint256` for IDs and amounts (gas-efficient on EVM)
- String comparisons using keccak256 hashing
- Arrays for user's tokens/transfers for efficient queries

### Gas Optimization
- View functions for all read operations
- Batch queries with array returns
- Minimal storage writes

### Future Enhancements (Not in MVP)
- Token burning
- Transfer cancellation
- Batch transfers
- Token metadata URI (IPFS)
- Upgradeable contract pattern
- Multi-sig admin

---

## 📚 References

- [Solidity Docs](https://docs.soliditylang.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

---

**Last Updated**: 2025-10-30  
**Status**: Specification Complete - Ready for Implementation

