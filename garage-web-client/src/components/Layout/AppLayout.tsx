import {
  AppShell,
  Burger,
  Group,
  Text,
  Select,
  NavLink,
  ActionIcon,
  Anchor,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useClusterStore } from "../../store/clusterStore";
import {
  IconServer,
  IconSun,
  IconMoon,
  IconBook,
  IconBrandGithub,
  IconDatabase,
  IconArchive,
  IconKey,
  IconUsers,
} from "@tabler/icons-react";
import { ClusterStatusPage } from "../../pages/Cluster/ClusterStatus";
import { ClusterLayoutPage } from "../../pages/Cluster/ClusterLayout";
import { BucketPage } from "../../pages/Bucket/BucketPage";
import { AccessKeysPage } from "../../pages/IAM/AccessKeysPage";
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

  // Check if we're on a cluster-related page
  const isClusterPage = location.pathname.startsWith("/cluster/");
  const isIAMPage = location.pathname.startsWith("/iam/");

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
            <Anchor
              fw={700}
              size="lg"
              onClick={() => navigate("/")}
              style={{
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Garage Web Client
            </Anchor>
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
          defaultOpened={isClusterPage}
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
          label="IAM"
          leftSection={<IconUsers size={16} stroke={1.5} />}
          childrenOffset={28}
          defaultOpened={isIAMPage}
        >
          <NavLink
            label="Access Keys"
            leftSection={<IconKey size={14} stroke={1.5} />}
            active={location.pathname === "/iam/keys"}
            onClick={() => navigate(`/iam/keys?clusterId=${activeClusterId}`)}
          />
        </NavLink>

        <NavLink
          label="Node"
          leftSection={<IconServer size={16} stroke={1.5} />}
          active={location.pathname === "/node"}
          onClick={() => navigate(`/node?clusterId=${activeClusterId}`)}
        />

        <NavLink
          label="Documentation"
          leftSection={<IconBook size={16} stroke={1.5} />}
          component="a"
          href="https://garagehq.deuxfleurs.fr/documentation/quick-start/"
          target="_blank"
        />

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{ display: "flex", gap: "8px", justifyContent: "center" }}
          >
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
          <Text size="sm" c="dimmed" ta="center">
            v{__APP_VERSION__}
          </Text>
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        {location.pathname === "/cluster/status" && <ClusterStatusPage />}
        {location.pathname === "/cluster/layout" && <ClusterLayoutPage />}
        {location.pathname === "/bucket" && <BucketPage />}
        {location.pathname === "/iam/keys" && <AccessKeysPage />}
        {location.pathname === "/node" && <NodePage />}
      </AppShell.Main>
    </AppShell>
  );
}
