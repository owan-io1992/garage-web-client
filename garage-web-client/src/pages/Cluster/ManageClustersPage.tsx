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
import type { ClusterConfig } from "../../store/clusterStore";
import { useClusterStore } from "../../store/clusterStore";
import { IconDeviceFloppy, IconTrash, IconServer } from "@tabler/icons-react";

export function ManageClustersPage() {
  const navigate = useNavigate();
  const { clusters, addCluster, removeCluster } = useClusterStore();

  const form = useForm({
    initialValues: {
      name: "",
      endpoint: "",
      token: "",
    },
    validate: {
      name: (value) => (value.length < 1 ? "Name is required" : null),
      endpoint: (value: string) => {
        try {
          new URL(value);
          return null;
        } catch {
          return "Invalid URL (e.g., http://localhost:3903)";
        }
      },
      token: (value) => (value.length < 1 ? "Token is required" : null),
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    const cleanEndpoint = values.endpoint.replace(/\/$/, "");
    addCluster({
      name: values.name,
      endpoint: cleanEndpoint,
      token: values.token,
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
      <Table.Td>{cluster.endpoint}</Table.Td>
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
                  <Table.Th>Endpoint</Table.Th>
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
              <TextInput
                label="Cluster Name"
                placeholder="My Local Garage"
                description="A friendly name for your cluster"
                required
                {...form.getInputProps("name")}
              />

              <TextInput
                label="Endpoint URL"
                description="The URL where your Garage Admin API is reachable (e.g. http://localhost:3903)"
                placeholder="http://localhost:3903"
                required
                {...form.getInputProps("endpoint")}
              />

              <PasswordInput
                label="API Token"
                description="Your Garage admin token"
                placeholder="s3cret_t0k3n..."
                required
                {...form.getInputProps("token")}
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
