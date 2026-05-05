'use client';

import React, { useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import Collapse from '@mui/material/Collapse';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { alpha, styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Theme } from '@mui/material/styles';

import NavItem from '../NavItem';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { CustomizerContext } from '@/app/context/customizerContext';

interface NavCollapseProps {
  menu: any;
  level: number;
  pathWithoutLastPart: string;
  pathDirect: string;
  hideMenu?: boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export default function NavCollapse({
  menu,
  level,
  pathWithoutLastPart,
  pathDirect,
  hideMenu,
  onClick,
}: NavCollapseProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const lgDown = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('lg')
  );
  const { isBorderRadius } = useContext(CustomizerContext);
  const { t } = useTranslation();

  const Icon = menu.icon;
  const [open, setOpen] = useState(false);

  const isActive =
    pathDirect === menu.href ||
    pathDirect.startsWith(menu.href + '/');

  useEffect(() => {
    setOpen(false);
    menu.children?.forEach((item: any) => {
      if (pathname.startsWith(item.href)) {
        setOpen(true);
      }
    });
  }, [pathname, menu.children]);

  const ListItemStyled = styled(ListItemButton)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,

    paddingTop: 8,
    paddingBottom: 8,

    // 🔑 HARUS SAMA DENGAN NavItem
    paddingLeft: hideMenu
      ? 12
      : level === 1
        ? 16
        : 16 + (level - 1) * 20,

    paddingRight: 16,
    marginBottom: 4,
    borderRadius: isBorderRadius,
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

  return (
    <>
      <ListItemStyled
        selected={isActive}
        onClick={() => setOpen(!open)}
      >
        <ListItemIcon
          className="nav-icon"
          sx={{
            // styles handled by ListItemStyled (.nav-icon)
          }}
        >
          <Icon size={18} stroke={1.5} />
        </ListItemIcon>

        {!hideMenu && (
          <ListItemText primary={t(menu.title)} />
        )}

        {!hideMenu &&
          (open ? (
            <IconChevronUp size={18} />
          ) : (
            <IconChevronDown size={18} />
          ))}
      </ListItemStyled>

      <Collapse in={open} timeout="auto">
        {menu.children?.map((item: any) =>
          item.children ? (
            <NavCollapse
              key={item.id}
              menu={item}
              level={level + 1}
              pathWithoutLastPart={pathWithoutLastPart}
              pathDirect={pathDirect}
              hideMenu={hideMenu}
              onClick={onClick}
            />
          ) : (
            <NavItem
              key={item.id}
              item={item}
              level={level + 1}
              pathDirect={pathDirect}
              hideMenu={hideMenu}
              onClick={lgDown ? onClick : () => {}}
            />
          )
        )}
      </Collapse>
    </>
  );
}
