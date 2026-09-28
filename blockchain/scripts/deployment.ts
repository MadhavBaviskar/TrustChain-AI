import { readFile } from "node:fs/promises";
import path from "node:path";

export interface DeploymentManifest {
  network: string;
  chainId: number;
  contractName: string;
  contractAddress: string;
  abiPath: string;
}

export async function loadDeployment(
  filename = "development.json",
): Promise<DeploymentManifest> {
  const filePath = path.join(
    process.cwd(),
    "deployments",
    filename,
  );

  const raw = await readFile(filePath, "utf8");
  const deployment = JSON.parse(raw) as DeploymentManifest;

  if (!deployment.network) {
    throw new Error("Deployment manifest missing: network");
  }

  if (typeof deployment.chainId !== "number") {
    throw new Error("Deployment manifest missing/invalid: chainId");
  }

  if (!deployment.contractAddress) {
    throw new Error("Deployment manifest missing: contractAddress");
  }

  if (!deployment.abiPath) {
    throw new Error("Deployment manifest missing: abiPath");
  }

  return deployment;
}