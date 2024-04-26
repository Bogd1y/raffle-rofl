// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

import "hardhat/console.sol";

contract VRFCoordinatorMock is VRFCoordinatorV2Interface {
    struct RequestInfo {
        uint256 requestId;
        address requester;
        uint256 callbackGasLimit;
        uint256 numWords;
        bool isFilled;
    }

    mapping(uint256 => RequestInfo) public requests;
    uint256 public lastRequestId;

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata words
    ) external {
        RequestInfo memory info = requests[requestId];

        require(!info.isFilled, "Mock VRF: already filled");
        info.isFilled = true;

        VRFConsumerBaseV2(info.requester).rawFulfillRandomWords(
            requestId,
            words
        );
    }

    function getRequestInfo(
        uint256 requestId
    ) external view returns (RequestInfo memory) {
        return requests[requestId];
    }

    function getRequestConfig()
        external
        view
        returns (uint16, uint32, bytes32[] memory)
    {}

    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        requestId = ++lastRequestId;

        requests[requestId] = RequestInfo({
            requestId: requestId,
            requester: msg.sender,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords,
            isFilled: false
        });
    }

    function createSubscription() external returns (uint64 subId) {}

    function getSubscription(
        uint64 subId
    )
        external
        view
        returns (
            uint96 balance,
            uint64 reqCount,
            address owner,
            address[] memory consumers
        )
    {}

    function requestSubscriptionOwnerTransfer(
        uint64 subId,
        address newOwner
    ) external {}

    function acceptSubscriptionOwnerTransfer(uint64 subId) external {}

    function addConsumer(uint64 subId, address consumer) external {}

    function removeConsumer(uint64 subId, address consumer) external {}

    function cancelSubscription(uint64 subId, address to) external {}

    function pendingRequestExists(uint64 subId) external view returns (bool) {}
}
