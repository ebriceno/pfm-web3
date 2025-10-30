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
    // FUNCTIONS (TO BE IMPLEMENTED IN NEXT STEPS)
    // ============================================
    
    // User Management Functions will be added in Step 1.2
    // Token Management Functions will be added in Step 1.4
    // Transfer Management Functions will be added in Step 1.6
}

