import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  SimpleGrid,
  LoadingOverlay,
  Code,
  Stack,
  Alert,
  Button,
  Table,
  Tabs,
  NumberInput,
  TextInput,
  Modal,
  Checkbox,
  ActionIcon,
} from "@mantine/core";
import { useEffect, useState, useCallback } from "react";
import { useClusterStore } from "../../store/clusterStore";
import {
  IconAlertCircle,
  IconCheck,
  IconServer,
  IconSlice,
  IconRefresh,
  IconDeviceFloppy,
  IconArrowBack,
  IconPlayerSkipForward,
} from "@tabler/icons-react";
import { useSearchParams } from "react-router-dom";

// Interfaces based on OpenAPI spec
interface LayoutNodeRole {
  id: string;
  zone: string;
  tags: string[];
  capacity: number | null;
  storedPartitions: number | null;
  usableCapacity: number | null;
}

interface LayoutParameters {
  zoneRedundancy:
    | {
        atLeast?: number;
      }
    | "maximum";
}

interface NodeRoleChange {
  id: string;
  remove?: boolean;
  zone?: string;
  capacity?: number;
  tags?: string[];
}

interface GetClusterLayoutResponse {
  version: number;
  roles: LayoutNodeRole[];
  parameters: LayoutParameters;
  partitionSize: number;
  stagedRoleChanges: NodeRoleChange[];
  stagedParameters: LayoutParameters | null;
}

interface ClusterLayoutVersion {
  version: number;
  status: "Current" | "Draining" | "Historical";
  storageNodes: number;
  gatewayNodes: number;
}

interface GetClusterLayoutHistoryResponse {
  currentVersion: number;
  minAck: number;
  versions: ClusterLayoutVersion[];
  updateTrackers?: Record<
    string,
    { ack: number; sync: number; syncAck: number }
  >;
}

interface UpdateClusterLayoutRequest {
  parameters?: LayoutParameters | null;
  roles?: NodeRoleChange[];
}

interface PreviewClusterLayoutChangesResponse {
  message: string[];
  newLayout: GetClusterLayoutResponse;
}

export function ClusterLayoutPage() {
  const [searchParams] = useSearchParams();
  const clusterId = searchParams.get("clusterId");
  const { clusters } = useClusterStore();
  const [layout, setLayout] = useState<GetClusterLayoutResponse | null>(null);
  const [history, setHistory] =
    useState<GetClusterLayoutHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("current");

  // Update modal states
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateRequest, setUpdateRequest] =
    useState<UpdateClusterLayoutRequest>({});
  const [preview, setPreview] =
    useState<PreviewClusterLayoutChangesResponse | null>(null);
  const [applying, setApplying] = useState(false);
  const [roleChanges, setRoleChanges] = useState<NodeRoleChange[]>([]);
  const [currentChange, setCurrentChange] = useState<{
    id?: string;
    remove?: boolean;
    zone?: string;
    capacity?: number;
    tags?: string;
  }>({});

  const cluster = clusters.find((c) => c.id === clusterId);

  const fetchLayout = useCallback(async () => {
    if (!cluster) return;
    setLoading(true);
    try {
      const response = await fetch(`${cluster.endpoint}/v2/GetClusterLayout`, {
        headers: {
          Authorization: `Bearer ${cluster.token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Layout API error! status: ${response.status}`);
      }
      const data = await response.json();
      setLayout(data);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch layout");
      }
    } finally {
      setLoading(false);
    }
  }, [cluster]);

  const fetchHistory = useCallback(async () => {
    if (!cluster) return;
    try {
      const response = await fetch(
        `${cluster.endpoint}/v2/GetClusterLayoutHistory`,
        {
          headers: {
            Authorization: `Bearer ${cluster.token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch {
      // Ignore history errors
    }
  }, [cluster]);

  useEffect(() => {
    if (cluster) {
      fetchLayout();
      fetchHistory();
    }
  }, [cluster, fetchLayout, fetchHistory]);

  const handleUpdateLayout = async () => {
    if (!cluster || !updateRequest) return;
    setApplying(true);
    try {
      const response = await fetch(
        `${cluster.endpoint}/v2/UpdateClusterLayout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cluster.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateRequest),
        },
      );
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }
      await fetchLayout();
      setUpdateModalOpen(false);
      setUpdateRequest({});
      setPreview(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setApplying(false);
    }
  };

  const handlePreview = async () => {
    if (!cluster || !updateRequest) return;
    try {
      const response = await fetch(
        `${cluster.endpoint}/v2/PreviewClusterLayoutChanges`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cluster.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateRequest),
        },
      );
      if (!response.ok) {
        throw new Error(`Preview failed: ${response.status}`);
      }
      const data = await response.json();
      setPreview(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleApply = async () => {
    if (!cluster || !layout) return;
    setApplying(true);
    try {
      const response = await fetch(
        `${cluster.endpoint}/v2/ApplyClusterLayout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cluster.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ version: layout.version }),
        },
      );
      if (!response.ok) {
        throw new Error(`Apply failed: ${response.status}`);
      }
      await fetchLayout();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setApplying(false);
    }
  };

  const handleRevert = async () => {
    if (!cluster) return;
    setApplying(true);
    try {
      const response = await fetch(
        `${cluster.endpoint}/v2/RevertClusterLayout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cluster.token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Revert failed: ${response.status}`);
      }
      await fetchLayout();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setApplying(false);
    }
  };

  const handleSkipDeadNodes = async () => {
    if (!cluster || !layout) return;
    setApplying(true);
    try {
      const response = await fetch(
        `${cluster.endpoint}/v2/ClusterLayoutSkipDeadNodes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cluster.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: layout.version,
            allowMissingData: false,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`Skip dead nodes failed: ${response.status}`);
      }
      await fetchLayout();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setApplying(false);
    }
  };

  const addRoleChange = () => {
    if (!currentChange.id) return;
    const change: NodeRoleChange = {
      id: currentChange.id,
      remove: currentChange.remove,
      zone: currentChange.zone || undefined,
      capacity: currentChange.capacity
        ? currentChange.capacity * 1024 ** 3
        : undefined, // Convert GB to bytes
      tags: currentChange.tags
        ? currentChange.tags.split(",").map((t) => t.trim())
        : undefined,
    };
    setRoleChanges([...roleChanges, change]);
    setCurrentChange({});
  };

  const removeRoleChange = (index: number) => {
    setRoleChanges(roleChanges.filter((_, i) => i !== index));
  };

  // Update updateRequest when roleChanges changes
  useEffect(() => {
    setUpdateRequest((prev) => ({
      ...prev,
      roles: roleChanges.length > 0 ? roleChanges : undefined,
    }));
  }, [roleChanges]);

  if (!cluster) return <Text>Cluster not found</Text>;

  return (
    <Container size="lg">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Cluster Layout</Title>
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={fetchLayout}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={() => setUpdateModalOpen(true)}
          >
            Update Layout
          </Button>
        </Group>
      </Group>

      <div style={{ position: "relative", minHeight: 200 }}>
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

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="current">Current Layout</Tabs.Tab>
            <Tabs.Tab value="history">Layout History</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="current">
            {layout && (
              <Stack>
                <SimpleGrid cols={{ base: 1, md: 3 }}>
                  <Paper withBorder p="md" radius="md">
                    <Group justify="space-between" mb="xs">
                      <Text c="dimmed">Version</Text>
                      <IconCheck
                        size={20}
                        color="var(--mantine-color-green-7)"
                      />
                    </Group>
                    <Text fw={700} size="xl">
                      {layout.version}
                    </Text>
                  </Paper>

                  <Paper withBorder p="md" radius="md">
                    <Group justify="space-between" mb="xs">
                      <Text c="dimmed">Partition Size</Text>
                      <IconSlice
                        size={20}
                        color="var(--mantine-color-blue-6)"
                      />
                    </Group>
                    <Text fw={700} size="xl">
                      {(layout.partitionSize / 1024 ** 3).toFixed(2)} GB
                    </Text>
                  </Paper>

                  <Paper withBorder p="md" radius="md">
                    <Group justify="space-between" mb="xs">
                      <Text c="dimmed">Nodes</Text>
                      <IconServer
                        size={20}
                        color="var(--mantine-color-orange-6)"
                      />
                    </Group>
                    <Text fw={700} size="xl">
                      {layout.roles.length}
                    </Text>
                  </Paper>
                </SimpleGrid>

                <Title order={3} mt="lg" mb="md">
                  Node Roles
                </Title>
                <Paper withBorder p="md" radius="md">
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Node ID</Table.Th>
                        <Table.Th>Zone</Table.Th>
                        <Table.Th>Capacity</Table.Th>
                        <Table.Th>Stored Partitions</Table.Th>
                        <Table.Th>Tags</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {layout.roles.map((role) => (
                        <Table.Tr key={role.id}>
                          <Table.Td>{role.id.slice(0, 16)}...</Table.Td>
                          <Table.Td>{role.zone}</Table.Td>
                          <Table.Td>
                            {role.capacity
                              ? `${(role.capacity / 1024 ** 3).toFixed(2)} GB`
                              : "Gateway"}
                          </Table.Td>
                          <Table.Td>{role.storedPartitions || 0}</Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              {role.tags.map((tag) => (
                                <Badge key={tag} size="sm">
                                  {tag}
                                </Badge>
                              ))}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>

                {layout.stagedRoleChanges.length > 0 && (
                  <>
                    <Title order={3} mt="lg" mb="md">
                      Staged Changes
                    </Title>
                    <Paper withBorder p="md" radius="md">
                      <Text>
                        Staged role changes: {layout.stagedRoleChanges.length}
                      </Text>
                      <Group mt="md">
                        <Button
                          leftSection={<IconDeviceFloppy size={16} />}
                          onClick={handleApply}
                          loading={applying}
                        >
                          Apply Changes
                        </Button>
                        <Button
                          leftSection={<IconArrowBack size={16} />}
                          onClick={handleRevert}
                          loading={applying}
                        >
                          Revert Changes
                        </Button>
                        <Button
                          leftSection={<IconPlayerSkipForward size={16} />}
                          onClick={handleSkipDeadNodes}
                          loading={applying}
                        >
                          Skip Dead Nodes
                        </Button>
                      </Group>
                    </Paper>
                  </>
                )}

                <Title order={4} mt="md">
                  Raw Layout Data
                </Title>
                <Code block>{JSON.stringify(layout, null, 2)}</Code>
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="history">
            {history && (
              <Stack>
                <SimpleGrid cols={{ base: 1, md: 2 }}>
                  <Paper withBorder p="md" radius="md">
                    <Text c="dimmed">Current Version</Text>
                    <Text fw={700} size="xl">
                      {history.currentVersion}
                    </Text>
                  </Paper>
                  <Paper withBorder p="md" radius="md">
                    <Text c="dimmed">Min ACK</Text>
                    <Text fw={700} size="xl">
                      {history.minAck}
                    </Text>
                  </Paper>
                </SimpleGrid>

                <Title order={3} mt="lg" mb="md">
                  Version History
                </Title>
                <Paper withBorder p="md" radius="md">
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Version</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Storage Nodes</Table.Th>
                        <Table.Th>Gateway Nodes</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {history.versions.map((version) => (
                        <Table.Tr key={version.version}>
                          <Table.Td>{version.version}</Table.Td>
                          <Table.Td>
                            <Badge
                              color={
                                version.status === "Current"
                                  ? "green"
                                  : version.status === "Draining"
                                    ? "yellow"
                                    : "gray"
                              }
                            >
                              {version.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>{version.storageNodes}</Table.Td>
                          <Table.Td>{version.gatewayNodes}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>

                <Title order={4} mt="md">
                  Raw History Data
                </Title>
                <Code block>{JSON.stringify(history, null, 2)}</Code>
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </div>

      <Modal
        opened={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false);
          setRoleChanges([]);
          setCurrentChange({});
          setPreview(null);
        }}
        title="Update Cluster Layout"
        size="lg"
      >
        <Stack>
          <TextInput
            label="Zone Redundancy (atLeast)"
            placeholder="Enter minimum zones (leave empty for 'maximum')"
            type="number"
            value={
              updateRequest.parameters?.zoneRedundancy &&
              typeof updateRequest.parameters.zoneRedundancy === "object"
                ? updateRequest.parameters.zoneRedundancy.atLeast || ""
                : ""
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setUpdateRequest({
                  ...updateRequest,
                  parameters: {
                    zoneRedundancy: "maximum",
                  },
                });
              } else {
                const num = parseInt(value);
                setUpdateRequest({
                  ...updateRequest,
                  parameters: {
                    zoneRedundancy: { atLeast: num },
                  },
                });
              }
            }}
          />

          <Title order={4} mt="md">
            Role Changes
          </Title>

          <Paper withBorder p="md" radius="md">
            <Stack>
              <TextInput
                label="Node ID"
                placeholder="Enter node ID"
                value={currentChange.id || ""}
                onChange={(e) =>
                  setCurrentChange({ ...currentChange, id: e.target.value })
                }
              />

              <Checkbox
                label="Remove this node"
                checked={currentChange.remove || false}
                onChange={(e) =>
                  setCurrentChange({
                    ...currentChange,
                    remove: e.currentTarget.checked,
                  })
                }
              />

              {!currentChange.remove && (
                <>
                  <TextInput
                    label="Zone"
                    placeholder="Enter zone name"
                    value={currentChange.zone || ""}
                    onChange={(e) =>
                      setCurrentChange({
                        ...currentChange,
                        zone: e.target.value,
                      })
                    }
                  />

                  <NumberInput
                    label="Capacity (GB)"
                    placeholder="Enter capacity in GB (leave empty for gateway)"
                    value={currentChange.capacity || ""}
                    onChange={(value) =>
                      setCurrentChange({
                        ...currentChange,
                        capacity: value ? Number(value) : undefined,
                      })
                    }
                    min={0}
                  />

                  <TextInput
                    label="Tags (comma-separated)"
                    placeholder="tag1, tag2, tag3"
                    value={currentChange.tags || ""}
                    onChange={(e) =>
                      setCurrentChange({
                        ...currentChange,
                        tags: e.target.value,
                      })
                    }
                  />
                </>
              )}

              <Button onClick={addRoleChange} disabled={!currentChange.id}>
                Add Change
              </Button>
            </Stack>
          </Paper>

          {roleChanges.length > 0 && (
            <Paper withBorder p="md" radius="md">
              <Title order={5} mb="md">
                Current Changes
              </Title>
              <Stack>
                {roleChanges.map((change, index) => (
                  <Group key={index} justify="space-between" align="flex-start">
                    <Stack gap="xs">
                      <Text fw={500}>Node: {change.id}</Text>
                      {change.remove ? (
                        <Badge color="red">Remove</Badge>
                      ) : (
                        <Stack gap="xs">
                          {change.zone && (
                            <Text size="sm">Zone: {change.zone}</Text>
                          )}
                          {change.capacity && (
                            <Text size="sm">
                              Capacity:{" "}
                              {(change.capacity / 1024 ** 3).toFixed(2)} GB
                            </Text>
                          )}
                          {change.tags && change.tags.length > 0 && (
                            <Group gap="xs">
                              Tags:{" "}
                              {change.tags.map((tag) => (
                                <Badge key={tag} size="sm">
                                  {tag}
                                </Badge>
                              ))}
                            </Group>
                          )}
                        </Stack>
                      )}
                    </Stack>
                    <ActionIcon
                      color="red"
                      onClick={() => removeRoleChange(index)}
                    >
                      <IconAlertCircle size={16} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Paper>
          )}

          <Group justify="space-between">
            <Button
              onClick={handlePreview}
              loading={applying}
              disabled={roleChanges.length === 0 && !updateRequest.parameters}
            >
              Preview Changes
            </Button>
            <Group>
              <Button
                variant="outline"
                onClick={() => {
                  setUpdateModalOpen(false);
                  setRoleChanges([]);
                  setCurrentChange({});
                  setPreview(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateLayout}
                loading={applying}
                disabled={roleChanges.length === 0 && !updateRequest.parameters}
              >
                Update Layout
              </Button>
            </Group>
          </Group>

          {preview && (
            <Paper withBorder p="md" radius="md">
              <Title order={4} mb="md">
                Preview
              </Title>
              <Text component="pre" style={{ whiteSpace: "pre-wrap" }}>
                {preview.message.join("\n")}
              </Text>
              <Title order={5} mt="md" mb="sm">
                New Layout Summary
              </Title>
              <Text>Version: {preview.newLayout.version}</Text>
              <Text>Nodes: {preview.newLayout.roles.length}</Text>
              <Text>
                Partition Size:{" "}
                {(preview.newLayout.partitionSize / 1024 ** 3).toFixed(2)} GB
              </Text>
            </Paper>
          )}
        </Stack>
      </Modal>
    </Container>
  );
}
