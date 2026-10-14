import { getPool } from '../../config/database.js';

const monthRange = (month) => {
  const [year, m] = month.split('-').map(Number);
  const next = new Date(Date.UTC(year, m, 1)).toISOString().slice(0, 10);
  return [`${month}-01`, next];
};

// Dashboard reporting uses Asia/Dhaka business days over UTC-stored created_at.
// Production MySQL time_zone must be +00:00 so CURRENT_TIMESTAMP(3) stores UTC.
const dhakaParts = (instant = new Date()) => {
  const tokens = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(instant);
  const part = name => Number(tokens.find(v => v.type === name).value);
  return { year: part('year'), month: part('month'), day: part('day') };
};
const mysqlUtc = timestamp => new Date(timestamp).toISOString().slice(0, 23).replace('T', ' ');
const dhakaMidnightUtc = (year, month, day) => Date.UTC(year, month - 1, day) - 6 * 60 * 60 * 1000;

const parseCount = value => Number(value);
const asPlainDate = value => value instanceof Date ? value.toISOString().slice(0,10) : String(value).slice(0,10);
const mapInquiry = row => ({
  id: String(row.id), fullName: row.full_name, phoneNumber: row.phone_number,
  email: row.email ?? '', eventDate: asPlainDate(row.event_date), preferredShift: row.preferred_shift,
  eventType: row.event_type ?? '', guestCount: row.guest_count == null ? null : Number(row.guest_count),
  companyOrganization: row.company_organization ?? '', additionalDetails: row.additional_details ?? '',
  submittedAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
});

export const inquiryRepository = {
  async publicMonth(month) {
    const db=getPool();
    const [[setting]] = await db.execute('SELECT display_mode FROM inquiry_count_settings WHERE id = 1 LIMIT 1');
    const mode=setting?.display_mode ?? 'HIDDEN';
    const [start, end] = monthRange(month);
    if(mode==='HIDDEN') return { month, mode, counts: [] };
    if(mode==='MANUAL') {
      const [rows]=await db.execute('SELECT DATE_FORMAT(event_date, \'%Y-%m-%d\') AS date, display_count AS count FROM manual_inquiry_counts WHERE event_date >= ? AND event_date < ? ORDER BY event_date', [start,end]);
      // Explicitly return 0, but do not fill missing dates.
      return { month, mode, counts: rows.map(row=>({ date:row.date, count:parseCount(row.count) })) };
    }
    const [rows]=await db.execute('SELECT DATE_FORMAT(event_date, \'%Y-%m-%d\') AS date, COUNT(*) AS count FROM inquiries WHERE event_date >= ? AND event_date < ? GROUP BY event_date ORDER BY event_date', [start,end]);
    // Public real mode's days without rows display 0 in the frontend.
    return {month,mode,counts:rows.map(row=>({date:row.date,count:parseCount(row.count)}))};
  },
  async insertInquiry(data) {
    const db=getPool();
    try {
      const [result]=await db.execute(`INSERT INTO inquiries
        (submission_key,full_name,phone_number,email,event_date,preferred_shift,event_type,guest_count,company_organization,additional_details)
        VALUES (?,?,?,?,?,?,?,?,?,?)`,[
          data.submissionKey,data.fullName,data.phoneNumber,data.email || null,data.eventDate,data.preferredShift,
          data.eventType || null,data.guestCount ?? null,data.companyOrganization || null,data.additionalDetails || null,
        ]);
      return {id:String(result.insertId),duplicate:false};
    } catch(error) {
      if(error.code!=='ER_DUP_ENTRY')throw error;
      const [[existing]]=await db.execute('SELECT id FROM inquiries WHERE submission_key=? LIMIT 1',[data.submissionKey]);
      if(!existing)throw error;
      return {id:String(existing.id),duplicate:true};
    }
  },
  async adminList({page=1,pageSize=20,search='',eventDate='',shift=''}={}) {
    const db=getPool();
    const where=[];const params=[];
    if(search){
      // Escape MySQL LIKE wildcards so search is literal (no wildcard amplification).
      const escaped=search.replace(/[\\%_]/g,'\\$&');
      where.push("(full_name LIKE ? OR phone_number LIKE ? OR email LIKE ?)");
      params.push(...Array(3).fill(`%${escaped}%`));
    }
    if(eventDate){where.push('event_date = ?');params.push(eventDate);}
    if(shift){where.push('preferred_shift = ?');params.push(shift);}
    const filter=where.length?' WHERE '+where.join(' AND '):'';
    const [[{total}]]=await db.execute(`SELECT COUNT(*) AS total FROM inquiries${filter}`,params);
    const offset=(page-1)*pageSize;
    // Numbers are validated by Zod; never interpolate unvalidated input into SQL.
    const [rows]=await db.execute(`SELECT * FROM inquiries${filter} ORDER BY created_at DESC,id DESC LIMIT ${pageSize} OFFSET ${offset}`,params);
    return {items:rows.map(mapInquiry),page,pageSize,total:Number(total),totalPages:Math.ceil(Number(total)/pageSize)};
  },
  async adminGet(id) {
    const [[row]]=await getPool().execute('SELECT * FROM inquiries WHERE id=? LIMIT 1',[id]);
    return row?mapInquiry(row):null;
  },
  async adminSummary() {
    // Existing API preserved for Phase 8 clients. Date windows use Dhaka business time.
    const d=dhakaParts();
    const today=mysqlUtc(dhakaMidnightUtc(d.year,d.month,d.day));
    const tomorrow=mysqlUtc(dhakaMidnightUtc(d.year,d.month,d.day+1));
    const [[row]]=await getPool().execute(`SELECT COUNT(*) AS total,
      COALESCE(SUM(created_at>=? AND created_at<?),0) AS submitted_today,
      COUNT(DISTINCT event_date) AS dates_with_inquiries FROM inquiries`,[today,tomorrow]);
    return {total:Number(row.total),submittedToday:Number(row.submitted_today||0),datesWithInquiries:Number(row.dates_with_inquiries)};
  },
  async adminDashboard() {
    const d=dhakaParts();
    const today=dhakaMidnightUtc(d.year,d.month,d.day);
    const tomorrow=dhakaMidnightUtc(d.year,d.month,d.day+1);
    const monthStart=dhakaMidnightUtc(d.year,d.month,1);
    const nextMonth=dhakaMidnightUtc(d.year,d.month+1,1);
    const sevenDaysAgo=today-6*86400000;
    const db=getPool();
    const [summaryRows,recentRows,dayRows,galleryRows,settingRows]=await Promise.all([
      db.execute(`SELECT COUNT(*) AS total,
        COALESCE(SUM(created_at>=? AND created_at<?),0) AS today_count,
        COALESCE(SUM(created_at>=? AND created_at<?),0) AS month_count,
        COUNT(DISTINCT event_date) AS dates_with_inquiries FROM inquiries`,
        [mysqlUtc(today),mysqlUtc(tomorrow),mysqlUtc(monthStart),mysqlUtc(nextMonth)]),
      db.query('SELECT * FROM inquiries ORDER BY created_at DESC,id DESC LIMIT 6'),
      db.execute(`SELECT DATE_FORMAT(DATE_ADD(created_at,INTERVAL 6 HOUR),'%Y-%m-%d') AS day,
        COUNT(*) AS count FROM inquiries WHERE created_at>=? AND created_at<?
        GROUP BY day ORDER BY day`,[mysqlUtc(sevenDaysAgo),mysqlUtc(tomorrow)]),
      db.query('SELECT COUNT(*) AS published_albums FROM gallery_albums WHERE is_published = 1'),
      db.query('SELECT display_mode FROM inquiry_count_settings WHERE id = 1 LIMIT 1'),
    ]);
    const stat=summaryRows[0][0];
    const buckets=new Map(dayRows[0].map(row=>[row.day,Number(row.count)]));
    const activity=Array.from({length:7},(_,index)=>{
      const date=new Date(sevenDaysAgo+index*86400000+6*3600000).toISOString().slice(0,10);
      return {date,count:buckets.get(date)??0};
    });
    return {
      metrics:{totalInquiries:Number(stat.total),submittedToday:Number(stat.today_count),
        submittedThisMonth:Number(stat.month_count),datesWithInquiries:Number(stat.dates_with_inquiries),
        publishedAlbums:Number(galleryRows[0][0].published_albums)},
      calendarMode:settingRows[0][0]?.display_mode??'HIDDEN',
      recentInquiries:recentRows[0].map(mapInquiry),
      dailyActivity:activity,
      businessTimeZone:'Asia/Dhaka',
    };
  },
  async adminSettings() {
    const [[row]]=await getPool().execute('SELECT display_mode,updated_at FROM inquiry_count_settings WHERE id=1 LIMIT 1');
    return {mode:row?.display_mode??'HIDDEN',updatedAt:row?.updated_at??null};
  },
  async adminSetMode(mode,adminId) {
    const db=getPool();const connection=await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[current]]=await connection.execute('SELECT display_mode FROM inquiry_count_settings WHERE id=1 FOR UPDATE');
      await connection.execute(`INSERT INTO inquiry_count_settings(id,display_mode,updated_by) VALUES (1,?,?)
        ON DUPLICATE KEY UPDATE display_mode=VALUES(display_mode),updated_by=VALUES(updated_by),updated_at=CURRENT_TIMESTAMP(3)`,[mode,adminId]);
      await connection.execute(`INSERT INTO admin_audit_logs(admin_user_id,action,entity_type,entity_key,previous_state,new_state)
        VALUES (?, 'UPDATE_INQUIRY_DISPLAY_MODE','inquiry_count_settings','1', ?, ?)`,
        [adminId,JSON.stringify({mode:current?.display_mode??'HIDDEN'}),JSON.stringify({mode})]);
      await connection.commit();
    } catch(e) {await connection.rollback();throw e;} finally{connection.release();}
    return {mode};
  },
  async adminManualCounts(month) {
    const [start,end]=monthRange(month);
    const [rows]=await getPool().execute(`SELECT DATE_FORMAT(event_date,'%Y-%m-%d') AS date,display_count,updated_at
      FROM manual_inquiry_counts WHERE event_date >= ? AND event_date < ? ORDER BY event_date`,[start,end]);
    return rows.map(row=>({date:row.date,count:parseCount(row.display_count),updatedAt:row.updated_at}));
  },
  async adminUpsertCount(date,count,adminId) {
    const db=getPool(),connection=await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[previous]]=await connection.execute('SELECT display_count FROM manual_inquiry_counts WHERE event_date=? FOR UPDATE',[date]);
      await connection.execute(`INSERT INTO manual_inquiry_counts(event_date,display_count,updated_by) VALUES(?,?,?)
       ON DUPLICATE KEY UPDATE display_count=VALUES(display_count),updated_by=VALUES(updated_by),updated_at=CURRENT_TIMESTAMP(3)`,[date,count,adminId]);
      await connection.execute(`INSERT INTO admin_audit_logs(admin_user_id,action,entity_type,entity_key,previous_state,new_state)
        VALUES (?,'UPSERT_MANUAL_INQUIRY_COUNT','manual_inquiry_counts',?,?,?)`,
        [adminId,date,JSON.stringify({count:previous?Number(previous.display_count):null}),JSON.stringify({count})]);
      await connection.commit();
    } catch(e) {await connection.rollback();throw e;}finally{connection.release();}
    return {date,count};
  },
  async adminDeleteCount(date,adminId) {
    const db=getPool(),connection=await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[previous]]=await connection.execute('SELECT display_count FROM manual_inquiry_counts WHERE event_date=? FOR UPDATE',[date]);
      if(!previous){await connection.rollback();return false;}
      await connection.execute('DELETE FROM manual_inquiry_counts WHERE event_date=?',[date]);
      await connection.execute(`INSERT INTO admin_audit_logs(admin_user_id,action,entity_type,entity_key,previous_state,new_state)
        VALUES (?,'DELETE_MANUAL_INQUIRY_COUNT','manual_inquiry_counts',?,?,?)`,
        [adminId,date,JSON.stringify({count:Number(previous.display_count)}),JSON.stringify({count:null})]);
      await connection.commit();return true;
    }catch(e){await connection.rollback();throw e;}finally{connection.release();}
  },
};
