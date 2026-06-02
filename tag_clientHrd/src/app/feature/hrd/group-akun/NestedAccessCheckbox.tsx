import React, { useState } from 'react';
import {
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  IconButton,
  Collapse,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface ActionItem {
  IdAction: string;
  NamaAction: string;
}

interface ControllerItem {
  IdController: string;
  Controller: string;
  ActionViewModel: ActionItem[];
}

interface MenuItem {
  IdMenu: string;
  NamaMenu: string;
  ControllerViewModel: ControllerItem[];
}

interface AccessObj {
  IdController: string;
  IdAction: string;
}

interface Props {
  data: MenuItem[];
  selected: AccessObj[];
  onChange: (val: AccessObj[]) => void;
}

const NestedAccessCheckbox: React.FC<Props> = ({ data, selected, onChange }) => {
  const [openMenu, setOpenMenu] = useState<string[]>([]);
  const [openController, setOpenController] = useState<string[]>([]);

  const toggleMenuCollapse = (menuId: string) => {
    setOpenMenu((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const toggleControllerCollapse = (controllerId: string) => {
    setOpenController((prev) =>
      prev.includes(controllerId)
        ? prev.filter((id) => id !== controllerId)
        : [...prev, controllerId]
    );
  };

  const toggleAccess = (controller: string, action: string) => {
    const exists = selected.some(
      (x) => x.IdController === controller && x.IdAction === action
    );

    const updated = exists
      ? selected.filter(
          (x) => !(x.IdController === controller && x.IdAction === action)
        )
      : [...selected, { IdController: controller, IdAction: action }];

    onChange(updated);
  };

  const toggleControllerGroup = (controller: ControllerItem) => {
    const ids = controller.ActionViewModel.map((a) => ({
      IdController: controller.IdController,
      IdAction: a.IdAction,
    }));

    const allChecked = ids.every((x) =>
      selected.some(
        (s) => s.IdController === x.IdController && s.IdAction === x.IdAction
      )
    );

    let updated = [...selected];

    if (allChecked) {
      updated = updated.filter(
        (x) => x.IdController !== controller.IdController
      );
    } else {
      ids.forEach((id) => {
        if (
          !updated.some(
            (x) =>
              x.IdController === id.IdController && x.IdAction === id.IdAction
          )
        ) {
          updated.push(id);
        }
      });
    }

    onChange(updated);
  };

  const toggleMenuGroup = (menu: MenuItem) => {
    const ids: AccessObj[] = [];

    menu.ControllerViewModel.forEach((ctrl) => {
      ctrl.ActionViewModel.forEach((action) => {
        ids.push({
          IdController: ctrl.IdController,
          IdAction: action.IdAction,
        });
      });
    });

    const allChecked = ids.every((x) =>
      selected.some(
        (s) => s.IdController === x.IdController && s.IdAction === x.IdAction
      )
    );

    let updated = [...selected];

    if (allChecked) {
      updated = updated.filter(
        (x) =>
          !ids.some(
            (id) =>
              id.IdController === x.IdController && id.IdAction === x.IdAction
          )
      );
    } else {
      ids.forEach((id) => {
        if (
          !updated.some(
            (x) =>
              x.IdController === id.IdController && x.IdAction === id.IdAction
          )
        ) {
          updated.push(id);
        }
      });
    }

    onChange(updated);
  };

  return (
    <Box mt={2}>
      <Typography fontWeight="bold" mb={1}>
        Hak Akses (Modul HRD)
      </Typography>

      {data.map((menu) => {
        const menuActions: AccessObj[] = [];
        menu.ControllerViewModel.forEach((c) =>
          c.ActionViewModel.forEach((a) =>
            menuActions.push({
              IdController: c.IdController,
              IdAction: a.IdAction,
            })
          )
        );

        const menuChecked = menuActions.every((x) =>
          selected.some(
            (s) =>
              s.IdController === x.IdController && s.IdAction === x.IdAction
          )
        );

        const menuIndeterminate =
          !menuChecked &&
          menuActions.some((x) =>
            selected.some(
              (s) =>
                s.IdController === x.IdController && s.IdAction === x.IdAction
            )
          );

        return (
          <Box key={menu.IdMenu} border={1} borderRadius={2} p={2} mb={2}>
            <Box display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={menuChecked}
                    indeterminate={menuIndeterminate}
                    onChange={() => toggleMenuGroup(menu)}
                  />
                }
                label={<strong>{menu.NamaMenu}</strong>}
              />

              <IconButton
                size="small"
                onClick={() => toggleMenuCollapse(menu.IdMenu)}
              >
                {openMenu.includes(menu.IdMenu) ? (
                  <ExpandLess />
                ) : (
                  <ExpandMore />
                )}
              </IconButton>
            </Box>

            <Collapse in={openMenu.includes(menu.IdMenu)}>
              <Box ml={3}>
                {menu.ControllerViewModel.map((ctrl) => {
                  const ctrlActions = ctrl.ActionViewModel.map((a) => ({
                    IdController: ctrl.IdController,
                    IdAction: a.IdAction,
                  }));

                  const ctrlChecked = ctrlActions.every((x) =>
                    selected.some(
                      (s) =>
                        s.IdController === x.IdController &&
                        s.IdAction === x.IdAction
                    )
                  );

                  const ctrlIndeterminate =
                    !ctrlChecked &&
                    ctrlActions.some((x) =>
                      selected.some(
                        (s) =>
                          s.IdController === x.IdController &&
                          s.IdAction === x.IdAction
                      )
                    );

                  return (
                    <Box key={ctrl.IdController} mt={1}>
                      <Box display="flex" alignItems="center">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={ctrlChecked}
                              indeterminate={ctrlIndeterminate}
                              onChange={() => toggleControllerGroup(ctrl)}
                            />
                          }
                          label={ctrl.Controller}
                        />

                        <IconButton
                          size="small"
                          onClick={() =>
                            toggleControllerCollapse(ctrl.IdController)
                          }
                        >
                          {openController.includes(ctrl.IdController) ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          )}
                        </IconButton>
                      </Box>

                      <Collapse in={openController.includes(ctrl.IdController)}>
                        <Box ml={4}>
                          {ctrl.ActionViewModel.map((action) => (
                            <FormControlLabel
                              key={action.IdAction}
                              control={
                                <Checkbox
                                  checked={selected.some(
                                    (s) =>
                                      s.IdController === ctrl.IdController &&
                                      s.IdAction === action.IdAction
                                  )}
                                  onChange={() =>
                                    toggleAccess(
                                      ctrl.IdController,
                                      action.IdAction
                                    )
                                  }
                                />
                              }
                              label={action.NamaAction}
                            />
                          ))}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
};

export default NestedAccessCheckbox;
