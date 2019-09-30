export const CacheManageError = (type: string) => {
  return new Error(type + ' no cacheManager')
}
