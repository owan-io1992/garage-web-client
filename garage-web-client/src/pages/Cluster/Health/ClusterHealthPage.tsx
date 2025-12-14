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
import { useClusterStore } from "../../../store/clusterStore";
import {
  IconAlertCircle,
  IconCheck,
  IconServer,
  IconSlice,
} from "@tabler/icons-react";
import { useParams } from "react-router-dom";

interface HealthData {
  status: string;
  known_nodes: number;
  connected_nodes: number;
  storage_nodes: number;
  storage_nodes_ok: number;
  partitions: number;
  partitions_ok: number;
  [key: string]: unknown;
}

export function ClusterHealthPage() {
  const { clusterId } = useParams();
  const { clusters } = useClusterStore();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cluster = clusters.find((c) => c.id === clusterId);

  useEffect(() => {
    if (!cluster) return;

    const fetchHealth = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${cluster.endpoint}/v2/GetClusterHealth`,
          {
            headers: {
              Authorization: `Bearer ${cluster.token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();
        setData(jsonData);
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

    fetchHealth();
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
                    {data.connected_nodes}
                  </Text>
                  <Text size="sm" c="dimmed" mb={4}>
                    / {data.known_nodes} connected
                  </Text>
                </Group>
                <Text size="xs" mt="sm">
                  Storage Nodes: {data.storage_nodes_ok} / {data.storage_nodes}{" "}
                  OK
                </Text>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text c="dimmed">Partitions</Text>
                  <IconSlice size={20} color="var(--mantine-color-orange-6)" />
                </Group>
                <Group align="flex-end" gap="xs">
                  <Text fw={700} size="xl">
                    {data.partitions_ok}
                  </Text>
                  <Text size="sm" c="dimmed" mb={4}>
                    / {data.partitions} healthy
                  </Text>
                </Group>
              </Paper>
            </SimpleGrid>

            {/* Verification Helper: Show raw JSON */}
            <Title order={4} mt="md">
              Raw Response
            </Title>
            <Code block>{JSON.stringify(data, null, 2)}</Code>
          </Stack>
        )}
      </div>
    </Container>
  );
}
