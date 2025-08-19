// Centralized error logging
export default class ErrorHandler{
  constructor(){ this.errors = []; }
  capture(e){ 
    console.error('❌', e); 
    this.errors.push({ e, ts: Date.now() }); 
    try{ alert('Ocurrió un error: '+ (e?.message||e)); }catch(_){}
  }
  clearErrorLog(){ this.errors = []; }
}
