// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

/**
 * @title SupplyChainTest
 * @notice Test suite for SupplyChain contract
 */
contract SupplyChainTest is Test {
    
    SupplyChain public supplyChain;
    
    // Test accounts
    address public admin;
    address public producer;
    address public factory;
    address public retailer;
    address public consumer;
    address public unauthorized;
    
    // Events to test
    event UserRoleRequested(address indexed user, string role);
    event UserStatusChanged(address indexed user, SupplyChain.UserStatus status);
    event TokenCreated(uint256 indexed tokenId, address indexed creator, string name, uint256 totalSupply);
    event TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount);
    event TransferAccepted(uint256 indexed transferId);
    event TransferRejected(uint256 indexed transferId);
    
    function setUp() public {
        // Setup test accounts
        admin = address(this); // Test contract is admin
        producer = makeAddr("producer");
        factory = makeAddr("factory");
        retailer = makeAddr("retailer");
        consumer = makeAddr("consumer");
        unauthorized = makeAddr("unauthorized");
        
        // Deploy contract
        supplyChain = new SupplyChain();
    }
    
    // ============================================
    // USER MANAGEMENT TESTS
    // ============================================
    
    function testUserRegistration() public {
        vm.prank(producer);
        vm.expectEmit(true, false, false, true);
        emit UserRoleRequested(producer, "Producer");
        supplyChain.requestUserRole("Producer");
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.userAddress, producer);
        assertEq(user.role, "Producer");
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Pending));
    }
    
    function testAdminApproveUser() public {
        // Register user
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        // Admin approves
        vm.expectEmit(true, false, false, true);
        emit UserStatusChanged(producer, SupplyChain.UserStatus.Approved);
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        // Verify status
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Approved));
    }
    
    function testAdminRejectUser() public {
        // Register user
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        // Admin rejects
        vm.expectEmit(true, false, false, true);
        emit UserStatusChanged(producer, SupplyChain.UserStatus.Rejected);
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Rejected);
        
        // Verify status
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Rejected));
    }
    
    function testUserStatusChanges() public {
        // Register user
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        // Pending -> Approved
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Approved));
        
        // Approved -> Rejected
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Rejected);
        user = supplyChain.getUserInfo(producer);
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Rejected));
        
        // Rejected -> Approved (can re-approve)
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        user = supplyChain.getUserInfo(producer);
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Approved));
    }
    
    function testOnlyApprovedUsersCanOperate() public {
        // Register user but don't approve
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        // This test will be expanded when we add token creation
        // For now, we verify the user is in Pending status
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Pending));
    }
    
    function testGetUserInfo() public {
        // Register multiple users
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        
        // Get producer info
        SupplyChain.User memory producerInfo = supplyChain.getUserInfo(producer);
        assertEq(producerInfo.userAddress, producer);
        assertEq(producerInfo.role, "Producer");
        assertEq(uint(producerInfo.status), uint(SupplyChain.UserStatus.Pending));
        assertEq(producerInfo.id, 1);
        
        // Get factory info
        SupplyChain.User memory factoryInfo = supplyChain.getUserInfo(factory);
        assertEq(factoryInfo.userAddress, factory);
        assertEq(factoryInfo.role, "Factory");
        assertEq(uint(factoryInfo.status), uint(SupplyChain.UserStatus.Pending));
        assertEq(factoryInfo.id, 2);
    }
    
    function testIsAdmin() public {
        // Test contract (deployer) is admin
        assertTrue(supplyChain.isAdmin(admin));
        
        // Other addresses are not admin
        assertFalse(supplyChain.isAdmin(producer));
        assertFalse(supplyChain.isAdmin(factory));
        assertFalse(supplyChain.isAdmin(unauthorized));
    }
    
    function testOnlyAdminCanChangeStatus() public {
        // Register user
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        // Unauthorized user tries to change status
        vm.prank(unauthorized);
        vm.expectRevert("Only admin can perform this action");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        // Producer tries to approve themselves
        vm.prank(producer);
        vm.expectRevert("Only admin can perform this action");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        // Admin can change status
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint(user.status), uint(SupplyChain.UserStatus.Approved));
    }
    
    function testUserAlreadyRegistered() public {
        // Register user
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        // Try to register again
        vm.prank(producer);
        vm.expectRevert("User already registered");
        supplyChain.requestUserRole("Producer");
        
        // Try to register with different role
        vm.prank(producer);
        vm.expectRevert("User already registered");
        supplyChain.requestUserRole("Factory");
    }
    
    function testInvalidRole() public {
        vm.prank(producer);
        vm.expectRevert("Invalid role");
        supplyChain.requestUserRole("InvalidRole");
        
        vm.prank(producer);
        vm.expectRevert("Invalid role");
        supplyChain.requestUserRole("Admin");
        
        vm.prank(producer);
        vm.expectRevert("Invalid role");
        supplyChain.requestUserRole("");
    }
    
    function testGetUserInfoNonExistent() public {
        vm.expectRevert("User not found");
        supplyChain.getUserInfo(unauthorized);
    }
    
    function testChangeStatusUserNonExistent() public {
        vm.expectRevert("User not found");
        supplyChain.changeStatusUser(unauthorized, SupplyChain.UserStatus.Approved);
    }
    
    function testMultipleRoleRegistrations() public {
        // Register users with different roles
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");
        
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer");
        
        // Verify all registered correctly
        SupplyChain.User memory p = supplyChain.getUserInfo(producer);
        assertEq(p.role, "Producer");
        
        SupplyChain.User memory f = supplyChain.getUserInfo(factory);
        assertEq(f.role, "Factory");
        
        SupplyChain.User memory r = supplyChain.getUserInfo(retailer);
        assertEq(r.role, "Retailer");
        
        SupplyChain.User memory c = supplyChain.getUserInfo(consumer);
        assertEq(c.role, "Consumer");
    }
    
    // ============================================
    // TOKEN CREATION TESTS
    // ============================================
    
    function testCreateTokenByProducer() public {
        // Register and approve producer
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        // Create token with parentId = 0 (raw material)
        vm.prank(producer);
        vm.expectEmit(true, true, false, true);
        emit TokenCreated(1, producer, "Organic Wheat", 1000);
        supplyChain.createToken("Organic Wheat", 1000, '{"origin": "Spain"}', 0);
        
        // Verify token created
        (uint256 id, address creator, string memory name, uint256 totalSupply, 
         string memory features, uint256 parentId, uint256 dateCreated) = supplyChain.getToken(1);
        
        assertEq(id, 1);
        assertEq(creator, producer);
        assertEq(name, "Organic Wheat");
        assertEq(totalSupply, 1000);
        assertEq(features, '{"origin": "Spain"}');
        assertEq(parentId, 0);
        assertGt(dateCreated, 0);
        
        // Verify balance
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
    }
    
    function testCreateTokenByFactory() public {
        // Note: This test validates that Factory CAN create tokens with parent
        // The full flow with actual token transfer will be tested in Step 1.7
        // For now, we test that Factory must have a parent token ID
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        // Factory tries to create without parent - should fail
        vm.prank(factory);
        vm.expectRevert("Invalid parent token");
        supplyChain.createToken("Wheat Flour", 500, '{"process": "milled"}', 0);
        
        // This validates Factory role requires parentId > 0
        // Full integration test with transfers will be in Step 1.7
    }
    
    function testCreateTokenByRetailer() public {
        // Note: This test validates that Retailer CAN create tokens with parent
        // The full flow with actual token transfer will be tested in Step 1.7
        
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        
        // Retailer tries to create without parent - should fail
        vm.prank(retailer);
        vm.expectRevert("Invalid parent token");
        supplyChain.createToken("Flour Pack 1kg", 50, '{"package": "retail"}', 0);
        
        // This validates Retailer role requires parentId > 0
        // Full integration test with transfers will be in Step 1.7
    }
    
    function testTokenWithParentId() public {
        // Create parent token
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, '{}', 0);
        
        // Verify parent token has parentId = 0
        (, , , , , uint256 parentId, ) = supplyChain.getToken(1);
        assertEq(parentId, 0);
        
        // Full parent-child relationship will be tested in Step 1.7
        // after transfer functions are implemented
    }
    
    function testTokenMetadata() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        string memory metadata = '{"origin": "Spain", "organic": true, "certifications": ["EU-BIO"]}';
        vm.prank(producer);
        supplyChain.createToken("Premium Wheat", 1000, metadata, 0);
        
        (, , , , string memory features, , ) = supplyChain.getToken(1);
        assertEq(features, metadata);
    }
    
    function testTokenBalance() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.createToken("Wheat", 5000, '{}', 0);
        
        // Creator should have full supply
        assertEq(supplyChain.getTokenBalance(1, producer), 5000);
        
        // Others should have 0
        assertEq(supplyChain.getTokenBalance(1, factory), 0);
        assertEq(supplyChain.getTokenBalance(1, retailer), 0);
    }
    
    function testGetToken() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.createToken("Test Token", 1234, '{"test": true}', 0);
        
        (uint256 id, address creator, string memory name, uint256 totalSupply,
         string memory features, uint256 parentId, uint256 dateCreated) = supplyChain.getToken(1);
        
        assertEq(id, 1);
        assertEq(creator, producer);
        assertEq(name, "Test Token");
        assertEq(totalSupply, 1234);
        assertEq(features, '{"test": true}');
        assertEq(parentId, 0);
        assertGt(dateCreated, 0);
    }
    
    function testGetUserTokens() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        // Create multiple tokens
        vm.prank(producer);
        supplyChain.createToken("Token 1", 100, '{}', 0);
        vm.prank(producer);
        supplyChain.createToken("Token 2", 200, '{}', 0);
        vm.prank(producer);
        supplyChain.createToken("Token 3", 300, '{}', 0);
        
        // Get user tokens
        uint256[] memory tokens = supplyChain.getUserTokens(producer);
        assertEq(tokens.length, 3);
        assertEq(tokens[0], 1);
        assertEq(tokens[1], 2);
        assertEq(tokens[2], 3);
    }
    
    function testUnapprovedUserCannotCreateToken() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        // Don't approve
        
        vm.prank(producer);
        vm.expectRevert("User not approved");
        supplyChain.createToken("Wheat", 1000, '{}', 0);
    }
    
    function testProducerCannotHaveParent() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        // Producer tries to create token with parent
        vm.prank(producer);
        vm.expectRevert("Producer cannot have parent token");
        supplyChain.createToken("Invalid", 100, '{}', 1);
    }
    
    function testFactoryMustHaveParent() public {
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        // Factory tries to create token without parent
        vm.prank(factory);
        vm.expectRevert("Invalid parent token");
        supplyChain.createToken("Invalid", 100, '{}', 0);
    }
    
    function testRetailerMustHaveParent() public {
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        
        // Retailer tries to create token without parent
        vm.prank(retailer);
        vm.expectRevert("Invalid parent token");
        supplyChain.createToken("Invalid", 100, '{}', 0);
    }
    
    function testConsumerCannotCreateToken() public {
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer");
        supplyChain.changeStatusUser(consumer, SupplyChain.UserStatus.Approved);
        
        vm.prank(consumer);
        vm.expectRevert("Consumer cannot create tokens");
        supplyChain.createToken("Invalid", 100, '{}', 0);
    }
    
    function testFactoryMustOwnParentToken() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        // Factory tries to use parent token it doesn't own
        vm.prank(factory);
        vm.expectRevert("Must own parent token");
        supplyChain.createToken("Flour", 100, '{}', 1);
    }
    
    function testCreateTokenEmptyName() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        vm.expectRevert("Name cannot be empty");
        supplyChain.createToken("", 1000, '{}', 0);
    }
    
    function testCreateTokenZeroSupply() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        vm.expectRevert("Supply must be greater than 0");
        supplyChain.createToken("Wheat", 0, '{}', 0);
    }
    
    function testGetTokenInvalidId() public {
        vm.expectRevert("Invalid token ID");
        supplyChain.getToken(999);
        
        vm.expectRevert("Invalid token ID");
        supplyChain.getToken(0);
    }
    
    function testGetTokenBalanceInvalidId() public {
        vm.expectRevert("Invalid token ID");
        supplyChain.getTokenBalance(999, producer);
    }
    
    // ============================================
    // TRANSFER SYSTEM TESTS
    // ============================================
    
    function testTransferFromProducerToFactory() public {
        // Setup: Producer creates token
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        // Setup: Factory registers
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        // Producer transfers to Factory
        vm.prank(producer);
        vm.expectEmit(true, true, true, true);
        emit TransferRequested(1, producer, factory, 1, 200);
        supplyChain.transfer(factory, 1, 200);
        
        // Verify transfer created
        SupplyChain.Transfer memory txn = supplyChain.getTransfer(1);
        assertEq(txn.from, producer);
        assertEq(txn.to, factory);
        assertEq(txn.tokenId, 1);
        assertEq(txn.amount, 200);
        assertEq(uint(txn.status), uint(SupplyChain.TransferStatus.Pending));
        
        // Balances not changed yet (pending)
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
        assertEq(supplyChain.getTokenBalance(1, factory), 0);
    }
    
    function testTransferFromFactoryToRetailer() public {
        // Setup chain: Producer -> Factory
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 200);
        
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Factory creates product
        vm.prank(factory);
        supplyChain.createToken("Flour", 100, '{}', 1);
        
        // Setup: Retailer registers
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        
        // Factory transfers to Retailer
        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 50);
        
        SupplyChain.Transfer memory txn = supplyChain.getTransfer(2);
        assertEq(txn.from, factory);
        assertEq(txn.to, retailer);
        assertEq(txn.tokenId, 2);
        assertEq(txn.amount, 50);
    }
    
    function testTransferFromRetailerToConsumer() public {
        // Setup complete chain
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 200);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        vm.prank(factory);
        supplyChain.createToken("Flour", 100, '{}', 1);
        
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 50);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        vm.prank(retailer);
        supplyChain.createToken("Flour Pack", 25, '{}', 2);
        
        // Setup: Consumer registers
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer");
        supplyChain.changeStatusUser(consumer, SupplyChain.UserStatus.Approved);
        
        // Retailer transfers to Consumer
        vm.prank(retailer);
        supplyChain.transfer(consumer, 3, 10);
        
        SupplyChain.Transfer memory txn = supplyChain.getTransfer(3);
        assertEq(txn.from, retailer);
        assertEq(txn.to, consumer);
        assertEq(txn.tokenId, 3);
        assertEq(txn.amount, 10);
    }
    
    function testAcceptTransfer() public {
        // Setup
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 200);
        
        // Accept transfer
        vm.prank(factory);
        vm.expectEmit(true, false, false, false);
        emit TransferAccepted(1);
        supplyChain.acceptTransfer(1);
        
        // Verify balances updated
        assertEq(supplyChain.getTokenBalance(1, producer), 800);
        assertEq(supplyChain.getTokenBalance(1, factory), 200);
        
        // Verify status changed
        SupplyChain.Transfer memory txn = supplyChain.getTransfer(1);
        assertEq(uint(txn.status), uint(SupplyChain.TransferStatus.Accepted));
        
        // Verify factory has token in list
        uint256[] memory factoryTokens = supplyChain.getUserTokens(factory);
        assertEq(factoryTokens.length, 1);
        assertEq(factoryTokens[0], 1);
    }
    
    function testRejectTransfer() public {
        // Setup
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 200);
        
        // Reject transfer
        vm.prank(factory);
        vm.expectEmit(true, false, false, false);
        emit TransferRejected(1);
        supplyChain.rejectTransfer(1);
        
        // Verify balances NOT updated
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
        assertEq(supplyChain.getTokenBalance(1, factory), 0);
        
        // Verify status changed
        SupplyChain.Transfer memory txn = supplyChain.getTransfer(1);
        assertEq(uint(txn.status), uint(SupplyChain.TransferStatus.Rejected));
    }
    
    function testInvalidRoleTransfer() public {
        // Producer cannot transfer to Retailer (must go to Factory)
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        vm.expectRevert("Invalid role transfer");
        supplyChain.transfer(retailer, 1, 100);
    }
    
    function testConsumerCannotTransfer() public {
        // Setup: Complete chain to get token to consumer
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 200);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        vm.prank(factory);
        supplyChain.createToken("Flour", 100, '{}', 1);
        
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 50);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        vm.prank(retailer);
        supplyChain.createToken("Flour Pack", 25, '{}', 2);
        
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer");
        supplyChain.changeStatusUser(consumer, SupplyChain.UserStatus.Approved);
        vm.prank(retailer);
        supplyChain.transfer(consumer, 3, 10);
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);
        
        // Now consumer has tokens, but still cannot transfer (end of chain)
        vm.prank(consumer);
        vm.expectRevert("Consumer cannot transfer");
        supplyChain.transfer(producer, 3, 5);
    }
    
    function testTransferToSameAddress() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(producer);
        vm.expectRevert("Cannot transfer to yourself");
        supplyChain.transfer(producer, 1, 100);
    }
    
    function testTransferInsufficientBalance() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        vm.expectRevert("Insufficient balance");
        supplyChain.transfer(factory, 1, 2000); // More than balance
    }
    
    function testUnapprovedUserCannotTransfer() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        // Don't approve factory
        
        vm.prank(producer);
        vm.expectRevert("Recipient not approved");
        supplyChain.transfer(factory, 1, 100);
    }
    
    function testTransferZeroAmount() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        vm.expectRevert("Amount must be greater than 0");
        supplyChain.transfer(factory, 1, 0);
    }
    
    function testTransferNonExistentToken() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        vm.expectRevert("Invalid token ID");
        supplyChain.transfer(factory, 999, 100);
    }
    
    function testGetTransfer() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 200);
        
        SupplyChain.Transfer memory txn = supplyChain.getTransfer(1);
        assertEq(txn.id, 1);
        assertEq(txn.from, producer);
        assertEq(txn.to, factory);
        assertEq(txn.tokenId, 1);
        assertEq(txn.amount, 200);
        assertEq(uint(txn.status), uint(SupplyChain.TransferStatus.Pending));
        assertGt(txn.dateCreated, 0);
    }
    
    function testGetUserTransfers() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        // Create multiple transfers
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);
        
        // Producer has 2 transfers (sender)
        uint256[] memory producerTransfers = supplyChain.getUserTransfers(producer);
        assertEq(producerTransfers.length, 2);
        
        // Factory has 2 transfers (recipient)
        uint256[] memory factoryTransfers = supplyChain.getUserTransfers(factory);
        assertEq(factoryTransfers.length, 2);
    }
    
    function testDoubleAcceptTransfer() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 200);
        
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Try to accept again
        vm.prank(factory);
        vm.expectRevert("Transfer not pending");
        supplyChain.acceptTransfer(1);
    }
    
    function testOnlyRecipientCanAccept() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 200);
        
        // Producer tries to accept (sender, not recipient)
        vm.prank(producer);
        vm.expectRevert("Only recipient can accept");
        supplyChain.acceptTransfer(1);
    }
    
    function testOnlyRecipientCanReject() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, '{}', 0);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 200);
        
        // Producer tries to reject (sender, not recipient)
        vm.prank(producer);
        vm.expectRevert("Only recipient can reject");
        supplyChain.rejectTransfer(1);
    }
    
    function testCompleteSupplyChainFlow() public {
        // 1. Producer creates raw material
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(producer);
        supplyChain.createToken("Organic Wheat", 1000, '{"origin": "Spain"}', 0);
        
        // 2. Producer -> Factory
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 300);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        assertEq(supplyChain.getTokenBalance(1, producer), 700);
        assertEq(supplyChain.getTokenBalance(1, factory), 300);
        
        // 3. Factory creates product
        vm.prank(factory);
        supplyChain.createToken("Wheat Flour", 150, '{"process": "milled"}', 1);
        
        // 4. Factory -> Retailer
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        
        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 100);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        
        assertEq(supplyChain.getTokenBalance(2, factory), 50);
        assertEq(supplyChain.getTokenBalance(2, retailer), 100);
        
        // 5. Retailer creates packaged product
        vm.prank(retailer);
        supplyChain.createToken("Flour Pack 1kg", 50, '{"package": "retail"}', 2);
        
        // 6. Retailer -> Consumer
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer");
        supplyChain.changeStatusUser(consumer, SupplyChain.UserStatus.Approved);
        
        vm.prank(retailer);
        supplyChain.transfer(consumer, 3, 20);
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);
        
        assertEq(supplyChain.getTokenBalance(3, retailer), 30);
        assertEq(supplyChain.getTokenBalance(3, consumer), 20);
        
        // 7. Verify complete traceability
        (, , , , , uint256 token3Parent, ) = supplyChain.getToken(3);
        assertEq(token3Parent, 2); // Flour Pack derived from Flour
        
        (, , , , , uint256 token2Parent, ) = supplyChain.getToken(2);
        assertEq(token2Parent, 1); // Flour derived from Wheat
        
        (, , , , , uint256 token1Parent, ) = supplyChain.getToken(1);
        assertEq(token1Parent, 0); // Wheat is raw material
        
        // Complete supply chain validated! 🎉
    }
}

