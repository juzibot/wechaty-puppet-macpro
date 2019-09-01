export const CacheManageError = (type: string) => {
  return new Error(type + 'no cacheManager')
}

export const NoIDError = (type: string) => {
  return new Error(type + 'no id')
}
