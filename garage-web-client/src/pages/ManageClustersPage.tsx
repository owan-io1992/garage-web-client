import {
  Container,
  Title,
  TextInput,
  Button,
  Paper,
  Group,
  Stack,
  PasswordInput,
  Table,
  ActionIcon,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import type { ClusterConfig } from "../store/clusterStore";
import { useClusterStore } from "../store/clusterStore";
import { IconDeviceFloppy, IconTrash, IconServer } from "@tabler/icons-react";

export function ManageClustersPage() {
  const navigate = useNavigate();
  const { clusters, addCluster, removeCluster } = useClusterStore();

  const form = useForm({
    initialValues: {
      name: "",
      endpoint: "",
      token: "",
      s3Endpoint: "",
      s3AccessKey: "",
      s3SecretKey: "",
    },
    validate: {
      name: (value) => (value.length < 1 ? "Name is required" : null),
      endpoint: (value: string) => {
        try {
          if (value) new URL(value);
          return null;
        } catch {
          return "Invalid URL (e.g., http://localhost:3903)";
        }
      },
      token: (value) => (value.length < 1 ? "Token is required" : null),
      s3Endpoint: (value: string) => {
        if (!value) return null;
        try {
          new URL(value);
          return null;
        } catch {
          return "Invalid URL (e.g., http://localhost:3900)";
        }
      },
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    const cleanEndpoint = values.endpoint.replace(/\/$/, "");
    const cleanS3Endpoint = values.s3Endpoint?.replace(/\/$/, "");
    addCluster({
      name: values.name,
      endpoint: cleanEndpoint,
      token: values.token,
      s3Endpoint: cleanS3Endpoint,
      s3AccessKey: values.s3AccessKey,
      s3SecretKey: values.s3SecretKey,
    });
    form.reset();
  };

  const handleDelete = (id: string) => {
    if (
      confirm("Are you sure you want to delete this cluster configuration?")
    ) {
      removeCluster(id);
    }
  };

  const rows = clusters.map((cluster: ClusterConfig) => (
    <Table.Tr key={cluster.id}>
      <Table.Td>
        <Group gap="sm">
          <IconServer size={16} />
          <Text fw={500}>{cluster.name}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Stack gap={0}>
          <Text size="sm">Admin: {cluster.endpoint}</Text>
          {cluster.s3Endpoint && (
            <Text size="xs" c="dimmed">
              S3: {cluster.s3Endpoint}
            </Text>
          )}
        </Stack>
      </Table.Td>
      <Table.Td>
        <Group gap={0} justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDelete(cluster.id)}
          >
            <IconTrash size={16} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="md" py={50}>
      <Stack gap="xl">
        <Title order={2}>Manage Clusters</Title>

        {/* List of existing clusters */}
        {clusters.length > 0 && (
          <Paper withBorder radius="md">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Endpoints</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Paper>
        )}

        {/* Add New Cluster Form */}
        <Paper withBorder p="xl" radius="md">
          <Title order={4} mb="md">
            Add New Cluster
          </Title>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <Title order={6}>Admin API (Cluster Management)</Title>
              <TextInput
                label="Cluster Name"
                placeholder="My Local Garage"
                description="A friendly name for your cluster"
                required
                {...form.getInputProps("name")}
              />

              <TextInput
                label="Admin Endpoint URL"
                description="The URL where your Garage Admin API is reachable (e.g. http://localhost:3903)"
                placeholder="http://localhost:3903"
                required
                {...form.getInputProps("endpoint")}
              />

              <PasswordInput
                label="Admin API Token"
                description="Your Garage admin token"
                placeholder="s3cret_t0k3n..."
                required
                {...form.getInputProps("token")}
              />

              <Title order={6} mt="md">
                S3 API (File Management - Optional)
              </Title>
              <TextInput
                label="S3 Endpoint URL"
                description="The URL where your Garage S3 API is reachable (e.g. http://localhost:3900)"
                placeholder="http://localhost:3900"
                {...form.getInputProps("s3Endpoint")}
              />

              <TextInput
                label="S3 Access Key"
                placeholder="GK..."
                {...form.getInputProps("s3AccessKey")}
              />

              <PasswordInput
                label="S3 Secret Key"
                placeholder="..."
                {...form.getInputProps("s3SecretKey")}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => navigate("/")}>
                  Back to Home
                </Button>
                <Button
                  type="submit"
                  leftSection={<IconDeviceFloppy size={18} />}
                >
                  Save Cluster
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}
