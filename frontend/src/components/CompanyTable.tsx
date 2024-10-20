import React, { useState } from "react";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
  GridPaginationModel,
} from "@mui/x-data-grid";
import {
  ICompany,
  addCompaniesToLiked,
  removeCompaniesFromLiked,
} from "../utils/jam-api";
import {
  IconButton,
  Button,
  Box,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

interface CompanyTableProps {
  companies: ICompany[];
  total: number;
  onLikeToggle: (companyId: number) => Promise<void>;
  showLikedOnly: boolean;
  onCompaniesUpdate: () => void;
  isLikeToggleInProgress: boolean;
}

const CompanyTable: React.FC<CompanyTableProps> = ({
  companies,
  total,
  onLikeToggle,
  showLikedOnly,
  onCompaniesUpdate,
  isLikeToggleInProgress,
}) => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([]);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [showCompletedMessage, setShowCompletedMessage] = useState(false);

  const handleLikeToggle = async (companyId: number) => {
    await onLikeToggle(companyId);
  };

  const handleAction = async (action: "add" | "remove") => {
    setIsActionInProgress(true);
    try {
      const selectedIds = rowSelectionModel as number[];
      if (action === "add") {
        await addCompaniesToLiked(selectedIds);
      } else {
        await removeCompaniesFromLiked(selectedIds);
      }
      onCompaniesUpdate();
      setRowSelectionModel([]);
      setShowCompletedMessage(true);
    } catch (error) {
      console.error(
        `Failed to ${action} selected companies ${
          action === "add" ? "to" : "from"
        } liked:`,
        error
      );
    } finally {
      setIsActionInProgress(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "company_name", headerName: "Company Name", width: 200 },
    {
      field: "liked",
      headerName: "Liked",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          onClick={() => handleLikeToggle(params.row.id)}
          disabled={isLikeToggleInProgress || isActionInProgress}
        >
          {params.value ? (
            <FavoriteIcon color="error" />
          ) : (
            <FavoriteBorderIcon />
          )}
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ height: 800, width: "100%" }}>
      {!showLikedOnly ? (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleAction("add")}
          disabled={rowSelectionModel.length === 0 || isActionInProgress}
          sx={{ mb: 2, mr: 2 }}
        >
          {isActionInProgress ? (
            <CircularProgress size={24} />
          ) : (
            "Add Selected to Liked Companies"
          )}
        </Button>
      ) : (
        <Button
          variant="contained"
          color="secondary"
          onClick={() => handleAction("remove")}
          disabled={rowSelectionModel.length === 0 || isActionInProgress}
          sx={{ mb: 2, mr: 2 }}
        >
          {isActionInProgress ? (
            <CircularProgress size={24} />
          ) : (
            "Unlike Selected Companies"
          )}
        </Button>
      )}
      <DataGrid
        rows={companies}
        columns={columns}
        rowCount={total}
        pageSizeOptions={[25, 50, 100]}
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={setPaginationModel}
        disableRowSelectionOnClick
        checkboxSelection
        onRowSelectionModelChange={(newRowSelectionModel) => {
          setRowSelectionModel(newRowSelectionModel);
        }}
        rowSelectionModel={rowSelectionModel}
      />
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={showCompletedMessage}
        autoHideDuration={3000}
        onClose={() => setShowCompletedMessage(false)}
        message="Action completed successfully"
      />
    </Box>
  );
};

export default CompanyTable;
