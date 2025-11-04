import React, { ReactNode } from 'react';
import { Stack, Typography, Paper, TableCell } from '@mui/material';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "table" | "card";
  colSpan?: number; // Required for table variant
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = "card",
  colSpan
}) => {
  const content = (
    <Stack spacing={2} alignItems="center" sx={{ py: variant === "table" ? 4 : 6 }}>
      {React.cloneElement(icon as React.ReactElement<any>, {
        sx: {
          fontSize: variant === "table" ? 48 : 64,
          color: variant === "table" ? 'text.secondary' : 'grey.400'
        }
      })}
      <Typography
        variant={variant === "table" ? "body1" : "h6"}
        color="text.secondary"
        sx={{ fontWeight: variant === "table" ? 400 : 600 }}
      >
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
          {description}
        </Typography>
      )}
      {action}
    </Stack>
  );

  if (variant === "table") {
    return (
      <TableCell colSpan={colSpan} sx={{ textAlign: 'center' }}>
        {content}
      </TableCell>
    );
  }

  return (
    <Paper
      sx={{
        textAlign: 'center',
        backgroundColor: 'grey.50',
        border: '1px dashed',
        borderColor: 'grey.300',
        borderRadius: 2
      }}
    >
      {content}
    </Paper>
  );
};

