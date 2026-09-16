const SPREADSHEET_ID = 'PASTE_GOOGLE_SHEET_ID_HERE';
const PASSWORD_SALT = 'GANTI_DENGAN_RAHASIA_PANJANG_ANDA';

function doGet(){return ContentService.createTextOutput(JSON.stringify({ok:true,service:'DUIT RAPIH API'})).setMimeType(ContentService.MimeType.JSON)}

function doPost(e){
  try{
    const p=JSON.parse(e.postData.contents||'{}');
    switch(p.action){
      case 'register': return out(register(p));
      case 'login': return out(login(p));
      case 'addTransaction': return out(addTransaction(p));
      case 'listTransactions': return out(listTransactions(p));
      default: return out({ok:false,message:'Aksi tidak dikenal'});
    }
  }catch(err){return out({ok:false,message:String(err.message||err)})}
}
function out(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON)}
function ss(){return SpreadsheetApp.openById(SPREADSHEET_ID)}
function sheet(name,headers){let s=ss().getSheetByName(name)||ss().insertSheet(name);if(s.getLastRow()===0)s.appendRow(headers);return s}
function hash(p){return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,p+PASSWORD_SALT))}
function register(p){
  if(!p.name||!p.email||!p.password||p.password.length<8)throw Error('Nama, email, dan password minimal 8 karakter wajib diisi.');
  const s=sheet('Users',['id','name','email','password_hash','created_at']);
  const vals=s.getDataRange().getValues(), email=String(p.email).trim().toLowerCase();
  if(vals.slice(1).some(r=>String(r[2]).toLowerCase()===email))throw Error('Email sudah terdaftar.');
  const id=Utilities.getUuid();s.appendRow([id,String(p.name).trim(),email,hash(p.password),new Date()]);
  return {ok:true,user:{id,name:String(p.name).trim(),email}};
}
function login(p){
  const s=sheet('Users',['id','name','email','password_hash','created_at']), vals=s.getDataRange().getValues(), email=String(p.email||'').trim().toLowerCase();
  const r=vals.slice(1).find(x=>String(x[2]).toLowerCase()===email);
  if(!r||hash(String(p.password||''))!==String(r[3]))throw Error('Email atau password salah.');
  return {ok:true,user:{id:r[0],name:r[1],email:r[2]}};
}
function addTransaction(p){
  if(!p.userId||!p.type||!p.amount||!p.date)throw Error('Data transaksi belum lengkap.');
  const s=sheet('Transactions',['id','user_id','type','amount','date','category','note','created_at']);
  s.appendRow([Utilities.getUuid(),p.userId,p.type,Number(p.amount),p.date,p.category||'Lainnya',p.note||'',new Date()]);
  return {ok:true};
}
function listTransactions(p){
  const s=sheet('Transactions',['id','user_id','type','amount','date','category','note','created_at']);
  const vals=s.getDataRange().getValues();
  const transactions=vals.slice(1).filter(r=>String(r[1])===String(p.userId)).map(r=>({id:r[0],userId:r[1],type:r[2],amount:Number(r[3]),date:Utilities.formatDate(new Date(r[4]),Session.getScriptTimeZone(),'yyyy-MM-dd'),category:r[5],note:r[6]}));
  return {ok:true,transactions};
}