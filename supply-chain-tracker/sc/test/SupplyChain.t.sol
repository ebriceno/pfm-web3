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
    // PLACEHOLDER FOR FUTURE TESTS
    // ============================================
    
    // Token creation tests will be added in Step 1.5
    // Transfer tests will be added in Step 1.7
}

