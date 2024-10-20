import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CompanyTable from "./components/CompanyTable";
import { getCompanies, toggleCompanyLike, ICompany } from "./utils/jam-api";
import {
  CircularProgress,
  Box,
  Typography,
  Tabs,
  Tab,
  Snackbar,
} from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const [activeTab, setActiveTab] = useState<"myList" | "likedCompanies">(
    "myList"
  );
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [isLikeToggleInProgress, setIsLikeToggleInProgress] = useState(false);
  const [showLikeToggleCompleted, setShowLikeToggleCompleted] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allCompaniesResponse = await getCompanies(0, 100);
      setCompanies(allCompaniesResponse.companies);
      setTotal(allCompaniesResponse.total);
    } catch (err) {
      setError("Failed to fetch initial data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleLikeToggle = async (companyId: number) => {
    try {
      setError(null);
      setIsLikeToggleInProgress(true);
      const updatedCompany = await toggleCompanyLike(companyId);
      setCompanies((prevCompanies) =>
        prevCompanies.map((company) =>
          company.id === companyId
            ? { ...company, liked: updatedCompany.liked }
            : company
        )
      );
      setShowLikeToggleCompleted(true);
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setError("Failed to update like status");
    } finally {
      setIsLikeToggleInProgress(false);
    }
  };

  const handleCompaniesUpdate = () => {
    fetchInitialData();
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const displayedCompanies =
    activeTab === "likedCompanies"
      ? companies.filter((company) => company.liked)
      : companies;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Harmonic Jam
        </Typography>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) =>
            setActiveTab(newValue as "myList" | "likedCompanies")
          }
          sx={{ mb: 2 }}
        >
          <Tab label="My List" value="myList" />
          <Tab label="Liked Companies" value="likedCompanies" />
        </Tabs>
        <CompanyTable
          companies={displayedCompanies}
          total={
            activeTab === "likedCompanies" ? displayedCompanies.length : total
          }
          onLikeToggle={handleLikeToggle}
          showLikedOnly={activeTab === "likedCompanies"}
          onCompaniesUpdate={handleCompaniesUpdate}
          isLikeToggleInProgress={isLikeToggleInProgress}
        />
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={showLikeToggleCompleted}
        autoHideDuration={3000}
        onClose={() => setShowLikeToggleCompleted(false)}
        message="Like status updated successfully"
      />
    </ThemeProvider>
  );
}

export default App;
