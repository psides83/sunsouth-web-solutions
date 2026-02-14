import React from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SearchRounded } from "@mui/icons-material";

export default function TableToolbar({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchLabel = "Search",
  searchPlaceholder = "Search",
  searchRequiresSubmit = false,
  onSearchSubmit,
  searchSubmitDisabled = false,
  chips = [],
  selectedChip = "all",
  onChipChange,
  sortValue,
  onSortChange,
  sortOptions = [],
  primaryActionLabel,
  primaryActionIcon,
  onPrimaryAction,
}) {
  const handleSearchKeyDown = (event) => {
    if (!searchRequiresSubmit || !onSearchSubmit) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <Stack spacing={{ xs: 2.25, sm: 1.5 }} sx={{ mb: { xs: 2.25, sm: 1.75 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={1}
      >
        <Box>
          <Typography variant="h5" color="primary" sx={{ fontSize: { xs: 22, sm: 26 } }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        {onPrimaryAction ? (
          <Button
            size="small"
            variant="contained"
            startIcon={primaryActionIcon}
            onClick={onPrimaryAction}
            sx={{
              alignSelf: "flex-start",
              minHeight: { xs: 34, sm: 36 },
              px: { xs: 1.25, sm: 1.5 },
              fontSize: { xs: 12, sm: 13 },
            }}
          >
            {primaryActionLabel}
          </Button>
        ) : null}
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1.5, sm: 1.25 }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ width: "100%", maxWidth: { xs: "100%", sm: 380 } }}
        >
          <TextField
            size="small"
            value={searchValue}
            onChange={onSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchPlaceholder}
            label={searchLabel}
            InputProps={{ startAdornment: <SearchRounded sx={{ mr: 0.5, color: "text.secondary" }} /> }}
            sx={{ minWidth: { xs: 0, sm: 220 }, flex: { xs: 1, sm: "0 1 auto" }, width: { xs: "auto", sm: 260 } }}
          />
          {searchRequiresSubmit ? (
            <Button
              size="small"
              variant="outlined"
              onClick={onSearchSubmit}
              disabled={searchSubmitDisabled}
              sx={{
                whiteSpace: "nowrap",
                minHeight: { xs: 34, sm: 40 },
                width: "auto",
                alignSelf: "center",
                px: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: 12, sm: 13 },
                flexShrink: 0,
              }}
            >
              Search
            </Button>
          ) : null}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {chips.length > 0 ? (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {chips.map((chip) => (
                <Chip
                  key={chip.value}
                  label={chip.label}
                  size="small"
                  color={selectedChip === chip.value ? "primary" : "default"}
                  variant={selectedChip === chip.value ? "filled" : "outlined"}
                  onClick={() => onChipChange?.(chip.value)}
                />
              ))}
            </Stack>
          ) : null}

          {sortOptions.length > 0 ? (
            <TextField
              size="small"
              select
              label="Sort"
              value={sortValue}
              onChange={onSortChange}
              sx={{ minWidth: 150 }}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
        </Stack>
      </Stack>
    </Stack>
  );
}
