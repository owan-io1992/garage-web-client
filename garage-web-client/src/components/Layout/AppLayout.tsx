import {
  AppShell,
  Burger,
  Group,
  Text,
  Select,
  NavLink,
  ActionIcon,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useClusterStore } from "../../store/clusterStore";
import {
  IconServer,
  IconSun,
  IconMoon,
  IconBrandGithub,
  IconDatabase,
  IconArchive,
} from "@tabler/icons-react";
import { ClusterStatusPage } from "../../pages/Cluster/ClusterStatus";
import { ClusterLayoutPage } from "../../pages/Cluster/ClusterLayout";
import { BucketPage } from "../../pages/Bucket/BucketPage";
import { NodePage } from "../../pages/Node/NodePage";
import { useEffect } from "react";

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { clusters, setActiveCluster, activeClusterId } = useClusterStore();
  const [searchParams] = useSearchParams();
  const clusterId = searchParams.get("clusterId");
  const navigate = useNavigate();
  const location = useLocation();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (clusterId && clusterId !== activeClusterId) {
      setActiveCluster(clusterId);
    }
  }, [clusterId, activeClusterId, setActiveCluster]);

  const handleClusterChange = (value: string | null) => {
    if (value === "manage-clusters") {
      navigate("/manage-clusters");
    } else if (value) {
      navigate(`/cluster/status?clusterId=${value}`);
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
            <Text size="sm" c="dimmed">
              v{__APP_VERSION__}
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

      <AppShell.Navbar
        p="md"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <NavLink
          label="Cluster"
          leftSection={<IconDatabase size={16} stroke={1.5} />}
          childrenOffset={28}
        >
          <NavLink
            label="status"
            active={location.pathname === "/cluster/status"}
            onClick={() =>
              navigate(`/cluster/status?clusterId=${activeClusterId}`)
            }
          />
          <NavLink
            label="layout"
            active={location.pathname === "/cluster/layout"}
            onClick={() =>
              navigate(`/cluster/layout?clusterId=${activeClusterId}`)
            }
          />
        </NavLink>

        <NavLink
          label="Bucket"
          leftSection={<IconArchive size={16} stroke={1.5} />}
          active={location.pathname === "/bucket"}
          onClick={() => navigate(`/bucket?clusterId=${activeClusterId}`)}
        />

        <NavLink
          label="Node"
          leftSection={<IconServer size={16} stroke={1.5} />}
          active={location.pathname === "/node"}
          onClick={() => navigate(`/node?clusterId=${activeClusterId}`)}
        />

        <div style={{ marginTop: "auto", display: "flex", gap: "8px" }}>
          <ActionIcon
            component="a"
            href="https://github.com/owan-io1992/garage-web-client"
            target="_blank"
            variant="subtle"
          >
            <IconBrandGithub size={20} />
          </ActionIcon>
          <ActionIcon onClick={toggleColorScheme} variant="subtle" size="lg">
            {colorScheme === "dark" ? (
              <IconSun size={20} />
            ) : (
              <IconMoon size={20} />
            )}
          </ActionIcon>
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        {location.pathname === "/cluster/status" && <ClusterStatusPage />}
        {location.pathname === "/cluster/layout" && <ClusterLayoutPage />}
        {location.pathname === "/bucket" && <BucketPage />}
        {location.pathname === "/node" && <NodePage />}
      </AppShell.Main>
    </AppShell>
  );
}
