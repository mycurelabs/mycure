export function usePmeNavRoutes (userRoles) {
  const navs = [
    {
      type: 'nav-header',
      name: 'PME',
    },
    {
      id: 'pme-nav-worklist',
      name: 'Worklist',
      route: 'pme-worklist',
      icon: 'fa fa-list',
      roles: [
        'a',
        'b',
        'c',
      ],
    },
    {
      type: 'nav-header',
      name: 'Records',
    },
    {
      id: 'pme-nav-walk-in-package',
      name: 'Walk-in Package',
      route: 'pme-walk-in-package',
      icon: 'fa fa-person-walking',
      roles: [
        'a',
        'b',
        'c',
      ],
    },
    {
      id: 'pme-nav-group-package',
      name: 'Group Package',
      route: 'pme-group-package',
      icon: 'fa fa-people-group',
      roles: [
        'a',
        'b',
        'c',
      ],
    },
    {
      type: 'nav-header',
      name: 'Reports',
    },
    {
      id: 'pme-nav-monitoring-report',
      name: 'Monitoring Report',
      route: 'pme-monitoring-report',
      icon: 'fa-regular fa-file',
      roles: [
        'a',
        'b',
        'c',
      ],
    },
    {
      id: 'pme-nav-summary-report',
      name: 'Summary Report',
      route: 'pme-summary-report',
      icon: 'fa fa-file',
      roles: [
        'a',
        'b',
        'c',
      ],
    },
  ];

  const mappedNavs = navs.map(nav => {
    // TODO: filter based on active user roles
    // const intersectingRoles = userRoles.filter(role => nav.roles.includes(role));
    // if (intersectingRoles.length) return nav;
    // return null;
    return nav;
  }).filter(Boolean);

  return mappedNavs;
};
