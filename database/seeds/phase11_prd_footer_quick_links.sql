-- Optional PRD-approved footer links seed. Non-destructive: only when no QUICK links exist.
-- Execute against an existing correctly migrated DB, once. No unverified policy destinations.
USE `elite_convention_hall`;
INSERT INTO footer_links (link_group,label,destination,sort_order,is_visible)
SELECT d.link_group,d.label,d.destination,d.sort_order,1
FROM (
 SELECT 'QUICK' link_group,'Home' label,'/#home' destination,10 sort_order UNION ALL
 SELECT 'QUICK','Query Calendar','/#query-calendar',20 UNION ALL
 SELECT 'QUICK','Gallery','/#gallery',30 UNION ALL
 SELECT 'QUICK','Facilities','/#facilities',40 UNION ALL
 SELECT 'QUICK','About Us','/#about',50 UNION ALL
 SELECT 'QUICK','FAQ','/#faq',60 UNION ALL
 SELECT 'QUICK','Contact Us','/#contact',70
) d
WHERE NOT EXISTS (SELECT 1 FROM footer_links existing WHERE existing.link_group='QUICK');
