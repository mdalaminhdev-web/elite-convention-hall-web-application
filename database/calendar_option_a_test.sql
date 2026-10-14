-- OPTIONAL CALENDAR OPTION A DEMONSTRATION (safe, uses TEMPORARY table only)
-- This checks the distinction between missing and explicitly zero manual counts.
-- It does not insert or change actual website inquiry data.
USE `elite_convention_hall`;
CREATE TEMPORARY TABLE `qa_manual_counts` (
  `event_date` DATE NOT NULL PRIMARY KEY,
  `display_count` INT UNSIGNED NOT NULL
);
INSERT INTO `qa_manual_counts` (`event_date`,`display_count`) VALUES
 ('2099-01-02',0), ('2099-01-03',7);
SELECT dates.event_date,
       CASE WHEN mc.event_date IS NULL THEN 'NO COUNT' ELSE 'DISPLAY NUMBER' END AS display_state,
       mc.display_count AS manual_count_value
FROM (
  SELECT DATE('2099-01-01') AS event_date
  UNION ALL SELECT DATE('2099-01-02')
  UNION ALL SELECT DATE('2099-01-03')
) AS dates
LEFT JOIN `qa_manual_counts` AS mc ON mc.event_date=dates.event_date
ORDER BY dates.event_date;
-- Expected: 01 -> NO COUNT/NULL; 02 -> DISPLAY NUMBER/0; 03 -> DISPLAY NUMBER/7.
DROP TEMPORARY TABLE `qa_manual_counts`;
