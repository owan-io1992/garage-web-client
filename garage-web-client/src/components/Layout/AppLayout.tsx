import { AppShell, Burger, Group, Text, Select, NavLink } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate, useParams, Outlet, useLocation } from "react-router-dom";
import { useClusterStore } from "../../store/clusterStore";
import { IconActivity, IconServer } from "@tabler/icons-react";
import { useEffect } from "react";

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { clusters, setActiveCluster, activeClusterId } = useClusterStore();
  const { clusterId } = useParams<{ clusterId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (clusterId && clusterId !== activeClusterId) {
      setActiveCluster(clusterId);
    }
  }, [clusterId, activeClusterId, setActiveCluster]);

  const handleClusterChange = (value: string | null) => {
    if (value === "manage-clusters") {
      navigate("/manage-clusters");
    } else if (value) {
      navigate(`/cluster/${value}/health`);
    }
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Text fw={700} size="lg">
              Garage Web Client
            </Text>
          </Group>

          <Group>
            <Select
              placeholder="Select Cluster"
              data={[
                ...clusters.map((c) => ({ value: c.id, label: c.name })),
                { value: "manage-clusters", label: "Manage Clusters" },
              ]}
              value={activeClusterId}
              onChange={handleClusterChange}
              allowDeselect={false}
              w={250}
            />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          label="Cluster"
          leftSection={<IconServer size={16} stroke={1.5} />}
          childrenOffset={28}
          defaultOpened
        >
          <NavLink
            label="Health Status"
            leftSection={<IconActivity size={16} stroke={1.5} />}
            active={location.pathname.includes("/health")}
            onClick={() => navigate("health")}
          />
        </NavLink>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
