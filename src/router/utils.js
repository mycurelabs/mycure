export const getURLQueryParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const queryParams = [];
  for (const [key, value] of urlParams.entries()) {
    console.log(key, value);
    queryParams.push({ key, value });
  }
  return queryParams;
};

export const getLayoutTypeQueryParam = () => {
  const queryParams = getURLQueryParams();
  const layoutType = queryParams.find(q => q.key === 'layout');
  return layoutType?.value;
};
