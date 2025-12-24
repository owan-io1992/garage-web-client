import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Table,
  Button,
  ActionIcon,
  TextInput,
  Select,
  Modal,
  Stack,
  LoadingOverlay,
  Alert,
} from "@mantine/core";
import { useEffect, useState, useCallback } from "react";
import { useClusterStore } from "../../store/clusterStore";
import { useSearchParams } from "react-router-dom";
import {
  IconPlus,
  IconTrash,
  IconArchive,
  IconAlertCircle,
  IconFolderOpen,
  IconLock,
} from "@tabler/icons-react";
import {
  listBuckets,
  createBucket,
  deleteBucket,
  listKeys,
  allowBucketKey,
  type BucketInfo,
  type KeyInfo,
} from "../../lib/garageAdmin";
import { useDisclosure } from "@mantine/hooks";
import { ObjectBrowser } from "../../components/Bucket/ObjectBrowser";

export function BucketPage() {
  const [searchParams] = useSearchParams();
  const clusterId = searchParams.get("clusterId");
  const { clusters } = useClusterStore();
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [newBucketAlias, setNewBucketAlias] = useState("");
  const [creating, setCreating] = useState(false);

  // For object browser
  const [selectedBucket, setSelectedBucket] = useState<BucketInfo | null>(null);

  // For permissions
  const [
    permissionsModalOpened,
    { open: openPermissions, close: closePermissions },
  ] = useDisclosure(false);
  const [bucketForPermissions, setBucketForPermissions] =
    useState<BucketInfo | null>(null);
  const [availableKeys, setAvailableKeys] = useState<KeyInfo[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [granting, setGranting] = useState(false);

  const cluster = clusters.find((c) => c.id === clusterId);

  const fetchBuckets = useCallback(async () => {
    if (!cluster) return;
    setLoading(true);
    try {
      const data = await listBuckets(cluster.endpoint, cluster.token);
      setBuckets(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [cluster]);

  const fetchKeys = useCallback(async () => {
    if (!cluster) return;
    try {
      const data = await listKeys(cluster.endpoint, cluster.token);
      setAvailableKeys(data);
    } catch (err: unknown) {
      console.error("Failed to fetch keys", err);
    }
  }, [cluster]);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  const handleCreateBucket = async () => {
    if (!cluster || !newBucketAlias) return;
    setCreating(true);
    try {
      await createBucket(cluster.endpoint, cluster.token, newBucketAlias);
      setNewBucketAlias("");
      close();
      await fetchBuckets();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBucket = async (id: string, alias: string) => {
    if (!cluster) return;
    if (confirm(`Are you sure you want to delete bucket "${alias}"?`)) {
      try {
        await deleteBucket(cluster.endpoint, cluster.token, id);
        await fetchBuckets();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : String(err));
      }
    }
  };

  const handleGrantPermissions = async () => {
    if (!cluster || !bucketForPermissions || !selectedKeyId) return;
    setGranting(true);
    try {
      await allowBucketKey(
        cluster.endpoint,
        cluster.token,
        bucketForPermissions.id,
        selectedKeyId,
        {
          read: true,
          write: true,
          owner: true,
        },
      );
      alert("Permissions granted successfully!");
      closePermissions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setGranting(false);
    }
  };

  if (!cluster)
    return (
      <Container>
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          No cluster selected. Please select a cluster from the header.
        </Alert>
      </Container>
    );

  const rows = buckets.map((bucket) => {
    const bucketName =
      bucket.globalAliases?.[0] || bucket.localAliases?.[0] || "No Alias";

    return (
      <Table.Tr key={bucket.id}>
        <Table.Td>
          <Group gap="sm">
            <IconArchive size={16} />
            <Stack gap={0}>
              <Text fw={500}>{bucketName}</Text>
              {!cluster.s3Endpoint && (
                <Text size="xs" c="orange">
                  S3 not configured
                </Text>
              )}
            </Stack>
          </Group>
        </Table.Td>
        <Table.Td>{bucket.id.slice(0, 16)}...</Table.Td>
        <Table.Td>
          <Group gap="xs" justify="flex-end">
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconLock size={14} />}
              onClick={() => {
                setBucketForPermissions(bucket);
                fetchKeys();
                openPermissions();
              }}
            >
              Permissions
            </Button>
            <Button
              variant="light"
              size="xs"
              leftSection={<IconFolderOpen size={14} />}
              onClick={() => setSelectedBucket(bucket)}
              disabled={!cluster.s3Endpoint}
            >
              Browse Objects
            </Button>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => handleDeleteBucket(bucket.id, bucketName)}
            >
              <IconTrash size={16} stroke={1.5} />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  if (selectedBucket) {
    return (
      <Container size="xl">
        <Group mb="lg">
          <Button variant="default" onClick={() => setSelectedBucket(null)}>
            Back to Buckets
          </Button>
          <Title order={2}>
            Bucket: {selectedBucket.globalAliases?.[0] || selectedBucket.id}
          </Title>
        </Group>

        <ObjectBrowser
          bucketName={selectedBucket.globalAliases?.[0] || selectedBucket.id}
          clusterConfig={{
            s3Endpoint: cluster.s3Endpoint,
            s3AccessKey: cluster.s3AccessKey,
            s3SecretKey: cluster.s3SecretKey,
          }}
        />
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Buckets</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={open}>
          Create Bucket
        </Button>
      </Group>

      <div style={{ position: "relative", minHeight: 100 }}>
        <LoadingOverlay visible={loading} />

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            mb="md"
          >
            {error}
          </Alert>
        )}

        {buckets.length > 0 ? (
          <Paper withBorder radius="md">
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name (Alias)</Table.Th>
                  <Table.Th>ID</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Paper>
        ) : (
          !loading && (
            <Paper withBorder p="xl" radius="md" ta="center">
              <Text c="dimmed">No buckets found in this cluster.</Text>
            </Paper>
          )
        )}
      </div>

      <Modal opened={opened} onClose={close} title="Create New Bucket">
        <Stack>
          <TextInput
            label="Bucket Alias (Name)"
            placeholder="my-new-bucket"
            description="A global alias for this bucket"
            required
            value={newBucketAlias}
            onChange={(e) => setNewBucketAlias(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleCreateBucket} loading={creating}>
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={permissionsModalOpened}
        onClose={closePermissions}
        title="Manage Bucket Permissions"
      >
        <Stack>
          <Text size="sm">
            Grant an access key permissions to bucket:{" "}
            <b>
              {bucketForPermissions?.globalAliases?.[0] ||
                bucketForPermissions?.id}
            </b>
          </Text>
          <Select
            label="Select Access Key"
            placeholder="Choose a key"
            data={availableKeys.map((k) => ({
              value: k.accessKeyId,
              label: k.name || k.accessKeyId,
            }))}
            value={selectedKeyId}
            onChange={setSelectedKeyId}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closePermissions}>
              Cancel
            </Button>
            <Button
              onClick={handleGrantPermissions}
              loading={granting}
              disabled={!selectedKeyId}
            >
              Grant Full Access (Read/Write/Owner)
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
