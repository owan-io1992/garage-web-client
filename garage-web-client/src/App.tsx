import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/Layout/AppLayout";
import { WelcomePage } from "./pages/Welcome/WelcomePage";
import { ManageClustersPage } from "./pages/Cluster/ManageClustersPage";
import { ClusterHealthPage } from "./pages/Cluster/Health/ClusterHealthPage";

// function App() {
//   const activeClusterId = useClusterStore((state) => state.activeClusterId);

//   return (
//     <Routes>

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/manage-clusters" element={<ManageClustersPage />} />

      {/* Protected Cluster Routes */}
      <Route path="/cluster/:clusterId" element={<AppLayout />}>
        <Route path="health" element={<ClusterHealthPage />} />
        {/* Default redirect to health for now */}
        <Route index element={<Navigate to="health" replace />} />
      </Route>

      {/* Catch all redirect to Welcome */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
