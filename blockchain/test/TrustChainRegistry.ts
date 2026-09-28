// import assert from "node:assert/strict";
// import { describe, it } from "node:test";

// import { network } from "hardhat";

// describe("TrustChainRegistry", async function () {
//   const { viem } = await network.create();

//   const [adminWallet, userWallet] =
//     await viem.getWalletClients();

//   // ---------------------------------------------------------
//   // Helpers
//   // ---------------------------------------------------------

//   const datasetId = "D001";
//   const modelId = "M001";

//   const datasetHash =
//     "0x1111111111111111111111111111111111111111111111111111111111111111";

//   const modelHashV1 =
//     "0x2222222222222222222222222222222222222222222222222222222222222222";

//   const modelHashV2 =
//     "0x3333333333333333333333333333333333333333333333333333333333333333";

//   const wrongHash =
//     "0x9999999999999999999999999999999999999999999999999999999999999999";

//   async function deployRegistry() {
//     return await viem.deployContract("TrustChainRegistry");
//   }

//   async function registerBasicModel(
//     registry: Awaited<ReturnType<typeof deployRegistry>>,
//   ) {
//     await registry.write.registerDataset([
//       datasetId,
//       datasetHash,
//       "ipfs://dataset-D001",
//     ]);

//     await registry.write.registerModel([
//       modelId,
//       datasetId,
//       adminWallet.account.address,
//     ]);

//     await registry.write.registerModelVersion([
//       modelId,
//       1n,
//       modelHashV1,
//       0n,
//       "ipfs://metadata/M001/v1",
//     ]);
//   }

//   // =========================================================
//   // DATASET
//   // =========================================================

//   it("registers a dataset correctly", async function () {
//     const registry = await deployRegistry();

//     await registry.write.registerDataset([
//       datasetId,
//       datasetHash,
//       "ipfs://dataset-D001",
//     ]);

//     const dataset =
//       await registry.read.getDataset([datasetId]);

//     assert.equal(dataset[0], datasetId);
//     assert.equal(dataset[1], datasetHash);
//     assert.equal(
//       dataset[2].toLowerCase(),
//       adminWallet.account.address.toLowerCase(),
//     );
//     assert.equal(dataset[4], "ipfs://dataset-D001");
//     assert.equal(dataset[5], true);
//   });

//   // =========================================================
//   // DUPLICATE DATASET
//   // =========================================================

//   it("rejects duplicate dataset registration", async function () {
//     const registry = await deployRegistry();

//     await registry.write.registerDataset([
//       datasetId,
//       datasetHash,
//       "ipfs://dataset-D001",
//     ]);

//     await assert.rejects(
//       registry.write.registerDataset([
//         datasetId,
//         datasetHash,
//         "ipfs://dataset-D001",
//       ]),
//     );
//   });

//   // =========================================================
//   // MODEL
//   // =========================================================

//   it("registers a model linked to an existing dataset", async function () {
//     const registry = await deployRegistry();

//     await registry.write.registerDataset([
//       datasetId,
//       datasetHash,
//       "ipfs://dataset-D001",
//     ]);

//     await registry.write.registerModel([
//       modelId,
//       datasetId,
//       adminWallet.account.address,
//     ]);

//     const model =
//       await registry.read.getModel([modelId]);

//     assert.equal(model[0], modelId);
//     assert.equal(model[1], datasetId);
//     assert.equal(
//       model[2].toLowerCase(),
//       adminWallet.account.address.toLowerCase(),
//     );
//     assert.equal(model[3], 0n);
//     assert.equal(model[4], true);
//   });

//   // =========================================================
//   // MODEL CANNOT USE UNKNOWN DATASET
//   // =========================================================

//   it("rejects model registration for an unknown dataset", async function () {
//     const registry = await deployRegistry();

//     await assert.rejects(
//       registry.write.registerModel([
//         modelId,
//         "DOES_NOT_EXIST",
//         adminWallet.account.address,
//       ]),
//     );
//   });

//   // =========================================================
//   // VERSION 1
//   // =========================================================

//   it("registers model version 1 correctly", async function () {
//     const registry = await deployRegistry();

//     await registerBasicModel(registry);

//     const version =
//       await registry.read.getModelVersion([
//         modelId,
//         1n,
//       ]);

//     assert.equal(version[0], 1n);
//     assert.equal(version[1], modelHashV1);
//     assert.equal(version[2], 0n);
//     assert.equal(
//       version[3].toLowerCase(),
//       adminWallet.account.address.toLowerCase(),
//     );
//     assert.equal(version[5], "ipfs://metadata/M001/v1");
//     assert.equal(version[6], true);

//     const model =
//       await registry.read.getModel([modelId]);

//     assert.equal(model[3], 1n);
//   });

//   // =========================================================
//   // HASH VERIFICATION — VALID
//   // =========================================================

//   it("returns true when the supplied hash matches the registered hash", async function () {
//     const registry = await deployRegistry();

//     await registerBasicModel(registry);

//     const result =
//       await registry.read.verifyModelVersion([
//         modelId,
//         1n,
//         modelHashV1,
//       ]);

//     assert.equal(result, true);
//   });

//   // =========================================================
//   // HASH VERIFICATION — TAMPERED
//   // =========================================================

//   it("returns false when the supplied hash does not match", async function () {
//     const registry = await deployRegistry();

//     await registerBasicModel(registry);

//     const result =
//       await registry.read.verifyModelVersion([
//         modelId,
//         1n,
//         wrongHash,
//       ]);

//     assert.equal(result, false);
//   });

//   // =========================================================
//   // VERSION 2
//   // =========================================================

//   it("registers version 2 with version 1 as its parent", async function () {
//     const registry = await deployRegistry();

//     await registerBasicModel(registry);

//     await registry.write.registerModelVersion([
//       modelId,
//       2n,
//       modelHashV2,
//       1n,
//       "ipfs://metadata/M001/v2",
//     ]);

//     const version2 =
//       await registry.read.getModelVersion([
//         modelId,
//         2n,
//       ]);

//     assert.equal(version2.version, 2n);

// assert.equal(version2.modelHash, modelHashV2);

// assert.equal(version2.parentVersion, 1n);

// const model =
//   await registry.read.getModel([modelId]);

// assert.equal(model.currentVersion, 2n);

//   // =========================================================
//   // INVALID VERSION SEQUENCE
//   // =========================================================

//   it("rejects skipping a model version", async function () {
//     const registry = await deployRegistry();

//     await registerBasicModel(registry);

//     await assert.rejects(
//       registry.write.registerModelVersion([
//         modelId,
//         3n,
//         modelHashV2,
//         2n,
//         "ipfs://metadata/M001/v3",
//       ]),
//     );
//   });

//   // =========================================================
//   // INVALID VERSION PARENT
//   // =========================================================

//   it("rejects a version with the wrong parent version", async function () {
//     const registry = await deployRegistry();

//     await registerBasicModel(registry);

//     await assert.rejects(
//       registry.write.registerModelVersion([
//         modelId,
//         2n,
//         modelHashV2,
//         0n,
//         "ipfs://metadata/M001/v2",
//       ]),
//     );
//   });

//   // =========================================================
//   // MODEL HISTORY
//   // =========================================================

//   it("returns the complete model version history", async function () {
//     const registry = await deployRegistry();

//     await registerBasicModel(registry);

//     await registry.write.registerModelVersion([
//       modelId,
//       2n,
//       modelHashV2,
//       1n,
//       "ipfs://metadata/M001/v2",
//     ]);

//     const history =
//       await registry.read.getModelHistory([modelId]);

//     assert.equal(history.length, 2);

//     assert.equal(history[0].version, 1n);
//     assert.equal(history[0].modelHash, modelHashV1);

//     assert.equal(history[1].version, 2n);
//     assert.equal(history[1].modelHash, modelHashV2);
//     assert.equal(history[1].parentVersion, 1n);
//   });

//   // =========================================================
//   // SECURITY EVENT
//   // =========================================================

//   it("records and reads a security event", async function () {
//     const registry = await deployRegistry();

//     await registerBasicModel(registry);

//     await registry.write.recordSecurityEvent([
//       modelId,
//       "MODEL_HASH_MISMATCH",
//       "HIGH",
//       "evidence/model-hash-mismatch.json",
//     ]);

//     const events =
//       await registry.read.getSecurityEvents([modelId]);

//     assert.equal(events.length, 1);

//     assert.equal(
//       events[0].eventType,
//       "MODEL_HASH_MISMATCH",
//     );

//     assert.equal(
//       events[0].severity,
//       "HIGH",
//     );

//     assert.equal(
//       events[0].evidenceRef,
//       "evidence/model-hash-mismatch.json",
//     );

//     assert.equal(
//       events[0].reporter.toLowerCase(),
//       adminWallet.account.address.toLowerCase(),
//     );
//   });

//   // =========================================================
//   // TRUST UPDATE
//   // =========================================================

//   it("stores a trust score update", async function () {
//     const registry = await deployRegistry();

//     await registerBasicModel(registry);

//     await registry.write.updateTrustScore([
//       modelId,
//       1n,
//       96n,
//       "TRUSTED",
//       "trust/healthy-v1.json",
//     ]);

//     const latest =
//       await registry.read.getLatestTrustUpdate([
//         modelId,
//         1n,
//       ]);

//     assert.equal(latest.score, 96n);
//     assert.equal(latest.status, "TRUSTED");
//     assert.equal(
//       latest.reasonRef,
//       "trust/healthy-v1.json",
//     );
//     assert.equal(
//       latest.reporter.toLowerCase(),
//       adminWallet.account.address.toLowerCase(),
//     );
//   });

//   // =========================================================
//   // TRUST HISTORY
//   // =========================================================

//   it("preserves multiple trust updates as history", async function () {
//     const registry = await deployRegistry();

//     await registerBasicModel(registry);

//     await registry.write.updateTrustScore([
//       modelId,
//       1n,
//       96n,
//       "TRUSTED",
//       "trust/healthy.json",
//     ]);

//     await registry.write.updateTrustScore([
//       modelId,
//       1n,
//       49n,
//       "HIGH_RISK",
//       "trust/hash-mismatch.json",
//     ]);

//     const history =
//       await registry.read.getTrustHistory([
//         modelId,
//         1n,
//       ]);

//     assert.equal(history.length, 2);

//     assert.equal(history[0].score, 96n);
//     assert.equal(history[0].status, "TRUSTED");

//     assert.equal(history[1].score, 49n);
//     assert.equal(history[1].status, "HIGH_RISK");
//   });

//   // =========================================================
//   // INVALID TRUST SCORE
//   // =========================================================

//   it("rejects a trust score greater than 100", async function () {
//     const registry = await deployRegistry();

//     await registerBasicModel(registry);

//     await assert.rejects(
//       registry.write.updateTrustScore([
//         modelId,
//         1n,
//         101n,
//         "INVALID",
//         "trust/invalid.json",
//       ]),
//     );
//   });

//   // =========================================================
//   // ROLE CHECK
//   // =========================================================

//   it("grants the registrar role to the deployer", async function () {
//     const registry = await deployRegistry();

//     const registrarRole =
//       await registry.read.REGISTRAR_ROLE();

//     const hasRole =
//       await registry.read.hasRole([
//         registrarRole,
//         adminWallet.account.address,
//       ]);

//     assert.equal(hasRole, true);
//   });

//   it("grants the analyst role to the deployer", async function () {
//     const registry = await deployRegistry();

//     const analystRole =
//       await registry.read.ANALYST_ROLE();

//     const hasRole =
//       await registry.read.hasRole([
//         analystRole,
//         adminWallet.account.address,
//       ]);

//     assert.equal(hasRole, true);
//   });
// });



import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("TrustChainRegistry", async function () {
  const { viem } = await network.create();

  const [adminWallet] = await viem.getWalletClients();

  // =========================================================
  // LOCAL TYPES
  // =========================================================
  //
  // Viem returns Solidity structs with named fields at runtime.
  // These interfaces make those fields explicit to TypeScript.
  // =========================================================

  type DatasetRecord = {
    datasetId: string;
    datasetHash: string;
    creator: string;
    timestamp: bigint;
    metadataRef: string;
    exists: boolean;
  };

  type ModelRecord = {
    modelId: string;
    datasetId: string;
    owner: string;
    currentVersion: bigint;
    exists: boolean;
  };

  type ModelVersionRecord = {
    version: bigint;
    modelHash: string;
    parentVersion: bigint;
    creator: string;
    timestamp: bigint;
    metadataRef: string;
    exists: boolean;
  };

  type SecurityEventRecord = {
    eventType: string;
    severity: string;
    evidenceRef: string;
    reporter: string;
    timestamp: bigint;
  };

  type TrustUpdateRecord = {
    score: bigint;
    status: string;
    reasonRef: string;
    reporter: string;
    timestamp: bigint;
  };

  // =========================================================
  // TEST CONSTANTS
  // =========================================================

  const datasetId = "D001";
  const modelId = "M001";

  const datasetHash =
    "0x1111111111111111111111111111111111111111111111111111111111111111";

  const modelHashV1 =
    "0x2222222222222222222222222222222222222222222222222222222222222222";

  const modelHashV2 =
    "0x3333333333333333333333333333333333333333333333333333333333333333";

  const wrongHash =
    "0x9999999999999999999999999999999999999999999999999999999999999999";

  // =========================================================
  // HELPERS
  // =========================================================

  async function deployRegistry() {
    return await viem.deployContract("TrustChainRegistry");
  }

  async function registerBasicModel(
    registry: Awaited<ReturnType<typeof deployRegistry>>,
  ) {
    // ---------------------------------------------------------
    // Register dataset
    // ---------------------------------------------------------

    await registry.write.registerDataset([
      datasetId,
      datasetHash,
      "ipfs://dataset-D001",
    ]);

    // ---------------------------------------------------------
    // Register model
    // ---------------------------------------------------------

    await registry.write.registerModel([
      modelId,
      datasetId,
      adminWallet.account.address,
    ]);

    // ---------------------------------------------------------
    // Register model version 1
    // ---------------------------------------------------------

    await registry.write.registerModelVersion([
      modelId,
      1n,
      modelHashV1,
      0n,
      "ipfs://metadata/M001/v1",
    ]);
  }

  // =========================================================
  // DATASET REGISTRATION
  // =========================================================

  it("registers a dataset correctly", async function () {
    const registry = await deployRegistry();

    await registry.write.registerDataset([
      datasetId,
      datasetHash,
      "ipfs://dataset-D001",
    ]);

    const dataset =
      (await registry.read.getDataset([
        datasetId,
      ])) as unknown as DatasetRecord;

    assert.equal(
      dataset.datasetId,
      datasetId,
    );

    assert.equal(
      dataset.datasetHash,
      datasetHash,
    );

    assert.equal(
      dataset.creator.toLowerCase(),
      adminWallet.account.address.toLowerCase(),
    );

    assert.equal(
      dataset.metadataRef,
      "ipfs://dataset-D001",
    );

    assert.equal(
      dataset.exists,
      true,
    );
  });

  // =========================================================
  // DUPLICATE DATASET
  // =========================================================

  it(
    "rejects duplicate dataset registration",
    async function () {
      const registry = await deployRegistry();

      await registry.write.registerDataset([
        datasetId,
        datasetHash,
        "ipfs://dataset-D001",
      ]);

      await assert.rejects(
        registry.write.registerDataset([
          datasetId,
          datasetHash,
          "ipfs://dataset-D001",
        ]),
      );
    },
  );

  // =========================================================
  // MODEL REGISTRATION
  // =========================================================

  it(
    "registers a model linked to an existing dataset",
    async function () {
      const registry = await deployRegistry();

      await registry.write.registerDataset([
        datasetId,
        datasetHash,
        "ipfs://dataset-D001",
      ]);

      await registry.write.registerModel([
        modelId,
        datasetId,
        adminWallet.account.address,
      ]);

      const model =
        (await registry.read.getModel([
          modelId,
        ])) as unknown as ModelRecord;

      assert.equal(
        model.modelId,
        modelId,
      );

      assert.equal(
        model.datasetId,
        datasetId,
      );

      assert.equal(
        model.owner.toLowerCase(),
        adminWallet.account.address.toLowerCase(),
      );

      assert.equal(
        model.currentVersion,
        0n,
      );

      assert.equal(
        model.exists,
        true,
      );
    },
  );

  // =========================================================
  // MODEL CANNOT USE UNKNOWN DATASET
  // =========================================================

  it(
    "rejects model registration for an unknown dataset",
    async function () {
      const registry = await deployRegistry();

      await assert.rejects(
        registry.write.registerModel([
          modelId,
          "DOES_NOT_EXIST",
          adminWallet.account.address,
        ]),
      );
    },
  );

  // =========================================================
  // VERSION 1
  // =========================================================

  it(
    "registers model version 1 correctly",
    async function () {
      const registry = await deployRegistry();

      await registerBasicModel(registry);

      const version =
        (await registry.read.getModelVersion([
          modelId,
          1n,
        ])) as unknown as ModelVersionRecord;

      assert.equal(
        version.version,
        1n,
      );

      assert.equal(
        version.modelHash,
        modelHashV1,
      );

      assert.equal(
        version.parentVersion,
        0n,
      );

      assert.equal(
        version.creator.toLowerCase(),
        adminWallet.account.address.toLowerCase(),
      );

      assert.equal(
        version.metadataRef,
        "ipfs://metadata/M001/v1",
      );

      assert.equal(
        version.exists,
        true,
      );

      const model =
        (await registry.read.getModel([
          modelId,
        ])) as unknown as ModelRecord;

      assert.equal(
        model.currentVersion,
        1n,
      );
    },
  );

  // =========================================================
  // HASH VERIFICATION — VALID
  // =========================================================

  it(
    "returns true when the supplied hash matches the registered hash",
    async function () {
      const registry = await deployRegistry();

      await registerBasicModel(registry);

      const result =
        await registry.read.verifyModelVersion([
          modelId,
          1n,
          modelHashV1,
        ]);

      assert.equal(
        result,
        true,
      );
    },
  );

  // =========================================================
  // HASH VERIFICATION — TAMPERED
  // =========================================================

  it(
    "returns false when the supplied hash does not match",
    async function () {
      const registry = await deployRegistry();

      await registerBasicModel(registry);

      const result =
        await registry.read.verifyModelVersion([
          modelId,
          1n,
          wrongHash,
        ]);

      assert.equal(
        result,
        false,
      );
    },
  );

  // =========================================================
  // VERSION 2
  // =========================================================

  it(
    "registers version 2 with version 1 as its parent",
    async function () {
      const registry = await deployRegistry();

      await registerBasicModel(registry);

      await registry.write.registerModelVersion([
        modelId,
        2n,
        modelHashV2,
        1n,
        "ipfs://metadata/M001/v2",
      ]);

      const version2 =
        (await registry.read.getModelVersion([
          modelId,
          2n,
        ])) as unknown as ModelVersionRecord;

      assert.equal(
        version2.version,
        2n,
      );

      assert.equal(
        version2.modelHash,
        modelHashV2,
      );

      assert.equal(
        version2.parentVersion,
        1n,
      );

      assert.equal(
        version2.creator.toLowerCase(),
        adminWallet.account.address.toLowerCase(),
      );

      assert.equal(
        version2.metadataRef,
        "ipfs://metadata/M001/v2",
      );

      assert.equal(
        version2.exists,
        true,
      );

      const model =
        (await registry.read.getModel([
          modelId,
        ])) as unknown as ModelRecord;

      assert.equal(
        model.currentVersion,
        2n,
      );
    },
  );

  // =========================================================
  // INVALID VERSION SEQUENCE
  // =========================================================

  it(
    "rejects skipping a model version",
    async function () {
      const registry = await deployRegistry();

      await registerBasicModel(registry);

      await assert.rejects(
        registry.write.registerModelVersion([
          modelId,
          3n,
          modelHashV2,
          2n,
          "ipfs://metadata/M001/v3",
        ]),
      );
    },
  );

  // =========================================================
  // INVALID VERSION PARENT
  // =========================================================

  it(
    "rejects a version with the wrong parent version",
    async function () {
      const registry = await deployRegistry();

      await registerBasicModel(registry);

      await assert.rejects(
        registry.write.registerModelVersion([
          modelId,
          2n,
          modelHashV2,
          0n,
          "ipfs://metadata/M001/v2",
        ]),
      );
    },
  );

  // =========================================================
  // MODEL HISTORY
  // =========================================================

  it(
    "returns the complete model version history",
    async function () {
      const registry = await deployRegistry();

      await registerBasicModel(registry);

      await registry.write.registerModelVersion([
        modelId,
        2n,
        modelHashV2,
        1n,
        "ipfs://metadata/M001/v2",
      ]);

      const history =
        (await registry.read.getModelHistory([
          modelId,
        ])) as unknown as readonly ModelVersionRecord[];

      assert.equal(
        history.length,
        2,
      );

      const version1 = history[0]!;
      const version2 = history[1]!;

      assert.equal(
        version1.version,
        1n,
      );

      assert.equal(
        version1.modelHash,
        modelHashV1,
      );

      assert.equal(
        version2.version,
        2n,
      );

      assert.equal(
        version2.modelHash,
        modelHashV2,
      );

      assert.equal(
        version2.parentVersion,
        1n,
      );
    },
  );

  // =========================================================
  // SECURITY EVENT
  // =========================================================

  it(
    "records and reads a security event",
    async function () {
      const registry = await deployRegistry();

      await registerBasicModel(registry);

      await registry.write.recordSecurityEvent([
        modelId,
        "MODEL_HASH_MISMATCH",
        "HIGH",
        "evidence/model-hash-mismatch.json",
      ]);

      const events =
        (await registry.read.getSecurityEvents([
          modelId,
        ])) as unknown as readonly SecurityEventRecord[];

      assert.equal(
        events.length,
        1,
      );

      const event = events[0]!;

      assert.equal(
        event.eventType,
        "MODEL_HASH_MISMATCH",
      );

      assert.equal(
        event.severity,
        "HIGH",
      );

      assert.equal(
        event.evidenceRef,
        "evidence/model-hash-mismatch.json",
      );

      assert.equal(
        event.reporter.toLowerCase(),
        adminWallet.account.address.toLowerCase(),
      );
    },
  );

  // =========================================================
  // TRUST UPDATE
  // =========================================================

  it(
    "stores a trust score update",
    async function () {
      const registry = await deployRegistry();

      await registerBasicModel(registry);

      await registry.write.updateTrustScore([
        modelId,
        1n,
        96n,
        "TRUSTED",
        "trust/healthy-v1.json",
      ]);

      const latest =
        (await registry.read.getLatestTrustUpdate([
          modelId,
          1n,
        ])) as unknown as TrustUpdateRecord;

      assert.equal(
        latest.score,
        96n,
      );

      assert.equal(
        latest.status,
        "TRUSTED",
      );

      assert.equal(
        latest.reasonRef,
        "trust/healthy-v1.json",
      );

      assert.equal(
        latest.reporter.toLowerCase(),
        adminWallet.account.address.toLowerCase(),
      );
    },
  );

  // =========================================================
  // TRUST HISTORY
  // =========================================================

  it(
    "preserves multiple trust updates as history",
    async function () {
      const registry = await deployRegistry();

      await registerBasicModel(registry);

      // First trust state
      await registry.write.updateTrustScore([
        modelId,
        1n,
        96n,
        "TRUSTED",
        "trust/healthy.json",
      ]);

      // Second trust state after simulated security issue
      await registry.write.updateTrustScore([
        modelId,
        1n,
        49n,
        "HIGH_RISK",
        "trust/hash-mismatch.json",
      ]);

      const history =
        (await registry.read.getTrustHistory([
          modelId,
          1n,
        ])) as unknown as readonly TrustUpdateRecord[];

      assert.equal(
        history.length,
        2,
      );

      const firstUpdate = history[0]!;
      const secondUpdate = history[1]!;

      assert.equal(
        firstUpdate.score,
        96n,
      );

      assert.equal(
        firstUpdate.status,
        "TRUSTED",
      );

      assert.equal(
        secondUpdate.score,
        49n,
      );

      assert.equal(
        secondUpdate.status,
        "HIGH_RISK",
      );
    },
  );

  // =========================================================
  // INVALID TRUST SCORE
  // =========================================================

  it(
    "rejects a trust score greater than 100",
    async function () {
      const registry = await deployRegistry();

      await registerBasicModel(registry);

      await assert.rejects(
        registry.write.updateTrustScore([
          modelId,
          1n,
          101n,
          "INVALID",
          "trust/invalid.json",
        ]),
      );
    },
  );

  // =========================================================
  // ROLE CHECK — REGISTRAR
  // =========================================================

  it(
    "grants the registrar role to the deployer",
    async function () {
      const registry = await deployRegistry();

      const registrarRole =
        await registry.read.REGISTRAR_ROLE();

      const hasRole =
        await registry.read.hasRole([
          registrarRole,
          adminWallet.account.address,
        ]);

      assert.equal(
        hasRole,
        true,
      );
    },
  );

  // =========================================================
  // ROLE CHECK — ANALYST
  // =========================================================

  it(
    "grants the analyst role to the deployer",
    async function () {
      const registry = await deployRegistry();

      const analystRole =
        await registry.read.ANALYST_ROLE();

      const hasRole =
        await registry.read.hasRole([
          analystRole,
          adminWallet.account.address,
        ]);

      assert.equal(
        hasRole,
        true,
      );
    },
  );
});