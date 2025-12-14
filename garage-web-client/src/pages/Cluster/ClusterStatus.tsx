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
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useClusterStore } from "../../store/clusterStore";
import {
  IconAlertCircle,
  IconCheck,
  IconServer,
  IconSlice,
} from "@tabler/icons-react";
import { useSearchParams } from "react-router-dom";

interface HealthData {
  status: string;
  knownNodes: number;
  connectedNodes: number;
  storageNodes: number;
  storageNodesUp: number;
  partitions: number;
  partitionsQuorum: number;
  partitionsAllOk: number;
  [key: string]: unknown;
}

interface StatisticsData {
  freeform: string;
  [key: string]: unknown;
}

interface NodeData {
  id: string;
  garageVersion: string;
  addr: string;
  hostname: string;
  isUp: boolean;
  lastSeenSecsAgo: number | null;
  role: {
    zone: string;
    tags: string[];
    capacity: number;
  };
  draining: boolean;
  dataPartition: {
    available: number;
    total: number;
  };
  metadataPartition: {
    available: number;
    total: number;
  };
  [key: string]: unknown;
}

interface StatusData {
  layoutVersion: number;
  nodes: NodeData[];
  [key: string]: unknown;
}

export function ClusterStatusPage() {
  const [searchParams] = useSearchParams();
  const clusterId = searchParams.get("clusterId");
  const { clusters } = useClusterStore();
  const [data, setData] = useState<HealthData | null>(null);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cluster = clusters.find((c) => c.id === clusterId);

  useEffect(() => {
    if (!cluster) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Health
        const healthResponse = await fetch(
          `${cluster.endpoint}/v2/GetClusterHealth`,
          {
            headers: {
              Authorization: `Bearer ${cluster.token}`,
            },
          },
        );

        if (!healthResponse.ok) {
          throw new Error(`Health API error! status: ${healthResponse.status}`);
        }

        const healthData = await healthResponse.json();
        setData(healthData);

        // Fetch Statistics
        const statsResponse = await fetch(
          `${cluster.endpoint}/v2/GetClusterStatistics`,
          {
            headers: {
              Authorization: `Bearer ${cluster.token}`,
            },
          },
        );

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStatistics(statsData);
        }

        // Fetch Status
        const statusResponse = await fetch(
          `${cluster.endpoint}/v2/GetClusterStatus`,
          {
            headers: {
              Authorization: `Bearer ${cluster.token}`,
            },
          },
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setStatus(statusData);
        }

        setError(null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to connect to cluster");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cluster]);

  if (!cluster) return <Text>Cluster not found</Text>;

  return (
    <Container size="lg">
      <Title order={2} mb="lg">
        Cluster Health
      </Title>

      <div style={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible={loading} />

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Connection Error"
            color="red"
            mb="md"
          >
            {error}
            <Text size="sm" mt="xs">
              Check your CORS settings, endpoint URL, or token.
            </Text>
          </Alert>
        )}

        {data && (
          <Stack>
            <SimpleGrid cols={{ base: 1, md: 3 }}>
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text c="dimmed">Status</Text>
                  <IconCheck size={20} color="var(--mantine-color-green-7)" />
                </Group>
                <Badge
                  size="xl"
                  color={data.status === "healthy" ? "green" : "red"}
                >
                  {data.status}
                </Badge>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text c="dimmed">Nodes</Text>
                  <IconServer size={20} color="var(--mantine-color-blue-6)" />
                </Group>
                <Group align="flex-end" gap="xs">
                  <Text fw={700} size="xl">
                    {data.connectedNodes}
                  </Text>
                  <Text size="sm" c="dimmed" mb={4}>
                    / {data.knownNodes} connected
                  </Text>
                </Group>
                <Text size="xs" mt="sm">
                  Storage Nodes: {data.storageNodesUp} / {data.storageNodes} OK
                </Text>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text c="dimmed">Partitions</Text>
                  <IconSlice size={20} color="var(--mantine-color-orange-6)" />
                </Group>
                <Group align="flex-end" gap="xs">
                  <Text fw={700} size="xl">
                    {data.partitionsAllOk}
                  </Text>
                  <Text size="sm" c="dimmed" mb={4}>
                    / {data.partitions} healthy
                  </Text>
                </Group>
              </Paper>
            </SimpleGrid>

            {statistics && (
              <>
                <Title order={3} mt="lg" mb="md">
                  Cluster Statistics
                </Title>
                <Paper withBorder p="md" radius="md">
                  <Text
                    component="pre"
                    style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                  >
                    {statistics.freeform}
                  </Text>
                </Paper>
              </>
            )}

            {status && (
              <>
                <Title order={3} mt="lg" mb="md">
                  Cluster Status
                </Title>
                <SimpleGrid cols={{ base: 1, md: 2 }}>
                  <Paper withBorder p="md" radius="md">
                    <Group justify="space-between" mb="xs">
                      <Text c="dimmed">Layout Version</Text>
                      <IconServer
                        size={20}
                        color="var(--mantine-color-blue-6)"
                      />
                    </Group>
                    <Text fw={700} size="lg">
                      {status.layoutVersion}
                    </Text>
                  </Paper>

                  <Paper withBorder p="md" radius="md">
                    <Group justify="space-between" mb="xs">
                      <Text c="dimmed">Nodes</Text>
                      <IconSlice
                        size={20}
                        color="var(--mantine-color-orange-6)"
                      />
                    </Group>
                    <Text fw={700} size="lg">
                      {status.nodes.length}
                    </Text>
                  </Paper>
                </SimpleGrid>

                <Title order={4} mt="md" mb="sm">
                  Nodes
                </Title>
                <Stack>
                  {status.nodes.map((node) => (
                    <Paper key={node.id} withBorder p="md" radius="md">
                      <Group justify="space-between" mb="xs">
                        <Text fw={500}>
                          {node.hostname} ({node.addr})
                        </Text>
                        <Badge color={node.isUp ? "green" : "red"}>
                          {node.isUp ? "Up" : "Down"}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed">
                        ID: {node.id.slice(0, 16)}... | Version:{" "}
                        {node.garageVersion} | Zone: {node.role.zone}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Capacity: {(node.role.capacity / 1024 ** 3).toFixed(2)}{" "}
                        GB | Data:{" "}
                        {(
                          (node.dataPartition.total -
                            node.dataPartition.available) /
                          1024 ** 3
                        ).toFixed(2)}{" "}
                        / {(node.dataPartition.total / 1024 ** 3).toFixed(2)} GB
                        | Meta:{" "}
                        {(
                          (node.metadataPartition.total -
                            node.metadataPartition.available) /
                          1024 ** 3
                        ).toFixed(2)}{" "}
                        /{" "}
                        {(node.metadataPartition.total / 1024 ** 3).toFixed(2)}{" "}
                        GB
                      </Text>
                    </Paper>
                  ))}
                </Stack>
              </>
            )}

            {/* Verification Helper: Show raw JSON */}
            <Title order={4} mt="md">
              Raw Responses
            </Title>
            {data && (
              <>
                <Text fw={500}>Health:</Text>
                <Code block>{JSON.stringify(data, null, 2)}</Code>
              </>
            )}
            {statistics && (
              <>
                <Text fw={500} mt="sm">
                  Statistics:
                </Text>
                <Code block>{JSON.stringify(statistics, null, 2)}</Code>
              </>
            )}
            {status && (
              <>
                <Text fw={500} mt="sm">
                  Status:
                </Text>
                <Code block>{JSON.stringify(status, null, 2)}</Code>
              </>
            )}
          </Stack>
        )}
      </div>
    </Container>
  );
}
