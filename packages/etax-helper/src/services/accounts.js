/** Normalize both current and legacy backend account fields for the view. */
export function normalizeAccounts(data) {
  if (!Array.isArray(data?.workspaces) || data.workspaces.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('账户数据格式不符合预期，请检查服务返回值');
  return data.workspaces.map(row => ({...row,
    taxNo: row.nsrsbh ?? row.name ?? '', company: row.nsrmc ?? row.name2 ?? '',
    user: row.username ?? row.name3 ?? '', statusText: row.status ?? '未校验',
  }));
}
export function filterAccounts(rows, query) {
  const search = query.trim().toLowerCase();
  return rows.filter(row => [row.taxNo, row.company, row.cookieId].some(value => String(value ?? '').toLowerCase().includes(search)));
}
export function createAccountQuery({state, load, getContext}) {
  let revision = 0, disposed = false;
  const current = (id, context) => !disposed && id === revision && context.apiKey === getContext().apiKey && context.area === getContext().area;
  return {
    invalidate() { revision++; state.loading = false; state.rows = []; state.error = ''; },
    dispose() { disposed = true; revision++; },
    async refresh() {
      if (disposed || state.loading) return;
      state.rows = []; state.error = '';
      const context = {...getContext()};
      if (!context.apiKey) return;
      if (!context.area) { state.error = '无法识别地区，请在电局、Tpass 或发票平台页面查询账户'; return; }
      const id = ++revision;
      state.loading = true;
      try {
        const data = await load({areaName: context.area});
        if (current(id, context)) state.rows = normalizeAccounts(data);
      } catch (error) { if (current(id, context)) state.error = error.message; }
      finally { if (!disposed && id === revision) state.loading = false; }
    },
  };
}
