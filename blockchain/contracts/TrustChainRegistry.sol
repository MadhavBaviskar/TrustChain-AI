// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract TrustChainRegistry is AccessControl {
    // =========================================================
    // ROLES
    // =========================================================

    bytes32 public constant REGISTRAR_ROLE =
        keccak256("REGISTRAR_ROLE");

    bytes32 public constant ANALYST_ROLE =
        keccak256("ANALYST_ROLE");

    // =========================================================
    // DATA STRUCTURES
    // =========================================================

    struct Dataset {
        string datasetId;
        bytes32 datasetHash;
        address creator;
        uint256 timestamp;
        string metadataRef;
        bool exists;
    }

    struct Model {
        string modelId;
        string datasetId;
        address owner;
        uint256 currentVersion;
        bool exists;
    }

    struct ModelVersion {
        uint256 version;
        bytes32 modelHash;
        uint256 parentVersion;
        address creator;
        uint256 timestamp;
        string metadataRef;
        bool exists;
    }

    struct SecurityEvent {
        string eventType;
        string severity;
        string evidenceRef;
        address reporter;
        uint256 timestamp;
    }

    struct TrustUpdate {
        uint256 score;
        string status;
        string reasonRef;
        address reporter;
        uint256 timestamp;
    }

    // =========================================================
    // STORAGE
    // =========================================================

    mapping(string => Dataset) private datasets;

    mapping(string => Model) private models;

    mapping(string => mapping(uint256 => ModelVersion))
        private modelVersions;

    mapping(string => SecurityEvent[])
        private securityEvents;

    // IMPORTANT:
    // Trust updates are stored as arrays so historical updates
    // are never overwritten.
    mapping(string => mapping(uint256 => TrustUpdate[]))
        private trustHistory;

    // =========================================================
    // ERRORS
    // =========================================================

    error DatasetAlreadyExists();
    error DatasetNotFound();

    error ModelAlreadyExists();
    error ModelNotFound();

    error InvalidVersion();
    error VersionAlreadyExists();
    error ParentVersionInvalid();
    error VersionNotFound();

    error InvalidHash();
    error InvalidOwner();

    error InvalidTrustScore();

    // =========================================================
    // EVENTS
    // =========================================================

    event DatasetRegistered(
        string datasetId,
        bytes32 datasetHash,
        address indexed creator,
        uint256 timestamp
    );

    event ModelRegistered(
        string modelId,
        string datasetId,
        address indexed owner,
        uint256 timestamp
    );

    event ModelVersionRegistered(
        string modelId,
        uint256 version,
        bytes32 modelHash,
        uint256 parentVersion,
        address indexed creator,
        uint256 timestamp
    );

    event SecurityEventRecorded(
        string modelId,
        string eventType,
        string severity,
        string evidenceRef,
        address indexed reporter,
        uint256 timestamp
    );

    event TrustScoreUpdated(
        string modelId,
        uint256 version,
        uint256 score,
        string status,
        string reasonRef,
        address indexed reporter,
        uint256 timestamp
    );

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
        _grantRole(ANALYST_ROLE, msg.sender);
    }

    // =========================================================
    // DATASET REGISTRATION
    // =========================================================

    function registerDataset(
        string calldata datasetId,
        bytes32 datasetHash,
        string calldata metadataRef
    )
        external
        onlyRole(REGISTRAR_ROLE)
    {
        if (datasets[datasetId].exists) {
            revert DatasetAlreadyExists();
        }

        if (datasetHash == bytes32(0)) {
            revert InvalidHash();
        }

        datasets[datasetId] = Dataset({
            datasetId: datasetId,
            datasetHash: datasetHash,
            creator: msg.sender,
            timestamp: block.timestamp,
            metadataRef: metadataRef,
            exists: true
        });

        emit DatasetRegistered(
            datasetId,
            datasetHash,
            msg.sender,
            block.timestamp
        );
    }

    // =========================================================
    // MODEL REGISTRATION
    // =========================================================

    function registerModel(
        string calldata modelId,
        string calldata datasetId,
        address owner
    )
        external
        onlyRole(REGISTRAR_ROLE)
    {
        if (models[modelId].exists) {
            revert ModelAlreadyExists();
        }

        if (!datasets[datasetId].exists) {
            revert DatasetNotFound();
        }

        if (owner == address(0)) {
            revert InvalidOwner();
        }

        models[modelId] = Model({
            modelId: modelId,
            datasetId: datasetId,
            owner: owner,
            currentVersion: 0,
            exists: true
        });

        emit ModelRegistered(
            modelId,
            datasetId,
            owner,
            block.timestamp
        );
    }

    // =========================================================
    // MODEL VERSION REGISTRATION
    // =========================================================

    function registerModelVersion(
        string calldata modelId,
        uint256 version,
        bytes32 modelHash,
        uint256 parentVersion,
        string calldata metadataRef
    )
        external
        onlyRole(REGISTRAR_ROLE)
    {
        if (!models[modelId].exists) {
            revert ModelNotFound();
        }

        if (modelHash == bytes32(0)) {
            revert InvalidHash();
        }

        uint256 currentVersion =
            models[modelId].currentVersion;

        // Versions must be strictly sequential:
        // 1 -> 2 -> 3 -> ...
        if (version == 0 || version != currentVersion + 1) {
            revert InvalidVersion();
        }

        if (modelVersions[modelId][version].exists) {
            revert VersionAlreadyExists();
        }

        // Version 1 has no parent.
        if (version == 1) {
            if (parentVersion != 0) {
                revert ParentVersionInvalid();
            }
        }
        // Later versions must point to their previous version.
        else {
            if (parentVersion != version - 1) {
                revert ParentVersionInvalid();
            }

            if (!modelVersions[modelId][parentVersion].exists) {
                revert VersionNotFound();
            }
        }

        modelVersions[modelId][version] = ModelVersion({
            version: version,
            modelHash: modelHash,
            parentVersion: parentVersion,
            creator: msg.sender,
            timestamp: block.timestamp,
            metadataRef: metadataRef,
            exists: true
        });

        models[modelId].currentVersion = version;

        emit ModelVersionRegistered(
            modelId,
            version,
            modelHash,
            parentVersion,
            msg.sender,
            block.timestamp
        );
    }

    // =========================================================
    // HASH VERIFICATION
    // =========================================================

    function verifyModelVersion(
        string calldata modelId,
        uint256 version,
        bytes32 suppliedHash
    )
        external
        view
        returns (bool)
    {
        if (!models[modelId].exists) {
            return false;
        }

        ModelVersion memory versionData =
            modelVersions[modelId][version];

        if (!versionData.exists) {
            return false;
        }

        return versionData.modelHash == suppliedHash;
    }

    // =========================================================
    // DATASET READ
    // =========================================================

    function getDataset(
        string calldata datasetId
    )
        external
        view
        returns (Dataset memory)
    {
        if (!datasets[datasetId].exists) {
            revert DatasetNotFound();
        }

        return datasets[datasetId];
    }

    // =========================================================
    // MODEL READ
    // =========================================================

    function getModel(
        string calldata modelId
    )
        external
        view
        returns (Model memory)
    {
        if (!models[modelId].exists) {
            revert ModelNotFound();
        }

        return models[modelId];
    }

    // =========================================================
    // MODEL VERSION READ
    // =========================================================

    function getModelVersion(
        string calldata modelId,
        uint256 version
    )
        external
        view
        returns (ModelVersion memory)
    {
        if (!models[modelId].exists) {
            revert ModelNotFound();
        }

        if (!modelVersions[modelId][version].exists) {
            revert VersionNotFound();
        }

        return modelVersions[modelId][version];
    }

    // =========================================================
    // MODEL HISTORY
    // =========================================================

    function getModelHistory(
        string calldata modelId
    )
        external
        view
        returns (ModelVersion[] memory)
    {
        if (!models[modelId].exists) {
            revert ModelNotFound();
        }

        uint256 count =
            models[modelId].currentVersion;

        ModelVersion[] memory history =
            new ModelVersion[](count);

        for (uint256 i = 0; i < count; i++) {
            history[i] =
                modelVersions[modelId][i + 1];
        }

        return history;
    }

    // =========================================================
    // SECURITY EVENTS
    // =========================================================

    function recordSecurityEvent(
        string calldata modelId,
        string calldata eventType,
        string calldata severity,
        string calldata evidenceRef
    )
        external
        onlyRole(ANALYST_ROLE)
    {
        if (!models[modelId].exists) {
            revert ModelNotFound();
        }

        securityEvents[modelId].push(
            SecurityEvent({
                eventType: eventType,
                severity: severity,
                evidenceRef: evidenceRef,
                reporter: msg.sender,
                timestamp: block.timestamp
            })
        );

        emit SecurityEventRecorded(
            modelId,
            eventType,
            severity,
            evidenceRef,
            msg.sender,
            block.timestamp
        );
    }

    function getSecurityEvents(
        string calldata modelId
    )
        external
        view
        returns (SecurityEvent[] memory)
    {
        if (!models[modelId].exists) {
            revert ModelNotFound();
        }

        return securityEvents[modelId];
    }

    // =========================================================
    // TRUST SCORE ANCHORING
    // =========================================================

    function updateTrustScore(
        string calldata modelId,
        uint256 version,
        uint256 score,
        string calldata status,
        string calldata reasonRef
    )
        external
        onlyRole(ANALYST_ROLE)
    {
        if (!models[modelId].exists) {
            revert ModelNotFound();
        }

        if (!modelVersions[modelId][version].exists) {
            revert VersionNotFound();
        }

        if (score > 100) {
            revert InvalidTrustScore();
        }

        trustHistory[modelId][version].push(
            TrustUpdate({
                score: score,
                status: status,
                reasonRef: reasonRef,
                reporter: msg.sender,
                timestamp: block.timestamp
            })
        );

        emit TrustScoreUpdated(
            modelId,
            version,
            score,
            status,
            reasonRef,
            msg.sender,
            block.timestamp
        );
    }

    // =========================================================
    // TRUST HISTORY
    // =========================================================

    function getTrustHistory(
        string calldata modelId,
        uint256 version
    )
        external
        view
        returns (TrustUpdate[] memory)
    {
        if (!models[modelId].exists) {
            revert ModelNotFound();
        }

        if (!modelVersions[modelId][version].exists) {
            revert VersionNotFound();
        }

        return trustHistory[modelId][version];
    }

    function getLatestTrustUpdate(
        string calldata modelId,
        uint256 version
    )
        external
        view
        returns (TrustUpdate memory)
    {
        if (!models[modelId].exists) {
            revert ModelNotFound();
        }

        if (!modelVersions[modelId][version].exists) {
            revert VersionNotFound();
        }

        uint256 count =
            trustHistory[modelId][version].length;

        if (count == 0) {
            return TrustUpdate({
                score: 0,
                status: "",
                reasonRef: "",
                reporter: address(0),
                timestamp: 0
            });
        }

        return trustHistory[modelId][version][count - 1];
    }
}