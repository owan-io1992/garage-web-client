import {
  Table,
  Group,
  Text,
  Button,
  ActionIcon,
  Stack,
  Paper,
  LoadingOverlay,
  Breadcrumbs,
  Anchor,
  FileButton,
  Tooltip,
} from "@mantine/core";
import { useEffect, useState, useCallback } from "react";
import {
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  type _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client } from "../../lib/s3Client";
import {
  IconFile,
  IconFolder,
  IconDownload,
  IconTrash,
  IconUpload,
  IconArrowLeft,
} from "@tabler/icons-react";

interface ObjectBrowserProps {
  bucketName: string;
  clusterConfig: {
    s3Endpoint?: string;
    s3AccessKey?: string;
    s3SecretKey?: string;
  };
}

export function ObjectBrowser({
  bucketName,
  clusterConfig,
}: ObjectBrowserProps) {
  const [objects, setObjects] = useState<_Object[]>([]);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [uploading, setUploading] = useState(false);

  const s3Client = clusterConfig.s3Endpoint
    ? getS3Client({
        s3Endpoint: clusterConfig.s3Endpoint,
        s3AccessKey: clusterConfig.s3AccessKey || "",
        s3SecretKey: clusterConfig.s3SecretKey || "",
      })
    : null;

  const fetchObjects = useCallback(async () => {
    if (!s3Client) return;
    setLoading(true);
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: currentPrefix,
        Delimiter: "/",
      });
      const response = await s3Client.send(command);
      setObjects(response.Contents || []);
      setPrefixes(response.CommonPrefixes?.map((p) => p.Prefix || "") || []);
    } catch (err: unknown) {
      console.error("Failed to fetch objects", err);
    } finally {
      setLoading(false);
    }
  }, [s3Client, bucketName, currentPrefix]);

  useEffect(() => {
    fetchObjects();
  }, [fetchObjects]);

  const handleUpload = async (file: File | null) => {
    if (!file || !s3Client) return;
    setUploading(true);
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: currentPrefix + file.name,
        Body: file,
      });
      await s3Client.send(command);
      await fetchObjects();
    } catch (err: unknown) {
      alert(
        "Upload failed: " + (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (key: string) => {
    if (!s3Client) return;
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      window.open(url, "_blank");
    } catch (err: unknown) {
      alert(
        "Download failed: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const handleDelete = async (key: string) => {
    if (!s3Client) return;
    if (confirm(`Delete ${key}?`)) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        await s3Client.send(command);
        await fetchObjects();
      } catch (err: unknown) {
        alert(
          "Delete failed: " +
            (err instanceof Error ? err.message : String(err)),
        );
      }
    }
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return "-";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const breadcrumbs = currentPrefix
    .split("/")
    .filter(Boolean)
    .reduce(
      (acc, curr, idx, arr) => {
        const path = arr.slice(0, idx + 1).join("/") + "/";
        acc.push({ label: curr, path });
        return acc;
      },
      [{ label: "Root", path: "" }] as { label: string; path: string }[],
    );

  if (!s3Client) {
    return (
      <Paper p="xl" withBorder ta="center">
        <Text c="red">S3 credentials not configured for this cluster.</Text>
        <Text size="sm" mt="xs">
          Please go to "Manage Clusters" and add S3 endpoint and keys.
        </Text>
      </Paper>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Breadcrumbs>
          {breadcrumbs.map((item, index) => (
            <Anchor
              key={index}
              onClick={() => setCurrentPrefix(item.path)}
              fw={index === breadcrumbs.length - 1 ? 700 : 400}
            >
              {item.label}
            </Anchor>
          ))}
        </Breadcrumbs>

        <Group>
          <FileButton onChange={handleUpload}>
            {(props) => (
              <Button
                {...props}
                leftSection={<IconUpload size={18} />}
                loading={uploading}
              >
                Upload File
              </Button>
            )}
          </FileButton>
          <Button variant="default" onClick={fetchObjects} loading={loading}>
            Refresh
          </Button>
        </Group>
      </Group>

      <div style={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible={loading} />

        <Paper withBorder radius="md">
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th w={150}>Size</Table.Th>
                <Table.Th w={200}>Last Modified</Table.Th>
                <Table.Th w={100} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currentPrefix && (
                <Table.Tr
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    const parts = currentPrefix.split("/").filter(Boolean);
                    parts.pop();
                    setCurrentPrefix(parts.length ? parts.join("/") + "/" : "");
                  }}
                >
                  <Table.Td colSpan={4}>
                    <Group gap="xs">
                      <IconArrowLeft size={16} />
                      <Text size="sm">..</Text>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )}

              {prefixes.map((p) => (
                <Table.Tr
                  key={p}
                  style={{ cursor: "pointer" }}
                  onClick={() => setCurrentPrefix(p)}
                >
                  <Table.Td>
                    <Group gap="xs">
                      <IconFolder
                        size={18}
                        color="var(--mantine-color-blue-filled)"
                      />
                      <Text size="sm">
                        {p.split("/").filter(Boolean).pop()}/
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>-</Table.Td>
                  <Table.Td>-</Table.Td>
                  <Table.Td />
                </Table.Tr>
              ))}

              {objects
                .filter((obj) => obj.Key !== currentPrefix) // Don't show the prefix object itself if it exists
                .map((obj) => (
                  <Table.Tr key={obj.Key}>
                    <Table.Td>
                      <Group gap="xs">
                        <IconFile
                          size={18}
                          color="var(--mantine-color-gray-6)"
                        />
                        <Text size="sm">
                          {obj.Key?.replace(currentPrefix, "")}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatSize(obj.Size)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {obj.LastModified?.toLocaleString() || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Tooltip label="Download">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleDownload(obj.Key!)}
                          >
                            <IconDownload size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDelete(obj.Key!)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}

              {objects.length === 0 && prefixes.length === 0 && !loading && (
                <Table.Tr>
                  <Table.Td colSpan={4} ta="center" py="xl">
                    <Text c="dimmed">This folder is empty.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </div>
    </Stack>
  );
}
