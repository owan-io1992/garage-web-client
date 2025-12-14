import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Group,
  Stack,
  SimpleGrid,
  Alert,
  Anchor,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useClusterStore } from "../../store/clusterStore";
import { IconPlus, IconServer } from "@tabler/icons-react";

export function WelcomePage() {
  const { clusters } = useClusterStore();
  const navigate = useNavigate();

  return (
    <Container size="sm" py={50}>
      <Stack gap="xl">
        <div style={{ textAlign: "center" }}>
          <img
            src="/garage-logo.svg"
            alt="Garage Logo"
            style={{ width: "300px", height: "300px", marginBottom: "20px" }}
          />
          <Title order={1} mb="md">
            Welcome to Garage Web Client
          </Title>
          <Text c="dimmed">
            Manage your interface for Garage S3 object store. Select a cluster
            to begin or connect a new one.
          </Text>
          <Anchor
            href="https://github.com/owan-io1992/garage-web-client"
            target="_blank"
            mt="sm"
            display="block"
          >
            View on GitHub
          </Anchor>
        </div>

        {clusters.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {clusters.map((cluster) => (
              <Paper
                key={cluster.id}
                withBorder
                p="xl"
                radius="md"
                style={{ cursor: "pointer", transition: "border-color 0.2s" }}
                onClick={() =>
                  navigate(`/cluster/status?clusterId=${cluster.id}`)
                }
                className="cluster-card"
              >
                <Group justify="space-between" mb="xs">
                  <Text fw={500} size="lg">
                    {cluster.name}
                  </Text>
                  <IconServer size={24} color="var(--mantine-color-blue-6)" />
                </Group>
                <Text size="sm" c="dimmed" truncate>
                  {cluster.endpoint}
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
        )}

        {clusters.length === 0 && (
          <Paper withBorder p="xl" radius="md" ta="center">
            <Text mb="lg">No clusters configured yet.</Text>
            <Button
              leftSection={<IconPlus size={20} />}
              onClick={() => navigate("/manage-clusters")}
              size="md"
            >
              Add Your First Cluster
            </Button>
          </Paper>
        )}

        {clusters.length > 0 && (
          <Group justify="center" mt="md">
            <Button
              variant="outline"
              leftSection={<IconPlus size={20} />}
              onClick={() => navigate("/manage-clusters")}
            >
              Manage Clusters
            </Button>
          </Group>
        )}

        <Alert
          variant="light"
          color="blue"
          title="Security & Privacy"
          icon={<IconServer size={20} />}
          mt="xl"
        >
          <Text size="sm" mb="xs">
            This application runs <strong>100% in your browser</strong>. Your
            API tokens are stored locally on your device and are never sent to
            any third-party server.
          </Text>
          <Text size="sm">
            All connections are made directly from your browser to your Garage
            instance. You can safely access any Garage instance from here
            without data leaving your local network context.
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
}
