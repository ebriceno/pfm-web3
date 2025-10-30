// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SupplyChain
 * @notice A supply chain tracking system with role-based token transfers
 * @dev Implements token creation, transfer approval system, and user role management
 */
contract SupplyChain {
    
    // ============================================
    // ENUMS
    // ============================================
    
    /**
     * @notice User status in the system
     */
    enum UserStatus {
        Pending,    // User registered, awaiting approval
        Approved,   // User approved by admin
        Rejected,   // User rejected by admin
        Canceled    // User canceled their registration
    }
    
    /**
     * @notice Transfer status
     */
    enum TransferStatus {
        Pending,    // Transfer initiated, awaiting acceptance
        Accepted,   // Transfer accepted by recipient
        Rejected    // Transfer rejected by recipient
    }
    
    // ============================================
    // STRUCTS
    // ============================================
    
    /**
     * @notice Token structure representing a product or raw material
     * @dev Balance is stored in a mapping within the struct
     */
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
    
    /**
     * @notice Transfer structure for token transfers between users
     */
    struct Transfer {
        uint256 id;              // Unique transfer ID
        address from;            // Sender address
        address to;              // Recipient address
        uint256 tokenId;         // Token being transferred
        uint256 dateCreated;     // Transfer initiation timestamp
        uint256 amount;          // Amount being transferred
        TransferStatus status;   // Current status
    }
    
    /**
     * @notice User structure for registered users
     */
    struct User {
        uint256 id;          // Unique user ID
        address userAddress; // User's wallet address
        string role;         // Role: Producer, Factory, Retailer, Consumer
        UserStatus status;   // Current status
    }
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    /// @notice Admin address (contract creator)
    address public admin;
    
    /// @notice Counter for next token ID
    uint256 public nextTokenId = 1;
    
    /// @notice Counter for next transfer ID
    uint256 public nextTransferId = 1;
    
    /// @notice Counter for next user ID
    uint256 public nextUserId = 1;
    
    /// @notice Mapping from token ID to Token
    mapping(uint256 => Token) public tokens;
    
    /// @notice Mapping from transfer ID to Transfer
    mapping(uint256 => Transfer) public transfers;
    
    /// @notice Mapping from user ID to User
    mapping(uint256 => User) public users;
    
    /// @notice Mapping from address to user ID (for quick lookups)
    mapping(address => uint256) public addressToUserId;
    
    /// @notice Mapping from address to array of token IDs they own
    mapping(address => uint256[]) private userTokenIds;
    
    /// @notice Mapping from address to array of transfer IDs involving them
    mapping(address => uint256[]) private userTransferIds;
    
    // ============================================
    // EVENTS
    // ============================================
    
    /**
     * @notice Emitted when a new token is created
     * @param tokenId The ID of the created token
     * @param creator The address that created the token
     * @param name The name of the token
     * @param totalSupply The total supply of the token
     */
    event TokenCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        uint256 totalSupply
    );
    
    /**
     * @notice Emitted when a transfer is requested
     * @param transferId The ID of the transfer
     * @param from The sender address
     * @param to The recipient address
     * @param tokenId The token being transferred
     * @param amount The amount being transferred
     */
    event TransferRequested(
        uint256 indexed transferId,
        address indexed from,
        address indexed to,
        uint256 tokenId,
        uint256 amount
    );
    
    /**
     * @notice Emitted when a transfer is accepted
     * @param transferId The ID of the accepted transfer
     */
    event TransferAccepted(uint256 indexed transferId);
    
    /**
     * @notice Emitted when a transfer is rejected
     * @param transferId The ID of the rejected transfer
     */
    event TransferRejected(uint256 indexed transferId);
    
    /**
     * @notice Emitted when a user requests a role
     * @param user The address requesting a role
     * @param role The role being requested
     */
    event UserRoleRequested(address indexed user, string role);
    
    /**
     * @notice Emitted when a user's status changes
     * @param user The address of the user
     * @param status The new status
     */
    event UserStatusChanged(address indexed user, UserStatus status);
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    /**
     * @notice Contract constructor
     * @dev Sets the contract deployer as admin
     */
    constructor() {
        admin = msg.sender;
    }
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    /**
     * @notice Restricts function access to admin only
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    /**
     * @notice Restricts function access to approved users only
     */
    modifier onlyApprovedUser() {
        uint256 userId = addressToUserId[msg.sender];
        require(userId != 0, "User not registered");
        require(users[userId].status == UserStatus.Approved, "User not approved");
        _;
    }
    
    // ============================================
    // USER MANAGEMENT FUNCTIONS
    // ============================================
    
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
    
    /**
     * @notice Checks if an address is the admin
     * @param userAddress Address to check
     * @return bool True if address is admin
     */
    function isAdmin(address userAddress) public view returns (bool) {
        return userAddress == admin;
    }
    
    // ============================================
    // INTERNAL HELPER FUNCTIONS
    // ============================================
    
    /**
     * @notice Validates if a role string is valid
     * @param role Role string to validate
     * @return bool True if role is valid
     */
    function _isValidRole(string memory role) internal pure returns (bool) {
        return _compareStrings(role, "Producer") ||
               _compareStrings(role, "Factory") ||
               _compareStrings(role, "Retailer") ||
               _compareStrings(role, "Consumer");
    }
    
    /**
     * @notice Validates if a transfer between two roles is allowed
     * @param fromRole Role of the sender
     * @param toRole Role of the recipient
     * @return bool True if transfer is valid
     */
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
    
    /**
     * @notice Compares two strings for equality
     * @param a First string
     * @param b Second string
     * @return bool True if strings are equal
     */
    function _compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
    
    // ============================================
    // TOKEN MANAGEMENT FUNCTIONS
    // ============================================
    
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
        
        // Producer: parentId must be 0 (raw materials)
        if (_compareStrings(userRole, "Producer")) {
            require(parentId == 0, "Producer cannot have parent token");
        }
        // Factory/Retailer: must have valid parent token and own some of it
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
    
    /**
     * @notice Gets token information
     * @param tokenId ID of the token
     * @return id Token ID
     * @return creator Creator address
     * @return name Token name
     * @return totalSupply Total supply
     * @return features JSON metadata
     * @return parentId Parent token ID
     * @return dateCreated Creation timestamp
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
    
    /**
     * @notice Gets all token IDs owned by a user (with balance > 0)
     * @param userAddress Address of the user
     * @return Array of token IDs
     */
    function getUserTokens(address userAddress) public view returns (uint256[] memory) {
        return userTokenIds[userAddress];
    }
    
    // ============================================
    // TRANSFER MANAGEMENT FUNCTIONS
    // ============================================
    
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
        
        // Consumer cannot transfer (end of chain)
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
    
    /**
     * @notice Gets transfer information
     * @param transferId ID of the transfer
     * @return Transfer struct
     */
    function getTransfer(uint256 transferId) public view returns (Transfer memory) {
        require(transferId > 0 && transferId < nextTransferId, "Invalid transfer ID");
        return transfers[transferId];
    }
    
    /**
     * @notice Gets all transfer IDs involving a user
     * @param userAddress Address of the user
     * @return Array of transfer IDs
     */
    function getUserTransfers(address userAddress) public view returns (uint256[] memory) {
        return userTransferIds[userAddress];
    }
}

