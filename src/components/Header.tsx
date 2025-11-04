import React, { useState } from "react"
import { AppBar, Toolbar, Box, Typography, Link, Avatar, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { LogoutOutlined } from "@mui/icons-material";
import { UserHelper } from "@churchapps/apphelper";

export const Header: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    window.location.href = '/logout';
  };

  const getAvatarInitials = () => {
    if (!UserHelper.user) return '';
    const firstName = UserHelper.user.firstName || '';
    const lastName = UserHelper.user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!UserHelper.user) return '';
    return `${UserHelper.user.firstName || ''} ${UserHelper.user.lastName || ''}`.trim();
  };

  return (
    <div style={{ backgroundColor: "var(--c1)", color: "#FFF" }}>
      <AppBar position="fixed" sx={{
        backgroundColor: 'var(--c1)',
        color: '#FFF',
        boxShadow: 'none',
        height: '64px'
      }}>
        <Toolbar sx={{
          pr: '24px',
          pl: '24px',
          backgroundColor: 'var(--c1)',
          minHeight: '64px !important',
          maxWidth: 'none',
          width: '100%'
        }}>
          <Box sx={{
            flexGrow: 0,
            display: 'flex',
            alignItems: 'center',
            mr: 6
          }}>
            <Link
              href="/"
              id="primaryNavButton"
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#FFF',
                textDecoration: 'none',
                '&:hover': {
                  backgroundColor: 'var(--c1d2)'
                }
              }}
            >
              <img
                src="/images/logo-icon.png"
                alt="B1.church Transfer"
                style={{
                  height: '35px',
                  marginRight: '15px'
                }}
              />
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: 600,
                  color: '#FFF',
                  lineHeight: 1,
                  textWrap: 'nowrap',
                  display: { xs: 'none', md: 'block' }
                }}
              >
                B1.Church Transfer Tool
              </Typography>
            </Link>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!UserHelper.user
              ? (
                <Link href="/login" sx={{ color: '#FFF', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Login
                </Link>
              )
              : (
                <>
                  <IconButton
                    onClick={handleAvatarClick}
                    size="small"
                    sx={{ ml: 2 }}
                    aria-controls={open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'var(--c1d2)',
                        color: '#FFF',
                        fontSize: '0.875rem'
                      }}
                    >
                      {getAvatarInitials()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    id="account-menu"
                    open={open}
                    onClose={handleClose}
                    onClick={handleClose}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                          width: 32,
                          height: 32,
                          ml: -0.5,
                          mr: 1,
                        },
                        '&::before': {
                          content: '""',
                          display: 'block',
                          position: 'absolute',
                          top: 0,
                          right: 14,
                          width: 10,
                          height: 10,
                          bgcolor: 'background.paper',
                          transform: 'translateY(-50%) rotate(45deg)',
                          zIndex: 0,
                        },
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <MenuItem sx={{ cursor: 'default' }}>
                      <Avatar sx={{ bgcolor: 'var(--c1)' }}>{getAvatarInitials()}</Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {getUserDisplayName()}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutOutlined fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Logout</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              )}
          </Box>
        </Toolbar>
      </AppBar>
    </div>
  )
}
