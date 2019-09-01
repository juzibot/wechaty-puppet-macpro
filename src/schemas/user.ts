/* eslint camelcase: 0 */
export interface GrpcLoginInfo {
  type: number,
  account: string,
  account_alias: string,
  name: string,
  thumb: string,
  extend: string,
}

export interface AreaInfo {
  id: number,
  area_name: string,
}
