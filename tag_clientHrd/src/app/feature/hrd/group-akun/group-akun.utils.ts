interface ActionItem {
  IdAction: string;
}

interface ControllerItem {
  IdController: string;
  ActionViewModel: ActionItem[];
}

interface MenuItem {
  ControllerViewModel: ControllerItem[];
}

export function collectHrdControllerIds(menus: MenuItem[]): Set<string> {
  const ids = new Set<string>();
  menus.forEach((menu) => {
    menu.ControllerViewModel?.forEach((ctrl) => {
      if (ctrl.IdController) ids.add(ctrl.IdController);
    });
  });
  return ids;
}

export function filterAccessForHrdTree<T extends { IdController: string; IdAction: string }>(
  access: T[],
  hrdControllerIds: Set<string>
): T[] {
  return access.filter((item) => hrdControllerIds.has(item.IdController));
}
