import {getPool} from '../../config/database.js';

const adminMediaUrl=key=>key&&/^gallery\/[0-9a-f-]{36}\.webp$/i.test(key)?`/api/v1/admin/gallery/media/${key.slice(8)}`:null;
const publicMediaUrl=key=>key&&/^gallery\/[0-9a-f-]{36}\.webp$/i.test(key)?`/media/site/${key.slice(8)}`:null;
const media=(key,admin)=>admin?adminMediaUrl(key):publicMediaUrl(key);
const heroRow=(r={},admin=false)=>({
  tagline:r.tagline??'',mainHeading:r.main_heading??'',supportingDescription:r.supporting_description??'',
  ctaText:r.cta_text??'',ctaDestination:r.cta_destination??'',ctaSupportingNote:r.cta_supporting_note??'',
  backgroundMediaId:r.background_media_id==null?null:String(r.background_media_id),backgroundUrl:media(r.background_key,admin),
  updatedAt:r.updated_at??null,
});
const aboutRow=(r={})=>({sectionHeading:r.section_heading??'',introduction:r.introduction??'',brandStory:r.brand_story??'',serviceApproach:r.service_approach??'',experienceStrengths:r.experience_strengths??'',brandValues:r.brand_values??'',updatedAt:r.updated_at??null});
const highlightRow=r=>({id:String(r.id),title:r.title,description:r.description??'',iconKey:r.icon_key??'',sortOrder:Number(r.sort_order),visible:Boolean(r.is_visible)});
const imageRow=(r,admin=false)=>({id:String(r.id),mediaId:String(r.media_id),url:media(r.storage_key,admin),altText:r.default_alt_text??'',caption:r.caption??'',sortOrder:Number(r.sort_order),visible:Boolean(r.is_visible)});
const linkRow=r=>({id:String(r.id),group:r.link_group,label:r.label,destination:r.destination,sortOrder:Number(r.sort_order),visible:Boolean(r.is_visible)});
const brandRow=(r={},admin=false)=>({brandName:r.brand_name??'Elite Convention Hall',logoMediaId:r.logo_media_id==null?null:String(r.logo_media_id),logoUrl:media(r.logo_key,admin)});
const footerRow=(r={},admin=false)=>({brandDescription:r.brand_description??'',copyrightText:r.copyright_text??'',logoMediaId:r.logo_media_id==null?null:String(r.logo_media_id),logoUrl:media(r.logo_key,admin),updatedAt:r.updated_at??null});

const singletonMap={
  hero:{table:'hero_content',fields:{tagline:'tagline',mainHeading:'main_heading',supportingDescription:'supporting_description',ctaText:'cta_text',ctaDestination:'cta_destination',ctaSupportingNote:'cta_supporting_note',backgroundMediaId:'background_media_id'},map:heroRow},
  about:{table:'about_content',fields:{sectionHeading:'section_heading',introduction:'introduction',brandStory:'brand_story',serviceApproach:'service_approach',experienceStrengths:'experience_strengths',brandValues:'brand_values'},map:aboutRow},
  footer:{table:'footer_settings',fields:{brandDescription:'brand_description',copyrightText:'copyright_text',logoMediaId:'logo_media_id'},map:footerRow},
  brand:{table:'website_settings',fields:{brandName:'brand_name',logoMediaId:'logo_media_id'},map:brandRow},
};
const childMap={
  highlights:{table:'about_highlights',fields:{title:'title',description:'description',iconKey:'icon_key',sortOrder:'sort_order',visible:'is_visible'},map:highlightRow},
  images:{table:'about_images',fields:{mediaId:'media_id',caption:'caption',sortOrder:'sort_order',visible:'is_visible'},map:imageRow},
  links:{table:'footer_links',fields:{group:'link_group',label:'label',destination:'destination',sortOrder:'sort_order',visible:'is_visible'},map:linkRow},
};
const sqlValue=v=>typeof v==='boolean'?Number(v):v;
async function audit(conn,actor,action,entity,key,oldValue,newValue){
  await conn.execute('INSERT INTO admin_audit_logs(admin_user_id,action,entity_type,entity_key,previous_state,new_state) VALUES(?,?,?,?,?,?)',[
    actor,action,entity,String(key),oldValue===undefined?null:JSON.stringify(oldValue),newValue===undefined?null:JSON.stringify(newValue)
  ]);
}
async function mediaRecord(conn,id){const [rows]=await conn.execute("SELECT storage_key FROM media_assets WHERE id=? AND storage_driver='LOCAL' LIMIT 1",[id]);return rows.length>0 && /^gallery\/[0-9a-f-]{36}\.webp$/i.test(rows[0].storage_key);}

export const siteRepository={
  async getHero(admin=false){const [rows]=await getPool().query('SELECT h.*,m.storage_key background_key FROM hero_content h LEFT JOIN media_assets m ON m.id=h.background_media_id WHERE h.id=1');return heroRow(rows[0],admin);},
  async getAbout(admin=false){const pool=getPool();const [rows]=await pool.query('SELECT * FROM about_content WHERE id=1');const [highlights]=await pool.query(`SELECT * FROM about_highlights ${admin?'':'WHERE is_visible=1'} ORDER BY sort_order,id`);const [images]=await pool.query(`SELECT a.*,m.storage_key,m.default_alt_text FROM about_images a JOIN media_assets m ON m.id=a.media_id ${admin?'':'WHERE a.is_visible=1'} ORDER BY a.sort_order,a.id`);return {...aboutRow(rows[0]),highlights:highlights.map(highlightRow),images:images.map(row=>imageRow(row,admin))};},
  async getFooter(admin=false){const pool=getPool();const [[footer],[brand],[links]]=await Promise.all([
   pool.query('SELECT f.*,m.storage_key logo_key FROM footer_settings f LEFT JOIN media_assets m ON m.id=f.logo_media_id WHERE f.id=1'),
   pool.query('SELECT w.*,m.storage_key logo_key FROM website_settings w LEFT JOIN media_assets m ON m.id=w.logo_media_id WHERE w.id=1'),
   pool.query(`SELECT * FROM footer_links ${admin?'':'WHERE is_visible=1'} ORDER BY sort_order,id`),
  ]);return {...footerRow(footer[0],admin),brand:brandRow(brand[0],admin),links:links.map(linkRow)};},
  async validMediaId(id){const conn=await getPool().getConnection();try{return mediaRecord(conn,id);}finally{conn.release();}},
  async saveSingleton(entity,data,actor){const config=singletonMap[entity];if(!config)throw new Error('Unknown singleton');const fields=Object.entries(data).filter(([k])=>Object.hasOwn(config.fields,k));const conn=await getPool().getConnection();try{await conn.beginTransaction();const [before]=await conn.query(`SELECT * FROM ${config.table} WHERE id=1 FOR UPDATE`);if(!before.length)throw new Error(`Missing ${entity} initial seed — run approved SQL migration`);if(fields.length){const stmt=fields.map(([k])=>`\`${config.fields[k]}\`=?`).join(',');await conn.execute(`UPDATE ${config.table} SET ${stmt}, updated_by=? WHERE id=1`,[...fields.map(([,v])=>sqlValue(v)),actor]);}const [after]=await conn.query(`SELECT * FROM ${config.table} WHERE id=1`);await audit(conn,actor,'UPDATE',entity,1,before[0],after[0]);await conn.commit();}catch(e){await conn.rollback();throw e;}finally{conn.release();}},
  async listChildren(entity,admin=true){const config=childMap[entity];const sql=entity==='images'?`SELECT a.*,m.storage_key,m.default_alt_text FROM about_images a JOIN media_assets m ON m.id=a.media_id ${admin?'':'WHERE a.is_visible=1'} ORDER BY a.sort_order,a.id`:`SELECT * FROM ${config.table} ${admin?'':'WHERE is_visible=1'} ORDER BY sort_order,id`;
    const [rows]=await getPool().query(sql);return rows.map(x=>config.map(x,admin));},
  async createChild(entity,data,actor){const config=childMap[entity];const entries=Object.entries(data).filter(([k])=>Object.hasOwn(config.fields,k));const conn=await getPool().getConnection();try{await conn.beginTransaction();const [result]=await conn.execute(`INSERT INTO ${config.table} (${entries.map(([k])=>'`'+config.fields[k]+'`').join(',')}) VALUES (${entries.map(()=>'?').join(',')})`,entries.map(([,v])=>sqlValue(v)));const [rows]=await conn.execute(`SELECT * FROM ${config.table} WHERE id=?`,[String(result.insertId)]);await audit(conn,actor,'CREATE',entity,result.insertId,undefined,rows[0]);await conn.commit();return String(result.insertId);}catch(e){await conn.rollback();throw e;}finally{conn.release();}},
  async updateChild(entity,id,data,actor){const config=childMap[entity];const entries=Object.entries(data).filter(([k])=>Object.hasOwn(config.fields,k));const conn=await getPool().getConnection();try{await conn.beginTransaction();const [rows]=await conn.execute(`SELECT * FROM ${config.table} WHERE id=? FOR UPDATE`,[id]);if(!rows.length){await conn.rollback();return false;}if(entries.length)await conn.execute(`UPDATE ${config.table} SET ${entries.map(([k])=>'`'+config.fields[k]+'`=?').join(',')} WHERE id=?`,[...entries.map(([,v])=>sqlValue(v)),id]);const [after]=await conn.execute(`SELECT * FROM ${config.table} WHERE id=?`,[id]);await audit(conn,actor,'UPDATE',entity,id,rows[0],after[0]);await conn.commit();return true;}catch(e){await conn.rollback();throw e;}finally{conn.release();}},
  async deleteChild(entity,id,actor){const config=childMap[entity];const conn=await getPool().getConnection();try{await conn.beginTransaction();const [rows]=await conn.execute(`SELECT * FROM ${config.table} WHERE id=? FOR UPDATE`,[id]);if(!rows.length){await conn.rollback();return false;}await conn.execute(`DELETE FROM ${config.table} WHERE id=?`,[id]);await audit(conn,actor,'DELETE',entity,id,rows[0],undefined);await conn.commit();return true;}catch(e){await conn.rollback();throw e;}finally{conn.release();}},
  async isPublicImageKey(key){const [rows]=await getPool().execute(`SELECT (
    EXISTS(SELECT 1 FROM hero_content h JOIN media_assets m ON m.id=h.background_media_id WHERE h.id=1 AND m.storage_key=?) OR
    EXISTS(SELECT 1 FROM about_images a JOIN media_assets m ON m.id=a.media_id WHERE a.is_visible=1 AND m.storage_key=?) OR
    EXISTS(SELECT 1 FROM footer_settings f JOIN media_assets m ON m.id=f.logo_media_id WHERE f.id=1 AND m.storage_key=?) OR
    EXISTS(SELECT 1 FROM website_settings w JOIN media_assets m ON m.id=w.logo_media_id WHERE w.id=1 AND m.storage_key=?)
    ) AS visible`,[key,key,key,key]);return Boolean(Number(rows[0]?.visible));},
};
