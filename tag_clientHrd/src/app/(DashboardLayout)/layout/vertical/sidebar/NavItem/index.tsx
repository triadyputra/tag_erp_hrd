'use client';

import React, { useContext } from 'react';
import Link from 'next/link';

import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { alpha, styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Theme } from '@mui/material/styles';

import { useTranslation } from 'react-i18next';
import { CustomizerContext } from '@/app/context/customizerContext';
import { useTabWorkspace } from '@/app/context/tabWorkspaceContext';
import { isWorkspaceRoute } from '@/app/(DashboardLayout)/workspace/routeRegistry';

interface ItemType {
  item: any;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  hideMenu?: boolean;
  level?: number;
  pathDirect: string;
}

export default function NavItem({
  item,
  level = 1,
  pathDirect,
  hideMenu,
  onClick,
}: ItemType) {
  const theme = useTheme();
  const lgDown = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('lg')
  );
  const { isBorderRadius } = useContext(CustomizerContext);
  const { t } = useTranslation();
  const { openTab } = useTabWorkspace();

  const Icon = item.icon;
  const workspaceRoute = isWorkspaceRoute(item.href);

  const isActive =
    pathDirect === item.href ||
    pathDirect.startsWith(item.href + '/');

  const ListItemStyled = styled(ListItemButton)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,

    paddingTop: 8,
    paddingBottom: 8,

    paddingLeft: hideMenu
      ? 12
      : level === 1
        ? 16
        : 16 + (level - 1) * 20,

    paddingRight: 16,
    borderRadius: isBorderRadius,
    marginBottom: 4,
    transition:
      'background-color 220ms cubic-bezier(0.22, 1, 0.36, 1), color 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',

    color: isActive
      ? theme.palette.primary.main
      : theme.palette.text.secondary,

    '& .nav-icon': {
      minWidth: 'unset',
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      color: 'inherit',
      backgroundColor: isActive
        ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.12)
        : 'transparent',
      transition:
        'background-color 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
    },

    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.primary.main,
      transform: 'translateX(1px)',
    },

    '&:hover .nav-icon': {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.12),
      transform: 'scale(1.04)',
    },

    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: '#fff',
      '&:hover': {
        backgroundColor: theme.palette.primary.main,
        transform: 'none',
      },
    },

    '&.Mui-selected .nav-icon': {
      backgroundColor: alpha('#fff', 0.18),
      transform: 'none',
    },
  }));

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (workspaceRoute) {
      e.preventDefault();
      openTab(item.href, t(item.title), item.iconKey);
    }
    if (lgDown) onClick(e);
  };

  const listItem = (
    <ListItemStyled
      selected={isActive}
      onClick={handleClick}
    >
      <ListItemIcon className="nav-icon" sx={{}}>
        <Icon size={18} stroke={1.5} />
      </ListItemIcon>

      {!hideMenu && (
        <ListItemText
          primary={t(item.title)}
          secondary={
            item.subtitle ? (
              <Typography variant="caption">
                {item.subtitle}
              </Typography>
            ) : null
          }
        />
      )}

      {!hideMenu && item.chip && (
        <Chip
          size="small"
          label={item.chip}
          color={item.chipColor || 'primary'}
        />
      )}
    </ListItemStyled>
  );

  return (
    <List component="li" disablePadding>
      {workspaceRoute ? (
        listItem
      ) : (
        <Link href={item.href ?? '#'} style={{ textDecoration: 'none' }}>
          {listItem}
        </Link>
      )}
    </List>
  );
}
