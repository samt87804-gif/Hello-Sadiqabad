export type GovernmentJobStoredStatus = 'draft' | 'published' | 'closed' | 'expired' | 'cancelled';
export type GovernmentJobDisplayStatus = 'open' | 'closing_soon' | 'closed' | 'expired' | 'cancelled';

export function getPakistanToday(now = new Date()): string {
 const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Karachi',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const values = Object.fromEntries(parts.map((part)=>[part.type,part.value]));
 return String(values.year)+'-'+String(values.month)+'-'+String(values.day);
}
function addIsoDays(date:string,days:number):string {
 const value=new Date(date+'T12:00:00Z'); value.setUTCDate(value.getUTCDate()+days); return value.toISOString().slice(0,10);
}
export function getGovernmentJobDisplayStatus(job:{status:GovernmentJobStoredStatus;deadline_at:string|null},today=getPakistanToday()):GovernmentJobDisplayStatus {
 if(job.status==='cancelled') return 'cancelled';
 if(job.status==='closed') return 'closed';
 if(job.status==='expired') return 'expired';
 if(job.deadline_at && job.deadline_at<today) return 'expired';
 if(job.deadline_at && job.deadline_at<=addIsoDays(today,7)) return 'closing_soon';
 return 'open';
}
export function isSafeGovernmentJobUrl(value:string|null|undefined):boolean {
 if(!value) return true;
 if(value.length>500) return false;
 try {
  const url=new URL(value.trim());
  if(url.protocol!=='https:'||!url.hostname||url.username||url.password) return false;
  const host=url.hostname.toLowerCase().replace(/\.$/,'');
  const shorteners=['bit.ly','tinyurl.com','t.co','goo.gl','cutt.ly','rb.gy','is.gd','shorturl.at','rebrand.ly','ow.ly','buff.ly','tiny.cc','lnkd.in','soo.gd','s.id'];
  return !shorteners.some((domain)=>host===domain||host.endsWith('.'+domain));
 } catch { return false; }
}
export function slugifyGovernmentJobTitle(value:string):string {
 return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100).replace(/-+$/g,'');
}
