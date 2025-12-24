export async function garageAdminRequest(
  endpoint: string,
  token: string,
  method: string,
  body?: unknown,
) {
  const url = `${endpoint.replace(/\/$/, "")}/v2/${method}`;
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Garage Admin API error: ${response.status} - ${errorText}`,
    );
  }

  return response.json();
}

export interface BucketInfo {
  id: string;
  globalAliases: string[];
  localAliases: string[];
  quotas: {
    maxSize: number | null;
    maxObjects: number | null;
  };
}

export async function listBuckets(
  endpoint: string,
  token: string,
): Promise<BucketInfo[]> {
  return garageAdminRequest(endpoint, token, "ListBuckets");
}

export async function createBucket(
  endpoint: string,
  token: string,
  alias: string,
) {
  // Creating a bucket in Garage often involves:
  // 1. CreateBucket
  // 2. AllowBucketKey (to give yourself access)
  // For now, let's just do CreateBucket
  return garageAdminRequest(endpoint, token, "CreateBucket", {
    globalAlias: alias,
  });
}

export async function deleteBucket(
  endpoint: string,
  token: string,
  id: string,
) {
  return garageAdminRequest(endpoint, token, "DeleteBucket", { id });
}

export interface KeyInfo {
  accessKeyId: string;
  secretAccessKey: string;
  name: string;
}

export async function listKeys(
  endpoint: string,
  token: string,
): Promise<KeyInfo[]> {
  return garageAdminRequest(endpoint, token, "ListKeys");
}

export async function createKey(
  endpoint: string,
  token: string,
  name: string,
): Promise<KeyInfo> {
  return garageAdminRequest(endpoint, token, "CreateKey", { name });
}

export async function allowBucketKey(
  endpoint: string,
  token: string,
  bucketId: string,
  accessKeyId: string,
  permissions: { read?: boolean; write?: boolean; owner?: boolean },
) {
  return garageAdminRequest(endpoint, token, "AllowBucketKey", {
    bucketId,
    accessKeyId,
    permissions,
  });
}
