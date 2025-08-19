// Minimal API manager with local fallback
export default class APIManager{
  constructor({ cacheManager, errorHandler } = {}){
    this.cacheManager = cacheManager; this.errorHandler = errorHandler;
  }
  async initialize(){}
  async close(){}
}
