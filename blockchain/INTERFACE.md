TrustChainRegistry Interface Notes

1. Overview

TrustChainRegistry is the Smart Contract and Provenance Registry for the TrustChain AI project.

Its purpose is to maintain tamper-evident on-chain records for:

datasets

machine learning models

model versions and lineage

model hash verification

security events

trust score updates

Large artifacts such as datasets, model files, logs, and telemetry remain off-chain. The blockchain stores compact identifiers, cryptographic hashes, metadata references, lineage information, and security/trust records.

Contract source:

blockchain/contracts/TrustChainRegistry.sol

2. Technology

Solidity

OpenZeppelin AccessControl

Hardhat

Viem-based tests

Ethereum-compatible blockchain

The contract uses role-based access control to separate provenance registration from security and trust-analysis operations.

3. Roles

DEFAULT_ADMIN_ROLE

The deployer receives the default administrator role.

The administrator can manage contract roles through OpenZeppelin AccessControl.

REGISTRAR_ROLE

Used for provenance registration operations.

Protected functions:

registerDataset

registerModel

registerModelVersion

ANALYST_ROLE

Used for security and trust-analysis operations.

Protected functions:

recordSecurityEvent

updateTrustScore

Read-only functions are publicly accessible.

4. Dataset Registration

registerDataset

Registers a dataset and its cryptographic fingerprint.

registerDataset(
    string calldata datasetId,
    bytes32 datasetHash,
    string calldata metadataRef
)

Requirements:

Caller must have REGISTRAR_ROLE.

datasetId must not already exist.

datasetHash must be non-zero.

Stored information:

dataset ID

dataset hash

creator address

registration timestamp

metadata reference

5. Model Registration

registerModel

Registers a model and links it to an existing dataset.

registerModel(
    string calldata modelId,
    string calldata datasetId,
    address owner
)

Requirements:

Caller must have REGISTRAR_ROLE.

modelId must not already exist.

The referenced dataset must already be registered.

owner must not be the zero address.

Stored information:

model ID

dataset ID

owner

current version

existence status

6. Model Version Registration

registerModelVersion

Registers a model version and maintains model lineage.

registerModelVersion(
    string calldata modelId,
    bytes32 modelHash,
    uint256 parentVersion,
    string calldata metadataRef
)

Requirements:

The model must already exist.

Versions must be registered sequentially.

Version 1 uses parent version 0.

Later versions must reference the immediately previous version.

A version cannot be registered twice.

modelHash must be non-zero.

Stored information:

version number

model hash

parent version

creator address

registration timestamp

metadata reference

7. Model Hash Verification

verifyModelVersion

Checks whether a supplied model hash matches the registered hash for a model version.

verifyModelVersion(
    string calldata modelId,
    uint256 version,
    bytes32 suppliedHash
)

Returns:

bool

true means the supplied hash matches the registered hash.

false means the supplied hash does not match.

A mismatch means the supplied artifact differs from the artifact represented by the registered hash. It does not by itself prove malicious activity.

8. Dataset Read

getDataset

getDataset(
    string calldata datasetId
)

Returns the registered dataset record.

The record contains:

dataset ID

dataset hash

creator

timestamp

metadata reference

existence status

9. Model Read

getModel

getModel(
    string calldata modelId
)

Returns the registered model record.

The record contains:

model ID

dataset ID

owner

current version

existence status

10. Model Version Read

getModelVersion

getModelVersion(
    string calldata modelId,
    uint256 version
)

Returns the requested model version record.

The record contains:

version number

model hash

parent version

creator

timestamp

metadata reference

existence status

11. Model Lineage

getModelHistory

getModelHistory(
    string calldata modelId
)

Returns the complete registered version history for the model.

Example:

Model Version 1
       |
       v
Model Version 2
       |
       v
Model Version 3

Each version stores its parent version, allowing the model lineage to be reconstructed.

12. Security Events

recordSecurityEvent

Records a security-related event for a model version.

recordSecurityEvent(
    string calldata modelId,
    uint256 version,
    string calldata eventType,
    string calldata severity,
    string calldata evidenceRef
)

Caller must have:

ANALYST_ROLE

The contract stores:

event type

severity

evidence reference

reporter address

timestamp

13. Security Event Retrieval

getSecurityEvents

Returns the recorded security events for a model.

getSecurityEvents(
    string calldata modelId
)

The backend can use this function to retrieve security-event history for the dashboard and trust-analysis components.

14. Trust Score Updates

updateTrustScore

Stores a trust-score update for a model version.

updateTrustScore(
    string calldata modelId,
    uint256 version,
    uint256 score,
    string calldata status,
    string calldata reasonRef
)

Caller must have:

ANALYST_ROLE

The valid trust-score range is:

0 to 100

Scores greater than 100 are rejected.

Trust updates are stored as history rather than replacing previous updates.

15. Trust History

getTrustHistory

getTrustHistory(
    string calldata modelId,
    uint256 version
)

Returns all stored trust updates for the specified model version.

This supports:

trust-history display

audit trails

explaining trust changes

historical analysis

16. Latest Trust Update

getLatestTrustUpdate

getLatestTrustUpdate(
    string calldata modelId,
    uint256 version
)

Returns the most recent trust update for the specified model version.

17. Important Contract Errors

The contract defines custom errors including:

DatasetAlreadyExists

DatasetNotFound

ModelAlreadyExists

ModelNotFound

InvalidVersion

VersionAlreadyExists

ParentVersionInvalid

VersionNotFound

InvalidHash

InvalidOwner

InvalidTrustScore

18. Main Integration Flow

Registration

Dataset Artifact
       |
       | Hash
       v
Dataset Hash
       |
       | registerDataset
       v
Blockchain Registry
       |
       | registerModel
       v
Model
       |
       | registerModelVersion
       v
Model Version 1
       |
       | registerModelVersion
       v
Model Version 2
       |
       | registerModelVersion
       v
Model Version N

Verification

Model Artifact
       |
       | Hash
       v
Supplied Hash
       |
       | verifyModelVersion
       v
Registered Blockchain Hash
       |
       +---- Match ------> Verified
       |
       +---- Mismatch ---> Integrity Difference Detected

Security and Trust

Behaviour Monitor
       |
       v
Security Evidence
       |
       | recordSecurityEvent
       v
Blockchain Registry
       |
       | updateTrustScore
       v
Trust History

19. Backend Integration

The backend/dashboard can use the contract to:

register datasets

register models

register model versions

verify model hashes

retrieve dataset information

retrieve model information

retrieve model version information

retrieve model lineage

retrieve security events

record trust-score updates

retrieve trust history

retrieve the latest trust update

Large datasets, model files, logs, and telemetry should remain off-chain. The blockchain stores hashes, identifiers, metadata references, lineage information, and security/trust records.

20. Testing Status

The current test suite covers:

dataset registration

duplicate dataset rejection

model registration

invalid dataset rejection

model version registration

hash verification

hash mismatch detection

model version lineage

invalid version rejection

invalid parent-version rejection

model history retrieval

security event recording

trust score updates

multiple trust updates

invalid trust score rejection

registrar role assignment

analyst role assignment

Current result:

22 passing
3 Solidity tests
19 Node.js tests
0 failures

21. Contract Responsibility Boundary

The smart contract is responsible for:

provenance records

cryptographic hashes

dataset/model/version relationships

model lineage

security-event records

trust-score history

role-based access control

The smart contract is not responsible for:

storing complete datasets

storing complete model files

running ML inference

detecting anomalies

calculating behavioural metrics

producing the dashboard

Those functions belong to the other TrustChain AI modules.