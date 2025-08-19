// Minimal cache manager (placeholder for future IndexedDB/Cache Storage)
export default class CacheManager{
  constructor({ maxStorageSize } = {}){
    this.maxStorageSize = maxStorageSize || 500*1024*1024;
  }
  async initialize(){}
  async close(){}
}
