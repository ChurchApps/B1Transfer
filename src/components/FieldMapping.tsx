import React, { useState, useEffect } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, Button, Alert, Chip } from "@mui/material";
import { FieldMapping as FieldMappingType, B1_PEOPLE_FIELDS } from "../types";

interface Props {
  columns: string[];
  sampleData: any[];
  onConfirm: (mappings: FieldMappingType[]) => void;
}

const autoDetectMapping = (column: string): string => {
  const col = column.toLowerCase().trim();
  const map: Record<string, string> = {
    "first name": "name.first",
    "firstname": "name.first",
    "first": "name.first",
    "last name": "name.last",
    "lastname": "name.last",
    "last": "name.last",
    "middle name": "name.middle",
    "middlename": "name.middle",
    "middle": "name.middle",
    "nickname": "name.nick",
    "nick name": "name.nick",
    "prefix": "name.title",
    "title": "name.title",
    "name prefix": "name.title",
    "suffix": "name.suffix",
    "name suffix": "name.suffix",
    "email": "contactInfo.email",
    "e-mail": "contactInfo.email",
    "email address": "contactInfo.email",
    "home phone": "contactInfo.homePhone",
    "homephone": "contactInfo.homePhone",
    "phone": "contactInfo.homePhone",
    "mobile": "contactInfo.mobilePhone",
    "mobile phone": "contactInfo.mobilePhone",
    "cell": "contactInfo.mobilePhone",
    "cell phone": "contactInfo.mobilePhone",
    "work phone": "contactInfo.workPhone",
    "workphone": "contactInfo.workPhone",
    "address": "contactInfo.address1",
    "address line 1": "contactInfo.address1",
    "street": "contactInfo.address1",
    "address1": "contactInfo.address1",
    "address line 2": "contactInfo.address2",
    "address2": "contactInfo.address2",
    "apt": "contactInfo.address2",
    "city": "contactInfo.city",
    "state": "contactInfo.state",
    "province": "contactInfo.state",
    "zip": "contactInfo.zip",
    "zip code": "contactInfo.zip",
    "zipcode": "contactInfo.zip",
    "postal code": "contactInfo.zip",
    "postal": "contactInfo.zip",
    "birth date": "birthDate",
    "birthdate": "birthDate",
    "birthday": "birthDate",
    "dob": "birthDate",
    "date of birth": "birthDate",
    "gender": "gender",
    "sex": "gender",
    "marital status": "maritalStatus",
    "marital": "maritalStatus",
    "membership status": "membershipStatus",
    "status": "membershipStatus",
    "member status": "membershipStatus",
    "family": "householdName",
    "family name": "householdName",
    "household": "householdName",
    "household name": "householdName",
    "group": "groupName",
    "group name": "groupName",
    "tag": "groupName",
    "ministry": "groupName"
  };
  return map[col] || "";
};

export const FieldMappingUI: React.FC<Props> = ({ columns, sampleData, onConfirm }) => {
  const [mappings, setMappings] = useState<FieldMappingType[]>([]);

  useEffect(() => {
    const initial = columns.map(col => ({
      sourceColumn: col,
      targetField: autoDetectMapping(col)
    }));
    setMappings(initial);
  }, [columns]);

  const handleChange = (index: number, value: string) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], targetField: value };
    setMappings(updated);
  };

  const mappedCount = mappings.filter(m => m.targetField !== "").length;
  const hasName = mappings.some(m => m.targetField === "name.first" || m.targetField === "name.last");

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main", mb: 1 }}>
        Map Your Fields
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Map each column from your file to the corresponding B1 field. We auto-detected {mappedCount} mappings — review and adjust as needed.
      </Typography>

      {!hasName && mappings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please map at least a First Name or Last Name field to proceed.
        </Alert>
      )}

      <TableContainer sx={{ maxHeight: 400, mb: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Your Column</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Sample Data</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Maps To</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mappings.map((mapping, i) => (
              <TableRow key={mapping.sourceColumn}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{mapping.sourceColumn}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={sampleData[0]?.[mapping.sourceColumn] ?? "—"}
                    size="small"
                    variant="outlined"
                    sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={mapping.targetField}
                    onChange={(e) => handleChange(i, e.target.value)}
                    sx={{ minWidth: 200 }}
                    displayEmpty
                  >
                    {B1_PEOPLE_FIELDS.map(f => (
                      <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        variant="contained"
        disabled={!hasName}
        onClick={() => onConfirm(mappings)}
        sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, px: 4 }}
      >
        Confirm Mapping & Import ({mappedCount} fields mapped)
      </Button>
    </Box>
  );
};
