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
  Modal,
  Stack,
  LoadingOverlay,
  Alert,
  Code,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import { useEffect, useState, useCallback } from "react";
import { useClusterStore } from "../../store/clusterStore";
import { useSearchParams } from "react-router-dom";
import {
  IconPlus,
  IconTrash,
  IconKey,
  IconAlertCircle,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import { listKeys, createKey, type KeyInfo } from "../../lib/garageAdmin";
import { useDisclosure } from "@mantine/hooks";

export function AccessKeysPage() {
  const [searchParams] = useSearchParams();
  const clusterId = searchParams.get("clusterId");
  const { clusters } = useClusterStore();
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [lastCreatedKey, setLastCreatedKey] = useState<KeyInfo | null>(null);

  const cluster = clusters.find((c) => c.id === clusterId);

  const fetchKeys = useCallback(async () => {
    if (!cluster) return;
    setLoading(true);
    try {
      const data = await listKeys(cluster.endpoint, cluster.token);
      setKeys(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [cluster]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = async () => {
    if (!cluster || !newKeyName) return;
    setCreating(true);
    try {
      const newKey = await createKey(
        cluster.endpoint,
        cluster.token,
        newKeyName,
      );
      setLastCreatedKey(newKey);
      setNewKeyName("");
      close();
      await fetchKeys();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  if (!cluster)
    return (
      <Container>
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          No cluster selected.
        </Alert>
      </Container>
    );

  const rows = keys.map((key) => (
    <Table.Tr key={key.accessKeyId}>
      <Table.Td>
        <Group gap="sm">
          <IconKey size={16} />
          <Text fw={500}>{key.name || "Unnamed Key"}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Code>{key.accessKeyId}</Code>
        <CopyButton value={key.accessKeyId} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip
              label={copied ? "Copied" : "Copy ID"}
              withArrow
              position="right"
            >
              <ActionIcon
                color={copied ? "teal" : "gray"}
                variant="subtle"
                onClick={copy}
                size="sm"
                ml={4}
              >
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="red"
            disabled // Deleting keys needs an API call we haven't implemented yet
          >
            <IconTrash size={16} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="lg">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Access Keys</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={open}>
          Create Access Key
        </Button>
      </Group>

      {lastCreatedKey && (
        <Alert
          variant="light"
          color="green"
          title="Key Created Successfully"
          mb="xl"
          withCloseButton
          onClose={() => setLastCreatedKey(null)}
        >
          <Stack gap="xs">
            <Text size="sm">
              Please save your Secret Key now. It will not be shown again.
            </Text>
            <Group>
              <Text size="sm" fw={700} w={120}>
                Access Key ID:
              </Text>
              <Code>{lastCreatedKey.accessKeyId}</Code>
            </Group>
            <Group>
              <Text size="sm" fw={700} w={120}>
                Secret Key:
              </Text>
              <Code>{lastCreatedKey.secretAccessKey}</Code>
              <CopyButton value={lastCreatedKey.secretAccessKey} timeout={2000}>
                {({ copied, copy }) => (
                  <ActionIcon
                    color={copied ? "teal" : "blue"}
                    onClick={copy}
                    size="sm"
                  >
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                )}
              </CopyButton>
            </Group>
          </Stack>
        </Alert>
      )}

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

        <Paper withBorder radius="md">
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Access Key ID</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Paper>
      </div>

      <Modal opened={opened} onClose={close} title="Create New Access Key">
        <Stack>
          <TextInput
            label="Key Name"
            placeholder="admin-key"
            description="A label to help you identify this key"
            required
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} loading={creating}>
              Create Key
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
