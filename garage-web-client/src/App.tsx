import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/Layout/AppLayout";
import { WelcomePage } from "./pages/Welcome/WelcomePage";
import { ManageClustersPage } from "./pages/ManageClustersPage";

// function App() {
//   const activeClusterId = useClusterStore((state) => state.activeClusterId);

//   return (
//     <Routes>

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/manage-clusters" element={<ManageClustersPage />} />

      {/* Cluster Pages */}
      <Route path="/cluster/status" element={<AppLayout />} />
      <Route path="/cluster/layout" element={<AppLayout />} />
      <Route path="/bucket" element={<AppLayout />} />
      <Route path="/iam/keys" element={<AppLayout />} />
      <Route path="/node" element={<AppLayout />} />

      {/* Catch all redirect to Welcome */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
